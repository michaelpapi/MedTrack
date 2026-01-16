import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWebSocketChat } from "../../hooks/useWebSocket";
import ChatMessage from "./ChatMessage";
import api from "../../api/axios";


interface ChatBoxProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

export default function ChatBox({ isExpanded, onToggleExpand, onClose }: ChatBoxProps) {
  const [input, setInput] = useState("");
  const [displayedMessages, setDisplayedMessages] = useState<any[]>([]);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // --- Auth check ---
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(() => setCheckedAuth(true))
      .catch(() => {
        toast.error("You must be logged in to chat.")
        navigate("/login");
      });
  }, []);

  if (!checkedAuth) return null;

  // frontend code
  const WS_URL = `${(window as any)._env_.VITE_WS_BASE}/rag/ws/ask`;

  const { messages, sendMessage, isConnected } = useWebSocketChat(WS_URL);

  // --- Auto-scroll ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedMessages]);

  // --- Handle incoming WebSocket messages ---
  useEffect(() => {
    messages.forEach((msg) => {
      const exists = displayedMessages.find(
        (m) => m.content === msg.content && m.type === msg.type
      );
      if (!exists) {
        setDisplayedMessages((prev) => {
          // Remove the first loading message if it exists
          const newPrev = prev.filter((m) => m.type !== "loading");
          return [...newPrev, { ...msg, _key: Date.now() + Math.random() }];
        });
      }
    });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    // 1️⃣ Add user's message
    const userMsg = { type: "user", content: text, _key: Date.now() + Math.random() };
    setDisplayedMessages((prev) => [...prev, userMsg]);

    // 2️⃣ Add temporary loading message
    const loadingMsg = { type: "loading", content: "Reasoning", _key: Date.now() + Math.random() };
    setDisplayedMessages((prev) => [...prev, loadingMsg]);

    // 3️⃣ Send to WebSocket
    sendMessage(text);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg,#2e7d32,#66bb6a)",
          color: "white",
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 800 }}>💊 MedTrack Assistant</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, opacity: 0.95 }}>
            {isConnected ? "🟢 Online" : "🕓 Connecting..."}
          </span>

          <button
            onClick={onToggleExpand}
            style={{
              background: "#ffffff33",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "2px 6px",
              cursor: "pointer",
              transition: "transform 0.3s ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
            title={isExpanded ? "Reduce" : "Expand"}
          >
            🔼
          </button>

          <button
            onClick={onClose}
            style={{
              background: "#ffffff33",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "2px 6px",
              cursor: "pointer",
            }}
            title="Close"
          >
            ✖
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {displayedMessages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6b7280", marginTop: 20 }}>
            👋 Hi! Ask me about <strong>dosages, interactions</strong> or{" "}
            <strong>common FAQs</strong>.
          </div>
        ) : (
          displayedMessages.map((msg) => (
            <ChatMessage key={msg._key} type={msg.type} content={msg.content} />
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{ padding: 12, borderTop: "1px solid #e6edf0", display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about dosage, interactions or FAQs..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #e6eef0",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#2e7d32",
            color: "white",
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
