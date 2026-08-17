import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker, declarative_base 

load_dotenv()
url = os.getenv("DATABASE_URL")
engine = create_engine(url)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()