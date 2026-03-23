from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import init_db
from routers import auth, consult, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup — creates DB tables
    await init_db()
    yield


app = FastAPI(
    title="MediDecide API",
    description="Multi-Agent Healthcare Decision Support System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# In production, replace "*" with your deployed frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://your-frontend.vercel.app",
        "https://a-multi-agent-decision-support-syst.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(consult.router)
app.include_router(history.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "MediDecide API v1"}
