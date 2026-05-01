import React, { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import chatApi from "../api/chatApi";

/* ─── helpers ─────────────────────────────────────────────── */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("USER_INFO");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} giờ trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarColor(id) {
  const colors = ["#EE4D2D", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#ec4899"];
  return colors[((id || 0) % colors.length + colors.length) % colors.length];
}

/**
 * Lấy thông tin hiển thị của đối phương trong cuộc hội thoại.
 * Cấu trúc từ backend: { user_id, shop_id, shop: { name }, user: { name } }
 *
 * - Nếu currentUser là buyer (user_id === currentUserId) → hiện tên shop
 * - Nếu currentUser là seller                           → hiện tên khách hàng
 */
function getPartnerInfo(conv, currentUserId) {
  if (!conv) return { name: "Hội thoại", label: null, avatarId: 0, isBuyer: false };

  const isBuyer = String(currentUserId) === String(conv.user_id);

  if (isBuyer) {
    return {
      name: conv.shop?.name || `Shop #${conv.shop_id}`,
      label: "Người bán",
      labelColor: "#EE4D2D",
      avatarId: conv.shop_id,
      isBuyer: true,
    };
  } else {
    return {
      name: conv.user?.name || conv.user?.username || `Khách hàng #${conv.user_id}`,
      label: "Khách hàng",
      labelColor: "#6366f1",
      avatarId: conv.user_id,
      isBuyer: false,
    };
  }
}

/* ─── ConversationItem ─────────────────────────────────────── */
function ConversationItem({ conv, currentUserId, isSelected, onClick }) {
  const partner = getPartnerInfo(conv, currentUserId);
  const lastMsg = conv.last_message;
  const unread = conv.unread_count || 0;

  return (
    <button onClick={onClick} className={`conv-item ${isSelected ? "selected" : ""}`}>
      <div className="conv-avatar" style={{ background: getAvatarColor(partner.avatarId) }}>
        {getInitials(partner.name)}
      </div>
      <div className="conv-info">
        <div className="conv-top">
          <div className="conv-name-wrap">
            <span className="conv-name">{partner.name}</span>
            {partner.label && (
              <span
                className="conv-tag"
                style={{ background: partner.labelColor + "18", color: partner.labelColor }}
              >
                {partner.label}
              </span>
            )}
          </div>
          <span className="conv-time">{formatTime(lastMsg?.created_at || conv.updated_at)}</span>
        </div>
        <div className="conv-bottom">
          <span className={`conv-preview ${unread > 0 ? "unread" : ""}`}>
            {lastMsg
              ? String(lastMsg.sender_id) === String(currentUserId)
                ? `Bạn: ${lastMsg.content}`
                : lastMsg.content
              : "Bắt đầu cuộc trò chuyện..."}
          </span>
          {unread > 0 && <span className="unread-badge">{unread}</span>}
        </div>
      </div>
    </button>
  );
}

/* ─── MessageBubble ────────────────────────────────────────── */
function MessageBubble({ msg, isOwn, partnerName }) {
  return (
    <div className={`msg-row ${isOwn ? "own" : "other"}`}>
      {!isOwn && (
        <div
          className="msg-avatar"
          style={{ background: getAvatarColor(msg.sender_id) }}
        >
          {getInitials(partnerName || "?")}
        </div>
      )}
      <div className="msg-bubble-wrap">
        <div className={`msg-bubble ${isOwn ? "bubble-own" : "bubble-other"}`}>
          {msg.content}
        </div>
        <span className="msg-time">
          {msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </span>
      </div>
    </div>
  );
}

/* ─── Main ChatPage ────────────────────────────────────────── */
export default function ChatPage() {
  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = currentUser?.id;

  const [searchParams] = useSearchParams();
  const conversationIdFromQuery = searchParams.get("conversationId");

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(conversationIdFromQuery || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [mobileView, setMobileView] = useState(conversationIdFromQuery ? "chat" : "list");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* fetch conversations */
  const fetchConversations = async () => {
    setErrorMessage(null);
    try {
      const res = await chatApi.listConversations();
      const convs = Array.isArray(res.data) ? res.data : [];
      setConversations(convs);
      if (!selectedConvId && !conversationIdFromQuery && convs[0]?.id) {
        setSelectedConvId(convs[0].id);
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể tải chat.");
    }
  };

  /* fetch messages */
  const fetchMessages = async (convId) => {
    if (!convId) { setMessages([]); return; }
    setLoading(true);
    try {
      const res = await chatApi.listMessages(convId);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedConvId) fetchMessages(selectedConvId); }, [selectedConvId]);
  useEffect(() => {
    if (conversationIdFromQuery) {
      setSelectedConvId(conversationIdFromQuery);
      setMobileView("chat");
    }
  }, [conversationIdFromQuery]);

  /* Dispatch chatRead để reset badge ở header */
  useEffect(() => {
    window.dispatchEvent(new Event("chatRead"));
  }, []);

  /* auto scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConv = (id) => {
    setSelectedConvId(id);
    setMobileView("chat");
  };

  const handleSend = async () => {
    const trimmed = inputVal.trim();
    if (!trimmed || !selectedConvId || sending) return;
    setSending(true);
    setInputVal("");
    setErrorMessage(null);
    try {
      await chatApi.sendMessage(selectedConvId, trimmed);
      await fetchMessages(selectedConvId);
      fetchConversations();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể gửi tin nhắn.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* derive selected conv partner info */
  const selectedConv = conversations.find((c) => String(c.id) === String(selectedConvId));
  const partner = useMemo(() => getPartnerInfo(selectedConv, currentUserId), [selectedConv, currentUserId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          font-family: 'Be Vietnam Pro', sans-serif;
          height: calc(100vh - 60px);
          display: flex;
          background: #f0f2f5;
        }

        /* ── SIDEBAR ── */
        .chat-sidebar {
          width: 320px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e8e8e8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 18px 16px 14px;
          border-bottom: 1px solid #f0f0f0;
        }

        .sidebar-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: -0.3px;
        }

        .sidebar-subtitle {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .conv-list {
          flex: 1;
          overflow-y: auto;
          padding: 6px 0;
        }

        .conv-list::-webkit-scrollbar { width: 4px; }
        .conv-list::-webkit-scrollbar-track { background: transparent; }
        .conv-list::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .conv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #9ca3af;
          font-size: 14px;
          gap: 8px;
        }

        .conv-empty-icon { font-size: 36px; }

        .conv-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .conv-item:hover { background: #fafafa; }
        .conv-item.selected { background: #fff4f2; }
        .conv-item.selected .conv-name { color: #EE4D2D; }

        .conv-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          flex-shrink: 0;
        }

        .conv-info { flex: 1; min-width: 0; }

        .conv-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 3px;
        }

        .conv-name-wrap {
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 0;
          flex: 1;
        }

        .conv-name {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .conv-time { font-size: 11px; color: #9ca3af; flex-shrink: 0; padding-top: 2px; }

        .conv-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .conv-preview {
          font-size: 12.5px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .conv-preview.unread { font-weight: 600; color: #374151; }

        .unread-badge {
          background: #EE4D2D;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          flex-shrink: 0;
        }

        /* ── CHAT PANEL ── */
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #fff;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-bottom: 1px solid #f0f0f0;
          background: #fff;
          flex-shrink: 0;
        }

        .chat-header-back {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #EE4D2D;
          padding: 4px;
          border-radius: 8px;
          transition: background 0.15s;
        }

        .chat-header-back:hover { background: #fff4f2; }

        .chat-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .chat-header-info { flex: 1; min-width: 0; }

        .chat-header-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-header-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .chat-header-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 20px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .chat-header-status {
          font-size: 11px;
          color: #22c55e;
          font-weight: 500;
          margin-top: 2px;
        }

        /* messages */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: #f8f9fb;
        }

        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .msg-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          max-width: 72%;
          animation: msgIn 0.2s ease;
        }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-row.own { align-self: flex-end; flex-direction: row-reverse; }
        .msg-row.other { align-self: flex-start; }

        .msg-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .msg-bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .msg-row.own .msg-bubble-wrap { align-items: flex-end; }

        .msg-bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.5;
          max-width: 100%;
          word-break: break-word;
        }

        .bubble-own {
          background: #EE4D2D;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .bubble-other {
          background: #fff;
          color: #1a1a1a;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }

        .msg-time {
          font-size: 10px;
          color: #9ca3af;
          padding: 0 4px;
        }

        .chat-empty, .chat-no-conv {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          gap: 10px;
          padding: 40px;
        }

        .chat-empty-icon, .chat-no-conv-icon { font-size: 52px; }
        .chat-empty-text, .chat-no-conv-text { font-size: 15px; font-weight: 500; color: #6b7280; }
        .chat-empty-sub, .chat-no-conv-sub { font-size: 13px; text-align: center; line-height: 1.6; }

        .loading-dots {
          display: flex;
          gap: 5px;
          padding: 12px 0;
          align-self: flex-start;
        }

        .loading-dots span {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #d1d5db;
          animation: dot 1.4s infinite both;
        }

        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; }
        }

        /* input */
        .chat-input-bar {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid #f0f0f0;
          background: #fff;
          flex-shrink: 0;
        }

        .chat-input-wrap {
          flex: 1;
          background: #f3f4f6;
          border-radius: 22px;
          display: flex;
          align-items: flex-end;
          padding: 10px 14px;
          transition: box-shadow 0.2s;
        }

        .chat-input-wrap:focus-within {
          box-shadow: 0 0 0 2px #EE4D2D33;
          background: #fff;
        }

        .chat-textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 14px;
          color: #1a1a1a;
          resize: none;
          max-height: 100px;
          line-height: 1.5;
        }

        .chat-textarea::placeholder { color: #9ca3af; }

        .send-btn {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #EE4D2D;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: background 0.2s, transform 0.15s;
        }

        .send-btn:hover { background: #d44123; transform: scale(1.05); }
        .send-btn:active { transform: scale(0.95); }
        .send-btn:disabled { background: #e5e7eb; cursor: not-allowed; transform: none; }

        .error-toast {
          background: #fef2f2;
          color: #b91c1c;
          font-size: 13px;
          padding: 10px 14px;
          border-left: 3px solid #EF4444;
          border-radius: 6px;
          margin: 10px 16px 0;
        }

        /* ── MOBILE ── */
        @media (max-width: 640px) {
          .chat-root { height: calc(100vh - 56px); flex-direction: column; }

          .chat-sidebar {
            width: 100%;
            flex-shrink: 0;
            border-right: none;
            height: 100%;
          }

          .chat-sidebar.mobile-hidden { display: none; }
          .chat-panel.mobile-hidden { display: none; }
          .chat-header-back { display: flex !important; }
          .msg-row { max-width: 85%; }
          .messages-area { padding: 12px; }
          .sidebar-header { padding: 14px 14px 12px; }
          .sidebar-title { font-size: 18px; }
        }
      `}</style>

      <div className="chat-root">
        {/* ── Sidebar ── */}
        <aside className={`chat-sidebar ${mobileView === "chat" ? "mobile-hidden" : ""}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">💬 Tin nhắn</div>
            <div className="sidebar-subtitle">{conversations.length} cuộc hội thoại</div>
          </div>

          <div className="conv-list">
            {conversations.length === 0 ? (
              <div className="conv-empty">
                <span className="conv-empty-icon">📭</span>
                <span>Chưa có hội thoại nào</span>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  currentUserId={currentUserId}
                  isSelected={String(conv.id) === String(selectedConvId)}
                  onClick={() => handleSelectConv(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* ── Chat Panel ── */}
        <section className={`chat-panel ${mobileView === "list" ? "mobile-hidden" : ""}`}>
          {!selectedConvId ? (
            <div className="chat-no-conv">
              <span className="chat-no-conv-icon">👈</span>
              <span className="chat-no-conv-text">Chọn một cuộc trò chuyện</span>
              <span className="chat-no-conv-sub">Chọn từ danh sách bên trái để bắt đầu nhắn tin</span>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <button
                  className="chat-header-back"
                  onClick={() => setMobileView("list")}
                  aria-label="Quay lại"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                </button>

                <div
                  className="chat-header-avatar"
                  style={{ background: getAvatarColor(partner.avatarId) }}
                >
                  {getInitials(partner.name)}
                </div>

                <div className="chat-header-info">
                  <div className="chat-header-name-row">
                    <div className="chat-header-name">{partner.name}</div>
                    {partner.label && (
                      <span
                        className="chat-header-tag"
                        style={{
                          background: partner.labelColor + "18",
                          color: partner.labelColor,
                        }}
                      >
                        {partner.label}
                      </span>
                    )}
                  </div>
                  <div className="chat-header-status">● Đang hoạt động</div>
                </div>
              </div>

              {/* Error */}
              {errorMessage && <div className="error-toast">{errorMessage}</div>}

              {/* Messages */}
              <div className="messages-area">
                {loading ? (
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty">
                    <span className="chat-empty-icon">🙌</span>
                    <span className="chat-empty-text">Bắt đầu cuộc trò chuyện</span>
                    <span className="chat-empty-sub">Gửi tin nhắn đầu tiên để kết nối!</span>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <MessageBubble
                      key={msg.id || i}
                      msg={msg}
                      isOwn={String(msg.sender_id) === String(currentUserId)}
                      partnerName={partner.name}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input-bar">
                <div className="chat-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="chat-textarea"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!inputVal.trim() || sending}
                  aria-label="Gửi"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}