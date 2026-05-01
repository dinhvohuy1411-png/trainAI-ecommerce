import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ChatBox({
  conversations,
  selectedConversationId,
  messages,
  currentUserId,
  onSelectConversation,
  onSendMessage,
}) {
  const [content, setContent] = useState("");
  const messagesEndRef = useRef(null);

  const conversationList = useMemo(() => (Array.isArray(conversations) ? conversations : []), [conversations]);

  const currentConv = useMemo(() => {
    return conversationList.find(c => String(c.id) === String(selectedConversationId));
  }, [conversationList, selectedConversationId]);

  // Xác định vai trò của user hiện tại trong hội thoại
  const getPartnerInfo = (conv) => {
    if (!conv) return { name: "Hội thoại", isCurrentUserBuyer: false };
    
    const isBuyer = String(currentUserId) === String(conv.user_id);
    
    return isBuyer 
      ? { name: conv.shop?.name || `Shop #${conv.shop_id}`, label: "Người bán", isCurrentUserBuyer: true }
      : { name: conv.user?.name || `Khách hàng #${conv.user_id}`, label: "Người mua", isCurrentUserBuyer: false };
  };

  const partner = useMemo(() => getPartnerInfo(currentConv), [currentConv, currentUserId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversationId]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSendMessage?.(trimmed);
    setContent("");
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px", fontFamily: "sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 15, height: "80vh" }}>
        
        {/* Sidebar */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 15, borderBottom: "1px solid #e5e7eb", fontWeight: 800, background: "#f8fafc" }}>
            Tin nhắn
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversationList.map((c) => {
              const active = String(c.id) === String(selectedConversationId);
              const { name } = getPartnerInfo(c);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectConversation?.(c.id)}
                  style={{
                    width: "100%", textAlign: "left", padding: "12px 15px", border: "none",
                    background: active ? "#fff5f1" : "transparent", cursor: "pointer",
                    borderBottom: "1px solid #f1f5f9", transition: "0.2s"
                  }}
                >
                  <div style={{ fontWeight: active ? 700 : 500, color: active ? "#ee4d2d" : "#111827" }}>{name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>ID: {c.id}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nội dung Chat */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", fontWeight: 800 }}>
            {selectedConversationId ? partner.name : "Chọn hội thoại"} 
            <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8", marginLeft: 8 }}>({partner.label})</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20, background: "#f8fafc" }}>
            {messages.map((m) => {
              const isMe = String(m.sender_id) === String(currentUserId);
              
              /**
               * LOGIC ĐẢO CHIỀU:
               * - Nếu tôi là Seller: 'Tôi' bên phải, 'Đối phương' bên trái (Giữ nguyên).
               * - Nếu tôi là Buyer: 'Tôi' bên trái, 'Đối phương' bên phải.
               */
              const isLeft = partner.isCurrentUserBuyer ? isMe : !isMe;

              return (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isLeft ? "flex-start" : "flex-end", marginBottom: 15 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>
                    {isMe ? "Bạn" : partner.name}
                  </div>
                  <div style={{
                    maxWidth: "75%", padding: "10px 14px", borderRadius: 12,
                    background: isMe ? "#ee4d2d" : "white", 
                    color: isMe ? "white" : "#111827",
                    border: isMe ? "none" : "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.content}</div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: isLeft ? "left" : "right" }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div style={{ padding: 15, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập tin nhắn..."
                style={{ flex: 1, padding: "10px 15px", borderRadius: 20, border: "1px solid #e5e7eb", outline: "none" }}
              />
              <button
                onClick={handleSend}
                disabled={!content.trim()}
                style={{
                  padding: "0 20px", borderRadius: 20, border: "none",
                  background: "#ee4d2d", color: "white", fontWeight: "bold", cursor: "pointer"
                }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}