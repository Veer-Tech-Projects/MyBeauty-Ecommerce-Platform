# backend/routes/cart_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.db import get_db_connection
import pymysql
import traceback
import json

cart_bp = Blueprint('cart', __name__, url_prefix='/api')

# ✅ GET CART
@cart_bp.route('/get-cart', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_id = get_jwt_identity()
        conn = get_db_connection()

        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    c.id AS cart_id,
                    c.product_id,
                    c.variant_id,
                    c.name,
                    c.price,
                    c.discount_percent,
                    ROUND(c.price * (1 - c.discount_percent / 100), 2) AS final_price,
                    c.quantity,
                    c.size,
                    c.image,
                    COALESCE(v.stock, p.stock) AS stock,
                    COALESCE(v.size_stock, p.size_stock) AS size_stock,
                    c.created_at
                FROM cart c
                LEFT JOIN products p ON c.product_id = p.id
                LEFT JOIN product_variants v ON c.variant_id = v.id
                WHERE c.user_id = %s
                ORDER BY c.created_at DESC
            """, (user_id,))
            cart_items = cursor.fetchall()

        # ✅ Normalize base URL (respects environment)
        base_url = request.host_url.rstrip('/')

        # ✅ Post-process items
        for item in cart_items:
            stock = item.get('stock') or 0
            size_stock_raw = item.get('size_stock')
            selected_size = item.get('size')
            effective_stock = stock

            # 🔍 Handle size-specific stock
            if size_stock_raw and selected_size:
                try:
                    size_map = json.loads(size_stock_raw)
                    if selected_size in size_map:
                        effective_stock = int(size_map[selected_size])
                except Exception as e:
                    print("❌ Failed to parse size_stock for item:", item['cart_id'], e)

            item['effective_stock'] = max(0, effective_stock)
            item['is_out_of_stock'] = item['effective_stock'] <= 0

            # 🌐 Normalize image path
            image = item.get('image')
            if image:
                if not image.startswith('http'):
                    image = image.lstrip('/')
                    item['image'] = f"{base_url}/{image}"
            else:
                item['image'] = f"{base_url}/fallback.png"

        return jsonify({"cart": cart_items})

    except Exception as e:
        print("❌ ERROR in /get-cart:", e)
        return jsonify({"error": "Something went wrong"}), 500

    finally:
        conn.close()


# backend/routes/cart_routes.py
@cart_bp.route("/add-to-cart", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    print(f"🛒 Add to cart — user_id: {user_id}")
    data = request.json

    product_id = data.get("product_id")
    variant_id = data.get("variant_id")
    quantity = int(data.get("quantity", 1))
    size = data.get("size") or None

    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    try:
        # Check if product has variants and enforce size if no variant_id
        cursor.execute("SELECT enable_variants FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if product and product['enable_variants'] and not variant_id and not size:
            return jsonify({"error": "Size is required for products with variants"}), 400

        # Fetch product/variant data
        if variant_id:
            cursor.execute("""
                SELECT v.name, v.price, v.discount AS discount_percent, v.stock, v.size_stock,
                    COALESCE(vi.image_path, v.image_path) AS image
                FROM product_variants v
                LEFT JOIN variant_images vi ON vi.variant_id = v.id
                WHERE v.id = %s
            """, (variant_id,))
        else:
            cursor.execute("""
                SELECT p.name, p.price, p.discount AS discount_percent, p.stock, p.size_stock,
                    (SELECT pi.image_path FROM product_images pi 
                     WHERE pi.product_id = p.id ORDER BY pi.id ASC LIMIT 1) AS image
                FROM products p
                WHERE p.id = %s
            """, (product_id,))

        item = cursor.fetchone()
        if not item:
            return jsonify({"error": "Product or variant not found"}), 404

        name = item["name"]
        price = float(item["price"])
        discount_percent = float(item.get("discount_percent") or 0)
        image = item.get("image", "")
        total_stock = int(item.get("stock") or 0)

        # Handle size-specific stock
        if size:
            try:
                size_stock = json.loads(item.get("size_stock") or "{}")
                stock = int(size_stock.get(size, 0))
                if stock == 0:
                    return jsonify({"error": f"No stock available for size {size}"}), 400
            except Exception as e:
                print("❌ Failed to parse size_stock:", e)
                stock = 0
        else:
            stock = total_stock

        if quantity > stock:
            return jsonify({"error": "Not enough stock available"}), 400

        # Check if product already exists in cart
        cursor.execute("""
            SELECT id, quantity FROM cart
            WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
        """, (user_id, product_id, variant_id, size))
        existing = cursor.fetchone()

        if existing:
            return jsonify({"warning": "Item already in cart"}), 200

        # Insert new item
        cursor.execute("""
            INSERT INTO cart (
                user_id, product_id, variant_id, name, price, discount_percent,
                quantity, image, size, stock
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, product_id, variant_id, name, price, discount_percent,
              quantity, image, size, stock))
        conn.commit()

        return jsonify({"message": "Item added to cart"}), 200

    except Exception as e:
        print("❌ Exception in /add-to-cart:", e)
        print(traceback.format_exc())
        return jsonify({"error": "Could not add to cart"}), 500
    finally:
        cursor.close()
        conn.close()


# ✅ UPDATE QUANTITY
@cart_bp.route('/update-cart', methods=['POST'])
@jwt_required()
def update_cart():
    user_id = get_jwt_identity()
    data = request.json

    product_id = data.get('product_id')
    variant_id = data.get('variant_id')
    quantity = int(data.get('quantity', 1))
    size = data.get('size') or None

    if not product_id:
        return jsonify({'error': 'Product ID is required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    try:
        # Check stock
        if variant_id:
            cursor.execute("SELECT stock FROM product_variants WHERE id = %s", (variant_id,))
        else:
            cursor.execute("SELECT stock FROM products WHERE id = %s", (product_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Product not found'}), 404
        if quantity > row['stock']:
            return jsonify({'error': 'Exceeds stock limit'}), 400

        # Update
        cursor.execute("""
            UPDATE cart
            SET quantity = %s
            WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
        """, (quantity, user_id, product_id, variant_id, size))

        conn.commit()
        return jsonify({'message': 'Quantity updated'})
    except Exception as e:
        print("❌ Error in /update-cart:", e)
        return jsonify({'error': 'Could not update cart'}), 500
    finally:
        cursor.close()
        conn.close()


# ✅ REMOVE ITEM
@cart_bp.route('/remove-from-cart', methods=['POST'])
@jwt_required()
def remove_from_cart():
    user_id = get_jwt_identity()
    data = request.json

    product_id = data.get('product_id')
    variant_id = data.get('variant_id')
    size = data.get('size') or None

    if not product_id:
        return jsonify({'error': 'Product ID required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            DELETE FROM cart
            WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
        """, (user_id, product_id, variant_id, size))
        conn.commit()
        return jsonify({'message': 'Item removed'})
    except Exception as e:
        print("❌ Error in /remove-from-cart:", e)
        return jsonify({'error': 'Could not remove item'}), 500
    finally:
        cursor.close()
        conn.close()
