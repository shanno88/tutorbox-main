from fastapi import FastAPI
from app.db import Base, engine
from app.routes import auth, plans, billing, practice
from app.routes.dodo import router as dodo_router

app = FastAPI(title="Paddle SaaS Boilerplate")

Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(billing.router)
app.include_router(practice.router)
app.include_router(dodo_router)
