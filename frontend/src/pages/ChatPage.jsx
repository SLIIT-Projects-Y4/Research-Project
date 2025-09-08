// Enhancements: emoji click-outside, attach click-outside, reactions, upload progress
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import ExperienceTipsModal from "../models/ExperienceTipsModal.jsx";
import ConfirmDialog from "../models/ConfirmDialog.jsx";

const serverUrl = "http://localhost:8000";

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
  const user_id = localUser?.userID;
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

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const shouldScrollRef = useRef(false);

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

  useEffect(() => {
    if (!group_id || !user_id || !username) return;
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
      setMessages((prev) => [...prev, data]);
      if (data.group_name) setGroupName(data.group_name);
    };
    socket.onclose = () => console.warn("WebSocket disconnected");
    return () => socket.close();
  }, [group_id, user_id, username, groupName]);

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
      alert("❌ File too large (max 20MB)");
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

  return (
    <div className="mt-20 max-w-2xl mx-auto p-4 h-screen flex flex-col bg-gray-100">
      <h2
        className="text-2xl font-bold text-center 
               bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500
               text-white p-4 rounded-2xl shadow-lg mb-6 
               flex items-center justify-center gap-2 
               transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
      >
        <span className="text-2xl">✈️</span>
        Trip Planner Chat
      </h2>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowLeaveDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-lg 
             shadow-sm transition-all duration-200 hover:bg-red-600 hover:shadow-md"
        >
          🚪 Leave Chat
        </button>

        <button
          onClick={() => setShowExperiencePanel(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-blue-700 rounded-lg 
               shadow-sm transition-all duration-200 hover:text-white hover:bg-amber-500 hover:shadow-md"
        >
          <span className="text-lg">📝</span>
          <span className="text-sm font-medium">View Tips</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border p-4 rounded mb-4 bg-white">
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
                  className={`relative group max-w-[75%] p-3 rounded-xl shadow text-sm whitespace-pre-wrap break-words ${
                    msg.user_id === user_id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
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
                  <div className="text-xs text-right mt-1 text-gray-300">
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

      <div className="relative flex gap-2 items-center">
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
          className="flex-1 border px-3 py-2 rounded"
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
    </div>
  );
}
