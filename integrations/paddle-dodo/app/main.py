from fastapi import FastAPI
from app.db import Base, engine
from app.routes.dodo import router as dodo_router
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, plans, billing, practice, trial

app = FastAPI(title="Paddle SaaS Boilerplate")

Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(billing.router)
app.include_router(practice.router)
app.include_router(trial.router)
app.include_router(dodo_router)