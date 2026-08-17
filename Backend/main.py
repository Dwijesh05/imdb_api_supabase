# pyrefly: ignore [missing-import]
from auth import get_password_hash
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, Query
# pyrefly: ignore [missing-import]
from fastapi.security import OAuth2PasswordRequestForm
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session  
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
import models
import auth
from database import engine, SessionLocal 
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
import httpx
import os
from datetime import date
from typing import List, Optional, Union

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# RapidAPI Setup
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = "imdb236.p.rapidapi.com"
RAPIDAPI_BASE_URL = f"https://{RAPIDAPI_HOST}"

rapidapi_headers = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": RAPIDAPI_HOST,
    "Content-Type": "application/json"
}

http_client = httpx.AsyncClient(base_url=RAPIDAPI_BASE_URL, headers=rapidapi_headers, timeout=30.0)


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


# ============================================================
# PYDANTIC RESPONSE MODEL (Automatic snake_case -> camelCase & type flexibility)
# ============================================================
class MovieResponse(BaseModel):
    id: str
    url: Optional[str] = None
    primaryTitle: Optional[str] = Field(None, alias="primary_title")
    originalTitle: Optional[str] = Field(None, alias="original_title")
    type: Optional[str] = None
    description: Optional[str] = None
    primaryImage: Optional[str] = Field(None, alias="primary_image")
    trailer: Optional[str] = None
    contentRating: Optional[str] = Field(None, alias="content_rating")
    startYear: Optional[int] = Field(None, alias="start_year")
    endYear: Optional[int] = Field(None, alias="end_year")
    releaseDate: Optional[Union[str, date]] = Field(None, alias="release_date")
    runtimeMinutes: Optional[int] = Field(None, alias="runtime_minutes")
    averageRating: Optional[float] = Field(None, alias="average_rating")
    numVotes: Optional[int] = Field(None, alias="num_votes")
    metascore: Optional[int] = None
    budget: Optional[Union[str, int, float]] = None
    grossWorldwide: Optional[Union[str, int, float]] = Field(None, alias="gross_worldwide")
    isAdult: bool = Field(False, alias="is_adult")
    thumbnails: List[Union[str, dict]] = []
    interests: List[str] = []
    countriesOfOrigin: List[str] = Field([], alias="countries_of_origin")
    externalLinks: List[str] = Field([], alias="external_links")
    spokenLanguages: List[str] = Field([], alias="spoken_languages")
    filmingLocations: List[str] = Field([], alias="filming_locations")
    productionCompanies: list = Field([], alias="production_companies")
    genres: list = []

    class Config:
        from_attributes = True
        populate_by_name = True
    

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="email already registered")

    hashed_pw = get_password_hash(user.password)

    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"detail": "user registered successfully"}


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    token_data = {"sub": db_user.email}
    access_token = auth.create_access_token(data=token_data)

    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}


# ============================================================
# MOVIE CACHING & PERSISTENCE HELPERS (SQLAlchemy)
# ============================================================

async def save_category_movies(db: Session, movies_array: list, category_slug: str = None):
    if not isinstance(movies_array, list) or len(movies_array) == 0:
        return

    try:
        for idx, item in enumerate(movies_array):
            if not item or not item.get("id"):
                continue

            movie_id = item.get("id")
            primary_image = item.get("primaryImage")
            if isinstance(primary_image, dict):
                primary_image = primary_image.get("url")

            db_movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()
            
            movie_data = {
                "id": movie_id,
                "url": item.get("url"),
                "primary_title": item.get("primaryTitle") or item.get("title"),
                "original_title": item.get("originalTitle"),
                "type": item.get("type"),
                "description": item.get("description"),
                "primary_image": primary_image,
                "trailer": item.get("trailer"),
                "content_rating": item.get("contentRating"),
                "start_year": item.get("startYear"),
                "end_year": item.get("endYear"),
                "release_date": str(item.get("releaseDate")) if item.get("releaseDate") else None,
                "runtime_minutes": item.get("runtimeMinutes"),
                "average_rating": float(item.get("averageRating")) if item.get("averageRating") else None,
                "num_votes": int(item.get("numVotes")) if item.get("numVotes") else 0,
                "metascore": item.get("metascore"),
                "budget": str(item.get("budget")) if item.get("budget") is not None else None,
                "gross_worldwide": str(item.get("grossWorldwide")) if item.get("grossWorldwide") is not None else None,
                "is_adult": item.get("isAdult", False),
                "thumbnails": item.get("thumbnails", []),
                "interests": item.get("interests", []),
                "countries_of_origin": item.get("countriesOfOrigin", []),
                "external_links": item.get("externalLinks", []),
                "spoken_languages": item.get("spokenLanguages", []),
                "filming_locations": item.get("filmingLocations", []),
                "production_companies": item.get("productionCompanies") or item.get("prdouctionCompanies", []),
                "genres": item.get("genres", [])
            }

            if db_movie:
                for key, value in movie_data.items():
                    setattr(db_movie, key, value)
            else:
                new_movie = models.Movie(**movie_data)
                db.add(new_movie)

            if category_slug:
                existing_link = db.query(models.MovieCategory).filter(
                    models.MovieCategory.category_slug == category_slug,
                    models.MovieCategory.movie_id == movie_id
                ).first()

                if existing_link:
                    existing_link.display_order = idx + 1
                else:
                    new_link = models.MovieCategory(
                        category_slug=category_slug,
                        movie_id=movie_id,
                        display_order=idx + 1
                    )
                    db.add(new_link)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving movies for category [{category_slug}]: {e}")


async def fetch_category_cached_or_api(db: Session, category_slug: str, external_endpoint: str):
    try:
        category_rows = db.query(models.MovieCategory)\
            .filter(models.MovieCategory.category_slug == category_slug)\
            .order_by(models.MovieCategory.display_order.asc())\
            .all()

        if category_rows:
            movie_ids = [row.movie_id for row in category_rows]
            movies = db.query(models.Movie).filter(models.Movie.id.in_(movie_ids)).all()
            movie_map = {m.id: m for m in movies}
            sorted_movies = [movie_map[mid] for mid in movie_ids if mid in movie_map]
            
            if sorted_movies:
                print(f"⚡ Loaded [{category_slug}] from PostgreSQL DB cache!")
                return sorted_movies
    except Exception as e:
        print(f"DB cache read error for [{category_slug}]: {e}")

    print(f"🌐 Fetching [{category_slug}] from RapidAPI...")
    try:
        response = await http_client.get(external_endpoint)
        api_data = response.json()
        movies_list = api_data if isinstance(api_data, list) else api_data.get("results", [])

        if movies_list:
            await save_category_movies(db, movies_list, category_slug)
            return await fetch_category_cached_or_api(db, category_slug, external_endpoint)
    except Exception as e:
        print(f"RapidAPI Error on [{category_slug}]: {e}")

    return []


# ============================================================
# MOVIE API ENDPOINTS (Using MovieResponse Pydantic Model)
# ============================================================

@app.get("/api/movies/category/{category_slug}", response_model=List[MovieResponse])
async def get_movies_by_category(category_slug: str, db: Session = Depends(get_db)):
    endpoint_map = {
        "trending_telugu_movies": "/api/imdb/india/trending-telugu",
        "most_anticipated_indian_movies": "/api/imdb/india/upcoming",
        "top_rated_indian_movies": "/api/imdb/india/top-rated-indian-movies",
        "top_250_movies": "/api/imdb/top250-movies",
        "top_250_tv_shows": "/api/imdb/top250-tv",
        "top_rated_telugu_movies": "/api/imdb/india/top-rated-telugu-movies",
        "top_rated_english_movies": "/api/imdb/top-rated-english-movies",
        "top_box_office_us": "/api/imdb/top-box-office",
        "most_popular_movies": "/api/imdb/most-popular-movies",
        "most_popular_tv_shows": "/api/imdb/most-popular-tv"
    }

    if category_slug not in endpoint_map:
        raise HTTPException(status_code=400, detail="Invalid category slug")

    return await fetch_category_cached_or_api(db, category_slug, endpoint_map[category_slug])


@app.get("/api/movies/search", response_model=List[MovieResponse])
async def search_movies(query: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    clean_query = query.strip()
    try:
        db_matches = db.query(models.Movie)\
            .filter(models.Movie.primary_title.ilike(f"%{clean_query}%"))\
            .limit(20)\
            .all()

        if db_matches:
            print("⚡ Loaded search results from PostgreSQL DB cache!")
            return db_matches

        response = await http_client.get("/api/imdb/autocomplete", params={"query": clean_query})
        data = response.json()
        api_results = data if isinstance(data, list) else data.get("d") or data.get("data") or data.get("results") or []

        if api_results:
            await save_category_movies(db, api_results, category_slug=None)

        return api_results
    except Exception as e:
        print(f"Search error: {e}")
        return []