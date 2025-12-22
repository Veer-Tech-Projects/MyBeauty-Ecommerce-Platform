import React, { useState, useRef, useEffect } from "react";
import { Form } from "react-bootstrap";
import { ChromePicker } from "react-color";
import { FaEyeDropper } from "react-icons/fa";
import "@/app/styles/ColorPicker.css";

const ColorPicker = ({ color, onChange, label = "Color" }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef();

  // 👇 Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🎯 Eyedropper click handler
  const handleEyeDrop = async () => {
    if (!("EyeDropper" in window)) {
      alert("Eyedropper not supported in this browser.");
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (err) {
      console.error("Eyedropper cancelled or failed", err);
    }
  };

  return (
    <Form.Group className="mb-3" ref={pickerRef}>
      <Form.Label>{label}</Form.Label>
      <div className="d-flex align-items-start gap-3 flex-wrap position-relative">
        
        {/* 🎨 Ring to open color picker */}
        <div
          className="default-color-ring"
          title="Click to choose color"
          onClick={() => setShowPicker((prev) => !prev)}
        ></div>

        {/* 🧪 React Eyedropper Icon */}
        <div
            onClick={handleEyeDrop}
            title="Use Eyedropper"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ccc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <FaEyeDropper size={18} color="#333" />
          </div>

        {/* Selected Color Preview Ring */}
        <div
          className="selected-color-ring"
          style={{ backgroundColor: color || "#000" }}
        ></div>

        {/* Color Picker Panel */}
        {showPicker && (
          <div className="color-picker-inline">
            <ChromePicker
              color={color}
              onChange={(updated) => onChange(updated.hex)}
            />
          </div>
        )}
      </div>
    </Form.Group>
  );
};

export default ColorPicker;
