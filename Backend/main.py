# pyrefly: ignore [missing-import]
from auth import get_password_hash
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session  
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
import models
import auth
from database import engine, SessionLocal 

# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware


models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    

@app.post("/register")
def register(user:UserCreate,db:Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail = "email already registered")

    hashed_pw = get_password_hash(user.password)

    new_user = models.User(username=user.username,email=user.email, hashed_password=hashed_pw )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"detail": "user registered successully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token_data = {"sub": db_user.email}
    access_token = auth.create_access_token(data=token_data)

    return {"access_token": access_token, "token_type": "bearer","username": db_user.username }
