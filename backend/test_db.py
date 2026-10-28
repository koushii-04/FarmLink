from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        print("SUCCESS: FarmLink is securely connected to MySQL.")
except Exception as e:
    print(f"TRASH SETUP: Connection failed. Check your MySQL service and credentials. Error: {e}")