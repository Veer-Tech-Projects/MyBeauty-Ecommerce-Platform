from app.shared.database import get_cursor
from typing import List, Dict
from app.shared.exceptions import AppError

class AddressRepository:
    
    @staticmethod
    def get_all(user_id: int) -> List[Dict]:
        with get_cursor() as cursor:
            # Sort by Default first, then Newest
            sql = "SELECT * FROM addresses WHERE user_id = %s ORDER BY is_default DESC, id DESC"
            cursor.execute(sql, (user_id,))
            return cursor.fetchall()

    @staticmethod
    def create(user_id: int, data: Dict) -> int:
        with get_cursor(commit=True) as cursor:
            # 1. LOCK & COUNT: Prevent Race Conditions
            cursor.execute("SELECT COUNT(*) as count FROM addresses WHERE user_id = %s FOR UPDATE", (user_id,))
            count = cursor.fetchone()['count']
            
            if count >= 3:
                raise AppError("Address limit reached (Max 3)", 409)

            # 2. Logic: First address is always default
            is_default = 1 if (data.get('is_default') or count == 0) else 0

            # 3. Reset other defaults if this one is default
            if is_default:
                cursor.execute("UPDATE addresses SET is_default = 0 WHERE user_id = %s", (user_id,))

            # 4. Insert
            sql = """
                INSERT INTO addresses 
                (user_id, fullname, phone, pincode, state, city, house, road, landmark, alternate_phone, type, is_default, country, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'India', NOW(), NOW())
            """
            cursor.execute(sql, (
                user_id, data['fullname'], data['phone'], data['pincode'], 
                data['state'], data['city'], data['house'], data['road'], 
                data.get('landmark'), data.get('alternate_phone'), data['type'], is_default
            ))
            return cursor.lastrowid

    @staticmethod
    def update(user_id: int, address_id: int, data: Dict) -> bool:
        with get_cursor(commit=True) as cursor:
            # 1. Handle Default Toggle
            if data.get('is_default'):
                cursor.execute("UPDATE addresses SET is_default = 0 WHERE user_id = %s", (user_id,))

            # 2. Build Query
            fields = []
            params = []
            allowed = ['fullname', 'phone', 'pincode', 'state', 'city', 'house', 'road', 'landmark', 'alternate_phone', 'type', 'is_default']
            
            for k in allowed:
                if k in data:
                    fields.append(f"{k} = %s")
                    params.append(data[k])
            
            if not fields: return False

            fields.append("updated_at = NOW()")
            params.append(address_id)
            params.append(user_id) # Ownership check
            
            sql = f"UPDATE addresses SET {', '.join(fields)} WHERE id = %s AND user_id = %s"
            cursor.execute(sql, tuple(params))
            
            return cursor.rowcount > 0

    @staticmethod
    def delete(user_id: int, address_id: int) -> bool:
        with get_cursor(commit=True) as cursor:
            # 1. Check if we are deleting the Default address
            cursor.execute("SELECT is_default FROM addresses WHERE id = %s AND user_id = %s FOR UPDATE", (address_id, user_id))
            target = cursor.fetchone()
            
            if not target:
                return False # Not found or not owned

            # 2. Delete
            cursor.execute("DELETE FROM addresses WHERE id = %s", (address_id,))

            # 3. Fallback: If it was default, promote the newest remaining address
            if target['is_default']:
                cursor.execute("""
                    UPDATE addresses SET is_default = 1 
                    WHERE id = (SELECT id FROM (SELECT id FROM addresses WHERE user_id = %s ORDER BY created_at DESC LIMIT 1) as t)
                """, (user_id,))
                
            return True