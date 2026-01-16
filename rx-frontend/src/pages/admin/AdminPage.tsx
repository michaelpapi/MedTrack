import React, { useState, type ReactNode } from "react";
import ProductsTab from "./tabs/ProductsTab";
import UsersTab from "./tabs/UsersTab";
import DispenseHistoryTab from "./tabs/DispenseHistoryTab";
import AnalyticsTab from "./tabs/AnalyticsTab";

type TabName = "products" | "users" | "dispense" | "analytics";

export default function AdminPage(): ReactNode {
  const [activeTab, setActiveTab] = useState<TabName>("products");

  const renderTab = (): ReactNode => {
    switch (activeTab) {
      case "products":
        return <ProductsTab />;
      case "users":
        return <UsersTab />;
      case "dispense":
        return <DispenseHistoryTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  const tabs: { name: TabName; label: string; icon: string }[] = [
    { name: "products", label: "Products", icon: "📦" },
    { name: "users", label: "Users", icon: "👥" },
    { name: "dispense", label: "Dispense History", icon: "💊" },
    { name: "analytics", label: "Analytics", icon: "📊" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#28a745",
          color: "white",
          padding: "20px 0",
          textAlign: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>🛠 Admin Dashboard</h1>
        <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.9 }}>
          Manage products, users, and system analytics
        </p>
      </header>

      {/* Tabs Navigation */}
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          margin: "30px 0 10px 0",
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              fontSize: "0.95rem",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s ease",
              background: activeTab === tab.name ? "#28a745" : "white",
              color: activeTab === tab.name ? "white" : "#333",
              boxShadow:
                activeTab === tab.name
                  ? "0 2px 8px rgba(40, 167, 69, 0.4)"
                  : "0 1px 4px rgba(0,0,0,0.1)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main
        style={{
          flexGrow: 1,
          background: "white",
          maxWidth: 1200,
          width: "95%",
          margin: "0 auto 40px auto",
          borderRadius: 12,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          padding: 24,
        }}
      >
        {renderTab()}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "10px 0",
          fontSize: "0.8rem",
          color: "#777",
          background: "#f0f3f7",
          borderTop: "1px solid #e0e4e8",
        }}
      >
        © {new Date().getFullYear()} Admin Dashboard. All rights reserved.
      </footer>
    </div>
  );
}
