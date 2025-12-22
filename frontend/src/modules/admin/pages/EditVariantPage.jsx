import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin"; // Use Admin Axios
import { toast } from "react-toastify";
import ColorPicker from "@/modules/Product/components/ColorPicker";
import "react-toastify/dist/ReactToastify.css";
import "@/app/styles/EditProductPage.css";

export default function EditVariantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [removeImage, setRemoveImage] = useState(false);

  // ... [Form State remains same] ...
  const [formData, setFormData] = useState({
    name: "",
    mrp: "",
    discount: "",
    price: "",
    stock: "",
    colorName: "",
    colorCode: "#000000",
    sizeStock: {},
    enableSizeStock: false,
    isSizeEditable: false,
    newSize: "",
    sizeStockInput: "",
    images: [],             
    imagePreviews: [],     
    removedImages: [],     
  });

  const [savedSizeStock, setSavedSizeStock] = useState({});
  const [savedFlatStock, setSavedFlatStock] = useState("");

  useEffect(() => {
    const fetchVariant = async () => {
      try {
        // Updated API path: /api/admin/variants/...
        const { data } = await axiosAdmin.get(`/api/admin/variants/${id}`);

        const price = (data.mrp || 0) - ((data.mrp || 0) * (data.discount || 0)) / 100;

        const sizeStockFromBackend = data.size_stock || {};
        const enableSizeStockFromBackend = data.enable_size_stock || false;
        const isSizeEditableFromBackend = data.is_size_editable || false;
        const existingImages = Array.isArray(data.variant_images) ? data.variant_images : [];

        const totalStock = Object.values(sizeStockFromBackend).reduce(
          (a, b) => a + Number(b || 0),
          0
        );

        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          mrp: data.mrp || "",
          discount: data.discount || "",
          price: price.toFixed(2),
          stock: enableSizeStockFromBackend ? totalStock : data.stock || "",
          colorName: data.color_name || "",
          colorCode: data.color_code || "#000000",
          sizeStock: sizeStockFromBackend,
          isSizeEditable: isSizeEditableFromBackend,
          enableSizeStock: enableSizeStockFromBackend,
          images: [],
          imagePreviews: existingImages,
          removedImages: []
        }));

        setSavedSizeStock(sizeStockFromBackend || {});
        setSavedFlatStock(data.stock || "");

      } catch (err) {
        toast.error("Variant not found");
        navigate("/admin/products"); // Redirect to admin products
      }
    };

    fetchVariant();
  }, [id]);

  useEffect(() => {
    const mrp = parseFloat(formData.mrp) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const price = mrp - (mrp * discount) / 100;
    setFormData((prev) => ({ ...prev, price: price.toFixed(2) }));
  }, [formData.mrp, formData.discount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  const remainingSlots = 4 - formData.imagePreviews.length;
  const selected = files.slice(0, remainingSlots);

  setFormData((prev) => ({
    ...prev,
    images: [...prev.images, ...selected],
    imagePreviews: [
      ...prev.imagePreviews,
      ...selected.map((file) => URL.createObjectURL(file)),
    ],
  }));
};


  const handleSizeStockChange = (size, qty) => {
    const cleanQty = Math.max(0, parseInt(qty) || 0);
    const updated = { ...formData.sizeStock, [size]: cleanQty };
    const total = Object.values(updated).reduce((a, b) => a + Number(b || 0), 0);

    setFormData((prev) => ({
      ...prev,
      sizeStock: updated,
      stock: total,
    }));
  };

  const handleAddSize = () => {
    const size = formData.newSize.trim().toUpperCase();
    const qty = parseInt(formData.sizeStockInput);

    if (!size || !/^[A-Z]+$/.test(size)) {
      toast.warning("Size must be letters only (e.g., S, M, L)");
      return;
    }

    if (formData.sizeStock[size] !== undefined) {
      toast.warning("Size already exists");
      return;
    }

    if (isNaN(qty) || qty < 0) {
      toast.warning("Quantity must be a positive number");
      return;
    }

    const updated = { ...formData.sizeStock, [size]: qty };
    const total = Object.values(updated).reduce((a, b) => a + Number(b || 0), 0);

    setFormData((prev) => ({
      ...prev,
      sizeStock: updated,
      stock: total,
      newSize: "",
      sizeStockInput: "",
      isSizeEditable: true,
      enableSizeStock: true,
    }));
  };

  const handleRemoveSize = (size) => {
    const updated = { ...formData.sizeStock };
    delete updated[size];
    const total = Object.values(updated).reduce((a, b) => a + Number(b || 0), 0);
    setFormData((prev) => ({
      ...prev,
      sizeStock: updated,
      stock: total > 0 ? total : "",
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

    setFormData((prev) => ({
      ...prev,
      enableSizeStock: enable,
      isSizeEditable: enable,
      sizeStock: enable
        ? Object.keys(savedSizeStock).length > 0
          ? savedSizeStock
          : {}
        : {},
      stock: enable
        ? Object.values(savedSizeStock).reduce((a, b) => a + Number(b || 0), 0)
        : savedFlatStock || "",
      newSize: "",
      sizeStockInput: "",
    }));
  };

  const handleRemoveImage = (index) => {
    const preview = formData.imagePreviews[index];

    const isExisting = typeof preview === "string" && !preview.startsWith("blob:");

    setFormData((prev) => {
      const newPreviews = [...prev.imagePreviews];
      newPreviews.splice(index, 1);

      const newFiles = [...prev.images];
      if (!isExisting) newFiles.splice(index - (prev.imagePreviews.length - prev.images.length), 1);

      return {
        ...prev,
        imagePreviews: newPreviews,
        images: newFiles,
        removedImages: isExisting ? [...prev.removedImages, preview] : prev.removedImages,
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = new FormData();

    const isSized = formData.isSizeEditable || formData.enableSizeStock;
    const finalStock = isSized
      ? Object.values(formData.sizeStock).reduce((a, b) => a + Number(b || 0), 0)
      : parseInt(formData.stock) || 0;

    const sizesCSV = isSized ? Object.keys(formData.sizeStock).join(",") : "";

    payload.append("name", formData.name);
    payload.append("mrp", formData.mrp);
    payload.append("discount", formData.discount);
    payload.append("price", formData.price);
    payload.append("stock", finalStock);
    payload.append("sizes", sizesCSV);
    payload.append("size_stock", JSON.stringify(isSized ? formData.sizeStock : {}));
    payload.append("color_name", formData.colorName || "");
    payload.append("color_code", formData.colorCode || "#000000");

    formData.images.forEach((file) => {
      if (file && typeof file !== "string") {
        payload.append("variant_images", file);
      }
    });

    if (formData.removedImages.length > 0) {
      payload.append("removed_images", JSON.stringify(formData.removedImages));
    }
    if (removeImage) {
        payload.append("remove_image", "true");
      }

    axiosAdmin
      .put(`/api/admin/variants/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        navigate("/admin/products", {
          state: { toastMessage: "Variant updated successfully" },
        });
      })
      .catch((err) => {
        console.error("Update failed:", err);
        toast.error("Failed to update variant");
      });
  };

  return (
    <div className="edit-product-page py-4">
      <div className="container edit-container">
        <h5 className="mb-4">
          <i
            className="bi bi-arrow-left-circle clickable-icon me-2"
            onClick={() => navigate("/admin/products")}
          />
          Edit Variant (ID: {id})
        </h5>
        
        {/* ... [Rest of Form UI is identical, just make sure to use the state/functions defined above] ... */}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm p-4 rounded">
          <div className="mb-3">
            <label className="form-label">Variant Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">MRP</label>
              <input
                type="number"
                name="mrp"
                value={formData.mrp}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Selling Price</label>
              <input
                type="number"
                name="price"
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
              />
            </div>
          )}

          {formData.enableSizeStock && (
            <div className="mb-4">
              <label className="form-label">Size-wise Stock</label>
              <div className="d-flex flex-column gap-2 mb-3">
                {Object.entries(formData.sizeStock).map(([size, qty]) => (
                  <div key={size} className="d-flex align-items-center gap-2">
                    <input className="form-control w-auto" value={size} readOnly />
                    <input
                      type="number"
                      className="form-control w-auto"
                      value={qty}
                      onChange={(e) => handleSizeStockChange(size, e.target.value)}
                    />
                    <i
                      className="bi bi-x-circle text-danger"
                      role="button"
                      onClick={() => handleRemoveSize(size)}
                    />
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control w-auto"
                  placeholder="Size"
                  value={formData.newSize}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, newSize: e.target.value.toUpperCase() }))
                  }
                />
                <input
                  type="number"
                  className="form-control w-auto"
                  placeholder="Qty"
                  value={formData.sizeStockInput}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sizeStockInput: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleAddSize}
                >
                  <i className="bi bi-plus-circle me-1"></i>Add
                </button>
              </div>

              <div className="mt-2 text-muted">
                <small>Total Stock: {formData.stock}</small>
              </div>
            </div>
          )}

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Color Name</label>
              <input
                name="colorName"
                value={formData.colorName}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-md-6">
              <ColorPicker
                label="Color Picker"
                color={formData.colorCode}
                onChange={(val) => setFormData((prev) => ({ ...prev, colorCode: val }))}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Variant Images <span className="text-muted">(Max 4)</span></label>
            <div className="d-flex flex-wrap gap-2">
              {formData.imagePreviews.map((img, index) => (
                <div key={index} className="position-relative">
                  <img
                    src={img}
                    alt="preview"
                    style={{ width: 100, height: 100, objectFit: "cover" }}
                    className="rounded shadow-sm border"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0"
                    onClick={() => handleRemoveImage(index)}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: "10px" }}></i>
                  </button>
                </div>
              ))}
              {formData.imagePreviews.length < 4 && (
                <label className="image-upload">
                  <span className="btn btn-outline-secondary btn-sm">+</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>


          <div className="text-end">
            <button type="submit" className="btn btn-success">
              <i className="bi bi-check-circle me-1"></i>Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}