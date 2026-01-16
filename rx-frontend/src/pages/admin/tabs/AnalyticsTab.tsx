import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

interface ProductStats {
  product_id: number;
  product_name: string;
  brand_name: string;
  total_qty: number;
}

interface UserStats {
  user_id: number;
  username: string;
  total_dispensed: number;
}

interface RevenueStats {
  total_revenue: number;
  total_items: number;
}

export default function AnalyticsTab() {
  const [mostPurchased, setMostPurchased] = useState<ProductStats[]>([]);
  const [mostActiveUsers, setMostActiveUsers] = useState<UserStats[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [productPage, setProductPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [cachedData, setCachedData] = useState({
    mostPurchased: [] as ProductStats[],
    mostActiveUsers: [] as UserStats[],
    revenueStats: null as RevenueStats | null,
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const [productsRes, usersRes, revenueRes] = await Promise.all([
        api.get<ProductStats[]>(`/analytics/most-purchased-products/?${queryParams.toString()}`),
        api.get<UserStats[]>(`/analytics/most-active-users/?${queryParams.toString()}`),
        api.get<RevenueStats>(`/analytics/revenue-stats/?${queryParams.toString()}`),
      ]);

      setMostPurchased(productsRes.data);
      setMostActiveUsers(usersRes.data);
      setRevenueStats(revenueRes.data);

      setCachedData({
        mostPurchased: productsRes.data,
        mostActiveUsers: usersRes.data,
        revenueStats: revenueRes.data,
      });

      setProductPage(1);
      setUserPage(1);
    } catch (err) {
      console.error("Error fetching analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const paginatedProducts = (mostPurchased.length ? mostPurchased : cachedData.mostPurchased).slice(
    (productPage - 1) * ITEMS_PER_PAGE,
    productPage * ITEMS_PER_PAGE
  );
  const paginatedUsers = (mostActiveUsers.length ? mostActiveUsers : cachedData.mostActiveUsers).slice(
    (userPage - 1) * ITEMS_PER_PAGE,
    userPage * ITEMS_PER_PAGE
  );

  const totalProductPages = Math.ceil(
    (mostPurchased.length || cachedData.mostPurchased.length) / ITEMS_PER_PAGE
  );
  const totalUserPages = Math.ceil(
    (mostActiveUsers.length || cachedData.mostActiveUsers.length) / ITEMS_PER_PAGE
  );

  const buttonStyle: React.CSSProperties = {
    padding: "8px 14px",
    margin: "0 4px",
    background: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    transition: "background 0.3s ease",
  };

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 10,
    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
    padding: 20,
    opacity: loading ? 0.7 : 1,
    transition: "opacity 0.3s ease, transform 0.2s ease",
  };

  return (
    <div
      style={{
        padding: "24px 32px",
        fontFamily: "Inter, Arial, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        color: "#1b4332",
      }}
    >
      <h2
        style={{
          fontSize: "1.8rem",
          marginBottom: 20,
          color: "#2e7d32",
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        📈 Analytics Overview
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>Start Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#1b4332",
            }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>End Date:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "white",
              color: "#1b4332",
            }}
          />
        </label>

        <button
          onClick={fetchAnalytics}
          style={{
            padding: "8px 16px",
            background: loading ? "#a5d6a7" : "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s ease",
          }}
        >
          {loading ? "Loading..." : "Apply Filter"}
        </button>
      </div>

      {/* Dashboard Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 20,
        }}
      >
        {/* Most Purchased Products */}
        <div style={cardStyle}>
          <h3 style={{ color: "#2e7d32", marginBottom: 14 }}>
            🏷️ Most Purchased Products
          </h3>
          {(paginatedProducts.length === 0 && !loading) ? (
            <p style={{ color: "#64748b" }}>No data available</p>
          ) : (
            <>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr style={{ background: "#e8f5e9", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>Product</th>
                    <th style={{ padding: "8px 10px" }}>Brand</th>
                    <th style={{ padding: "8px 10px" }}>Qty Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p, i) => (
                    <tr
                      key={p.product_id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        background: i % 2 === 0 ? "#ffffff" : "#f6fef8",
                      }}
                    >
                      <td style={{ padding: "8px 10px" }}>{p.product_name}</td>
                      <td style={{ padding: "8px 10px" }}>{p.brand_name}</td>
                      <td style={{ padding: "8px 10px" }}>{p.total_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <button
                  disabled={productPage === 1}
                  onClick={() => setProductPage(productPage - 1)}
                  style={{
                    ...buttonStyle,
                    opacity: productPage === 1 ? 0.5 : 1,
                  }}
                >
                  Prev
                </button>
                <span style={{ margin: "0 8px" }}>
                  Page {productPage} of {totalProductPages || 1}
                </span>
                <button
                  disabled={productPage === totalProductPages}
                  onClick={() => setProductPage(productPage + 1)}
                  style={{
                    ...buttonStyle,
                    opacity: productPage === totalProductPages ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Most Active Users */}
        <div style={cardStyle}>
          <h3 style={{ color: "#1b5e20", marginBottom: 14 }}>
            👥 Most Active Users
          </h3>
          {(paginatedUsers.length === 0 && !loading) ? (
            <p style={{ color: "#64748b" }}>No data available</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "#e8f5e9", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px" }}>Username</th>
                  <th style={{ padding: "8px 10px" }}>Total Dispensed</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u, i) => (
                  <tr
                    key={u.user_id}
                    style={{
                      borderBottom: "1px solid #f0f0f0",
                      background: i % 2 === 0 ? "#ffffff" : "#f6fef8",
                    }}
                  >
                    <td style={{ padding: "8px 10px" }}>{u.username}</td>
                    <td style={{ padding: "8px 10px" }}>{u.total_dispensed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Revenue Summary */}
        <div style={cardStyle}>
          <h3 style={{ color: "#1b4332", marginBottom: 14 }}>
            💰 Revenue & Sales Summary
          </h3>
          {(revenueStats || cachedData.revenueStats) ? (
            <div style={{ fontSize: 15 }}>
              <p>
                <strong>Total Revenue:</strong>{" "}
                <span style={{ color: "#2e7d32" }}>
                  ₦{(revenueStats || cachedData.revenueStats)?.total_revenue.toLocaleString()}
                </span>
              </p>
              <p>
                <strong>Total Items Dispensed:</strong>{" "}
                <span style={{ color: "#2e7d32" }}>
                  {(revenueStats || cachedData.revenueStats)?.total_items.toLocaleString()}
                </span>
              </p>
            </div>
          ) : (
            <p style={{ color: "#64748b" }}>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
