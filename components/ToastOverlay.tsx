import React, { useEffect } from "react";

export type ToastMessage = {
  id: number;
  text: string;
  type?: "info" | "error" | "success";
};

export const ToastOverlay: React.FC<{
  messages: ToastMessage[];
  onRemove: (id: number) => void;
}> = ({ messages, onRemove }) => {
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      onRemove(messages[0].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [messages, onRemove]);

  return (
    <div style={{
      position: "fixed",
      top: 16,
      right: 16,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none"
    }}>
      {messages.map(msg => (
        <div
          key={msg.id}
          style={{
            background: msg.type === "error" ? "#ff4d4f" : "#222",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            fontSize: 15,
            opacity: 0.95,
            pointerEvents: "auto"
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
};
