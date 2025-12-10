# backend/app/db.py
from __future__ import annotations

import json
import time

import threading
from contextlib import contextmanager
from typing import Any, Dict, Iterable, Optional, Tuple

import pymysql
from dbutils.pooled_db import PooledDB

from .config import settings
from .logger import get_logger

log = get_logger(__name__)

_pool_lock = threading.Lock()
_pool: Optional[PooledDB] = None


def _create_pool() -> PooledDB:
    return PooledDB(
        creator=pymysql,
        maxconnections=settings.DB_POOL_SIZE,  # max open connections
        mincached=1,                           # keep some connections cached
        maxcached=settings.DB_POOL_SIZE,       # max cached connections
        blocking=True,                         # wait if pool exhausted
        maxusage=None,                         # unlimited reuse
        setsession=["SET NAMES utf8mb4"],
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def _get_pool() -> PooledDB:
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = _create_pool()
                log.info(
                    "db_pool_initialized",
                    extra={"extra": {"pool_size": settings.DB_POOL_SIZE}},
                )
    return _pool


@contextmanager
def connection():
    """Yields a pooled connection from PyMySQL."""
    pool = _get_pool()
    conn = pool.connection()
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def cursor(dict_rows: bool = True):
    """Yields (conn, cursor). Autocommit disabled by default."""
    with connection() as conn:
        cur = conn.cursor()  # DictCursor already set globally
        try:
            yield conn, cur
        finally:
            cur.close()


@contextmanager
def transaction():
    """Context manager for BEGIN → COMMIT/ROLLBACK."""
    with cursor() as (conn, cur):
        try:
            yield conn, cur
            conn.commit()
        except Exception as e:
            conn.rollback()
            log.error("db_transaction_rollback", extra={"extra": {"error": str(e)}})
            raise


def fetch_one(sql: str, params: Tuple[Any, ...] = ()) -> Optional[Dict[str, Any]]:
    with cursor() as (_, cur):
        cur.execute(sql, params)
        return cur.fetchone()


def fetch_all(sql: str, params: Tuple[Any, ...] = ()) -> Iterable[Dict[str, Any]]:
    with cursor() as (_, cur):
        cur.execute(sql, params)
        return cur.fetchall()


def execute(sql: str, params: Tuple[Any, ...] = ()) -> int:
    with transaction() as (conn, cur):
        cur.execute(sql, params)
        return cur.rowcount


def executemany(sql: str, params_seq: Iterable[Tuple[Any, ...]]) -> int:
    with transaction() as (conn, cur):
        cur.executemany(sql, list(params_seq))
        return cur.rowcount
    
def get_db_connection():
    """
    Backward-compatible shim for legacy code that expects get_db_connection().
    Returns a pooled MySQL connection.
    """
    return _get_pool().connection()

