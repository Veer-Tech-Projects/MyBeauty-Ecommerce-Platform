from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.shared.database import get_db_connection
import pymysql
import traceback
import json

cart_bp = Blueprint('cart', __name__, url_prefix='/api')

@cart_bp.route('/get-cart', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_id = get_jwt_identity()
        cart_items = []
        
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("""
                    SELECT 
                        c.id AS cart_id, c.product_id, c.variant_id, c.name,
                        c.price, c.discount_percent,
                        ROUND(c.price * (1 - c.discount_percent / 100), 2) AS final_price,
                        c.quantity, c.size, c.image,
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

        # Post-process items
        base_url = request.host_url.rstrip('/')
        for item in cart_items:
            stock = item.get('stock') or 0
            size_stock_raw = item.get('size_stock')
            selected_size = item.get('size')
            effective_stock = stock

            if size_stock_raw and selected_size:
                try:
                    size_map = json.loads(size_stock_raw)
                    if selected_size in size_map:
                        effective_stock = int(size_map[selected_size])
                except Exception:
                    pass

            item['effective_stock'] = max(0, effective_stock)
            item['is_out_of_stock'] = item['effective_stock'] <= 0

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


@cart_bp.route("/add-to-cart", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = get_jwt_identity()
    data = request.json
    product_id = data.get("product_id")
    variant_id = data.get("variant_id")
    quantity = int(data.get("quantity", 1))
    size = data.get("size") or None

    if not product_id:
        return jsonify({"error": "Product ID is required"}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check product/variant
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
                            (SELECT pi.image_path FROM product_images pi WHERE pi.product_id = p.id LIMIT 1) AS image
                        FROM products p
                        WHERE p.id = %s
                    """, (product_id,))

                item = cursor.fetchone()
                if not item:
                    return jsonify({"error": "Product not found"}), 404

                # Stock checks logic...
                total_stock = int(item.get("stock") or 0)
                stock = total_stock
                if size:
                    try:
                        size_stock = json.loads(item.get("size_stock") or "{}")
                        stock = int(size_stock.get(size, 0))
                    except:
                        stock = 0
                
                if quantity > stock:
                    return jsonify({"error": "Not enough stock"}), 400

                # Insert/Check Existing
                cursor.execute("""
                    SELECT id FROM cart WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
                """, (user_id, product_id, variant_id, size))
                if cursor.fetchone():
                    return jsonify({"warning": "Item already in cart"}), 200

                cursor.execute("""
                    INSERT INTO cart (
                        user_id, product_id, variant_id, name, price, discount_percent,
                        quantity, image, size, stock
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, product_id, variant_id, item["name"], float(item["price"]), 
                      float(item.get("discount_percent") or 0), quantity, item.get("image", ""), size, stock))
                conn.commit()

        return jsonify({"message": "Item added to cart"}), 200

    except Exception as e:
        print("❌ Exception in /add-to-cart:", e)
        return jsonify({"error": "Could not add to cart"}), 500


@cart_bp.route('/update-cart', methods=['POST'])
@jwt_required()
def update_cart():
    user_id = get_jwt_identity()
    data = request.json
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE cart SET quantity = %s
                    WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
                """, (int(data.get('quantity', 1)), user_id, data.get('product_id'), data.get('variant_id'), data.get('size')))
                conn.commit()
        return jsonify({'message': 'Quantity updated'})
    except Exception as e:
        return jsonify({'error': 'Could not update cart'}), 500


@cart_bp.route('/remove-from-cart', methods=['POST'])
@jwt_required()
def remove_from_cart():
    user_id = get_jwt_identity()
    data = request.json
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM cart
                    WHERE user_id = %s AND product_id = %s AND variant_id <=> %s AND size <=> %s
                """, (user_id, data.get('product_id'), data.get('variant_id'), data.get('size')))
                conn.commit()
        return jsonify({'message': 'Item removed'})
    except Exception as e:
        return jsonify({'error': 'Could not remove item'}), 500