import api from "../../api/axios";
import React, { useContext } from "react";
import { CartContext } from "../../context/CartContext";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CartModal({ open, onClose }: CartModalProps) {
  const cart = useContext(CartContext);
  if (!cart) return null;

  const { items, updateQty, remove, clear, triggerRefresh } = cart;
  if (!open) return null;

  const dispenseCart = async () => {
    try {
      if (items.length === 0) {
        alert("Cart is empty!");
        return;
      }

      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          qty: item.qty,
          price: item.product.price,
          nhia_cover: item.product.nhia_cover,
        })),
      };

      const res = await api.post("/dispense", payload);
      console.log("✅ Dispensed successfully:", res.data);
      alert("Dispense successful!");
      clear();
      triggerRefresh();
      onClose();
    } catch (err: any) {
      console.error("❌ Dispense failed:", err?.response?.data || err?.message);
      alert("Failed to dispense items.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1400,
        backgroundColor: "rgba(16,24,40,0.45)",
        backdropFilter: "blur(2px)",
        padding: 20,
        transition: "opacity 220ms ease",
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 12,
          background: "white",
          padding: 18,
          boxShadow: "0 18px 40px rgba(16,24,40,0.3)",
          transform: "translateY(0)",
          transition: "transform 180ms ease",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#2e7d32",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              🛒
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Edit Cart</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{items.length} items</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={clear}
              style={{
                background: "#f3f4f6",
                border: "none",
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: "#374151",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Items */}
        <div style={{ maxHeight: 360, overflowY: "auto", paddingRight: 6 }}>
          {items.length === 0 ? (
            <div style={{ padding: 22, textAlign: "center", color: "#6b7280" }}>Your cart is empty.</div>
          ) : (
            items.map(({ product, qty }) => (
              <div
                key={product.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px dashed #eef2f7",
                }}
              >
                <div style={{ maxWidth: "65%" }}>
                  <div style={{ fontWeight: 700, color: "#111827" }}>
                    {typeof product.drug === "string" ? product.drug : product.drug?.name || "Unnamed"}
                    <span style={{ fontWeight: 500, color: "#6b7280", marginLeft: 8 }}>{product.strength || ""}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                    ₦{product.price?.toLocaleString() ?? "0"} • {product.nhia_cover ? "NHIA ✅" : "NHIA ❌"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="number"
                    min={0}
                    value={qty}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newQty = value === "" ? 0 : Number(value);
                      updateQty(product.id, newQty);
                    }}
                    style={{
                      width: 72,
                      padding: 6,
                      borderRadius: 8,
                      border: "1px solid #e6e6e6",
                      textAlign: "center",
                    }}
                  />

                  <button
                    onClick={() => remove(product.id)}
                    style={{
                      background: "#ff4d4d",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <div style={{ fontWeight: 700 }}>
            Total: ₦
            {items.reduce((sum, item) => sum + (item.product.price || 0) * item.qty, 0).toLocaleString()}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                clear();
                onClose();
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "#f3f4f6",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={dispenseCart}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "#2e7d32",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Dispense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
