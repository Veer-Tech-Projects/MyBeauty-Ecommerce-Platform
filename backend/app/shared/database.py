import pymysql
from dbutils.pooled_db import PooledDB
from contextlib import contextmanager
from app.shared.config import settings
from app.shared.exceptions import DatabaseError

class Database:
    _pool = None

    @classmethod
    def initialize(cls):
        """Initializes the connection pool singleton."""
        if cls._pool is None:
            try:
                cls._pool = PooledDB(
                    creator=pymysql,
                    mincached=1,
                    maxcached=settings.DB_POOL_SIZE,
                    host=settings.DB_HOST,
                    user=settings.DB_USER,
                    password=settings.DB_PASSWORD,
                    database=settings.DB_NAME,
                    port=settings.DB_PORT,
                    cursorclass=pymysql.cursors.DictCursor,
                    autocommit=False,  # We control transactions manually
                    ping=2,  # Check connection before use (MySQL specific)
                )
            except Exception as e:
                raise DatabaseError(f"Failed to initialize DB pool: {str(e)}")

    @classmethod
    def get_connection(cls):
        if cls._pool is None:
            cls.initialize()
        return cls._pool.connection()

# --- Context Managers ---

@contextmanager
def get_db_connection():
    """
    Yields a raw connection. 
    Use this if you need fine-grained control over the connection.
    """
    conn = Database.get_connection()
    try:
        yield conn
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

@contextmanager
def get_cursor(commit=False):
    """
    Yields a cursor. 
    If commit=True, it attempts to commit at the end of the block.
    If an error occurs, it rolls back automatically.
    """
    conn = Database.get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise DatabaseError(f"Database Transaction Error: {str(e)}")
    finally:
        cursor.close()
        conn.close()