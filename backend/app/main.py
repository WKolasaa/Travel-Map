from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.data import initialize_database
from app.media import MEDIA_ROOT, MEDIA_URL_PREFIX, ensure_media_root
from app.migrations import run_migrations
from app.routers import auth, groups, map_data, media, places, trips, users

ensure_media_root()


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_migrations()
    ensure_media_root()
    initialize_database()
    yield


app = FastAPI(
    title="Travel Map API",
    version="0.1.0",
    description="FastAPI scaffold for the travel memory app.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(MEDIA_URL_PREFIX, StaticFiles(directory=MEDIA_ROOT), name="media")

app.include_router(auth.router, prefix="/api")
app.include_router(map_data.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(places.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(groups.router, prefix="/api")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
