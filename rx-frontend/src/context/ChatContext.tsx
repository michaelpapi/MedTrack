import React, { createContext, useContext, useState } from "react";

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
    const [history, setHistory] = useState([]);
    return (
        <ChatContext.Provider value={{ history, setHistory }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => useContext(ChatContext);