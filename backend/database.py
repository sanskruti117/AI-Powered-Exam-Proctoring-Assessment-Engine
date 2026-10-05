import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/exam_proctoring")

import re

# Clean PostgreSQL connection string for SQLAlchemy
clean_db_url = DATABASE_URL
if clean_db_url.startswith("postgres://"):
    clean_db_url = clean_db_url.replace("postgres://", "postgresql://", 1)
if "?schema=" in clean_db_url:
    clean_db_url = clean_db_url.split("?schema=")[0]
# Remove unsupported Neon query parameters like channel_binding for psycopg2
clean_db_url = re.sub(r'[&?]channel_binding=[^&]*', '', clean_db_url)
if '?' not in clean_db_url and '&' in clean_db_url:
    clean_db_url = clean_db_url.replace('&', '?', 1)

engine = create_engine(
    clean_db_url,
    pool_pre_ping=True,
    echo=os.getenv("DEBUG_SQL", "False").lower() in ("true", "1"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency that provides a transactional SQLAlchemy database session.
    Automatically closes the session after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
