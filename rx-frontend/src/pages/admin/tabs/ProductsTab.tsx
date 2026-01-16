// src/pages/admin/tabs/ProductsTab.tsx
import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface Product {
  id: number;
  drug?: { name?: string } | string;
  brand?: { name?: string } | string;
  formulation_type?: string;
  unit?: string;
  strength?: string;
  price?: number;
  stock?: number;
  reorder_level?: number;
  nhia_cover?: boolean;
  notes?: string;
}

interface NewProductPayload {
  drug_id: string;
  brand_id: string;
  formulation_type_id: string;
  unit_id: string;
  strength: string;
  price: number;
  stock: number;
  reorder_level: number;
  nhia_cover: boolean;
  notes?: string;
}

export default function ProductsTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<NewProductPayload>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null
  );

  // ------------------ Helpers ------------------
  const showTempMessage = (
    text: string,
    type: "success" | "error" = "success",
    ms = 3000
  ) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), ms);
  };

  const [qDeb, setQDeb] = useState(query);
  useEffect(() => {
    const timeout = setTimeout(() => setQDeb(query), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  // Live search
  useEffect(() => {
    if (!qDeb || qDeb.trim().length < 1) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .get(`/products/search/`, { params: { query: qDeb, limit: 20 } })
      .then((res) => {
        if (!cancelled) setResults(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          showTempMessage("No products found", "error");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [qDeb]);

  // Manual search
  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/search/`, { params: { query } });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults([]);
      showTempMessage("Search failed. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Local update helper
  const updateLocalProduct = (id: number, changes: Partial<Product>) => {
    setResults((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)));
  };

  // Create product
  const handleCreate = async () => {
    try {
      const payload: Partial<NewProductPayload> = {
        drug_id: newProduct.drug_id || "",
        brand_id: newProduct.brand_id || "",
        formulation_type_id: newProduct.formulation_type_id || "",
        unit_id: newProduct.unit_id || "",
        strength: newProduct.strength || "",
        price: Number(newProduct.price || 0),
        stock: Number(newProduct.stock || 0),
        reorder_level: Number(newProduct.reorder_level || 0),
        nhia_cover: Boolean(newProduct.nhia_cover),
        notes: newProduct.notes || "",
      };

      await api.post("/products/create-products/", payload);
      setNewProduct({});
      setShowCreate(false);
      handleSearch(); // Refresh after creation
      showTempMessage("✅ Product created successfully", "success");
    } catch (err) {
      console.error(err);
      showTempMessage("❌ Failed to create product", "error");
    }
  };

  const handleUpdateStock = async (id: number, qty: number) => {
    try {
      await api.put(`/products/${id}/stock`, null, { params: { qty } });
      updateLocalProduct(id, { stock: qty });
      showTempMessage("Stock updated successfully", "success");
    } catch (err) {
      console.error(err);
      showTempMessage("Failed to update stock", "error");
    }
  };

  const handleUpdateReorder = async (id: number, reorder_level: number) => {
    try {
      await api.put(`/products/${id}/reorder`, null, { params: { reorder_level } });
      updateLocalProduct(id, { reorder_level });
      showTempMessage("Reorder level updated", "success");
    } catch (err) {
      console.error(err);
      showTempMessage("Failed to update reorder level", "error");
    }
  };

  const handleUpdatePrice = async (id: number, price: number) => {
    try {
      await api.put(`/products/update-products/${id}/`, { price });
      updateLocalProduct(id, { price });
      showTempMessage("Price updated successfully", "success");
    } catch (err) {
      console.error(err);
      showTempMessage("Failed to update price", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/delete-products/${id}`);
      handleSearch();
      showTempMessage("Product deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showTempMessage("Failed to delete product", "error");
    }
  };

  // Theme
  const primaryGreen = "#1b5e20";
  const accentGreen = "#43a047";
  const lightGreen = "#e8f5e9";

  return (
    <div style={{ padding: 20, position: "relative" }}>
      {/* Notification Message */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: message.type === "success" ? "#2e7d32" : "#c62828",
            color: "white",
            padding: "12px 20px",
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 999,
            transition: "all 0.3s ease-in-out",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      <h2 style={{ fontSize: 22, marginBottom: 10, color: primaryGreen }}>
        🧩 Product Management
      </h2>

      {/* Search Section */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search drug, brand or strength..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #c8e6c9",
            outline: "none",
            transition: "all .2s ease",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 16px",
            background: primaryGreen,
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            transition: "background .2s ease",
          }}
        >
          Search
        </button>

        <button
          onClick={() => setShowCreate((s) => !s)}
          style={{
            padding: "10px 14px",
            background: accentGreen,
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showCreate ? "✖ Close" : "➕ Add Product"}
        </button>
      </div>

      {/* Create Product Form */}
      {showCreate && (
        <div
          style={{
            border: "1px solid #dcedc8",
            padding: 16,
            borderRadius: 10,
            background: lightGreen,
            marginBottom: 20,
            boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h4 style={{ marginBottom: 12, color: primaryGreen }}>Create New Product</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              "drug_id",
              "brand_id",
              "formulation_type_id",
              "unit_id",
              "strength",
              "notes",
            ].map((field) => (
              <input
                key={field}
                placeholder={field.replace(/_/g, " ").toUpperCase()}
                value={(newProduct as any)[field] || ""}
                onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #a5d6a7",
                  flex: "1 1 200px",
                }}
              />
            ))}
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price ?? ""}
              onChange={(e) => setNewProduct({ ...newProduct, price: +e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #a5d6a7" }}
            />
            <input
              type="number"
              placeholder="Stock"
              value={newProduct.stock ?? ""}
              onChange={(e) => setNewProduct({ ...newProduct, stock: +e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #a5d6a7" }}
            />
            <input
              type="number"
              placeholder="Reorder Level"
              value={newProduct.reorder_level ?? ""}
              onChange={(e) => setNewProduct({ ...newProduct, reorder_level: +e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #a5d6a7" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={newProduct.nhia_cover ?? false}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, nhia_cover: e.target.checked })
                }
              />
              <span style={{ fontSize: 13 }}>NHIA Cover</span>
            </label>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                onClick={handleCreate}
                style={{
                  padding: "8px 14px",
                  background: primaryGreen,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "8px 14px",
                  background: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div style={{ overflowX: "auto", borderRadius: 10 }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              border: "1px solid #eee",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            <thead style={{ background: lightGreen, color: primaryGreen }}>
              <tr>
                {["ID", "Drug", "Brand", "Strength", "Price", "Stock", "Reorder", "Actions"].map(
                  (h) => (
                    <th key={h} style={{ padding: 10, textAlign: "left" }}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid #f1f1f1",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fff9")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td style={{ padding: 10 }}>{p.id}</td>
                  <td style={{ padding: 10 }}>
                    {typeof p.drug === "string" ? p.drug : p.drug?.name || "Unnamed"}
                  </td>
                  <td style={{ padding: 10 }}>
                    {typeof p.brand === "string" ? p.brand : p.brand?.name || "—"}
                  </td>
                  <td style={{ padding: 10 }}>{p.strength}</td>

                  {/* Editable price */}
                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      defaultValue={p.price ?? 0}
                      id={`price-${p.id}`}
                      style={{
                        width: 90,
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #e6efe6",
                      }}
                    />
                    <button
                      onClick={() => {
                        const raw = (
                          document.getElementById(`price-${p.id}`) as HTMLInputElement
                        )?.value;
                        const val = parseFloat(raw);
                        if (isNaN(val)) return alert("Enter a valid price");
                        handleUpdatePrice(p.id, val);
                      }}
                      style={{
                        marginLeft: 8,
                        padding: "6px 8px",
                        background: accentGreen,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </td>

                  {/* Editable stock */}
                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      defaultValue={p.stock ?? 0}
                      id={`stock-${p.id}`}
                      style={{
                        width: 70,
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #e6efe6",
                      }}
                    />
                    <button
                      onClick={() => {
                        const raw = (
                          document.getElementById(`stock-${p.id}`) as HTMLInputElement
                        )?.value;
                        const val = parseInt(raw);
                        if (isNaN(val)) return alert("Enter a valid stock number");
                        handleUpdateStock(p.id, val);
                      }}
                      style={{
                        marginLeft: 8,
                        padding: "6px 8px",
                        background: accentGreen,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </td>

                  {/* Editable reorder */}
                  <td style={{ padding: 10 }}>
                    <input
                      type="number"
                      defaultValue={p.reorder_level ?? 0}
                      id={`reorder-${p.id}`}
                      style={{
                        width: 70,
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #e6efe6",
                      }}
                    />
                    <button
                      onClick={() => {
                        const raw = (
                          document.getElementById(`reorder-${p.id}`) as HTMLInputElement
                        )?.value;
                        const val = parseInt(raw);
                        if (isNaN(val)) return alert("Enter a valid reorder level");
                        handleUpdateReorder(p.id, val);
                      }}
                      style={{
                        marginLeft: 8,
                        padding: "6px 8px",
                        background: primaryGreen,
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </td>

                  {/* Delete */}
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: "#c62828",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: "pointer",
                        transition: "background .2s",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
