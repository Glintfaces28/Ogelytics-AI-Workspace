import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    DATABASE_URL = URL.create(
        drivername="postgresql+psycopg2",
        username=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "enterprise_ai_workspace"),
)

engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 30})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations(engine):
    """Add new columns to existing tables without Alembic."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_url VARCHAR",
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS text_content TEXT",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("Migration skipped: %s — %s", sql, exc)
        conn.commit()
