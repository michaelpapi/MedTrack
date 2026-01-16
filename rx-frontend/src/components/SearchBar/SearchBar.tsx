import React, { useState, useEffect, useContext } from "react";
import api from "../../api/axios";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import ProductCard from "../ProductCard/ProductCard";
import { CartContext } from "../../context/CartContext";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const qDeb = useDebouncedValue(query, 350);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const cart = useContext(CartContext);

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let res;
        if (!qDeb || qDeb.length < 1) {
          // 👇 Default fetch for when search box is empty
          res = await api.get(`/products`, { params: { limit: 20, random: true } });
        } else {
          // 👇 Search results
          res = await api.get(`/products/search`, { params: { query: qDeb, limit: 20 } });
        }

        if (!cancelled) setResults(res.data);
      } catch (err) {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [qDeb, cart?.refreshKey]); // 👈 Re-fetch on search or dispense event

  return (
    <div style={{ padding: 16 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔎 Search products (e.g. Paracetamol 500mg Fidson)"
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #A8D5BA",
          backgroundColor: "#f6fff9",
          color: "#1b4332",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          outline: "none",
          transition: "0.2s ease",
        }}
        onFocus={(e) => (e.currentTarget.style.border = "1px solid #004d40")}
        onBlur={(e) => (e.currentTarget.style.border = "1px solid #A8D5BA")}
      />

      {loading && (
        <div style={{ padding: 12, color: "#004d40", fontWeight: 500 }}>Loading...</div>
      )}

      <div style={{ marginTop: 12 }}>
        {results.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAdd={(qty = 1) => cart?.addToCart(p, qty)}
          />
        ))}

        {!loading && results.length === 0 && qDeb && (
          <div style={{ textAlign: "center", color: "#777", marginTop: 20 }}>
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
