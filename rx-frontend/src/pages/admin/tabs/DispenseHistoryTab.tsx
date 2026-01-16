import React, { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";

interface ProductFromAPI {
  id?: number;
  drug?: string | { name?: string } | null;
  brand?: string | { name?: string } | null;
}

interface DispenseItem {
  id: number;
  qty: number;
  price_at_dispense?: number | null;
  product?: ProductFromAPI | string | null;
}

interface DispenseFromAPI {
  id: number;
  user?: { username?: string } | string | null;
  user_id?: number | null;
  created_at: string | Date;
  items?: DispenseItem[] | null;
}

export default function DispenseHistoryTab() {
  const [dispenses, setDispenses] = useState<DispenseFromAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchDispenses = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get<DispenseFromAPI[]>("/dispense/all", { params });
      setDispenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching dispenses:", err);
      setDispenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const out: Array<{
      dispenseId: number;
      userLabel: string;
      createdAt: Date;
      itemId: number;
      productLabel: string;
      brandLabel: string;
      qty: number;
      price: number;
    }> = [];

    for (const d of dispenses) {
      if (!d) continue;

      let userLabel = "—";
      if (typeof d.user === "string" && d.user.trim() !== "") {
        userLabel = d.user;
      } else if (d.user && typeof d.user === "object") {
        userLabel = d.user.username ?? `User #${d.user_id ?? "—"}`;
      } else if (d.user_id) {
        userLabel = `User #${d.user_id}`;
      }

      const createdAt =
        typeof d.created_at === "string"
          ? new Date(d.created_at)
          : new Date(d.created_at ?? new Date());

      const items = Array.isArray(d.items) ? d.items : [];
      for (const item of items) {
        if (!item) continue;

        let productLabel = "Unnamed";
        let brandLabel = "—";
        const product = item.product;

        if (typeof product === "string") {
          productLabel = product;
        } else if (product && typeof product === "object") {
          if (typeof product.drug === "string") {
            productLabel = product.drug;
          } else if (product.drug && typeof product.drug === "object") {
            productLabel = product.drug.name ?? "Unnamed";
          }

          if (typeof product.brand === "string") {
            brandLabel = product.brand;
          } else if (product.brand && typeof product.brand === "object") {
            brandLabel = product.brand.name ?? "—";
          }
        }

        const qty = Number(item.qty ?? 0);
        const price = Number(item.price_at_dispense ?? 0);

        out.push({
          dispenseId: d.id,
          userLabel,
          createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
          itemId: item.id,
          productLabel,
          brandLabel,
          qty,
          price,
        });
      }
    }

    out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return out;
  }, [dispenses]);

  const totalRevenue = useMemo(
    () => rows.reduce((acc, r) => acc + r.price * r.qty, 0),
    [rows]
  );

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#1b1b1b",
      }}
    >
      <h2
        style={{
          marginBottom: 16,
          color: "#2e7d32",
          fontWeight: 700,
          fontSize: "1.6rem",
        }}
      >
        💊 Dispense History
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          From:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "1px solid #c8e6c9",
              background: "#f9fdf9",
            }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          To:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "1px solid #c8e6c9",
              background: "#f9fdf9",
            }}
          />
        </label>

        <button
          onClick={fetchDispenses}
          style={{
            padding: "8px 14px",
            background: "#43a047",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#388e3c")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#43a047")}
        >
          Apply Filter
        </button>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
            fetchDispenses();
          }}
          style={{
            padding: "8px 14px",
            background: "#e8f5e9",
            color: "#2e7d32",
            border: "1px solid #a5d6a7",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#c8e6c9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#e8f5e9")}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#2e7d32" }}>Loading dispenses…</p>
      ) : rows.length === 0 ? (
        <p style={{ color: "#555" }}>No dispenses found for the selected range.</p>
      ) : (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 10,
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 900,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#e8f5e9",
                  color: "#1b5e20",
                  fontWeight: 600,
                }}
              >
                <th style={{ padding: "12px 14px" }}>Dispense ID</th>
                <th style={{ padding: "12px 14px" }}>User</th>
                <th style={{ padding: "12px 14px" }}>Product</th>
                <th style={{ padding: "12px 14px" }}>Brand</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Qty</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>
                  Price (₦)
                </th>
                <th style={{ padding: "12px 14px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={`${r.dispenseId}-${r.itemId}`}
                  style={{
                    background: i % 2 === 0 ? "#ffffff" : "#f9fdf9",
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background 0.2s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#f1f8e9")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0 ? "#ffffff" : "#f9fdf9")
                  }
                >
                  <td style={{ padding: "10px 14px" }}>{r.dispenseId}</td>
                  <td style={{ padding: "10px 14px" }}>{r.userLabel}</td>
                  <td style={{ padding: "10px 14px" }}>{r.productLabel}</td>
                  <td style={{ padding: "10px 14px" }}>{r.brandLabel}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {r.qty}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {Number.isFinite(r.price)
                      ? r.price.toLocaleString()
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {r.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#e8f5e9", fontWeight: 600 }}>
                <td colSpan={4} style={{ padding: "12px 14px" }}>
                  Total
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  {rows.reduce((s, r) => s + r.qty, 0).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "12px 14px",
                    textAlign: "right",
                    color: "#1b5e20",
                  }}
                >
                  ₦{totalRevenue.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
