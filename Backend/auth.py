# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
from jose import jwt 
from datetime import datetime,timedelta

SECRET_KEY = "qwertyuiop"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data):
    data1 = data.copy()
    data1.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE)})
    encode_jwt = jwt.encode(data1, SECRET_KEY, algorithm=ALGORITHM)
    return encode_jwt 