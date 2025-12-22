from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.shared.database import get_db_connection
import pymysql

products_bp = Blueprint("products", __name__, url_prefix="/api/products")

# ---------------- API Routes ----------------

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT * FROM categories")
                categories = cursor.fetchall()

        # Normalize image paths
        for cat in categories:
            if not cat.get("image"):
                cat["image"] = "/static/default-category.png"

        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/category/<int:category_id>', methods=['GET'])
def get_products_by_category(category_id):
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("""
                    SELECT 
                        p.id, p.name, p.price, p.mrp, p.discount, p.stock, p.category_id, p.created_at,
                        (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) AS image_path
                    FROM products p
                    WHERE p.category_id = %s
                    ORDER BY p.created_at DESC
                """, (category_id,))
                products = cursor.fetchall()

        # Normalize paths
        for product in products:
            if product.get("image_path") and not product["image_path"].startswith("/"):
                product["image_path"] = "/" + product["image_path"]

        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@products_bp.route('/', methods=['GET'])
def get_products():
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                query = """
                    SELECT 
                        p.id, p.name, p.price, p.mrp, p.discount,
                        (SELECT image_path FROM product_images WHERE product_id = p.id ORDER BY id ASC LIMIT 1) AS image_path
                    FROM products p
                    WHERE p.status = 1
                    ORDER BY p.created_at DESC
                """
                cursor.execute(query)
                products = cursor.fetchall()

        # Normalize image paths
        for product in products:
            if product.get("image_path") and not product["image_path"].startswith("/"):
                product["image_path"] = "/" + product["image_path"]

        return jsonify(products)

    except Exception as e:
        print("🔥 Error in /api/products:", e)
        return jsonify({"error": str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cursor:
                # Check if product exists and is active
                cursor.execute("""
                    SELECT 
                        p.id, p.name, p.description, p.brand, 
                        p.price, p.mrp, p.discount, p.stock, p.size_stock,
                        p.delivery_type, p.delivery_charge, p.dispatch_time,
                        p.return_policy, p.cod_available,
                        p.color_name, p.color_code, p.category_id
                    FROM products p
                    WHERE p.id = %s AND p.status = 1
                """, (product_id,))
                product = cursor.fetchone()

                if not product:
                    return jsonify({'error': 'Product not found'}), 404

                # Normalize size_stock
                product['size_stock'] = product.get('size_stock') or '{}'

                # Fetch images
                cursor.execute("SELECT image_path FROM product_images WHERE product_id = %s", (product_id,))
                images = cursor.fetchall()
                for img in images:
                    if img["image_path"] and not img["image_path"].startswith("/"):
                        img["image_path"] = "/" + img["image_path"]
                product['images'] = images

                # Fetch variants
                cursor.execute("""
                    SELECT 
                        id, product_id, name, color_name, color_code,
                        size_stock, price, mrp, discount, stock,
                        image_path, brand, description,
                        dispatch_time, delivery_type, delivery_charge,
                        cod_available, return_policy
                    FROM product_variants
                    WHERE product_id = %s AND status = 1
                """, (product_id,))
                variants = cursor.fetchall()

                for variant in variants:
                    if variant.get("image_path") and not variant["image_path"].startswith("/"):
                        variant["image_path"] = "/" + variant["image_path"]
                    variant["size_stock"] = variant.get("size_stock") or '{}'

                    # Variant images
                    cursor.execute("SELECT image_path FROM variant_images WHERE variant_id = %s", (variant["id"],))
                    variant_imgs = cursor.fetchall()
                    normalized_variant_imgs = []
                    for img in variant_imgs:
                        path = img["image_path"]
                        if path and not path.startswith("/"):
                            path = "/" + path
                        normalized_variant_imgs.append(path)
                    variant["variant_images"] = normalized_variant_imgs

                product['variants'] = variants

        return jsonify(product)

    except Exception as e:
        print(f"❌ Error fetching product: {e}")
        return jsonify({'error': str(e)}), 500


@products_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)


@products_bp.route('/search', methods=['GET'])
def search_products():
    q = (request.args.get('q') or '').strip()
    if not q:
        return jsonify([])

    try:
        with get_db_connection() as conn:
            with conn.cursor(pymysql.cursors.DictCursor) as cur:
                # FULLTEXT search
                cur.execute("""
                    SELECT
                        p.id, p.name, p.price, p.discount AS discount, p.stock,
                        COALESCE((SELECT image_path FROM product_images pi WHERE pi.product_id = p.id LIMIT 1), '') AS image_path,
                        MATCH(p.name, p.description) AGAINST (%s IN NATURAL LANGUAGE MODE) AS relevance
                    FROM products p
                    WHERE MATCH(p.name, p.description) AGAINST (%s IN NATURAL LANGUAGE MODE)
                    ORDER BY relevance DESC LIMIT 100
                """, (q, q))
                rows = cur.fetchall()

                if not rows:
                    # Fallback LIKE search
                    wildcard = f"%{q}%"
                    cur.execute("""
                        SELECT
                            p.id, p.name, p.price, p.discount AS discount, p.stock,
                            COALESCE((SELECT image_path FROM product_images pi WHERE pi.product_id = p.id LIMIT 1), '') AS image_path,
                            0 AS relevance
                        FROM products p
                        WHERE p.name LIKE %s OR p.description LIKE %s
                        ORDER BY p.name LIMIT 100
                    """, (wildcard, wildcard))
                    rows = cur.fetchall()
        return jsonify(rows)

    except Exception as e:
        return jsonify({'error': str(e)}), 500