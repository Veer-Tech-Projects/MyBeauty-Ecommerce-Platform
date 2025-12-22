import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Accordion,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Select, { components as RSComponents } from "react-select";
import { useNavigate } from "react-router-dom";
import "@/app/styles/AdminAddProductPage.css";
import { toast } from "react-toastify";
import axiosAdmin from "@/modules/admin/auth/api/axiosAdmin"; // Updated import
import ColorPicker from "@/modules/Product/components/ColorPicker";

// ... [Keep Helper Functions: clampNonNegative, ProductNumberInput, Option, SingleValue same as before] ...
const clampNonNegative = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
};

const ProductNumberInput = ({ value, onChange, min = 0, step = "any", readOnly = false, ...rest }) => {
  const handleFocus = () => {
    if (String(value) === "0") onChange("");
  };
  const handleBlur = (e) => {
    if (e.target.value === "" || e.target.value === null) onChange(0);
  };
  return (
    <Form.Control
      type="number"
      min={min}
      step={step}
      value={value}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") return onChange("");
        onChange(clampNonNegative(raw));
      }}
      readOnly={readOnly}
      {...rest}
    />
  );
};

const Option = (props) => {
  const { data } = props;
  return (
    <RSComponents.Option {...props}>
      <div className="rs-option">
        {data.image && <img src={data.image} alt={data.label} className="rs-option-thumb" />}
        <div className="rs-option-label">{data.label}</div>
      </div>
    </RSComponents.Option>
  );
};

const SingleValue = (props) => {
  const { data } = props;
  return (
    <RSComponents.SingleValue {...props}>
      <div className="rs-single">
        {data.image && <img src={data.image} alt={data.label} className="rs-single-thumb" />}
        <div className="rs-single-label">{data.label}</div>
      </div>
    </RSComponents.SingleValue>
  );
};

const AdminAddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Use axiosAdmin for secure session access
    axiosAdmin
      .get("/api/categories") 
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        const fixed = arr.map((c) => ({
          value: c.id,
          label: c.name,
          image: c.image.startsWith("http")
            ? c.image
            : `http://localhost:5000${c.image}`,
        }));
        setCategories(fixed);
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        setCategories([]);
      });
  }, []);

  // ... [Keep blankVariant and productData state definition same as before] ...
  const blankVariant = () => ({
    name: "",
    colorName: "",
    colorCode: "#000000",
    enableSizeStock: false,
    sizeStock: {},
    sizeInput: "",
    sizeQtyInput: 0,
    stock: 0,
    mrp: 0,
    discount: 0,
    price: 0,
    length: 0,
    breadth: 0,
    height: 0,
    weight: 0,
    images: [],
  });

  const [productData, setProductData] = useState({
    name: "",
    category: null,
    brand: "",
    description: "",
    images: [],
    enableSizeStock: false,
    sizeStock: {},
    sizeInput: "",
    sizeQtyInput: 0,
    sizes: [],
    stock: 0,
    enableVariants: false,
    variants: [blankVariant()],
    mrp: 0,
    discount: 0,
    price: 0,
    length: 0,
    breadth: 0,
    height: 0,
    weight: 0,
    dispatchTime: "",
    deliveryType: "free",
    deliveryCharge: 0,
    codAvailable: false,
    returnPolicy: "",
    tags: "",
    colorName: "",
    colorCode: "#000000",
  });

  const setPD = (patch) => setProductData((p) => ({ ...p, ...patch }));

  useEffect(() => {
    const mrp = Number(productData.mrp || 0);
    const discount = Number(productData.discount || 0);
    const price = mrp ? +(mrp - (mrp * discount) / 100).toFixed(2) : 0;
    if (productData.price !== price) setPD({ price });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData.mrp, productData.discount]);

  // ... [Keep Image Helpers, Size Stock Helpers, Variant Helpers same as before] ...
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - productData.images.length;
    if (remaining <= 0) return;
    setPD({ images: [...productData.images, ...files.slice(0, remaining)] });
    e.target.value = null;
  };

  const removeImage = (index) => {
    const imgs = [...productData.images];
    imgs.splice(index, 1);
    setPD({ images: imgs });
  };

  const addSizeToProduct = () => {
    const size = (productData.sizeInput || "").toString().trim().toUpperCase();
    const qty = Number(productData.sizeQtyInput || 0);
    if (!size) {
      toast.error("Size cannot be empty");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Size quantity must be greater than 0");
      return;
    }
    const next = { ...productData.sizeStock, [size]: qty };
    setPD({ sizeStock: next, sizeInput: "", sizeQtyInput: 0 });
  };

  const removeSizeFromProduct = (sizeKey) => {
    const copy = { ...productData.sizeStock };
    delete copy[sizeKey];
    setPD({ sizeStock: copy });
  };

  const computeMainStock = () =>
    productData.enableSizeStock ? Object.values(productData.sizeStock).reduce((s, v) => s + Number(v || 0), 0) : Number(productData.stock || 0);

  const updateVariant = (index, patch) => {
    setPD({ variants: productData.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) });
  };

  const handleVariantImageUpload = (index, files) => {
    const f = Array.from(files || []);
    const existing = productData.variants[index].images || [];
    const remaining = 4 - existing.length;
    const newImgs = existing.concat(f.slice(0, remaining));
    updateVariant(index, { images: newImgs });
  };

  const removeVariantImage = (vIdx, imgIdx) => {
    const v = productData.variants[vIdx];
    const arr = [...(v.images || [])];
    arr.splice(imgIdx, 1);
    updateVariant(vIdx, { images: arr });
  };

  const addVariant = () => {
    setPD({ variants: [...productData.variants, blankVariant()] });
  };

  const removeVariant = (index) => {
    const arr = [...productData.variants];
    arr.splice(index, 1);
    setPD({ variants: arr });
  };

  const addVariantSize = (vIdx) => {
    const v = productData.variants[vIdx];
    const size = (v.sizeInput || "").toString().trim().toUpperCase();
    const qty = Number(v.sizeQtyInput || 0);
    if (!size) {
      toast.error("Size cannot be empty");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Size quantity must be greater than 0");
      return;
    }
    const next = { ...(v.sizeStock || {}), [size]: qty };
    updateVariant(vIdx, { sizeStock: next, sizeInput: "", sizeQtyInput: 0 });
  };

  const removeVariantSize = (vIdx, sizeKey) => {
    const v = productData.variants[vIdx];
    const copy = { ...(v.sizeStock || {}) };
    delete copy[sizeKey];
    updateVariant(vIdx, { sizeStock: copy });
  };

  const computeVariantPrice = (v) => {
    const mrp = Number(v.mrp || 0);
    const discount = Number(v.discount || 0);
    return mrp ? +(mrp - (mrp * discount) / 100).toFixed(2) : 0;
  };

  // ... [Keep Validation same as before] ...
  const validate = () => {
    if (!String(productData.name || "").trim()) {
      toast.error("Product name is required");
      return false;
    }
    if (!String(productData.brand || "").trim()) {
      toast.error("Brand is required");
      return false;
    }
    if (!Number(productData.mrp) || Number(productData.mrp) <= 0) {
      toast.error("MRP must be greater than 0");
      return false;
    }
    if (!Number(productData.price) || Number(productData.price) <= 0) {
      toast.error("Price must be greater than 0");
      return false;
    }
    if (!productData.images || productData.images.length === 0) {
      toast.error("At least one product image is required");
      return false;
    }
    if (productData.enableSizeStock) {
      const s = productData.sizeStock || {};
      if (!Object.keys(s).length) {
        toast.error("Please add at least one size with quantity when Size Stock is enabled");
        return false;
      }
      for (const [k, v] of Object.entries(s)) {
        if (!(Number(v) > 0)) {
          toast.error(`Size ${k} must have quantity > 0`);
          return false;
        }
      }
    }
    if (productData.enableVariants) {
      for (let i = 0; i < productData.variants.length; i++) {
        const v = productData.variants[i];
        if (!String(v.name || "").trim()) {
          toast.error(`Variant #${i + 1}: name is required`);
          return false;
        }
        if (!Number(v.mrp) || Number(v.mrp) <= 0) {
          toast.error(`Variant #${i + 1}: MRP must be greater than 0`);
          return false;
        }
        if (!Number(v.price) || Number(v.price) <= 0) {
          toast.error(`Variant #${i + 1}: Price must be greater than 0`);
          return false;
        }
        if (v.enableSizeStock) {
          const s = v.sizeStock || {};
          if (!Object.keys(s).length) {
            toast.error(`Variant #${i + 1}: Add at least one size when variant size-stock is enabled`);
            return false;
          }
          for (const [k, qty] of Object.entries(s)) {
            if (!(Number(qty) > 0)) {
              toast.error(`Variant #${i + 1}: Size ${k} must have quantity > 0`);
              return false;
            }
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalStock = computeMainStock();
    const formData = new FormData();

    const fieldsToAppend = {
      name: productData.name,
      category_id: productData.category ? productData.category.value : "",
      brand: productData.brand,
      description: productData.description,
      enableVariants: productData.enableVariants ? "true" : "false",
      mrp: productData.mrp,
      discount: productData.discount,
      price: productData.price,
      length: productData.length,
      breadth: productData.breadth,
      height: productData.height,
      weight: productData.weight,
      deliveryType: productData.deliveryType,
      deliveryCharge: productData.deliveryCharge,
      codAvailable: productData.codAvailable ? "true" : "false",
      returnPolicy: productData.returnPolicy,
      tags: productData.tags,
      dispatch_time: productData.dispatchTime || "",
      dispatchTime: productData.dispatchTime || "",
    };

    Object.entries(fieldsToAppend).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, typeof v === "object" ? JSON.stringify(v) : v);
    });

    formData.append("size_stock", JSON.stringify(productData.enableSizeStock ? productData.sizeStock : {}));
    formData.append("stock", String(finalStock));

    if (!productData.enableVariants) {
      formData.append("sizes", JSON.stringify(productData.sizes || []));
    }

    productData.images.forEach((f) => {
      if (f) formData.append("images", f);
    });

    if (productData.enableVariants) {
      const variantsPayload = productData.variants.map((v) => {
        const vStock = v.enableSizeStock ? Object.values(v.sizeStock || {}).reduce((s, x) => s + Number(x || 0), 0) : Number(v.stock || 0);
        return {
          name: v.name || "",
          color_name: v.colorName || "",
          color_code: v.colorCode || "#000000",
          sizes: v.sizes || "",
          mrp: Number(v.mrp || 0),
          discount: Number(v.discount || 0),
          price: Number(v.price || 0),
          stock: vStock,
          size_stock: v.enableSizeStock ? v.sizeStock || {} : {},
          length: Number(v.length || 0),
          breadth: Number(v.breadth || 0),
          height: Number(v.height || 0),
          weight: Number(v.weight || 0),
        };
      });

      formData.append("variants", JSON.stringify(variantsPayload));
      productData.variants.forEach((v, i) => {
        (v.images || []).forEach((f) => {
          if (f) formData.append(`variant_images_v${i}`, f);
        });
      });
    }

    try {
      // ✅ Use axiosAdmin (auto-handles cookies)
      const res = await axiosAdmin.post("/api/admin/products/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      if (res.status === 201) {
        toast.success("🎉 Product added successfully!");
        navigate("/admin/products", { state: { toastMessage: "Product added" } });
      } else {
        toast.error(`❌ ${res.data?.message || "Failed to add product"}`);
      }
    } catch (err) {
      console.error("Product add error:", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.error || err?.message || "Failed to add product";
      toast.error(`🚨 ${msg}`);
    }
  };

  // ... [Keep JSX Return same as before] ...
  return (
    <Container fluid className="admin-add-product-page px-0 py-0">
      {/* Sticky header */}
      <div className="sticky-top top-bar d-flex align-items-center justify-content-between px-3">
        <div className="d-flex align-items-center">
          <i
            className="bi bi-arrow-left-circle me-3 back-icon"
            onClick={() => navigate("/admin/dashboard")}
            title="Back to dashboard"
          />
          <div>
            <h5 className="mb-0">Add Product Page</h5>
            <small className="text-muted">Create a new product listing</small>
          </div>
        </div>
      </div>
      <Form onSubmit={handleSubmit}>
        {/* ... [Rest of the form UI remains identical] ... */}
        {/* Note: I am not repeating the huge JSX here to save space, but you should copy the JSX from the original file 
            and just ensure the imports and handleSubmit/useEffect logic match the above. 
            Key change: navigate("/admin/dashboard") instead of seller dashboard. */}
            <Row className="g-4 mt-3">
          <Col md={6}>
            <Card className="custom-card p-4 h-100">
              <div className="card-header-inline">
                <Card.Title className="fw-semibold mb-0">Basic Product Details</Card.Title>
                <OverlayTrigger placement="right" overlay={<Tooltip>Fill the core product details.</Tooltip>}>
                  <i className="bi bi-info-circle ms-2 text-muted" />
                </OverlayTrigger>
              </div>

              <Form.Group className="mb-3 mt-3">
                <Form.Label>Product Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  placeholder="Enter product name"
                  value={productData.name}
                  onChange={(e) => setPD({ name: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category <small className="text-muted">(optional)</small></Form.Label>
                <Select
                  components={{ Option, SingleValue }}
                  options={categories}
                  value={productData.category}
                  onChange={(val) => setPD({ category: val })}
                  isClearable
                  isSearchable={true} 
                  placeholder="Select category or leave blank"
                  classNamePrefix="rs"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Brand <span className="text-danger">*</span></Form.Label>
                <Form.Control value={productData.brand} onChange={(e) => setPD({ brand: e.target.value })} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description<span className="text-danger">*</span></Form.Label>
                <Form.Control as="textarea" rows={3} value={productData.description} onChange={(e) => setPD({ description: e.target.value })} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Product Images (Max 4) <span className="text-danger">*</span></Form.Label>
                <div className="image-preview-group mt-2 mb-3 d-flex flex-wrap gap-2">
                  {productData.images.map((img, i) => (
                    <div key={i} className="position-relative image-wrapper">
                      <img src={typeof img === "string" ? img : URL.createObjectURL(img)} alt="preview" className="image-preview" />
                      <i className="bi bi-x-circle-fill position-absolute top-0 end-0 text-danger rm-icon" onClick={() => removeImage(i)} />
                    </div>
                  ))}
                  {productData.images.length < 4 && (
                    <label className="image-upload">
                      <span>+</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </Form.Group>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Color Name<span className="text-danger">*</span></Form.Label>
                    <Form.Control value={productData.colorName} onChange={(e) => setPD({ colorName: e.target.value })} />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-center">
                  <ColorPicker color={productData.colorCode} onChange={(val) => setPD({ colorCode: val })} label="Product Color" />
                </Col>
              </Row>

              <div className="d-flex align-items-center justify-content-between mt-3">
                <Form.Check
                  type="switch"
                  id="enableSizeStockMain"
                  label="Enable Size Stock (main product)"
                  checked={productData.enableSizeStock}
                  onChange={(e) => setPD({ enableSizeStock: e.target.checked })}
                />
                <Form.Check
                  type="switch"
                  id="enableVariantsToggle"
                  label="Enable Variants"
                  checked={productData.enableVariants}
                  onChange={(e) => setPD({ enableVariants: e.target.checked })}
                />
              </div>

              {productData.enableSizeStock && (
                <Card className="mt-3 p-3 variant-entry">
                  <Row className="g-2 align-items-end">
                    <Col xs={5}>
                      <Form.Label>Size (auto uppercase)<span className="text-danger">*</span></Form.Label>
                      <Form.Control value={productData.sizeInput} placeholder="E.g. S, M, L" onChange={(e) => setPD({ sizeInput: e.target.value.toUpperCase() })} />
                    </Col>
                    <Col xs={5}>
                      <Form.Label>Quantity<span className="text-danger">*</span></Form.Label>
                      <ProductNumberInput value={productData.sizeQtyInput} onChange={(val) => setPD({ sizeQtyInput: val })} min={0} />
                    </Col>
                    <Col xs={2}>
                      <Button className="w-100" onClick={addSizeToProduct}>Add</Button>
                    </Col>

                    <Col xs={12} className="mt-2">
                      {Object.keys(productData.sizeStock || {}).length === 0 ? (
                        <div className="text-muted small">No sizes added yet</div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(productData.sizeStock).map(([size, qty]) => (
                            <Badge bg="light" text="dark" key={size} className="border size-badge">
                              {size}: {qty} <i className="bi bi-x ms-2 rm-size" onClick={() => removeSizeFromProduct(size)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              )}
            </Card>
          </Col>

          <Col md={6}>
            <Card className="custom-card p-4 h-100">
              <div className="card-header-inline">
                <Card.Title className="fw-semibold mb-0">Pricing & Delivery</Card.Title>
                <OverlayTrigger placement="right" overlay={<Tooltip>Fill the product price, measurement & delivery details.</Tooltip>}>
                  <i className="bi bi-info-circle ms-2 text-muted" />
                </OverlayTrigger>
              </div>
              
              <Row>
                <Col md={6}>
                  <Form.Label>MRP <span className="text-danger">*</span></Form.Label>
                  <OverlayTrigger placement="top" overlay={<Tooltip>MRP must be greater than 0</Tooltip>}>
                    <div>
                      <ProductNumberInput value={productData.mrp} onChange={(val) => setPD({ mrp: val })} min={0} step="0.01" />
                    </div>
                  </OverlayTrigger>
                </Col>

                <Col md={6}>
                  <Form.Label>Discount (%)</Form.Label>
                  <OverlayTrigger placement="top" overlay={<Tooltip>Discount between 0 and 100</Tooltip>}>
                    <div>
                      <ProductNumberInput value={productData.discount} onChange={(val) => setPD({ discount: val })} min={0} step="0.01" />
                    </div>
                  </OverlayTrigger>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Label>Price<span className="text-danger">*</span> </Form.Label>
                  <Form.Control readOnly value={productData.price} />
                  <small className="text-muted">Auto-calculated from MRP & Discount</small>
                </Col>

                <Col md={6}>
                  <Form.Label>Total Stock<span className="text-danger">*</span></Form.Label>
                  <ProductNumberInput
                    value={productData.enableSizeStock ? computeMainStock() : productData.stock}
                    onChange={(val) => {
                      if (!productData.enableSizeStock) setPD({ stock: val });
                    }}
                    min={0}
                    readOnly={productData.enableSizeStock}
                  />
                </Col>
              </Row>

              <Row className="mt-3">
                <Col><Form.Label>Length (cm)<span className="text-danger">*</span></Form.Label><ProductNumberInput value={productData.length} onChange={(val) => setPD({ length: val })} /></Col>
                <Col><Form.Label>Breadth (cm)<span className="text-danger">*</span></Form.Label><ProductNumberInput value={productData.breadth} onChange={(val) => setPD({ breadth: val })} /></Col>
                <Col><Form.Label>Height (cm)<span className="text-danger">*</span></Form.Label><ProductNumberInput value={productData.height} onChange={(val) => setPD({ height: val })} /></Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label>Weight (kg)<span className="text-danger">*</span></Form.Label>
                <ProductNumberInput value={productData.weight} onChange={(val) => setPD({ weight: val })} />
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Return Policy<span className="text-danger">*</span></Form.Label>
                <Form.Select value={productData.returnPolicy} onChange={(e) => setPD({ returnPolicy: e.target.value })}>
                  <option value="">Select</option>
                  <option value="7-days">7 Days Return</option>
                  <option value="no-returns">No Returns</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Delivery Type<span className="text-danger">*</span></Form.Label>
                <div className="d-flex gap-3 flex-wrap mt-2">
                  <Form.Check type="radio" name="deliveryType" label="Free Delivery" checked={productData.deliveryType === "free"} onChange={() => setPD({ deliveryType: "free", deliveryCharge: 0 })} />
                  <Form.Check type="radio" name="deliveryType" label="Custom Charge" checked={productData.deliveryType === "custom"} onChange={() => setPD({ deliveryType: "custom" })} />
                </div>
                {productData.deliveryType === "custom" && (
                  <ProductNumberInput value={productData.deliveryCharge} onChange={(val) => setPD({ deliveryCharge: val })} min={0} placeholder="Enter Delivery Charge (₹)" className="mt-3" />
                )}
              </Form.Group>

              <Form.Group className="mt-4 d-flex align-items-center justify-content-between">
                <Form.Label className="fw-semibold mb-0">
                  Cash on Delivery:
                  <span className={`ms-1 ${productData.codAvailable ? "text-success" : "text-danger"}`}>{productData.codAvailable ? "Available" : "Not Available"}</span>
                </Form.Label>
                <Form.Check type="switch" id="codToggle" checked={productData.codAvailable} onChange={(e) => setPD({ codAvailable: e.target.checked })} />
              </Form.Group>
            </Card>
          </Col>
        </Row>
        
        {/* Variants Section */}
{productData.enableVariants && (
  <>
    <Accordion defaultActiveKey="0" className="mt-4 mb-5 px-2">
      {productData.variants.map((variant, i) => (
        <Accordion.Item
          eventKey={String(i)}
          key={i}
          className="variant-card border-0 mb-3 shadow-sm"
        >
          <Accordion.Header>
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center gap-3">
                <Badge bg="primary" className="fw-semibold">
                  {i + 1}
                </Badge>
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: variant.colorCode || "#ccc",
                      border: "1px solid #999",
                    }}
                  ></div>
                  <div>
                    <div className="fw-semibold">
                      {variant.name || `Variant #${i + 1}`}
                    </div>
                    <small className="text-muted">
                      {variant.colorName || variant.colorCode}
                    </small>
                  </div>
                </div>
              </div>
              <div className="text-muted small">
                <strong>MRP:</strong> {variant.mrp || 0} |{" "}
                <strong>Price:</strong> {variant.price || 0}
              </div>
            </div>
          </Accordion.Header>

          <Accordion.Body>
            <Card className="border-0 p-3 variant-inner shadow-sm">
              {/* Basic Info */}
              <h6 className="fw-semibold mb-3 text-primary-black">Variant Details</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>Variant Name</Form.Label>
                  <Form.Control
                    value={variant.name}
                    onChange={(e) => updateVariant(i, { name: e.target.value })}
                    placeholder="e.g., Red Edition"
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Color Name</Form.Label>
                  <Form.Control
                    value={variant.colorName}
                    onChange={(e) =>
                      updateVariant(i, { colorName: e.target.value })
                    }
                    placeholder="e.g., Rose Gold"
                  />
                </Col>
                <Col md={2} className="d-flex align-items-center">
                  <ColorPicker
                    color={variant.colorCode}
                    onChange={(val) => updateVariant(i, { colorCode: val })}
                  />
                </Col>
              </Row>

              {/* Pricing Section */}
              <hr className="my-4" />
              <h6 className="fw-semibold mb-3 text-primary-black">Pricing</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Label>MRP</Form.Label>
                  <ProductNumberInput
                    value={variant.mrp}
                    onChange={(val) =>
                      updateVariant(i, {
                        mrp: val,
                        price: computeVariantPrice({ ...variant, mrp: val }),
                      })
                    }
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Discount (%)</Form.Label>
                  <ProductNumberInput
                    value={variant.discount}
                    onChange={(val) =>
                      updateVariant(i, {
                        discount: val,
                        price: computeVariantPrice({
                          ...variant,
                          discount: val,
                        }),
                      })
                    }
                  />
                </Col>
                <Col md={4}>
                  <Form.Label>Price</Form.Label>
                  <Form.Control readOnly value={variant.price} />
                </Col>
              </Row>

              {/* Image Upload */}
              <hr className="my-4" />
              <h6 className="fw-semibold mb-3 text-primary-black">Variant Images</h6>
              <div className="image-preview-group mt-2 mb-3 d-flex flex-wrap gap-2">
                {variant.images.map((img, idx) => (
                  <div key={idx} className="position-relative image-wrapper">
                    <img
                      src={
                        typeof img === "string"
                          ? img
                          : URL.createObjectURL(img)
                      }
                      alt="variant"
                      className="image-preview"
                    />
                    <i
                      className="bi bi-x-circle-fill position-absolute top-0 end-0 text-danger rm-icon"
                      onClick={() => removeVariantImage(i, idx)}
                      title="Remove Image"
                    />
                  </div>
                ))}
                {variant.images.length < 4 && (
                  <label className="image-upload">
                    <span>+</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        handleVariantImageUpload(i, e.target.files)
                      }
                    />
                  </label>
                )}
              </div>

              {/* Stock Section */}
              <hr className="my-4" />
              <h6 className="fw-semibold mb-3 text-primary-black">Stock Management</h6>
              <Form.Check
                type="switch"
                id={`vsize_${i}`}
                label="Enable Size Stock for this variant"
                checked={variant.enableSizeStock}
                onChange={(e) =>
                  updateVariant(i, { enableSizeStock: e.target.checked })
                }
              />

              {variant.enableSizeStock && (
                <Card className="p-3 variant-entry mt-3">
                  <Row className="g-2 align-items-end">
                    <Col xs={5}>
                      <Form.Label>Size (auto uppercase)</Form.Label>
                      <Form.Control
                        value={variant.sizeInput || ""}
                        onChange={(e) =>
                          updateVariant(i, {
                            sizeInput: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="E.g. S, M, L"
                      />
                    </Col>
                    <Col xs={5}>
                      <Form.Label>Quantity</Form.Label>
                      <ProductNumberInput
                        value={variant.sizeQtyInput}
                        onChange={(val) =>
                          updateVariant(i, { sizeQtyInput: val })
                        }
                      />
                    </Col>
                    <Col xs={2}>
                      <Button
                        className="w-100"
                        onClick={() => addVariantSize(i)}
                      >
                        Add
                      </Button>
                    </Col>
                    <Col xs={12} className="mt-3">
                      {Object.keys(variant.sizeStock || {}).length === 0 ? (
                        <div className="text-muted small">
                          No sizes added yet
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {Object.entries(variant.sizeStock || {}).map(
                            ([size, qty]) => (
                              <Badge
                                bg="light"
                                text="dark"
                                key={size}
                                className="border size-badge"
                              >
                                {size}: {qty}
                                <i
                                  className="bi bi-x ms-2 rm-size"
                                  onClick={() => removeVariantSize(i, size)}
                                />
                              </Badge>
                            )
                          )}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              )}
            
              {!variant.enableSizeStock && (
                <div className="mt-3">
                  <Form.Label>Stock</Form.Label>
                  <ProductNumberInput
                    value={variant.stock}
                    onChange={(val) => updateVariant(i, { stock: val })}
                  />
                </div>
              )}

              <div className="text-end mt-4">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeVariant(i)}
                >
                  <i className="bi bi-trash me-1" /> Remove Variant
                </Button>
              </div>
            </Card>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>

    {/* Sticky Add Variant Button */}
    <div className="sticky-add-variant text-end px-4">
      <Button
        variant="primary"
        size="sm"
        className="px-4 py-2 shadow-sm rounded-pill fw-semibold"
        onClick={addVariant}
      >
        <i className="bi bi-plus-circle me-2" />
        Add Variant
      </Button>
    </div>
  </>
)}

        <div className="text-end mt-4 mb-5 px-4 py-4">
          <Button variant="light" className="me-2 border border-secondary px-4 py-2 rounded-pill fw-semibold shadow-sm" onClick={() => navigate("/admin/dashboard")}>
            <i className="bi bi-x-circle me-2" /> Cancel
          </Button>
          <Button variant="primary" type="submit" className="px-4 py-2 rounded-pill fw-semibold shadow-sm">
            <i className="bi bi-check-circle me-2" /> Submit Product
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default AdminAddProductPage;