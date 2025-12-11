import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosAdmin from "../../utils/axiosAdmin"; // Use Admin Axios
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/EditProductPage.css";
import ColorPicker from "../../components/ColorPicker";

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // No token needed, cookie handled by axiosAdmin

  const [savedSizeStock, setSavedSizeStock] = useState({});
  const [savedFlatStock, setSavedFlatStock] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mrp: "",
    discount: "",
    price: "",
    stock: "",
    category_id: "",
    description: "",
    brand: "",
    returnPolicy: "",
    deliveryType: "free",
    deliveryCharge: "",
    codAvailable: false,
    colorName: "",
    colorCode: "#000000",
    sizeStock: {},
    enableSizeStock: false,
    isSizeEditable: false,
    newSize: "",
    sizeStockInput: "",
  });

  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [initialStock, setInitialStock] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Updated API path: /api/admin/products/...
        const { data } = await axiosAdmin.get(`/api/admin/products/${id}`);

        let parsedSizeStock = {};
        let enableSizeStock = false;

        try {
          parsedSizeStock =
            typeof data.size_stock === "string"
              ? JSON.parse(data.size_stock)
              : data.size_stock || {};
          enableSizeStock = Object.keys(parsedSizeStock).length > 0;
        } catch (e) {
          parsedSizeStock = {};
          enableSizeStock = false;
        }

        const calculatedPrice = (data.mrp || 0) - ((data.mrp || 0) * (data.discount || 0)) / 100;

        setFormData({
          name: data.name || "",
          mrp: data.mrp || "",
          discount: data.discount || "",
          price: calculatedPrice.toFixed(2),
          stock: data.stock || "",
          category_id: data.category_id || "",
          description: data.description || "",
          brand: data.brand || "",
          returnPolicy: data.return_policy || "",
          deliveryType: data.delivery_type || "free",
          deliveryCharge: data.delivery_charge || "",
          codAvailable: !!data.cod_available,
          colorName: data.color_name || "",
          colorCode: data.color_code || "#000000",
          sizeStock: parsedSizeStock,
          enableSizeStock: enableSizeStock,
          isSizeEditable: enableSizeStock,
          newSize: "",
          sizeStockInput: "",
        });

        setSavedSizeStock(parsedSizeStock || {});
        setSavedFlatStock(data.stock || "");
        setInitialStock(data.stock || "");
        setExistingImages((data.images || []).map((img) => ({
          id: img.id,
          url: img.url,
        })));

        setVariants(data.variants || []);
      } catch (err) {
        console.error("Product fetch failed:", err);
        toast.error("Product not found");
        navigate("/admin/products"); // Updated redirect
      }

      try {
        const catRes = await axiosAdmin.get("/api/categories");
        setCategories(catRes.data || []);
      } catch (e) {
        console.error("Category fetch failed:", e);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const mrp = parseFloat(formData.mrp) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const price = mrp - (mrp * discount) / 100;
    setFormData((prev) => ({ ...prev, price: price.toFixed(2) }));
  }, [formData.mrp, formData.discount]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleToggleSizeStock = () => {
    const enable = !formData.enableSizeStock;

    if (enable) {
      setSavedFlatStock(formData.stock);
    } else {
      if (Object.keys(formData.sizeStock).length > 0) {
        setSavedSizeStock({ ...formData.sizeStock });
      }
    }

    const newSizeStock = enable
      ? Object.keys(savedSizeStock).length > 0
        ? savedSizeStock
        : {}
      : {};

    const newStock = enable
      ? Object.values(savedSizeStock).reduce((a, b) => a + Number(b || 0), 0)
      : savedFlatStock || "";

    setFormData((prev) => ({
      ...prev,
      enableSizeStock: enable,
      isSizeEditable: enable,
      sizeStock: newSizeStock,
      stock: newStock,
      newSize: "",
      sizeStockInput: "",
    }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxAllowed = 4;
    const totalImages = existingImages.length + images.length;

    if (totalImages >= maxAllowed) {
      toast.warn("Image limit reached (4 images max)");
      return;
    }

    const spaceLeft = maxAllowed - totalImages;
    const acceptedFiles = selectedFiles.slice(0, spaceLeft);

    if (acceptedFiles.length < selectedFiles.length) {
      toast.info(`Only first ${spaceLeft} image(s) accepted. Extra images skipped.`);
    }

    setImages((prev) => [...prev, ...acceptedFiles]);
  };

  const removeExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();

    const isSized = formData.isSizeEditable || formData.enableSizeStock;

    const finalStock = isSized
      ? Object.values(formData.sizeStock).reduce((a, b) => a + Number(b || 0), 0)
      : parseInt(formData.stock) || 0;

    Object.entries(formData).forEach(([k, v]) => {
      if (["enableSizeStock", "sizeStock", "isSizeEditable", "newSize", "sizeStockInput", "price"].includes(k)) return;
      payload.append(k, v);
    });

    payload.append("stock", finalStock);
    payload.append("size_stock", JSON.stringify(isSized ? formData.sizeStock : {}));
    images.forEach((img) => payload.append("images", img));
    existingImages.forEach((img) => payload.append("keepImageIds[]", img.id));
    payload.append("color_name", formData.colorName || "");
    payload.append("color_code", formData.colorCode || "#000000");

    axiosAdmin
      .put(`/api/admin/products/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        navigate("/admin/products", {
          state: { toastMessage: "Product updated successfully" },
        });
      })
      .catch((err) => {
        console.error("Update failed:", err.response?.data || err.message);
        toast.error("Failed to update product");
      });
  };

  return (
  <div className="edit-product-page">
    <div className="edit-container">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h5>
          <i
            className="bi bi-arrow-left-circle clickable-icon me-2"
            onClick={() => navigate("/admin/products")}
          />
          Edit Product (ID: {id})
        </h5>
      </div>
      
      {/* ... [Form UI kept exactly the same as previous file] ... */}
      <form className="bg-white p-4 shadow-sm rounded" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Product Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="row mb-3">
          <div className="col">
            <label className="form-label">MRP (₹)</label>
            <input
              name="mrp"
              type="number"
              value={formData.mrp}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col">
            <label className="form-label">Discount (%)</label>
            <input
              name="discount"
              type="number"
              value={formData.discount}
              onChange={handleChange}
              className="form-control"
            />
          </div>
          <div className="col">
            <label className="form-label">Selling Price (₹)</label>
            <input
              name="price"
              type="number"
              value={formData.price}
              readOnly
              className="form-control bg-light"
            />
          </div>
        </div>

        <div className="form-check form-switch mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="enableSizeStock"
            checked={formData.enableSizeStock}
            onChange={handleToggleSizeStock}
          />
          <label className="form-check-label" htmlFor="enableSizeStock">
            Enable Size-wise Stock
          </label>
        </div>

        {!formData.enableSizeStock && (
          <div className="mb-3">
            <label className="form-label">Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="form-control"
              placeholder="Enter total stock"
            />
          </div>
        )}

        {formData.enableSizeStock && (
          <div className="mb-3">
            <label className="form-label">Size-wise Stock</label>

            <div className="d-flex flex-column gap-2 mb-3">
              {Object.entries(formData.sizeStock).map(([size, qty]) => (
                <div key={size} className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control w-auto"
                    value={size}
                    disabled
                  />
                  <input
                    type="number"
                    className="form-control w-auto"
                    placeholder="0"
                    value={qty === 0 ? "" : qty}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updated = {
                        ...formData.sizeStock,
                        [size]: val === "" ? "" : Math.max(0, parseInt(val)),
                      };
                      const total = Object.values(updated).reduce(
                        (a, b) => a + (parseInt(b) || 0),
                        0
                      );
                      setFormData((prev) => ({
                        ...prev,
                        sizeStock: updated,
                        stock: total > 0 ? total : "",
                      }));
                    }}
                  />
                  <i
                    className="bi bi-x-circle text-danger"
                    role="button"
                    title="Remove size"
                    onClick={() => {
                      const updated = { ...formData.sizeStock };
                      delete updated[size];
                      const total = Object.values(updated).reduce(
                        (a, b) => a + Number(b || 0),
                        0
                      );
                      setFormData((prev) => ({
                        ...prev,
                        sizeStock: updated,
                        stock: total > 0 ? total : "",
                      }));
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control w-auto"
                placeholder="Size (e.g. XL)"
                value={formData.newSize}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    newSize: e.target.value.toUpperCase(),
                  }))
                }
              />
              <input
                type="number"
                min="0"
                className="form-control w-auto"
                placeholder="Qty"
                value={formData.sizeStockInput}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sizeStockInput: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                disabled={!formData.newSize || !formData.sizeStockInput}
                onClick={() => {
                  const newSize = formData.newSize.trim().toUpperCase();
                  const qty = parseInt(formData.sizeStockInput);

                  if (!newSize || !/^[A-Z]+$/.test(newSize)) {
                    toast.warning("Size must be letters only (e.g., S, M, L)");
                    return;
                  }

                  if (formData.sizeStock[newSize] !== undefined) {
                    toast.warning("Size already exists");
                    return;
                  }

                  if (isNaN(qty) || qty < 0) {
                    toast.warning("Quantity must be a positive number");
                    return;
                  }

                  const updated = { ...formData.sizeStock, [newSize]: qty };
                  const total = Object.values(updated).reduce(
                    (a, b) => a + Number(b || 0),
                    0
                  );

                  setFormData((prev) => ({
                    ...prev,
                    sizeStock: updated,
                    stock: total,
                    newSize: "",
                    sizeStockInput: "",
                  }));
                }}
              >
                <i className="bi bi-plus-circle me-1"></i>Add
              </button>
            </div>

            <div className="mt-2 text-muted">
              <small>Total Stock: {formData.stock}</small>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-control"
            rows={3}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Color Name</label>
          <input
            className="form-control"
            name="colorName"
            value={formData.colorName}
            onChange={handleChange}
            placeholder="e.g. Sky Blue"
            required
          />
        </div>

        <ColorPicker
          label="Product Color"
          color={formData.colorCode}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, colorCode: value }))
          }
          required
        />

        <div className="mb-3">
          <label className="form-label mb-2">Delivery Type</label>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="del-free"
              name="deliveryType"
              value="free"
              checked={formData.deliveryType === "free"}
              onChange={handleChange}
              className="form-check-input"
            />
            <label htmlFor="del-free" className="form-check-label">
              Free Delivery
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              type="radio"
              id="del-custom"
              name="deliveryType"
              value="custom"
              checked={formData.deliveryType === "custom"}
              onChange={handleChange}
              className="form-check-input"
            />
            <label htmlFor="del-custom" className="form-check-label">
              Custom Charge
            </label>
          </div>
          {formData.deliveryType === "custom" && (
            <input
              type="number"
              name="deliveryCharge"
              value={formData.deliveryCharge}
              onChange={handleChange}
              className="form-control mt-2"
              placeholder="Delivery Charge (₹)"
            />
          )}
        </div>

        <div className="form-check form-switch mb-3">
          <input
            type="checkbox"
            id="cod"
            name="codAvailable"
            checked={formData.codAvailable}
            onChange={handleChange}
            className="form-check-input"
          />
          <label htmlFor="cod" className="form-check-label">
            Cash on Delivery: {formData.codAvailable ? "Available" : "Not Available"}
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Return Policy</label>
          <select
            name="returnPolicy"
            value={formData.returnPolicy}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select policy</option>
            <option value="7days">7‑day return</option>
            <option value="no">No returns</option>
          </select>
        </div>

        {existingImages.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Current Images</label>
            <div className="d-flex gap-2 flex-wrap">
              {existingImages.map((img, i) => (
                <div key={i} className="position-relative">
                  <img
                    src={img.url}
                    alt=""
                    className="rounded shadow-sm"
                    style={{ width: 60, height: 60 }}
                  />
                  <i
                    className="bi bi-x-lg remove-x-icon"
                    onClick={() => removeExistingImage(i)}
                  ></i>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Upload New Images (max 4 total)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="form-control"
            onChange={handleImageChange}
          />
        </div>

        {variants.length > 0 && (
          <div className="mt-4">
            <h6>Variants</h6>
            <table className="table table-bordered table-sm">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>MRP</th>
                  <th>Discount</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id}>
                    <td>{i + 1}</td>
                    <td>{v.name}</td>
                    <td>₹{v.mrp}</td>
                    <td>{v.discount}%</td>
                    <td>₹{v.price}</td>
                    <td>{v.stock}</td>
                    <td>
                      <img
                        src={v.image}
                        alt={v.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                        }}
                        className="rounded shadow-sm"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          navigate(`/admin/edit-variant/${v.id}`)
                        }
                      >
                        <i className="bi bi-pencil me-1"></i>Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-end mt-3">
          <button type="submit" className="btn btn-success">
            <i className="bi bi-check-circle me-1"></i>Save
          </button>
        </div>
      </form>
    </div>
  </div>
);
}