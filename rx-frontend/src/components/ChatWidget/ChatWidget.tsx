import React, { useState } from "react";
import ChatBox from "./ChatBox";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#2e7d32",
            color: "white",
            border: "none",
            boxShadow: "0 12px 30px rgba(46,125,50,0.28)",
            cursor: "pointer",
            fontSize: 22,
            zIndex: 1300,
            transition: "all 0.3s ease",
          }}
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: isExpanded ? "90vw" : 380,
            height: isExpanded ? "80vh" : 520,
            maxWidth: "calc(100% - 40px)",
            maxHeight: "90vh",
            zIndex: 1300,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(2,6,23,0.15)",
            transition: "all 0.3s ease",
            display: "flex",
            flexDirection: "column",
            background: "#f8faf9",
          }}
        >
          <ChatBox
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
            onClose={toggleOpen} // collapse back to bubble
          />
        </div>
      )}
    </>
  );
}
