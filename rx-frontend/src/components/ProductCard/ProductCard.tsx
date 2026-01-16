import React, { useState, useEffect, useContext } from "react";
import { CartContext } from "../../context/CartContext";

interface Product {
  id: number;
  drug: string | null;
  brand: string | null;
  formulation_type?: string | null;
  unit?: string | null;
  strength?: string | null;
  price?: number | null;
  stock?: number | null;
  nhia_cover?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAdd: (qty?: number) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const cart = useContext(CartContext);
  const [qty, setQty] = useState<number | string>(0);

  // Reset qty when the cart refreshes (e.g. after dispense)
  useEffect(() => {
    setQty(0);
  }, [cart?.refreshKey]);

  const handleAdd = () => {
    const numericQty = Number(qty);
    if (!numericQty || numericQty < 1) {
      alert("Please enter a valid quantity");
      return;
    }
    onAdd(numericQty);
    setQty(0);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
        padding: 16,
        marginBottom: 10,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1b4332" }}>
            {product.drug || "Unnamed"} {product.strength || ""}
          </div>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>
            {product.brand || "No brand"} • {product.formulation_type || "Unknown"} •{" "}
            {product.unit || ""} • <strong>Stock:</strong> {product.stock ?? 0}
          </div>
          {product.price && (
            <div style={{ fontWeight: 600, color: "#2e7d32", fontSize: 14 }}>
              ₦{product.price.toLocaleString()} •{" "}
              {product.nhia_cover ? "NHIA ✅" : "NHIA ❌"}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty input
              setQty(value === "" ? "" : Number(value));
            }}
            style={{
              width: 60,
              padding: 6,
              border: "1px solid #A8D5BA",
              borderRadius: 6,
              textAlign: "center",
              color: "#1b4332",
              backgroundColor: "#f6fff9",
              outline: "none",
              transition: "0.2s border ease",
            }}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid #2e7d32")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid #A8D5BA")}
          />
          <button
            onClick={handleAdd}
            style={{
              background: "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1b5e20")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2e7d32")}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
