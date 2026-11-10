"use client";

import { useEffect, useState } from "react";

export function ChatbaseBubble() {
  const [chatbotId, setChatbotId] = useState<string>("");

  useEffect(() => {
    // 1. Try env variable first, then fallback to localStorage or default ID
    const envId = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID?.trim() || "";
    const localId = typeof window !== "undefined" ? localStorage.getItem("agritrace_chatbase_id")?.trim() || "" : "";
    const effectiveId = envId || localId || "HNBmb5fk_wSlCm4pwAPS6";

    setChatbotId(effectiveId);

    // Listener for real-time ID updates from UI
    const handleIdUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setChatbotId(customEvent.detail.trim());
      }
    };
    window.addEventListener("chatbase_id_updated", handleIdUpdate);

    return () => {
      window.removeEventListener("chatbase_id_updated", handleIdUpdate);
    };
  }, []);

  useEffect(() => {
    if (!chatbotId) return;

    // Set Chatbase configuration
    (window as unknown as { embeddedChatbotConfig?: { chatbotId: string; domain: string } }).embeddedChatbotConfig = {
      chatbotId,
      domain: "www.chatbase.co",
    };

    // Remove existing script if any to re-initialize
    const existing = document.getElementById("chatbase-embed-script");
    if (existing) {
      existing.remove();
    }

    const script = document.createElement("script");
    script.id = "chatbase-embed-script";
    script.src = "https://www.chatbase.co/embed.min.js";
    script.setAttribute("chatbotId", chatbotId);
    script.setAttribute("domain", "www.chatbase.co");
    script.defer = true;
    document.body.appendChild(script);
  }, [chatbotId]);

  return null;
}
