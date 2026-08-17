# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, UniqueConstraint
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import ARRAY
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=True)
    email = Column(String(50), unique=True)
    hashed_password = Column(String(100))


class Movie(Base):
    __tablename__ = "movies"

    id = Column(String, primary_key=True, index=True)
    url = Column(String, nullable=True)
    primary_title = Column(String, index=True, nullable=True)
    original_title = Column(String, nullable=True)
    type = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    primary_image = Column(String, nullable=True)
    trailer = Column(String, nullable=True)
    content_rating = Column(String, nullable=True)
    start_year = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    release_date = Column(String, nullable=True)
    runtime_minutes = Column(Integer, nullable=True)
    average_rating = Column(Float, nullable=True)
    num_votes = Column(Integer, nullable=True)
    metascore = Column(Integer, nullable=True)
    budget = Column(String, nullable=True)
    gross_worldwide = Column(String, nullable=True)
    is_adult = Column(Boolean, default=False)

    # Postgres array columns to hold multi-valued fields like genres or thumbnails
    thumbnails = Column(ARRAY(String), default=[])
    interests = Column(ARRAY(String), default=[])
    countries_of_origin = Column(ARRAY(String), default=[])
    external_links = Column(ARRAY(String), default=[])
    spoken_languages = Column(ARRAY(String), default=[])
    filming_locations = Column(ARRAY(String), default=[])
    production_companies = Column(ARRAY(String), default=[])
    genres = Column(ARRAY(String), default=[])


class MovieCategory(Base):
    __tablename__ = "movie_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_slug = Column(String, index=True, nullable=False)
    movie_id = Column(String, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    display_order = Column(Integer, nullable=False)

    # Composite unique constraint ensuring a movie appears only once per category slug
    __table_args__ = (
        UniqueConstraint('category_slug', 'movie_id', name='uq_category_movie'),
    )