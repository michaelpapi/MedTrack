import React, { useContext, useState } from "react";
import api from "../api/axios";
import SearchBar from "../components/SearchBar/SearchBar";
import { CartContext } from "../context/CartContext";
import CartModal from "../components/CartModal/CartModal";
import ChatWidget from "../components/ChatWidget/ChatWidget";

export default function Dashboard() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("CartContext not found");

  const [cartOpen, setCartOpen] = useState(false);

  const handleDispense = async () => {
    const payload = {
      items: cart.items.map((i) => ({
        product_id: i.product.id,
        qty: i.qty,
        nhia_cover: i.product.nhia_cover,
      })),
    };

    try {
      await api.post("/dispense/", payload);
      cart.clear();
      alert("✅ Products dispensed successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Error dispensing products");
    }
  };

  return (
    <div style={{ display: "flex", gap: 20, padding: 20, background: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ flex: 2 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>Dashboard</h1>
            <div style={{ color: "#6b7280", marginTop: 4 }}>Quickly search and dispense medicines</div>
          </div>
          <div>
            <button
              onClick={() => setCartOpen(true)}
              style={{
                background: "#2e7d32",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 8px 18px rgba(46,125,50,0.14)"
              }}
            >
              View Cart ({cart.items.length})
            </button>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 12, padding: 12, boxShadow: "0 8px 18px rgba(15,23,42,0.04)" }}>
          <SearchBar />
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ flex: 1 }}>
        <div style={{
          borderRadius: 12,
          padding: 14,
          background: "white",
          boxShadow: "0 8px 20px rgba(15,23,42,0.04)"
        }}>
          <h2 style={{ marginTop: 0 }}>🛒 Cart</h2>

          {cart.items.length === 0 ? (
            <p style={{ color: "#6b7280" }}>Cart is empty</p>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cart.items.map((item) => {
                  const p = item.product;
                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>
                          {typeof p.drug === "string" ? p.drug : p.drug?.name || "Unnamed"}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                          {typeof p.brand === "string" ? p.brand : p.brand?.name || "—"} | Qty: {item.qty}
                        </div>
                      </div>
                      <div style={{ color: "#2e7d32", fontWeight: 700 }}>
                        ₦{(p.price || 0).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 12, textAlign: "right", fontWeight: 700 }}>
                Total ₦
                {cart.items.reduce((sum, i) => sum + (i.product.price || 0) * i.qty, 0).toLocaleString()}
              </div>

              {/* ---- BUTTON AREA ---- */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <button
                  style={{
                    padding: "10px 18px",
                    background: "#2e7d32",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    minWidth: "120px"
                  }}
                  onClick={handleDispense}
                >
                  Dispense
                </button>
              </div>
              {/* ----------------------------- */}
            </>
          )}
        </div>
      </div>

      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} />
      <ChatWidget />
    </div>
  );
}
