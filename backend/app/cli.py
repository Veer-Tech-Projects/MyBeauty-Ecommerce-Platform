# backend/cli.py
import argparse
import sys
import uuid
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.db import transaction, fetch_one, fetch_all, execute
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)
ph = PasswordHasher(time_cost=2, memory_cost=102400, parallelism=8)  # Argon2id

def hash_password(pwd: str) -> str:
    return ph.hash(pwd)

def verify_password(hash_: str, pwd: str) -> bool:
    try:
        ph.verify(hash_, pwd)
        return True
    except VerifyMismatchError:
        return False

# === CLI Commands ===

def create_admin(args):
    """
    Create a new admin user.
    Idempotent: does nothing if username already exists.
    """
    username = args.username.strip()
    password = args.password
    name = args.name.strip() if args.name else None
    role = args.role or 'manager'

    # Basic validation
    if len(username) < 3 or len(password) < 8:
        print("Error: Username must be >=3 chars, Password >=8 chars")
        return

    try:
        with transaction() as (conn, cur):
            # Check if admin already exists
            existing = fetch_one("SELECT id FROM admins WHERE username = %s", (username,))
            if existing:
                print(f"Admin '{username}' already exists. Skipping creation.")
                return

            # Hash password using Argon2
            pwd_hash = ph.hash(password)

            # Insert admin directly using cursor to get lastrowid
            cur.execute(
                "INSERT INTO admins (username, password_hash, name, role) VALUES (%s, %s, %s, %s)",
                (username, pwd_hash, name, role)
            )
            admin_id = cur.lastrowid
            conn.commit()

        # Log safely (avoid using 'args' key)
        log.info("admin_created", extra={"admin_id": admin_id, "username": username, "role": role})

        print(f"Admin '{username}' created successfully with ID: {admin_id}")

    except Exception as e:
        log.error("cli_error", extra={"error": str(e), "cli_args": vars(args)})
        print(f"Error creating admin: {e}")

def update_admin(args):
    username = args.username.strip()
    admin = fetch_one("SELECT id, password_hash FROM admins WHERE username = %s", (username,))
    if not admin:
        print(f"Admin '{username}' not found.")
        return

    updates = []
    params = []

    if args.password:
        updates.append("password_hash = %s")
        params.append(hash_password(args.password))
        log.info("admin_password_updated", extra={"admin_id": admin['id'], "username": username})

    if args.name:
        updates.append("name = %s")
        params.append(args.name.strip())
        log.info("admin_name_updated", extra={"admin_id": admin['id'], "username": username})

    if not updates:
        print("Nothing to update.")
        return

    params.append(username)
    sql = f"UPDATE admins SET {', '.join(updates)} WHERE username = %s"
    execute(sql, tuple(params))
    print(f"Admin '{username}' updated.")

def clear_sessions(args):
    username = args.username.strip() if args.username else None
    all_sessions = args.all

    if not username and not all_sessions:
        print("Use --username or --all")
        return

    with transaction() as (conn, cur):
        if all_sessions:
            cur.execute("UPDATE admin_sessions SET revoked_at = NOW() WHERE revoked_at IS NULL")
            print(f"All sessions revoked. Rows: {cur.rowcount}")
        else:
            admin = fetch_one("SELECT id FROM admins WHERE username = %s", (username,))
            if not admin:
                print(f"Admin '{username}' not found.")
                return
            cur.execute(
                "UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = %s AND revoked_at IS NULL",
                (admin['id'],)
            )
            print(f"Sessions for '{username}' revoked. Rows: {cur.rowcount}")

        # Redis cleanup handled by Celery sweep or middleware
        conn.commit()

def list_admins(args):
    admins = fetch_all("SELECT id, username, name, role, is_active, created_at FROM admins ORDER BY id")
    if not admins:
        print("No admins found.")
        return
    print("\n{:<5} {:<15} {:<20} {:<12} {:<8} {:<20}".format("ID", "Username", "Name", "Role", "Active", "Created"))
    print("-" * 80)
    for a in admins:
        active = "Yes" if a['is_active'] else "No"
        print(f"{a['id']:<5} {a['username']:<15} {a['name'] or '' :<20} {a['role']:<12} {active:<8} {a['created_at']}")

# === Argparse Setup ===

parser = argparse.ArgumentParser(description="Admin CLI Tool")
subparsers = parser.add_subparsers()

# create-admin
p_create = subparsers.add_parser('create-admin', help='Create new admin')
p_create.add_argument('--username', required=True)
p_create.add_argument('--password', required=True)
p_create.add_argument('--name')
p_create.add_argument('--role', choices=['superadmin', 'manager'])
p_create.set_defaults(func=create_admin)

# update-admin
p_update = subparsers.add_parser('update-admin', help='Update admin')
p_update.add_argument('--username', required=True)
p_update.add_argument('--password')
p_update.add_argument('--name')
p_update.set_defaults(func=update_admin)

# clear-sessions
p_clear = subparsers.add_parser('clear-sessions', help='Revoke sessions')
p_clear.add_argument('--username')
p_clear.add_argument('--all', action='store_true')
p_clear.set_defaults(func=clear_sessions)

# list-admins
p_list = subparsers.add_parser('list-admins', help='List all admins')
p_list.set_defaults(func=list_admins)

# === Main ===

def main():
    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        sys.exit(1)
    try:
        args.func(args)
    except Exception as e:
        log.error("cli_error", extra={"error": str(e), "args": vars(args)})
        print(f"Error: {e}")

if __name__ == '__main__':
    main()