import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  type: "user" | "bot" | "sources" | "loading";
  content: any;
}

export function useWebSocketChat(wsUrl: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);

    ws.current.onmessage = (evt) => {
      const data = JSON.parse(evt.data);

      if (data.type === "final") {
        // Replace the first loading message with the bot answer
        setMessages((prev) => {
          const updated = [...prev];
          const loadingIndex = updated.findIndex(m => m.type === "loading");
          if (loadingIndex !== -1) {
            updated[loadingIndex] = { type: "bot", content: data.answer };
          } else {
            updated.push({ type: "bot", content: data.answer });
          }

          // Add sources if any
          if (data.sources && data.sources.length > 0) {
            updated.push({ type: "sources", content: data.sources });
          }

          return updated;
        });
      }
    };

    return () => ws.current?.close();
  }, [wsUrl]);

  const sendMessage = (query: string) => {
    if (ws.current && isConnected) {
      // Add user message
      setMessages(prev => [...prev, { type: "user", content: query }]);

      // Add temporary “thinking” bubble
      setMessages(prev => [...prev, { type: "loading", content: "Reasoning" }]);

      ws.current.send(JSON.stringify({ query }));
    }
  };

  return { messages, sendMessage, isConnected };
}
