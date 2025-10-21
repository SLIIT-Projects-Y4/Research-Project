// Enhancements: emoji click-outside, attach click-outside, reactions, upload progress
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { toast } from "react-toastify";
import ExperienceTipsModal from "../models/ExperienceTipsModal.jsx";
import ConfirmDialog from "../models/ConfirmDialog.jsx";
import TranslateModal from "../models/TranslateModal.jsx";
import { Navbar } from "../components/common/Navbar.jsx";
import PollCreator from "../models/PollCreator.jsx";
import PollCard from "../models/PollCard.jsx";
import { useCallback } from "react";

const serverUrl = "http://localhost:9090";

const FILE_TYPES = {
  photo: "image/*,video/*",
  document: ".pdf,.doc,.docx,.txt,.csv,.xlsx",
  audio: "audio/*",
  all: "*",
};

const MAX_FILE_SIZE_MB = 20;

export default function ChatPage() {
  const location = useLocation();

  const group_id = location.state?.group_id;
  const localUser = JSON.parse(localStorage.getItem("user") || "null");
  const user_id = localUser?.userId;
  const username = localUser?.name;

  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupName, setGroupName] = useState("Group Chat");
  const [typingUser, setTypingUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);
  const [experienceTips, setExperienceTips] = useState([]);
  const [showExperiencePanel, setShowExperiencePanel] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [translateMsg, setTranslateMsg] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [polls, setPolls] = useState([]);
  const [showPolls, setShowPolls] = useState(false);
  const [members, setMembers] = useState([]);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const shouldScrollRef = useRef(false);
  const reportedRef = useRef(new Set());

  const formatDateHeader = (timestamp) => {
    const msgDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(msgDate, today)) return "Today";
    if (isSameDay(msgDate, yesterday)) return "Yesterday";

    return msgDate.toLocaleDateString("en-LK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (shouldScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!group_id) return;
    const loadHistory = async () => {
      try {
        const res = await fetch(`${serverUrl}/history/${group_id}`);
        const data = await res.json();
        setMessages(data);
        shouldScrollRef.current = true;
        if (data.length > 0 && data[0].group_name)
          setGroupName(data[0].group_name);
      } catch (err) {
        console.error("❌ Failed to load chat history:", err);
      }
    };
    loadHistory();
  }, [group_id]);

  const connectedRef = useRef(false);
  useEffect(() => {
    if (!group_id || !user_id || !username) return;
    if (connectedRef.current) return;
       connectedRef.current = true;
    const socket = new WebSocket(
      `${serverUrl.replace("http", "ws")}/ws/chat/${group_id}/${user_id}`
    );
    setWs(socket);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "typing") {
        if (data.user_id !== user_id) {
          setTypingUser(data.username || "Someone");
          setTimeout(() => setTypingUser(null), 2000);
        }
        return;
      }
      if (data.type === "reaction") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data._id ? { ...msg, reactions: data.reactions } : msg
          )
        );
        return;
      }
      if (data.type === "bot_offer") {
        const msg = {
          user_id: "AI_BOT",
          username: "TripBot",
          group_name: groupName,
          message: data.text,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => {
          if (window.confirm("Do you want help from TripBot?")) {
            socket.send(
              JSON.stringify({ type: "confirm_help", query: data.query })
            );
          }
        }, 500);
        return;
      }
      if (data.type === "group_meta" && data.group_name) {
        setGroupName(data.group_name);
        return;
      }
      setMessages((prev) => [...prev, data]);
      // if (data.group_name) setGroupName(data.group_name);
    };
    socket.onclose = () => console.warn("WebSocket disconnected");
    return () => {
    connectedRef.current = false;              // cleanup guard
    try { socket.close(); } catch { /* empty */ }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group_id, user_id, username]);

  useEffect(() => {
    if (showExperiencePanel && group_id) {
      const loadExperiences = async () => {
        try {
          const res = await fetch(
            `${serverUrl}/groups/${group_id}/experiences`
          );
          const data = await res.json();
          setExperienceTips(data);
        } catch (err) {
          console.error("❌ Failed to load experience log:", err);
        }
      };
      loadExperiences();
    }
  }, [showExperiencePanel, group_id]);

  const sendMessage = () => {
    if (ws && newMessage.trim()) {
      ws.send(
        JSON.stringify({
          type: "chat",
          message: newMessage,
          username,
          user_id,
        })
      );
      console.log(username);
      setNewMessage("");
      shouldScrollRef.current = true;
    }
  };

  useEffect(() => {
    if (!group_id) return;
    (async () => {
      try {
        const res = await fetch(`${serverUrl}/groups/members/${group_id}`);
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn("Failed to load members", e);
      }
    })();
  }, [group_id]);

  const initials = (name = "") =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  const handleTyping = (value) => {
    setNewMessage(value);
    if (ws && value.trim()) {
      ws.send(
        JSON.stringify({
          type: "typing",
          user_id,
          username,
        })
      );
    }
  };

  const triggerFileInput = (type) => {
    setSelectedFileType(type);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !ws) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error("❌ File too large (max 20MB)");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${serverUrl}/upload/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    const file_id = data.file_id;
    const mediaType = file.type.startsWith("image")
      ? "image"
      : file.type.startsWith("video")
      ? "video"
      : file.type.startsWith("audio")
      ? "audio"
      : "file";
    ws.send(
      JSON.stringify({
        type: "media",
        file_id: file_id,
        media_type: mediaType,
        user_id,
        username,
      })
    );
    setUploading(false);
  };

  const addReaction = (messageIndex, emoji) => {
    const msg = messages[messageIndex];
    const hasReacted = msg.reactions?.some(
      (r) => r.user_id === user_id && r.emoji === emoji
    );

    if (ws && msg._id) {
      ws.send(
        JSON.stringify({
          type: "reaction",
          message_id: msg._id,
          reaction: emoji,
          user_id,
          username,
          action: hasReacted ? "remove" : "add",
        })
      );
    }
  };

  let lastDateLabel = "";

  async function reportMessage(msg) {
    // local guard: avoid extra POST before server says "already_reported"
    if (reportedRef.current.has(msg._id)) {
      toast.info("You can report a message only once");
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/messages/${msg._id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporter_id: user_id, group_id }),
      });
      const data = await res.json();

      // normalize: success statuses from backend
      switch (data.status) {
        case "recorded":
          reportedRef.current.add(msg._id);
          toast.success("Thanks for the report");
          break;
        case "warned_author":
          reportedRef.current.add(msg._id);
          toast.info("Author has been warned");
          break;
        case "auto_removed":
          reportedRef.current.add(msg._id);
          toast.warn("Author was removed from the group");
          break;
        case "already_reported":
          reportedRef.current.add(msg._id); // mark locally too
          toast.info("You can report a message only once");
          break;
        default:
          toast.info("Report received");
      }
    } catch (e) {
      toast.error("Couldn’t report this message. Please try again.", e);
    }
  }

  function openTranslate(msg) {
    if (!msg?.message) return;
    setTranslateMsg(msg);
    setTranslateOpen(true);
  }

  const fetchPolls = useCallback(async () => {
    if (!group_id) return;
    const res = await fetch(`${serverUrl}/polls/${group_id}`);
    const data = await res.json();
    setPolls(data || []);
  }, [group_id]);

  useEffect(() => {
    fetchPolls();
    const t = setInterval(fetchPolls, 20000);
    return () => clearInterval(t);
  }, [fetchPolls]);

  return (
    <div className="mt-20 mx-auto w-full max-w-3xl lg:max-w-4xl px-3 sm:px-4 h-[calc(100vh-5rem)] flex flex-col bg-gray-50">
      <Navbar />
      {/* Top bar: title + members (avatars only) */}
      <div className="relative z-40 mb-4 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-200 backdrop-blur">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center">
          {/* Title (same look, now visible) */}
          <h2
            className="inline-block whitespace-nowrap rounded-xl
                   bg-orange-300 px-4 py-2 text-2xl sm:text-3xl lg:text-4xl 
                   font-extrabold text-slate-900 shadow-sm"
          >
            Trip Planner Chat
          </h2>

          {/* Avatars + View all */}
          <div className="flex items-center gap-3">
            {/* Avatars */}
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m) => (
                <div
                  key={m.userID}
                  title={m.name}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full 
                       border border-white bg-slate-200 text-[12px] font-semibold 
                       text-slate-700 shadow-sm"
                >
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    initials(m.name)
                  )}
                </div>
              ))}
              {members.length > 3 && (
                <div
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full 
                          border border-white bg-slate-100 text-[12px] font-semibold 
                          text-slate-600 shadow-sm"
                >
                  +{members.length - 3}
                </div>
              )}
            </div>

            {/* View all */}
            <details className="relative">
              <summary
                className="list-none cursor-pointer select-none rounded-md px-2 py-1 
                            text-m font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
              >
                ▸ View all
              </summary>
              <div
                className="absolute right-0 z-50 mt-2 max-h-72 w-64 overflow-auto 
                        rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
              >
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  Members ({members.length})
                </div>
                <ul className="space-y-1">
                  {members.map((m) => (
                    <li
                      key={m.userID}
                      className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50"
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center overflow-hidden 
                                rounded-full bg-slate-200 text-[12px] font-semibold text-slate-700"
                      >
                        {m.avatar ? (
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          initials(m.name)
                        )}
                      </div>
                      <div className="truncate text-sm text-slate-800">
                        {m.name}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
      {/* Actions: responsive & touch-friendly */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <button
          onClick={() => setShowExperiencePanel(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-blue-700 rounded-lg 
         shadow-sm transition-all duration-200 hover:text-white hover:bg-amber-500 hover:shadow-md"
        >
          <span className="text-lg">📝</span>
          <span className="text-sm font-medium">View Tips</span>
        </button>

        <button
          onClick={() => setShowPollModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg 
       shadow-sm transition-all duration-200 hover:text-white hover:bg-indigo-500 hover:shadow-md"
        >
          📊 <span className="text-sm font-medium">Create Poll</span>
        </button>

        <button
          onClick={() => setShowLeaveDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg 
       shadow-sm transition-all duration-200 hover:bg-red-600 hover:shadow-md"
        >
          🚪 Leave Chat
        </button>
      </div>
      {/* Polls (collapsible) */}
      {(polls?.length ?? 0) > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPolls((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2 
                 rounded-lg bg-indigo-100 text-indigo-800 hover:bg-indigo-200 
                 transition-colors"
            aria-expanded={showPolls}
            aria-controls="polls-panel"
          >
            <span className="flex items-center gap-2">
              📊 <span className="font-medium">Polls</span>
              <span className="ml-2 text-xs rounded-full bg-white/70 px-2 py-0.5">
                {polls.length}
              </span>
            </span>
            <span className="text-sm">{showPolls ? "▲" : "▼"}</span>
          </button>

          <div
            id="polls-panel"
            className={`overflow-hidden transition-[max-height] duration-300 ease-in-out 
                  ${showPolls ? "max-h-96" : "max-h-0"}`}
          >
            <div className="mt-2 space-y-3 p-1 overflow-y-auto max-h-80 rounded-lg">
              {polls.map((p) => (
                <PollCard
                  key={p._id}
                  poll={{
                    _id: p._id,
                    question: p.question,
                    is_open: p.status !== "closed",
                    options: p.options.map((o) => ({
                      _id: o._id || o.id || o.option_id,
                      text: o.text,
                      votes: o.votes,
                    })),
                    total_votes: p.options.reduce(
                      (a, b) => a + (b.votes || 0),
                      0
                    ),
                  }}
                  myVotes={p.myVotes || []}
                  onVote={async (option_id) => {
                    try {
                      const res = await fetch(
                        `${serverUrl}/polls/${p._id}/vote`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ user_id, option_id }),
                        }
                      );
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(
                          err.detail || `Vote failed (${res.status})`
                        );
                      }
                      fetchPolls();
                    } catch (e) {
                      console.error(e);
                      toast.error(e.message || "Something went wrong");
                    }
                  }}
                  onClose={async () => {
                    try {
                      await fetch(
                        `${serverUrl}/polls/${p._id}/close?user_id=${user_id}`,
                        { method: "POST" }
                      );
                      fetchPolls();
                    } catch (e) {
                      console.error(e);
                      toast.error(
                        "Couldn’t report this message. Please try again."
                      );
                    }
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto border p-3 sm:p-4 rounded-xl mb-4 bg-white">
        {typingUser && (
          <div className="text-sm italic text-gray-500 mb-2">
            {typingUser} is typing...
          </div>
        )}
        {messages.map((msg, i) => {
          const currentDateLabel = formatDateHeader(msg.timestamp);
          const showDateHeader = currentDateLabel !== lastDateLabel;
          lastDateLabel = currentDateLabel;

          return (
            <React.Fragment key={i}>
              {showDateHeader && (
                <div className="text-center text-xs font-semibold text-gray-500 my-4">
                  <span className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                    {currentDateLabel}
                  </span>
                </div>
              )}

              <div
                className={`mb-3 flex ${
                  msg.user_id === user_id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`relative group max-w-[88%] sm:max-w-[78%] p-3 rounded-xl shadow text-sm whitespace-pre-wrap break-words ${
                    msg.user_id === user_id
                      ? "bg-orange-300 text-black"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <div className="font-medium mb-1">{msg.username}</div>
                  {msg.media_type && msg.media_id ? (
                    msg.media_type === "image" ? (
                      <img
                        src={`${serverUrl}/file/${msg.media_id}`}
                        alt="uploaded"
                        className="rounded mt-2 max-h-60 object-cover"
                      />
                    ) : msg.media_type === "video" ? (
                      <video
                        controls
                        src={`${serverUrl}/file/${msg.media_id}`}
                        className="mt-2 rounded w-full max-h-60"
                      />
                    ) : msg.media_type === "audio" ? (
                      <audio
                        controls
                        src={`${serverUrl}/file/${msg.media_id}`}
                        className="mt-2 w-full"
                      />
                    ) : (
                      <a
                        href={`${serverUrl}/file/${msg.media_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        📎 Download {msg.filename || "file"}
                      </a>
                    )
                  ) : (
                    <div>{msg.message}</div>
                  )}
                  <div className="text-xs text-right mt-1 text-black-300">
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  <div className="absolute -top-4 right-2 hidden group-hover:flex gap-1 text-lg">
                    {["❤️", "😂", "👍"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(i, emoji)}
                        className="hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}

                    {/* 🌍 Translate (open modal) */}
                    {msg.message && (
                      <button
                        title="Translate"
                        onClick={() => openTranslate(msg)}
                        className="text-xs px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200"
                      >
                        🌍
                      </button>
                    )}

                    {msg.user_id !== user_id && (
                      <button
                        title="Report message"
                        onClick={() => reportMessage(msg)}
                        className={`text-xs px-2 py-0.5 rounded border
        ${
          reportedRef.current.has(msg._id)
            ? "bg-rose-50 border-rose-200 text-rose-400 cursor-not-allowed"
            : "bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200"
        }`}
                      >
                        🚩
                      </button>
                    )}
                  </div>

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Array.from(
                        new Set(msg.reactions.map((r) => r.emoji))
                      ).map((emoji) => {
                        const count = msg.reactions.filter(
                          (r) => r.emoji === emoji
                        ).length;
                        return (
                          <span
                            key={emoji}
                            className={`text-sm px-2 py-0.5 rounded-full shadow border ${
                              msg.reactions.some(
                                (r) =>
                                  r.user_id === user_id && r.emoji === emoji
                              )
                                ? "bg-blue-100 border-blue-400 text-blue-700"
                                : "bg-white border-gray-300 text-gray-700"
                            }`}
                          >
                            {emoji} {count}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {uploading && (
          <p className="text-sm text-gray-500">Uploading file...</p>
        )}
        <div ref={bottomRef}></div>
      </div>

      <div className="relative flex items-center gap-2 sm:gap-3">
        <div ref={attachRef} className="relative">
          <button
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className="text-xl px-2"
            title="Attach"
          >
            📎
          </button>
          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 z-10 w-44 bg-white border rounded shadow-lg py-2 text-sm space-y-1 animate-fade-in">
              <button
                onClick={() => triggerFileInput("photo")}
                className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 w-full"
              >
                📷 <span>Photos & Videos</span>
              </button>
              <button
                onClick={() => triggerFileInput("document")}
                className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 w-full"
              >
                📄 <span>Document</span>
              </button>
              <button
                onClick={() => triggerFileInput("audio")}
                className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 w-full"
              >
                🎵 <span>Audio</span>
              </button>
              <button
                onClick={() => triggerFileInput("all")}
                className="flex items-center gap-2 px-4 py-1 hover:bg-gray-100 w-full"
              >
                📁 <span>Any File</span>
              </button>
            </div>
          )}
        </div>

        <div ref={emojiRef} className="relative">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-xl"
            title="Emoji"
          >
            😄
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 w-72 rounded-xl shadow-lg border border-gray-200 bg-white">
              <EmojiPicker
                emojiStyle={EmojiStyle.APPLE}
                height={320}
                width="100%"
                searchDisabled={false}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={true}
                onEmojiClick={(emojiData) =>
                  setNewMessage((prev) => prev + emojiData.emoji)
                }
              />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={selectedFileType ? FILE_TYPES[selectedFileType] : undefined}
          className="hidden"
          onChange={handleFileUpload}
        />

        <input
          type="text"
          placeholder="Type your message..."
          className="min-w-0 flex-1 border px-3 py-2 rounded"
          value={newMessage}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          className="bg-amber-100 text-black px-4 py-2 rounded-lg 
               shadow-sm hover:bg-amber-500 hover:shadow-md"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
      {showExperiencePanel && (
        <ExperienceTipsModal
          tips={experienceTips}
          onClose={() => setShowExperiencePanel(false)}
        />
      )}

      <ConfirmDialog
        open={showLeaveDialog}
        title={uploading ? "Leave while uploading?" : "Leave this chat?"}
        message={
          uploading
            ? "A file is still uploading. If you leave now, the upload will be canceled."
            : "You’ll stop receiving messages and this group will be removed from your joined list."
        }
        confirmText={uploading ? "Leave anyway" : "Leave"}
        cancelText="Stay"
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={async () => {
          setShowLeaveDialog(false); // close immediately
          try {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "leave", user_id, username }));
            }
            if (group_id && user_id) {
              await fetch(`${serverUrl}/groups/leave/${group_id}/${user_id}`, {
                method: "POST",
              });
            }
          } catch (e) {
            console.warn("Leave flow error:", e);
            alert("Couldn’t leave the chat. Please try again.");
            return;
          } finally {
            ws?.close();
            localStorage.removeItem("group_id");
            window.history.back(); // or use useNavigate if you prefer
          }
        }}
      />
      <TranslateModal
        open={translateOpen}
        onClose={() => setTranslateOpen(false)}
        serverUrl={serverUrl}
        messageId={translateMsg?._id} // not shown to the user; just used in API call
        originalText={translateMsg?.message}
      />
      {showPollModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl">
            <div className="text-lg font-semibold mb-2">Create Poll</div>
            <PollCreator
              group_id={group_id}
              user_id={user_id}
              onClose={() => setShowPollModal(false)}
              onCreated={() => {
                setShowPollModal(false);
                fetchPolls();
              }}
            />
          </div>
        </div>
      )}
      <br></br>
    </div>
  );
}
