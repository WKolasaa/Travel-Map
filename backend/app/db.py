import os

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/travel_map")


def normalize_database_url(url: str) -> str:
    return url.replace("postgresql+psycopg://", "postgresql://", 1)


def get_connection():
    return psycopg.connect(normalize_database_url(DATABASE_URL), row_factory=dict_row)
