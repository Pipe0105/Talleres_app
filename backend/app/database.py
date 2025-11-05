from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()

def get_db():
    from contextlib import contextmanager
    @contextmanager
    def _session_scope():
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except:
            db.rollback()
            raise
        finally:
            db.close()
    return _session_scope()
