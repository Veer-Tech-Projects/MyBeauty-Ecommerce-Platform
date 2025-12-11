import React, { useEffect, useState } from "react";
import axiosAdmin from "../../utils/axiosAdmin"; // Using Admin Axios
import "../../styles/SellerProductsPage.css"; // Reuse existing styles
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [openVariants, setOpenVariants] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, isVariant: false });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 5;

  // Fetch Products using Admin Session
  useEffect(() => {
    axiosAdmin
      .get("/api/admin/products/list-with-variants")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Failed to fetch products", err));
  }, []);

  useEffect(() => {
    if (location.state?.toastMessage) {
      toast.success(location.state.toastMessage, {
        position: "top-center",
        autoClose: 2000,
        theme: "colored",
      });
      // Clear state
      navigate(location.pathname, { replace: true });
    }
  }, [location.key]);

  const calculateDiscount = (price, mrp) =>
    mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleToggleStatus = (productId, isVariant = false) => {
    const url = `/api/admin/products/${productId}/status${
      isVariant ? "?is_variant=true" : ""
    }`;

    axiosAdmin
      .put(url, {})
      .then((res) => {
        const updated = products.map((prod) => {
          if (!isVariant && prod.id === productId) {
            return { ...prod, status: res.data.new_status };
          } else if (isVariant && prod.variants) {
            const updatedVariants = prod.variants.map((v) =>
              v.id === productId ? { ...v, status: res.data.new_status } : v
            );
            return { ...prod, variants: updatedVariants };
          }
          return prod;
        });
        setProducts(updated);
        toast.success("Status updated", { position: "top-center", autoClose: 1000 });
      })
      .catch((err) => {
        console.error("Failed to toggle status", err);
        toast.error("Status update failed", { position: "top-center" });
      });
  };

  const confirmDelete = () => {
    const { id, isVariant } = deleteTarget;
    const url = `/api/admin/products/${id}${isVariant ? "?is_variant=true" : ""}`;

    axiosAdmin
      .delete(url)
      .then(() => {
        const updated = products
          .map((prod) => {
            if (!isVariant && prod.id === id) return null;
            if (isVariant && prod.variants) {
              const filtered = prod.variants.filter((v) => v.id !== id);
              return { ...prod, variants: filtered };
            }
            return prod;
          })
          .filter(Boolean);
        setProducts(updated);
        toast.success(`${isVariant ? "Variant" : "Product"} deleted successfully`, {
          position: "top-center",
          autoClose: 2000,
          theme: "colored",
        });
        setShowConfirm(false);
      })
      .catch((err) => {
        console.error("Delete failed", err);
        toast.error("Delete failed", { position: "top-center", theme: "colored" });
        setShowConfirm(false);
      });
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="seller-products-page container-fluid py-4 px-3 px-md-4">
      <ToastContainer />
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-2">
          <i
            className="bi bi-arrow-left-circle fs-5 text-dark clickable-icon"
            onClick={() => navigate("/admin/dashboard")}
            style={{ cursor: "pointer" }}
          ></i>
          <h4 className="fw-semibold mb-0">Admin Products</h4>
        </div>
        <div className="d-flex gap-3">
            <div className="position-relative" style={{ width: "320px" }}>
            <input
                type="search"
                className="form-control ps-5 rounded-pill shadow-sm"
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
                }}
            />
            <i
                className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                style={{ fontSize: "1rem" }}
            ></i>
            </div>
            <button 
                className="btn btn-primary rounded-pill px-4 shadow-sm fw-semibold"
                onClick={() => navigate("/admin/add-product")}
            >
                <i className="bi bi-plus-lg me-2"></i>Add Product
            </button>
        </div>
      </div>

      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>No.</th>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Category</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((prod, idx) => {
              const globalIndex = (currentPage - 1) * PRODUCTS_PER_PAGE + idx;
              const isOpen = openVariants[prod.id];
              const hasVariants =
                prod.enable_variants &&
                Array.isArray(prod.variants) &&
                prod.variants.length > 0;

              const mainRow = (
                <tr>
                  <td>{globalIndex + 1}</td>
                  <td>
                    <img
                      src={prod.thumbnail || "/default-product.png"}
                      alt={prod.name}
                      className="product-img rounded shadow-sm"
                      style={{ width: 40, height: 40, objectFit: "cover" }}
                    />
                  </td>
                  <td className="fw-semibold">{prod.name}</td>
                  <td>
                    ₹{prod.price}
                    {prod.mrp && (
                      <small className="text-muted ms-1">
                        <del>₹{prod.mrp}</del>
                      </small>
                    )}
                  </td>
                  <td>{prod.stock}</td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={prod.status}
                        onChange={() => handleToggleStatus(prod.id)}
                      />
                    </div>
                  </td>
                  <td>{prod.category_name}</td>
                  <td>{new Date(prod.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => navigate(`/admin/edit-product/${prod.id}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          setDeleteTarget({ id: prod.id, isVariant: false });
                          setShowConfirm(true);
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );

              if (!hasVariants) {
                return <React.Fragment key={prod.id}>{mainRow}</React.Fragment>;
              }

              return (
                <React.Fragment key={prod.id}>
                  {mainRow}

                  {/* Variant Toggle Button */}
                  <tr className="variant-toggle-row">
                    <td colSpan="9">
                      <button
                        className={`variant-toggle-button ${isOpen ? "open" : ""} d-flex align-items-center gap-2`}
                        onClick={() =>
                          setOpenVariants((prev) => ({
                            ...prev,
                            [prod.id]: !prev[prod.id],
                          }))
                        }
                      >
                        <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                        {isOpen ? "Hide variant products" : "Show variant products"}
                      </button>
                    </td>
                  </tr>

                  {/* Variant Table */}
                  {isOpen && (
                    <tr>
                      <td colSpan="9" style={{ padding: 0 }}>
                        <div
                          className="variant-slide-wrapper"
                          style={{
                            maxHeight: "1000px",
                            transition: "max-height 0.3s ease",
                            overflow: "hidden",
                          }}
                        >
                          <table className="table table-borderless mb-0">
                            <tbody>
                              {prod.variants.map((v, vidx) => (
                                <tr key={v.id} className="variant-row variant-indent small">
                                  <td className="text-muted">{vidx + 1}</td>
                                  <td>
                                    <img
                                      src={v.image}
                                      alt={v.name}
                                      className="rounded shadow-sm"
                                      style={{ width: 40, height: 40, objectFit: "cover" }}
                                    />
                                  </td>
                                  <td>{v.name}</td>
                                  <td>
                                    ₹{v.price}
                                  </td>
                                  <td>{v.stock}</td>
                                  <td>
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={v.status}
                                        onChange={() => handleToggleStatus(v.id, true)}
                                      />
                                    </div>
                                  </td>
                                  <td className="text-muted">Variant</td>
                                  <td className="text-muted">—</td>
                                  <td>
                                    <div className="d-flex gap-2">
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => navigate(`/admin/edit-variant/${v.id}`)}
                                      >
                                        <i className="bi bi-pencil"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                          setDeleteTarget({ id: v.id, isVariant: true });
                                          setShowConfirm(true);
                                        }}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

          </tbody>    
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <ul className="pagination pagination-sm">
              {[...Array(totalPages)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showConfirm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete this{" "}
                  <strong>{deleteTarget.isVariant ? "variant" : "product"}</strong>?
                </p>
              </div>
              <div className="modal-footer justify-content-end">
                <button className="btn btn-outline-dark px-4" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger px-4" onClick={confirmDelete}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}