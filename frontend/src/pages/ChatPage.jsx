import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import chatApi from "../api/chatApi";
import ChatBox from "../components/Chat/ChatBox";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("USER_INFO");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = currentUser?.id;

  const [searchParams] = useSearchParams();
  const conversationIdFromQuery = searchParams.get("conversationId");

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(
    conversationIdFromQuery || null,
  );
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchConversations = async () => {
    setErrorMessage(null);
    const res = await chatApi.listConversations();
    setConversations(Array.isArray(res.data) ? res.data : []);
  };

  const fetchMessages = async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    try {
      const res = await chatApi.listMessages(convId);
      // Backend returns { conversation_id, messages }
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await chatApi.listConversations();
        const convs = Array.isArray(res.data) ? res.data : [];
        setConversations(convs);

        if (!selectedConversationId && !conversationIdFromQuery) {
          const first = convs[0];
          if (first?.id) setSelectedConversationId(first.id);
        }
      } catch (err) {
        setErrorMessage(err?.response?.data?.message || "Không thể tải chat.");
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  // Keep selectedConversationId consistent when query param exists
  useEffect(() => {
    if (conversationIdFromQuery) setSelectedConversationId(conversationIdFromQuery);
  }, [conversationIdFromQuery]);

  const handleSendMessage = async (content) => {
    if (!selectedConversationId) return;
    setErrorMessage(null);
    await chatApi.sendMessage(selectedConversationId, content);
    await fetchMessages(selectedConversationId);
  };

  const handleSelectConversation = async (convId) => {
    setSelectedConversationId(convId);
  };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "20px 0" }}>
      {errorMessage && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px", marginBottom: 15 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            {errorMessage}
          </div>
        </div>
      )}

      <ChatBox
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        messages={messages}
        currentUserId={currentUserId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
      />

      {loading && selectedConversationId && (
        <div style={{ maxWidth: 1000, margin: "10px auto 0", padding: "0 15px", color: "#64748b" }}>
          Đang tải tin nhắn...
        </div>
      )}
    </div>
  );
}

