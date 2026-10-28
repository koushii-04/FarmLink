import logging
import os
from dotenv import load_dotenv

# FORCE LOAD ENV VARS BEFORE ANYTHING ELSE HAPPENS
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger("farmlink.database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()

def get_engine():
    target_url = settings.DATABASE_URL
    
    if target_url.startswith("mysql"):
        base_url = target_url.rsplit("/", 1)[0]
        db_name = target_url.rsplit("/", 1)[1].split("?")[0]
        try:
            temp_engine = create_engine(base_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            temp_engine.dispose()
            logger.info(f"Verified MySQL database: {db_name}")
        except Exception as e:
            logger.warning(f"Could not auto-create MySQL database: {e}")

    # NO try/except block here. If this fails, the app crashes loudly.
    engine = create_engine(
        target_url,
        pool_pre_ping=True,
        echo=False
    )
    
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        
    logger.info(f"Connected to primary database: {target_url}")
    return engine

# THESE MUST BE ACTIVE FOR FASTAPI TO WORK
engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()