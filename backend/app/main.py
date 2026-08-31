import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from pydantic import BaseModel
from app.models import Project, Document, Collection

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
    all_documents = db.query(Document).filter(Document.project_id == project_id).all()
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
    }