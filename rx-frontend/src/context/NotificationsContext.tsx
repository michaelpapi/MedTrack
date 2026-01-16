import React, { createContext, useState, useEffect, useContext, type ReactNode} from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";

interface NotificationsContextType {
    notifications: string[];
    setNotifications: React.Dispatch<React.SetStateAction<string[]>>;
}

export const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);


export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<string[]>([]);
    const auth = useContext(AuthContext);

    useEffect(() => {
        if (!auth?.user) return;

        // Load notifications from backend
        api.get("notifications/active")
            .then((res) => {
                const msgs = res.data.map((n: any) => n.message);
                setNotifications(msgs);
            })
            .catch((err) => console.error("Could not fetch active notifications", err))


        // Setup websocket listener
        const WS_HOST = window.location.hostname === "localhost"
            ? "localhost:8000"
            : "medtrack.local";

        const wsUrl = `ws://${WS_HOST}/notifications/ws/notifications`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (evt) => {
            try {
                const data = JSON.parse(evt.data);

                // New low-stock notification
                if (data.type === "add" && data.message) {
                    setNotifications((prev) => [data.message, ...prev]);
                }

                if (data.type === "remove" && data.product_id) {
                    setNotifications((prev) => 
                    prev.filter((msg) => !msg.toLowerCase().includes(data.product_id.toString())));
                }
            } catch (err) {
                console.error("ws parse err", err);
            }
        }

        ws.onopen = () => console.log("Websocket connected");
        ws.onclose = () => console.log("WebSocket closed");
        return () => ws.close();
    }, [auth?.user]);

    return (
        <NotificationsContext.Provider value={{ notifications, setNotifications }}>
            {children}
        </NotificationsContext.Provider>
    );
};

