from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./licenses.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    # 这里可以暂时留空，或者在 main.py 里调用 Base.metadata.create_all
    from models import License  # 如果你希望这里创建表，可以加这一行
    Base.metadata.create_all(bind=engine)