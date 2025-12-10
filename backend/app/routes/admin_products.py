# backend/app/routes/admin_products.py

import os
import uuid
import json
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.utils import secure_filename

from app.db import get_db_connection
from app.middlewares.admin_auth_middleware import require_admin_auth
from app.utils.session_utils import get_redis
from app.logger import get_logger

# Blueprint
admin_products = Blueprint("admin_products", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads", "products")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Logging
log = get_logger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def safe_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def invalidate_stock_cache(redis_client, product_id, variant_id=None):
    """
    Delete redis keys matching stock:{product_id}:{variant_id or 'null'}:*
    Uses scan_iter to safely delete pattern matches (supports Redis clusters / large keyspaces).
    """
    if not redis_client:
        return

    pattern = f"stock:{product_id}:{variant_id if variant_id is not None else 'null'}:*"
    try:
        # scan_iter is preferable for production (non-blocking)
        for key in redis_client.scan_iter(match=pattern, count=100):
            try:
                redis_client.delete(key)
            except Exception as e:
                log.error("Failed to delete redis key during cache invalidation", extra={"key": key, "error": str(e)})
    except Exception as e:
        log.error("Redis cache invalidation failed", extra={"pattern": pattern, "error": str(e)})


# ------------------ Add product ------------------
@admin_products.route("/api/admin/products/add", methods=["POST"])
@require_admin_auth
def add_product():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.form
    files = request.files

    try:
        redis_client = get_redis()
    except Exception:
        redis_client = None

    try:
        admin_id = g.admin.get("admin_id")

        # --- Upload folder inside app/static ---
        upload_root = os.path.join(current_app.root_path, "static", "uploads", "products")
        os.makedirs(upload_root, exist_ok=True)

        # --- Basic fields ---
        name = data.get("name", "").strip()
        try:
            category_id = int(data.get("category_id", 0))
        except (ValueError, TypeError):
            category_id = None
        brand = data.get("brand", "").strip()
        description = data.get("description", "").strip()
        enable_variants = str(data.get("enableVariants", "false")).lower() == "true"

        mrp = safe_float(data.get("mrp"))
        discount = safe_float(data.get("discount"))
        price = round(mrp - (mrp * discount / 100), 2) if mrp else 0.0

        # --- Size stock ---
        size_stock_json = data.get("size_stock", "{}")
        try:
            size_stock_dict = json.loads(size_stock_json)
        except Exception:
            size_stock_dict = {}

        if isinstance(size_stock_dict, dict) and size_stock_dict:
            stock = sum(int(qty) for qty in size_stock_dict.values())
        else:
            stock = safe_int(data.get("stock", 0))
            size_stock_dict = {}

        color_name = (data.get("color_name") or "").strip()
        color_code = (data.get("color_code") or "#000000").strip()

        sizes = None
        if not enable_variants:
            try:
                sizes_list = json.loads(data.get("sizes", "[]"))
                sizes = ",".join(size.strip() for size in sizes_list if size and size.strip())
            except Exception:
                sizes = ""

        # --- Shipping ---
        length = safe_float(data.get("length"))
        breadth = safe_float(data.get("breadth"))
        height = safe_float(data.get("height"))
        weight = safe_float(data.get("weight"))
        delivery_type = data.get("deliveryType", "free")
        delivery_charge = safe_float(data.get("deliveryCharge")) if delivery_type == "custom" else 0
        cod_available = data.get("codAvailable", "false").lower() == "true"
        return_policy = data.get("returnPolicy", "").strip()
        tags = data.get("tags", "")
        dispatch_time = data.get("dispatch_time", "")

        # --- Insert product ---
        cursor.execute(
            """
            INSERT INTO products (
                name, category_id, brand, description, enable_variants,
                price, mrp, discount, stock, sizes, size_stock,
                length, breadth, height, weight,
                delivery_type, delivery_charge, cod_available,
                return_policy, tags, dispatch_time,
                color_name, color_code
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s
            )
            """,
            (
                name, category_id, brand, description, int(enable_variants),
                price, mrp, discount, stock, sizes, json.dumps(size_stock_dict) if size_stock_dict else None,
                length, breadth, height, weight,
                delivery_type, delivery_charge, int(cod_available),
                return_policy, tags, dispatch_time,
                color_name, color_code
            ),
        )
        product_id = cursor.lastrowid

        # --- Product Images ---
        for img in files.getlist("images"):
            if img and img.filename:
                filename = secure_filename(f"{uuid.uuid4().hex}_{img.filename}")
                abs_path = os.path.join(upload_root, filename)
                img.save(abs_path)

                rel_path = os.path.relpath(abs_path, current_app.root_path).replace("\\", "/")
                cursor.execute(
                    "INSERT INTO product_images (product_id, image_path) VALUES (%s, %s)",
                    (product_id, rel_path)
                )

        # --- Variants ---
        if enable_variants:
            variants = json.loads(data.get("variants", "[]"))
            for idx, v in enumerate(variants):
                vname = v.get("name", "").strip()
                vcolor_name = v.get("color_name", "").strip()
                vcolor_code = v.get("color_code", "#000000").strip()
                vsizes = ",".join(size.strip() for size in v.get("sizes", []) if size and size.strip())
                vmrp = safe_float(v.get("mrp"))
                vdiscount = safe_float(v.get("discount"))
                vprice = round(vmrp - (vmrp * vdiscount / 100), 2) if vmrp else 0.0

                vsize_stock_dict = {}
                try:
                    vsize_stock_dict = v.get("size_stock", {}) or {}
                    if isinstance(vsize_stock_dict, dict) and vsize_stock_dict:
                        vstock = sum(int(qty) for qty in vsize_stock_dict.values())
                    else:
                        vstock = safe_int(v.get("stock", 0))
                        vsize_stock_dict = {}
                except Exception:
                    vstock = safe_int(v.get("stock", 0))
                    vsize_stock_dict = {}

                vlength = safe_float(v.get("length")) or length
                vbreadth = safe_float(v.get("breadth")) or breadth
                vheight = safe_float(v.get("height")) or height
                vweight = safe_float(v.get("weight")) or weight

                # --- Variant images ---
                variant_image_paths = []
                variant_files = files.getlist(f"variant_images_v{idx}")
                for vimg in variant_files:
                    if vimg and vimg.filename:
                        filename = secure_filename(f"{uuid.uuid4().hex}_{vimg.filename}")
                        abs_path = os.path.join(upload_root, filename)
                        vimg.save(abs_path)
                        rel_path = os.path.relpath(abs_path, current_app.root_path).replace("\\", "/")
                        variant_image_paths.append(rel_path)

                primary_image_path = variant_image_paths[0] if variant_image_paths else None

                cursor.execute(
                    """
                    INSERT INTO product_variants (
                        product_id, category_id, name, color_name, color_code, sizes,
                        mrp, discount, price, image_path, stock, size_stock,
                        length, breadth, height, weight,
                        brand, description,
                        delivery_type, delivery_charge, cod_available,
                        return_policy, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s,
                        %s, %s, %s,
                        %s, %s
                    )
                    """,
                    (
                        product_id, category_id, vname, vcolor_name, vcolor_code, vsizes,
                        vmrp, vdiscount, vprice, primary_image_path, vstock, json.dumps(vsize_stock_dict) if vsize_stock_dict else None,
                        vlength, vbreadth, vheight, vweight,
                        brand, description,
                        delivery_type, delivery_charge, int(cod_available),
                        return_policy, 1
                    ),
                )
                variant_id = cursor.lastrowid

                for path in variant_image_paths:
                    cursor.execute(
                        "INSERT INTO variant_images (variant_id, image_path) VALUES (%s, %s)",
                        (variant_id, path)
                    )

        # --- Invalidate cache ---
        invalidate_stock_cache(redis_client, product_id)
        if enable_variants:
            cursor.execute("SELECT id FROM product_variants WHERE product_id = %s", (product_id,))
            for row in cursor.fetchall():
                invalidate_stock_cache(redis_client, product_id, row["id"])

        conn.commit()
        log.info("✅ Product and variants added successfully", extra={"product_id": product_id, "admin_id": admin_id})
        return jsonify({"message": "Product added successfully", "product_id": product_id}), 201

    except Exception as e:
        conn.rollback()
        log.error("Product add error", extra={"error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500

    finally:
        cursor.close()
        conn.close()



# ------------------ categories (unchanged) ------------------
@admin_products.route("/api/categories", methods=["GET"])
def get_categories():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, image FROM categories")
                rows = cursor.fetchall()
                categories = [dict(row) for row in rows]  # ensure plain dicts
                return jsonify(categories)
    except Exception as e:
        log.error("Error fetching categories", extra={"error": str(e)})
        return jsonify({"error": str(e)}), 500


# ------------------ list products (admin sees all brand products) ------------------
@admin_products.route("/api/admin/products", methods=["GET"])
@require_admin_auth
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            p.id, p.name, p.price, p.mrp, p.stock, p.created_at, 
            p.category_id, p.enable_variants, c.name AS category,
            COALESCE(i.image_path, '') AS image_path
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT product_id, MIN(image_path) AS image_path 
            FROM product_images 
            GROUP BY product_id
        ) i ON p.id = i.product_id
        ORDER BY p.created_at DESC
    """
    try:
        cursor.execute(query)
        products = cursor.fetchall()

        result = []
        for row in products:
            result.append({
                "id": row["id"],
                "name": row["name"],
                "price": float(row["price"]) if row["price"] is not None else 0,
                "mrp": float(row["mrp"]) if row["mrp"] is not None else 0,
                "stock": row["stock"] or 0,
                "status": True,
                "category": row["category"] or "Uncategorized",
                "created_at": row["created_at"].strftime("%Y-%m-%d %I:%M %p") if isinstance(row["created_at"], datetime) else row["created_at"],
                "image": f"{request.url_root.rstrip('/')}/{row['image_path']}" if row["image_path"] else ""
            })

        return jsonify(result)
    except Exception as e:
        log.error("Failed to list products", extra={"admin_id": g.admin.get("admin_id"), "error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ toggle product/variant status ------------------
@admin_products.route("/api/admin/products/<int:product_id>/status", methods=["PUT"])
@require_admin_auth
def toggle_product_status(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    is_variant = request.args.get("is_variant", "false").lower() == "true"
    admin_id = g.admin.get("admin_id")

    try:
        if is_variant:
            cursor.execute("SELECT status FROM product_variants WHERE id = %s", (product_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Variant not found"}), 404
            new_status = 0 if result["status"] else 1
            cursor.execute("UPDATE product_variants SET status = %s WHERE id = %s", (new_status, product_id))
        else:
            cursor.execute("SELECT status FROM products WHERE id = %s", (product_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Product not found"}), 404
            new_status = 0 if result["status"] else 1
            cursor.execute("UPDATE products SET status = %s WHERE id = %s", (new_status, product_id))

        conn.commit()
        log.info("Toggled product/variant status", extra={"admin_id": admin_id, "product_id": product_id, "is_variant": is_variant, "new_status": new_status})
        return jsonify({"success": True, "new_status": new_status})
    except Exception as e:
        conn.rollback()
        log.error("Toggle status error", extra={"admin_id": admin_id, "error": str(e)})
        return jsonify({"error": "Failed to toggle status"}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ delete product / variant ------------------
@admin_products.route("/api/admin/products/<int:product_id>", methods=["DELETE"])
@require_admin_auth
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    admin_id = g.admin.get("admin_id")

    is_variant = request.args.get("is_variant", "false").lower() == "true"

    try:
        if is_variant:
            cursor.execute("SELECT id, product_id FROM product_variants WHERE id = %s", (product_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": "Variant not found"}), 404
            # delete variant images
            cursor.execute("SELECT image_path FROM variant_images WHERE variant_id = %s", (product_id,))
            for img in cursor.fetchall():
                path = img.get("image_path")
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as e:
                        log.error("Failed to delete variant image file", extra={"path": path, "error": str(e)})
            cursor.execute("DELETE FROM variant_images WHERE variant_id = %s", (product_id,))
            cursor.execute("DELETE FROM product_variants WHERE id = %s", (product_id,))
            invalidate_stock_cache(get_redis(), row["product_id"], product_id)
        else:
            # delete product images
            cursor.execute("SELECT image_path FROM product_images WHERE product_id = %s", (product_id,))
            for img in cursor.fetchall():
                path = img.get("image_path")
                if path and os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as e:
                        log.error("Failed to delete product image file", extra={"path": path, "error": str(e)})
            cursor.execute("DELETE FROM product_images WHERE product_id = %s", (product_id,))

            # delete variant images & variants
            cursor.execute("SELECT id FROM product_variants WHERE product_id = %s", (product_id,))
            variant_rows = cursor.fetchall()
            for v in variant_rows:
                vid = v["id"]
                cursor.execute("SELECT image_path FROM variant_images WHERE variant_id = %s", (vid,))
                for img in cursor.fetchall():
                    path = img.get("image_path")
                    if path and os.path.exists(path):
                        try:
                            os.remove(path)
                        except Exception as e:
                            log.error("Failed to delete variant image file", extra={"path": path, "error": str(e)})
                cursor.execute("DELETE FROM variant_images WHERE variant_id = %s", (vid,))
            cursor.execute("DELETE FROM product_variants WHERE product_id = %s", (product_id,))
            cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))

            invalidate_stock_cache(get_redis(), product_id, None)

        conn.commit()
        log.info("Deleted product/variant", extra={"admin_id": admin_id, "product_id": product_id, "is_variant": is_variant})
        return jsonify({"success": True, "message": "Deleted successfully"})
    except Exception as e:
        conn.rollback()
        log.error("Delete error", extra={"admin_id": admin_id, "error": str(e)})
        return jsonify({"error": "Failed to delete"}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ get product by id ------------------
@admin_products.route("/api/admin/products/<int:product_id>", methods=["GET"])
@require_admin_auth
def get_product_by_id(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404

        cursor.execute("SELECT id, image_path FROM product_images WHERE product_id = %s", (product_id,))
        images = cursor.fetchall()

        result = {
            "id": product["id"],
            "name": product["name"],
            "price": float(product["price"]) if product["price"] else None,
            "mrp": float(product["mrp"]) if product["mrp"] else None,
            "discount": float(product["discount"]) if product["discount"] else None,
            "stock": product["stock"],
            "category_id": product["category_id"],
            "description": product["description"],
            "brand": product["brand"],
            "return_policy": product["return_policy"],
            "delivery_type": product["delivery_type"],
            "delivery_charge": float(product["delivery_charge"]) if product["delivery_charge"] else 0,
            "cod_available": bool(product["cod_available"]),
            "enable_variants": bool(product["enable_variants"]),
            "color_name": product.get("color_name") or "",
            "color_code": product.get("color_code") or "#000000",
            "size_stock": product.get("size_stock") or "{}",
            "images": [
                {"id": img["id"], "url": f"{request.url_root.rstrip('/')}/{img['image_path']}"}
                for img in images
            ],
        }

        if product["enable_variants"]:
            cursor.execute("SELECT * FROM product_variants WHERE product_id = %s", (product_id,))
            variants = cursor.fetchall()
            result["variants"] = []
            for v in variants:
                result["variants"].append({
                    "id": v["id"],
                    "name": v["name"],
                    "price": float(v["price"]),
                    "mrp": float(v["mrp"]),
                    "discount": float(v["discount"]),
                    "stock": v["stock"],
                    "size": v.get("sizes"),
                    "image": f"{request.url_root.rstrip('/')}/{v['image_path']}" if v.get("image_path") else None
                })

        return jsonify(result)
    except Exception as e:
        log.error("Product fetch error", extra={"error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ update product ------------------
@admin_products.route("/api/admin/products/<int:product_id>", methods=["PUT"])
@require_admin_auth
def update_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.form
    files = request.files

    try:
        redis_client = get_redis()
    except Exception:
        redis_client = None

    try:
        admin_id = g.admin.get("admin_id")

        # 1. Fetch product (ownership is implied)
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({"error": "Product not found"}), 404

        # 2. Parse fields
        name = data.get("name", "").strip()
        mrp = safe_float(data.get("mrp"))
        discount = safe_float(data.get("discount"))
        price = round(mrp - (mrp * discount / 100), 2) if mrp else None

        size_stock_raw = data.get("size_stock", "{}")
        try:
            size_stock = json.loads(size_stock_raw) if size_stock_raw else {}
            if isinstance(size_stock, dict):
                stock = sum(int(v or 0) for v in size_stock.values())
            else:
                size_stock = {}
                stock = safe_int(data.get("stock", 0))
        except Exception:
            size_stock = {}
            stock = safe_int(data.get("stock", 0))

        try:
            category_id = int(data.get("category_id")) if data.get("category_id") else None
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid category ID"}), 400

        description = data.get("description", "").strip()
        brand = data.get("brand", "").strip()
        return_policy = data.get("returnPolicy", "").strip()
        delivery_type = data.get("deliveryType", "free")
        delivery_charge = safe_float(data.get("deliveryCharge")) if delivery_type == "custom" else 0
        cod_available = data.get("codAvailable", "false").lower() == "true"
        color_name = (data.get("color_name") or "").strip()
        color_code = (data.get("color_code") or "#000000").strip()

        # 3. Update products table
        cursor.execute(
            """
            UPDATE products
            SET name=%s, price=%s, mrp=%s, discount=%s, stock=%s, category_id=%s, description=%s,
                brand=%s, delivery_type=%s, delivery_charge=%s, cod_available=%s, return_policy=%s,
                size_stock=%s, color_name=%s, color_code=%s, updated_at=CURRENT_TIMESTAMP
            WHERE id=%s
            """,
            (
                name, price, mrp, discount, stock, category_id, description,
                brand, delivery_type, delivery_charge, int(cod_available), return_policy,
                json.dumps(size_stock) if size_stock else None, color_name, color_code,
                product_id,
            ),
        )

        # 4. Update product_variants meta fields if present
        cursor.execute(
            """
            UPDATE product_variants
            SET brand=%s, description=%s, delivery_type=%s, delivery_charge=%s,
                cod_available=%s, return_policy=%s
            WHERE product_id=%s
            """,
            (brand, description, delivery_type, delivery_charge, int(cod_available), return_policy, product_id),
        )

        # 5. Handle product images: keepImageIds[] provided from client
        cursor.execute("SELECT id, image_path FROM product_images WHERE product_id = %s", (product_id,))
        existing_images = cursor.fetchall()
        keep_ids = []
        try:
            # support both array-style and single param
            keep_list = data.getlist("keepImageIds[]") or []
            keep_ids = [int(i) for i in keep_list if str(i).isdigit()]
        except Exception:
            keep_ids = []

        for img in existing_images:
            if img["id"] not in keep_ids:
                if img.get("image_path") and os.path.exists(img["image_path"]):
                    try:
                        os.remove(img["image_path"])
                    except Exception as e:
                        log.error("Failed to remove product image file", extra={"path": img.get("image_path"), "error": str(e)})
                cursor.execute("DELETE FROM product_images WHERE id = %s", (img["id"],))

        for img in files.getlist("images"):
            if img and img.filename:
                filename = secure_filename(f"{uuid.uuid4().hex}_{img.filename}")
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                img.save(filepath)
                cursor.execute("INSERT INTO product_images (product_id, image_path) VALUES (%s, %s)", (product_id, filepath.replace("\\", "/")))

        # 6. Cache invalidation
        invalidate_stock_cache(redis_client, product_id, None)

        # 7. Audit & commit
        log.info("Product updated", extra={"admin_id": admin_id, "product_id": product_id, "stock": stock})
        conn.commit()
        return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        log.error("Product update error", extra={"admin_id": g.admin.get("admin_id"), "error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ list with variants ------------------
@admin_products.route("/api/admin/products/list-with-variants", methods=["GET"])
@require_admin_auth
def get_products_with_variants():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
            """
        )
        products = cursor.fetchall()
        result = []
        for product in products:
            pid = product["id"]
            cursor.execute("SELECT image_path FROM product_images WHERE product_id = %s", (pid,))
            images = cursor.fetchall()
            image_urls = [f"{request.url_root.rstrip('/')}/{img['image_path']}" for img in images]
            main_image = image_urls[0] if image_urls else None

            variants = []
            if product.get("enable_variants"):
                cursor.execute(
                    "SELECT id, name, price, mrp, discount, stock, image_path, status FROM product_variants WHERE product_id = %s",
                    (pid,),
                )
                variant_rows = cursor.fetchall()
                for v in variant_rows:
                    variants.append({
                        "id": v["id"],
                        "name": v["name"],
                        "price": float(v["price"] or 0),
                        "mrp": float(v["mrp"] or 0),
                        "discount": float(v["discount"] or 0),
                        "stock": v["stock"] or 0,
                        "status": bool(v["status"]),
                        "image": f"{request.url_root.rstrip('/')}/{v['image_path']}" if v.get("image_path") else None
                    })

            result.append({
                "id": product["id"],
                "name": product["name"],
                "price": float(product["price"]) if product["price"] is not None else 0,
                "mrp": float(product["mrp"]) if product["mrp"] is not None else 0,
                "discount": float(product["discount"]) if product["discount"] is not None else 0,
                "stock": product["stock"],
                "status": bool(product.get("status", 1)),
                "category_name": product.get("category_name") or "Uncategorized",
                "created_at": product.get("created_at"),
                "thumbnail": main_image,
                "images": image_urls,
                "variants": variants if product.get("enable_variants") else [],
                "enable_variants": bool(product.get("enable_variants"))
            })

        return jsonify(result)
    except Exception as e:
        log.error("Failed to fetch products with variants", extra={"error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ variant update ------------------
@admin_products.route("/api/admin/variants/<int:variant_id>", methods=["PUT"])
@require_admin_auth
def update_variant(variant_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.form
    files = request.files

    try:
        redis_client = get_redis()
    except Exception:
        redis_client = None

    try:
        # Fetch variant
        cursor.execute("SELECT * FROM product_variants WHERE id = %s", (variant_id,))
        variant = cursor.fetchone()
        if not variant:
            return jsonify({"error": "Variant not found"}), 404

        # Parse inputs
        name = data.get("name", "").strip()
        color_name = (data.get("color_name") or "").strip()
        color_code = (data.get("color_code") or "#000000").strip()
        mrp = safe_float(data.get("mrp"))
        discount = safe_float(data.get("discount"))
        price = round(mrp - (mrp * discount / 100), 2) if mrp else None
        sizes = (data.get("sizes") or "").strip()

        try:
            size_stock = json.loads(data.get("size_stock") or "{}")
            if not isinstance(size_stock, dict):
                size_stock = {}
        except Exception:
            size_stock = {}

        stock = (
            sum(int(v) for v in size_stock.values() if str(v).isdigit())
            if size_stock else safe_int(data.get("stock"), 0)
        )
        size_stock_serialized = json.dumps(size_stock) if size_stock else None

        # Update variant record (stock included)
        cursor.execute(
            """
            UPDATE product_variants
            SET name=%s, color_name=%s, color_code=%s, mrp=%s, discount=%s, price=%s,
                stock=%s, sizes=%s, size_stock=%s, updated_at=CURRENT_TIMESTAMP
            WHERE id=%s
            """,
            (name, color_name, color_code, mrp, discount, price, stock, sizes, size_stock_serialized, variant_id),
        )

        # Upload folder for variant images
        VARIANT_UPLOAD = os.path.join("static", "uploads", "variants")
        os.makedirs(VARIANT_UPLOAD, exist_ok=True)

        # Save new images
        new_images = request.files.getlist("variant_images")
        for img in new_images:
            if img and img.filename:
                filename = secure_filename(f"{uuid.uuid4().hex}_{img.filename}")
                filepath = os.path.join(VARIANT_UPLOAD, filename)
                os.makedirs(os.path.dirname(filepath), exist_ok=True)
                img.save(filepath)
                normalized = filepath.replace("\\", "/")
                cursor.execute("INSERT INTO variant_images (variant_id, image_path) VALUES (%s, %s)", (variant_id, normalized))

        # Delete removed images
        removed_images_raw = data.get("removed_images")
        if removed_images_raw:
            try:
                removed_images = json.loads(removed_images_raw)
                for img_url in removed_images:
                    path = img_url.replace(f"{request.url_root.rstrip('/')}/", "")
                    abs_path = os.path.join(".", path)
                    if os.path.exists(abs_path):
                        try:
                            os.remove(abs_path)
                        except Exception as e:
                            log.error("Failed to delete variant image file", extra={"path": abs_path, "error": str(e)})
                    cursor.execute("DELETE FROM variant_images WHERE variant_id = %s AND image_path = %s", (variant_id, path))
            except Exception as e:
                log.error("Failed to remove images list", extra={"error": str(e)})

        # Invalidate cache for variant
        invalidate_stock_cache(redis_client, variant["product_id"], variant_id)

        conn.commit()
        log.info("Variant updated", extra={"variant_id": variant_id, "product_id": variant["product_id"], "stock": stock})
        return jsonify({"message": "Variant updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        log.error("Variant update error", extra={"error": str(e)})
        return jsonify({"error": "Server error", "detail": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ get variant by id ------------------
@admin_products.route("/api/admin/variants/<int:variant_id>", methods=["GET"])
@require_admin_auth
def get_variant_by_id(variant_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM product_variants WHERE id = %s", (variant_id,))
        variant = cursor.fetchone()
        if not variant:
            return jsonify({"error": "Variant not found"}), 404

        try:
            size_stock = json.loads(variant["size_stock"]) if variant.get("size_stock") else {}
        except Exception:
            size_stock = {}

        calculated_stock = (
            sum(int(v) for v in size_stock.values() if str(v).isdigit())
            if size_stock else variant.get("stock", 0)
        )
        is_size_editable = bool(size_stock)

        cursor.execute("SELECT image_path FROM variant_images WHERE variant_id = %s", (variant_id,))
        variant_images = cursor.fetchall()
        variant_image_urls = [f"{request.url_root.rstrip('/')}/{row['image_path']}" for row in variant_images]

        result = {
            "id": variant["id"],
            "product_id": variant["product_id"],
            "category_id": variant.get("category_id"),
            "name": variant["name"],
            "color_name": variant.get("color_name") or "",
            "color_code": variant.get("color_code") or "#000000",
            "mrp": float(variant.get("mrp") or 0),
            "discount": float(variant.get("discount") or 0),
            "price": float(variant.get("price") or 0),
            "stock": calculated_stock,
            "sizes": variant.get("sizes", ""),
            "size_stock": size_stock,
            "is_size_editable": is_size_editable,
            "enable_size_stock": is_size_editable,
            "variant_images": variant_image_urls
        }

        return jsonify(result)
    except Exception as e:
        log.error("Fetch variant error", extra={"error": str(e)})
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()


# ------------------ delete product image ------------------
@admin_products.route("/api/admin/products/image/<int:image_id>", methods=["DELETE"])
@require_admin_auth
def delete_product_image(image_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, image_path, product_id FROM product_images WHERE id = %s", (image_id,))
        image = cursor.fetchone()
        if not image:
            return jsonify({"error": "Image not found"}), 404

        # Remove file
        if image.get("image_path"):
            try:
                if os.path.exists(image["image_path"]):
                    os.remove(image["image_path"])
            except Exception as e:
                log.error("Failed to delete product image file", extra={"path": image.get("image_path"), "error": str(e)})

        cursor.execute("DELETE FROM product_images WHERE id = %s", (image_id,))
        conn.commit()

        # Invalidate product cache
        invalidate_stock_cache(get_redis(), image["product_id"], None)

        return jsonify({"message": "Image deleted successfully"}), 200
    except Exception as e:
        conn.rollback()
        log.error("Delete image error", extra={"error": str(e)})
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()
