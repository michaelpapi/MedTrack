// src/pages/admin/tabs/UsersTab.tsx
import React, { useEffect, useState } from "react";
import api from "../../../api/axios";

// ------------------ Interfaces ------------------
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
  is_active?: boolean;
}

interface ProductInfo {
  id: number | null;
  drug: string | null;
  brand: string | null;
}

interface DispenseItem {
  id: number;
  qty: number;
  price_at_dispense?: number | null;
  product: ProductInfo;
}

interface Dispense {
  id: number;
  created_at: string;
  items: DispenseItem[];
}

interface DispenseUser {
  id: number;
  username: string;
}

interface DispenseResponse {
  id: number;
  created_at: string;
  user_id: number;
  user: DispenseUser;
  items: DispenseItem[];
}

interface PaginatedDispenseResponse {
  total: number;
  page: number;
  limit: number;
  results: DispenseResponse[];
}

// ------------------ Component ------------------
export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected user + inline edit
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Create user
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    is_admin: false,
    is_active: true,
  });

  // UI message
  const [message, setMessage] = useState<{ text: string; type?: "success" | "error" } | null>(null);

  /**
   * dispenseCache structure:
   * {
   *   [userId]: {
   *     pages: { [pageNumber]: Dispense[] },
   *     totalPages: number,
   *     raw?: Dispense[]   // full list when client-side mode used
   *   }
   * }
   */
  const [dispenseCache, setDispenseCache] = useState<Record<number, { pages: Record<number, Dispense[]>; totalPages: number; raw?: Dispense[] }>>({});

  // Dispense history (current visible page)
  const [dispenseHistory, setDispenseHistory] = useState<Dispense[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState<string>("");
  const [historyEndDate, setHistoryEndDate] = useState<string>("");

  // Pagination for history (client-side page size)
  const ITEMS_PER_PAGE = 5;
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Visual theme colors
  const primaryGreen = "#2e7d32";
  const accentGreen = "#197b30";
  const mutedBg = "#f7fbf7";

  // ------------------ Helpers ------------------
  const showTempMessage = (text: string, type: "success" | "error" = "success", ms = 3000) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), ms);
  };

  // Update a single user locally (no refetch)
  const updateLocalUser = (id: number, changes: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)));
    setSelectedUser((s) => (s && s.id === id ? { ...s, ...changes } : s));
    setEditUser((e) => (e && e.id === id ? { ...e, ...changes } : e));
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/all-users");
      setUsers(res.data);
    } catch (err) {
      console.error("fetchUsers:", err);
      showTempMessage("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch user dispense history (supports clientSide fetch and server-side pagination)
  const fetchUserHistory = async (
    userId: number,
    page = 1,
    start_date?: string | null,
    end_date?: string | null,
    clientSide: boolean = false
  ) => {
    setHistoryLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: ITEMS_PER_PAGE };
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      if (clientSide) params.paginate = false;

      const res = await api.get(`/dispense/dispense-history/${userId}`, { params });
      const data = res.data as PaginatedDispenseResponse | any;

      const returnedResults: DispenseResponse[] = data.results ?? [];
      const returnedTotal: number = data.total ?? returnedResults.length ?? 0;
      const returnedPage: number = data.page ?? 1;
      const returnedLimit: number = data.limit ?? ITEMS_PER_PAGE;

      if (clientSide) {
        const rawResults: Dispense[] = returnedResults as Dispense[];
        const totalPages = Math.max(1, Math.ceil(rawResults.length / ITEMS_PER_PAGE));
        const pages: Record<number, Dispense[]> = {};
        for (let p = 1; p <= totalPages; p++) {
          const startIdx = (p - 1) * ITEMS_PER_PAGE;
          const endIdx = p * ITEMS_PER_PAGE;
          pages[p] = rawResults.slice(startIdx, endIdx);
        }

        setDispenseCache((prev) => ({
          ...prev,
          [userId]: {
            pages,
            totalPages,
            raw: rawResults,
          },
        }));

        const showPg = page in pages ? page : 1;
        setDispenseHistory(pages[showPg] || []);
        setHistoryPage(showPg);
        setHistoryTotalPages(totalPages);
        setShowHistory(true);
        return;
      }

      // Server-side path
      const results: Dispense[] = returnedResults as Dispense[];
      const pageNum = returnedPage || page;
      const total = returnedTotal || 0;
      const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

      setDispenseCache((prev) => {
        const prevForUser = prev[userId] ?? { pages: {}, totalPages };
        const newPages = { ...prevForUser.pages, [pageNum]: results };
        return { ...prev, [userId]: { pages: newPages, totalPages } };
      });

      setDispenseHistory(results);
      setHistoryPage(pageNum);
      setHistoryTotalPages(totalPages);
      setShowHistory(true);
    } catch (err) {
      console.error("fetchUserHistory:", err);
      showTempMessage("Failed to load history", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Toggle details view for a user
  const handleSelectUser = (user: User) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setEditUser(null);
      setShowHistory(false);
      setDispenseHistory([]);
    } else {
      setSelectedUser(user);
      setEditUser({ ...user });
      setShowHistory(false);
      setDispenseHistory([]);
      setHistoryPage(1);
      setHistoryStartDate("");
      setHistoryEndDate("");
    }
  };

  // Save edited user
  const handleSaveChanges = async () => {
    if (!editUser) return;
    setSaving(true);
    const old = users.find((u) => u.id === editUser.id) ?? null;
    updateLocalUser(editUser.id, { ...editUser });
    try {
      await api.put(`/auth/users/${editUser.id}`, editUser);
      showTempMessage("✅ User updated successfully", "success");
    } catch (err) {
      console.error("handleSaveChanges:", err);
      if (old) updateLocalUser(old.id, old);
      showTempMessage("Error updating user", "error");
    } finally {
      setSaving(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.username || !newUser.email || !newUser.password) {
      alert("⚠️ Please fill all required fields");
      return;
    }
    setCreating(true);
    try {
      await api.post("/auth/reg", newUser);
      showTempMessage("✅ User created", "success");
      setShowCreateForm(false);
      setNewUser({ first_name: "", last_name: "", username: "", email: "", password: "", is_admin: false, is_active: true });
      await fetchUsers();
    } catch (err) {
      console.error("handleCreateUser:", err);
      showTempMessage("Error creating user", "error");
    } finally {
      setCreating(false);
    }
  };

  // Delete user
  const deleteUser = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/auth/${id}`);
      showTempMessage("User deleted", "success");
      await fetchUsers();
      setSelectedUser(null);
      setEditUser(null);
    } catch (err) {
      console.error("deleteUser:", err);
      showTempMessage("Error deleting user", "error");
    }
  };

  // Toggle / load history (client-side full fetch for instant pagination)
  const handleToggleHistory = async () => {
    if (!selectedUser) return;
    if (showHistory) {
      setShowHistory(false);
      setDispenseHistory([]);
      return;
    }
    setHistoryPage(1);
    const cached = dispenseCache[selectedUser.id];
    const noDateFilters = !historyStartDate && !historyEndDate;
    if (cached && cached.pages && cached.pages[1] && noDateFilters) {
      setDispenseHistory(cached.pages[1]);
      setHistoryTotalPages(cached.totalPages || 1);
      setShowHistory(true);
      return;
    }
    await fetchUserHistory(selectedUser.id, 1, historyStartDate || undefined, historyEndDate || undefined, true);
  };

  // Apply filters
  const handleApplyHistoryFilter = async () => {
    if (!selectedUser) return;
    setHistoryPage(1);
    setHistoryLoading(true);
    await fetchUserHistory(selectedUser.id, 1, historyStartDate || undefined, historyEndDate || undefined);
    setHistoryLoading(false);
  };

  // Page navigation
  const goToHistoryPage = async (page: number) => {
    if (!selectedUser || page < 1) return;
    const target = Math.max(1, Math.min(page, historyTotalPages));
    const cachedForUser = dispenseCache[selectedUser.id];
    const cachedPage = cachedForUser?.pages?.[target];
    if (cachedPage) {
      setDispenseHistory(cachedPage);
      setHistoryPage(target);
      return;
    }
    if (cachedForUser?.raw) {
      const rawResults = cachedForUser.raw!;
      const newTotalPages = Math.max(1, Math.ceil(rawResults.length / ITEMS_PER_PAGE));
      const newPages: Record<number, Dispense[]> = { ...(cachedForUser.pages || {}) };
      for (let p = 1; p <= newTotalPages; p++) {
        const startIdx = (p - 1) * ITEMS_PER_PAGE;
        const endIdx = p * ITEMS_PER_PAGE;
        newPages[p] = rawResults.slice(startIdx, endIdx);
      }
      setDispenseCache((prev) => ({
        ...prev,
        [selectedUser.id]: { pages: newPages, totalPages: newTotalPages, raw: rawResults },
      }));
      setDispenseHistory(newPages[target] || []);
      setHistoryPage(target);
      setHistoryTotalPages(newTotalPages);
      return;
    }
    setHistoryPage(target);
    await fetchUserHistory(selectedUser.id, target, historyStartDate || undefined, historyEndDate || undefined, false);
  };

  // ------------------ Render ------------------
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: primaryGreen, marginBottom: 12 }}>👥 User Management</h2>

      {/* message */}
      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 14px",
            borderRadius: 8,
            background: message.type === "success" ? "#ecf9f1" : "#fff6f6",
            color: message.type === "success" ? "#065f46" : "#7f1d1d",
            border: message.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
          }}
        >
          {message.text}
        </div>
      )}

      {/* add user */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div />
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: showCreateForm ? "#e0f2e9" : accentGreen,
            color: showCreateForm ? primaryGreen : "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showCreateForm ? "✖ Close" : "➕ Add User"}
        </button>
      </div>

      {/* create user */}
      {showCreateForm && (
        <div
          style={{
            background: mutedBg,
            padding: 18,
            borderRadius: 10,
            marginBottom: 20,
            boxShadow: "0 6px 20px rgba(46,125,50,0.04)",
            border: "1px solid #ecf7ed",
          }}
        >
          <h4 style={{ marginTop: 0, color: primaryGreen }}>🧾 New User</h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="First Name"
              value={newUser.first_name}
              onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
            />
            <input
              placeholder="Last Name"
              value={newUser.last_name}
              onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
            />
            <input
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
            />
            <input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
            />
            <input
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={newUser.is_admin}
                onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
              />
              Admin
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={newUser.is_active}
                onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
              />
              Active
            </label>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <button
                onClick={handleCreateUser}
                disabled={creating}
                style={{
                  background: primaryGreen,
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {creating ? "Creating..." : "Create User"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: "#9e9e9e",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* users table */}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", boxShadow: "0 4px 14px rgba(0,0,0,0.03)" }}>
            <thead style={{ background: "#f0faf3", color: primaryGreen }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left" }}>ID</th>
                <th style={{ padding: 12, textAlign: "left" }}>Username</th>
                <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                <th style={{ padding: 12, textAlign: "left" }}>Full Name</th>
                <th style={{ padding: 12, textAlign: "left" }}>Admin?</th>
                <th style={{ padding: 12, textAlign: "left" }}>Active?</th>
                <th style={{ padding: 12, textAlign: "left" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderBottom: "1px solid #f1f1f1" }}>
                    <td style={{ padding: 12 }}>{u.id}</td>
                    <td style={{ padding: 12 }}>{u.username}</td>
                    <td style={{ padding: 12 }}>{u.email}</td>
                    <td style={{ padding: 12 }}>{u.first_name} {u.last_name}</td>
                    <td style={{ padding: 12 }}>{u.is_admin ? "✅" : "❌"}</td>
                    <td style={{ padding: 12 }}>{u.is_active ? "✅" : "❌"}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleSelectUser(u)}
                          style={{
                            background: "#e8f7f0",
                            color: primaryGreen,
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          {selectedUser?.id === u.id ? "Hide Details" : "View Details"}
                        </button>

                        <button
                          onClick={() => deleteUser(u.id)}
                          style={{
                            background: "#ff6b6b",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* details */}
                  {selectedUser?.id === u.id && editUser && (
                    <tr>
                      <td colSpan={7} style={{ background: "#fafaf9", padding: 16 }}>
                        <h4 style={{ marginTop: 0, color: primaryGreen }}>🧍 User Details</h4>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                          <input
                            type="text"
                            value={editUser.first_name}
                            onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                            placeholder="First Name"
                            style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
                          />
                          <input
                            type="text"
                            value={editUser.last_name}
                            onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                            placeholder="Last Name"
                            style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
                          />
                          <input
                            type="email"
                            value={editUser.email}
                            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                            placeholder="Email"
                            style={{ padding: 8, borderRadius: 8, border: "1px solid #e6efe6" }}
                          />

                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={!!editUser.is_admin}
                              onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })}
                            />
                            Admin
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={!!editUser.is_active}
                              onChange={(e) => setEditUser({ ...editUser, is_active: e.target.checked })}
                            />
                            Active
                          </label>

                          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            <button
                              onClick={handleSaveChanges}
                              disabled={saving}
                              style={{
                                background: primaryGreen,
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 14px",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              {saving ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                              onClick={() => setEditUser(selectedUser ? { ...selectedUser } : null)}
                              style={{
                                background: "#9e9e9e",
                                color: "white",
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 14px",
                                cursor: "pointer",
                              }}
                            >
                              Cancel Edits
                            </button>
                          </div>
                        </div>

                        {/* history controls */}
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                          <button
                            onClick={handleToggleHistory}
                            style={{
                              background: "#e8f7f0",
                              color: primaryGreen,
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 12px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            {showHistory ? "Hide History" : "Show History"}
                          </button>

                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            From:
                            <input
                              type="date"
                              value={historyStartDate}
                              onChange={(e) => setHistoryStartDate(e.target.value)}
                              style={{ marginLeft: 8, padding: 6, borderRadius: 8, border: "1px solid #e6efe6" }}
                            />
                          </label>

                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            To:
                            <input
                              type="date"
                              value={historyEndDate}
                              onChange={(e) => setHistoryEndDate(e.target.value)}
                              style={{ marginLeft: 8, padding: 6, borderRadius: 8, border: "1px solid #e6efe6" }}
                            />
                          </label>

                          <button
                            onClick={handleApplyHistoryFilter}
                            style={{
                              background: accentGreen,
                              color: "white",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 12px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Apply Dates
                          </button>
                        </div>

                        {/* Dispense History */}
                        {showHistory && (
                          <>
                            <h4 style={{ marginTop: 6, color: primaryGreen }}>💊 Dispense History for {u.first_name}</h4>

                            <div style={{ position: "relative", minHeight: 40 }}>
                              {historyLoading && (
                                <div style={{ position: "absolute", top: 0, right: 0, background: "rgba(255,255,255,0.8)", color: "#444", fontSize: 12, padding: "4px 8px", borderRadius: 6 }}>
                                  Refreshing...
                                </div>
                              )}

                              {dispenseHistory.length > 0 ? (
                                <>
                                  <table style={{ width: "100%", marginTop: 10, borderCollapse: "collapse", fontSize: 14 }}>
                                    <thead style={{ background: "#f5f7f5" }}>
                                      <tr>
                                        <th style={{ padding: 8 }}>Date</th>
                                        <th style={{ padding: 8 }}>Drug</th>
                                        <th style={{ padding: 8 }}>Qty</th>
                                        <th style={{ padding: 8 }}>Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {dispenseHistory.map((d) =>
                                        d.items.map((i) => {
                                          const drugName = i.product?.drug ?? "Unnamed Drug";
                                          const brandName = i.product?.brand ? ` (${i.product.brand})` : "";
                                          return (
                                            <tr key={`${d.id}-${i.id}`}>
                                              <td style={{ padding: 8 }}>{new Date(d.created_at).toLocaleString()}</td>
                                              <td style={{ padding: 8 }}>{`${drugName}${brandName}`}</td>
                                              <td style={{ padding: 8 }}>{i.qty}</td>
                                              <td style={{ padding: 8 }}>{i.price_at_dispense ?? "—"}</td>
                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>

                                  {/* pagination */}
                                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 12 }}>
                                    <button
                                      onClick={() => goToHistoryPage(historyPage - 1)}
                                      disabled={historyPage === 1}
                                      style={{
                                        background: historyPage === 1 ? "#e0e0e0" : accentGreen,
                                        color: historyPage === 1 ? "#777" : "white",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 12px",
                                        cursor: historyPage === 1 ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      ⬅ Previous
                                    </button>

                                    <span>Page {historyPage} of {historyTotalPages}</span>

                                    <button
                                      onClick={() => goToHistoryPage(historyPage + 1)}
                                      disabled={historyPage === historyTotalPages}
                                      style={{
                                        background: historyPage === historyTotalPages ? "#e0e0e0" : accentGreen,
                                        color: historyPage === historyTotalPages ? "#777" : "white",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "8px 12px",
                                        cursor: historyPage === historyTotalPages ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      Next ➡
                                    </button>
                                  </div>
                                </>
                              ) : (
                                !historyLoading && <p>No records found</p>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
