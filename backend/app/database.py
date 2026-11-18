from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

settings = get_settings()


def normalize_database_url(url: str) -> str:
    """Pin PostgreSQL URLs to the psycopg2 driver (the one we install).

    - postgres:// (Railway, Heroku) is no longer accepted by SQLAlchemy 2.
    - A bare postgresql:// lets SQLAlchemy pick its default driver, which is
      psycopg (v3) since SQLAlchemy 2.1 — not installed here, so the app
      would crash at startup. URLs that name a driver are left untouched.
    """
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


_database_url = normalize_database_url(settings.database_url)

engine = create_engine(
    _database_url,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if _database_url.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
