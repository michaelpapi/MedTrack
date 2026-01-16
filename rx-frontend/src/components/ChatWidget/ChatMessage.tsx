import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  type: "user" | "bot" | "sources" | "loading";
  content: any;
}

function ChatMessage({ type, content }: ChatMessageProps) {
  const [dots, setDots] = useState("");
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (type === "loading") {
      const interval = setInterval(() => {
        setDots(prev => (prev.length < 3 ? prev + "•" : ""));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [type]);

  // Fade-in for all non-loading messages
  useEffect(() => {
    if (type !== "loading") {
      // delay slightly so React renders first
      const timeout = setTimeout(() => setFadeIn(true), 10);
      return () => clearTimeout(timeout);
    }
  }, [type]);

  const isUser = type === "user";

  if (type === "sources") {
    const sources: string[] = Array.isArray(content) ? content : [String(content)];
    return (
      <div style={{
        background: "#f3f4f6",
        padding: 10,
        borderRadius: 8,
        fontSize: 13,
        color: "#374151",
        maxWidth: "85%"
      }}>
        <strong style={{ display: "block", marginBottom: 6 }}>Sources</strong>
        {sources.map((src, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <a href={src} target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5a3", textDecoration: "underline" }}>{src}</a>
          </div>
        ))}
      </div>
    );
  }

  if (type === "loading") {
    return (
      <div style={{
        fontStyle: "italic",
        color: "#6b7280",
        padding: "10px 14px",
        borderRadius: 12,
        maxWidth: "80%",
        background: "#f3f4f6"
      }}>
        {content} {dots}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      gap: 12,
      alignItems: "flex-start",
      width: "100%",
      opacity: fadeIn ? 1 : 0, // fade-in
      transition: "opacity 0.4s ease-in-out"
    }}>
      {!isUser && <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "#e6f4ea",
        color: "#1f8a3b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700
      }}>🤖</div>}
      <div style={{
        background: isUser ? "#2e7d32" : "white",
        color: isUser ? "white" : "#111827",
        padding: "10px 14px",
        borderRadius: 12,
        maxWidth: "80%",
        boxShadow: isUser ? "none" : "0 6px 12px rgba(17,24,39,0.06)",
        border: isUser ? "none" : "1px solid #eef2f7",
        whiteSpace: "pre-wrap",
      }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content)}</ReactMarkdown>
      </div>
      {isUser && <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "#e6f4ff",
        color: "#374151",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700
      }}>🧑</div>}
    </div>
  );
}

export default React.memo(ChatMessage);
