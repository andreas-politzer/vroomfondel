from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Lokale Postgres-Instanz, Datenbank "vroomfondel" haben wir bereits angelegt.
DATABASE_URL = "postgresql://localhost/vroomfondel"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()