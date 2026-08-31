import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from pydantic import BaseModel
from app.models import Project, Document, Collection, TrashEntry

# Legt die Tabellen an, falls sie noch nicht existieren — für den Anfang bequem,
# später (bei echten Schema-Änderungen) würden wir auf Alembic-Migrationen umsteigen.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vroomfondel Backend")

# Erlaubt Anfragen vom Vite-Dev-Server (läuft auf einem anderen Port als FastAPI).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_ROOT = Path("data/projects")


@app.post("/projects/{project_id}/documents")
async def upload_document(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")

    document_id = uuid.uuid4()
    project_dir = STORAGE_ROOT / str(project_id) / "documents"
    project_dir.mkdir(parents=True, exist_ok=True)

    destination = project_dir / f"{document_id}_{file.filename}"
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size = destination.stat().st_size

    document = Document(
        id=document_id,
        project_id=project_id,
        filename=file.filename,
        mime_type=file.content_type or "application/octet-stream",
        size=size,
        storage_path=str(destination),
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "id": str(document.id),
        "filename": document.filename,
        "size": document.size,
        "created_at": document.created_at,
    }


@app.post("/projects")
async def create_project(name: str, db: Session = Depends(get_db)):
    project = Project(name=name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {"id": str(project.id), "name": project.name}

@app.get("/projects/current")
async def get_current_project(db: Session = Depends(get_db)):
    project = db.query(Project).first()
    if not project:
        project = Project(name="Mein erstes Projekt")
        db.add(project)
        db.commit()
        db.refresh(project)
    return {"id": str(project.id), "name": project.name}

@app.delete("/projects/{project_id}/documents/{document_id}")
async def delete_document(
    project_id: uuid.UUID,
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.project_id == project_id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    Path(document.storage_path).unlink(missing_ok=True)
    db.delete(document)
    db.commit()

    return {"deleted": str(document_id)}

@app.get("/projects/{project_id}/documents")
async def list_documents(project_id: uuid.UUID, db: Session = Depends(get_db)):
    documents = db.query(Document).filter(Document.project_id == project_id).all()
    return [
        {
            "id": str(doc.id),
            "filename": doc.filename,
            "size": doc.size,
            "status": doc.status,
            "created_at": doc.created_at,
        }
        for doc in documents
    ]

class CollectionCreate(BaseModel):
    name: str
    parent_collection_id: uuid.UUID | None = None


@app.post("/projects/{project_id}/collections")
async def create_collection(
    project_id: uuid.UUID,
    payload: CollectionCreate,
    db: Session = Depends(get_db),
):
    collection = Collection(
        project_id=project_id,
        name=payload.name,
        parent_collection_id=payload.parent_collection_id,
    )
    db.add(collection)
    db.commit()
    db.refresh(collection)
    return {
        "id": str(collection.id),
        "name": collection.name,
        "parent_collection_id": str(collection.parent_collection_id) if collection.parent_collection_id else None,
    }


@app.get("/projects/{project_id}/collections")
async def list_collections(project_id: uuid.UUID, db: Session = Depends(get_db)):
    collections = db.query(Collection).filter(Collection.project_id == project_id).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "parent_collection_id": str(c.parent_collection_id) if c.parent_collection_id else None,
        }
        for c in collections
    ]


@app.post("/documents/{document_id}/collections/{collection_id}")
async def assign_document_to_collection(
    document_id: uuid.UUID,
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not document or not collection:
        raise HTTPException(status_code=404, detail="Dokument oder Collection nicht gefunden")

    if collection not in document.collections:
        document.collections.append(collection)
        db.commit()

    return {"document_id": str(document_id), "collection_id": str(collection_id)}

@app.get("/projects/{project_id}/library")
async def get_library(project_id: uuid.UUID, db: Session = Depends(get_db)):
    all_documents = (
        db.query(Document)
        .filter(Document.project_id == project_id, Document.status != "deleted")
        .all()
    )
    unsorted = [d for d in all_documents if len(d.collections) == 0]

    all_collections = db.query(Collection).filter(Collection.project_id == project_id).all()

    return {
        "unsorted": [
            {"id": str(d.id), "filename": d.filename, "size": d.size}
            for d in unsorted
        ],
        "collections": [
            {
                "id": str(c.id),
                "name": c.name,
                "parent_collection_id": str(c.parent_collection_id) if c.parent_collection_id else None,
                "document_count": len(c.documents),
            }
            for c in all_collections
        ],
        # NEU: alle Dokumente mit ihrer Collection-Zugehörigkeit, damit das Frontend
        # lokal filtern kann ("welche Dokumente liegen in Sammlung X"), ohne
        # zusätzliche Backend-Aufrufe beim Navigieren.
        "documents": [
            {
                "id": str(d.id),
                "filename": d.filename,
                "size": d.size,
                "collection_ids": [str(c.id) for c in d.collections],
            }
            for d in all_documents
        ],
    }

class CollectionUpdate(BaseModel):
    name: str


@app.patch("/collections/{collection_id}")
async def rename_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    db: Session = Depends(get_db),
):
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")

    collection.name = payload.name
    db.commit()
    db.refresh(collection)
    return {"id": str(collection.id), "name": collection.name}


@app.delete("/collections/{collection_id}")
async def delete_collection(collection_id: uuid.UUID, db: Session = Depends(get_db)):
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection nicht gefunden")

    # Unter-Collections werden NICHT automatisch gelöscht, sondern eine Ebene nach oben
    # gehängt — verhindert versehentlichen Verlust von tiefer verschachteltem Material.
    children = db.query(Collection).filter(Collection.parent_collection_id == collection_id).all()
    for child in children:
        child.parent_collection_id = collection.parent_collection_id

    # Dokumente in dieser Collection werden NICHT gelöscht — sie landen automatisch
    # wieder in "Unsortiert" (da Zuordnung über die Verknüpfungstabelle entfernt wird).
    db.delete(collection)
    db.commit()
    return {"deleted": str(collection_id)}

@app.delete("/documents/{document_id}/collections/{collection_id}")
async def remove_document_from_collection(
    document_id: uuid.UUID,
    collection_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not document or not collection:
        raise HTTPException(status_code=404, detail="Dokument oder Collection nicht gefunden")

    if collection in document.collections:
        document.collections.remove(collection)
        db.commit()

    return {"document_id": str(document_id), "collection_id": str(collection_id), "removed": True}

@app.post("/documents/{document_id}/trash")
async def move_document_to_trash(
    document_id: uuid.UUID,
    source_collection_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    if source_collection_id:
        # Nur diese eine Zuordnung entfernen — Dokument bleibt anderswo bestehen.
        collection = db.query(Collection).filter(Collection.id == source_collection_id).first()
        if collection and collection in document.collections:
            document.collections.remove(collection)
    else:
        # Kam aus Unsortiert — es gibt nichts zu entfernen, also kompletter Soft-Delete.
        document.status = "deleted"

    entry = TrashEntry(project_id=document.project_id, document_id=document.id, source_collection_id=source_collection_id)
    db.add(entry)
    db.commit()
    return {"id": str(document.id)}


@app.post("/trash/{trash_entry_id}/restore")
async def restore_from_trash(trash_entry_id: uuid.UUID, db: Session = Depends(get_db)):
    entry = db.query(TrashEntry).filter(TrashEntry.id == trash_entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Papierkorb-Eintrag nicht gefunden")

    document = db.query(Document).filter(Document.id == entry.document_id).first()
    if document:
        if entry.source_collection_id:
            collection = db.query(Collection).filter(Collection.id == entry.source_collection_id).first()
            if collection and collection not in document.collections:
                document.collections.append(collection)
        else:
            document.status = "uploaded"

    db.delete(entry)
    db.commit()
    return {"restored": str(trash_entry_id)}


@app.delete("/trash/{trash_entry_id}")
async def delete_from_trash(trash_entry_id: uuid.UUID, db: Session = Depends(get_db)):
    entry = db.query(TrashEntry).filter(TrashEntry.id == trash_entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Papierkorb-Eintrag nicht gefunden")

    document = db.query(Document).filter(Document.id == entry.document_id).first()
    if document and entry.source_collection_id is None:
        # War kompletter Soft-Delete (aus Unsortiert) — jetzt wirklich weg: Datei + DB-Eintrag.
        Path(document.storage_path).unlink(missing_ok=True)
        db.delete(document)
    # War nur eine Sammlungs-Zuordnung: die ist schon entfernt, das Dokument existiert
    # ggf. anderswo weiter — hier wird nur der Papierkorb-Eintrag selbst entfernt.

    db.delete(entry)
    db.commit()
    return {"deleted": str(trash_entry_id)}


@app.get("/projects/{project_id}/trash")
async def get_trash(project_id: uuid.UUID, db: Session = Depends(get_db)):
    entries = db.query(TrashEntry).filter(TrashEntry.project_id == project_id).all()
    result = []
    for entry in entries:
        document = db.query(Document).filter(Document.id == entry.document_id).first()
        if not document:
            continue
        collection = (
            db.query(Collection).filter(Collection.id == entry.source_collection_id).first()
            if entry.source_collection_id
            else None
        )
        result.append(
            {
                "trash_entry_id": str(entry.id),
                "document_id": str(document.id),
                "filename": document.filename,
                "size": document.size,
                "source_collection_name": collection.name if collection else None,
            }
        )
    return result