import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

const ChatBot = ({ showChatBot, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [confirmedPlan, setConfirmedPlan] = useState(null);

    const chatbotRef = useRef(null);

    // Load messages based on confirmed plan or state
    useEffect(() => {
        if (!showChatBot) return;

        const savedPlan = localStorage.getItem("confirmedPlan");
        const triggeredWithoutConfirm = localStorage.getItem("chatTriggeredWithoutConfirm");

        if (savedPlan) {
            const plan = JSON.parse(savedPlan);
            setConfirmedPlan(plan);
            setMessages([
                {
                    sender: "bot",
                    text: `Thank you for selecting Trip Plan ${plan.planNumber}!`,
                },
                {
                    sender: "bot",
                    text: `Here’s how the system works: Based on your preferences and predicted budget, we've created the most optimized travel combo for you. 💼`,
                },
                {
                    sender: "bot",
                    text: `Are you satisfied with this plan? Feel free to share any thoughts or feedback!`,
                },
            ]);
        } else if (triggeredWithoutConfirm) {
            setMessages([
                {
                    sender: "bot",
                    text: `Hi there! You didn’t confirm a trip plan.`,
                },
                {
                    sender: "bot",
                    text: `Can I assist you in customizing one? You can ask for help combining Triplane 1 and 2, or tell me what you’re looking for!`,
                },
            ]);
        } else {
            setMessages([
                {
                    sender: "bot",
                    text: `Hi! How can I help you today? 😊`,
                },
            ]);
        }

        localStorage.removeItem("chatTriggeredWithoutConfirm");
    }, [showChatBot]);

    // API call to backend chatbot
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch("http://localhost:8000/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) throw new Error("Chatbot error");

            const data = await response.json();
            setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Sorry, something went wrong." },
            ]);
            console.error("Chatbot API error:", error);
        }

        setInput("");
    };

    if (!showChatBot) return null;

    const chatbotContent = (
        <div
            ref={chatbotRef}
            className="bg-white border border-gray-300 rounded-2xl shadow-xl flex flex-col w-full max-w-xs"
            style={{ height: "400px", display: "flex", flexDirection: "column" }}
        >
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 py-2 rounded-t-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <FaRobot />
                    <span>TripBot Assistant</span>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close chatbot"
                    className="hover:bg-blue-700 p-1 rounded"
                >
                    <IoClose size={24} />
                </button>
            </div>

            {/* Messages */}
            <div
                className="overflow-y-auto p-4 space-y-2 flex-grow"
                style={{ flexGrow: 1 }}
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`text-sm p-2 rounded-xl max-w-[85%] ${msg.sender === "bot"
                                ? "bg-gray-100 text-gray-800 self-start"
                                : "bg-blue-500 text-white self-end ml-auto"
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-2 border-t border-gray-300 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask anything..."
                    className="flex-1 text-sm px-3 py-2 border rounded-lg focus:outline-none"
                />
                <button
                    onClick={handleSend}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                >
                    <FaPaperPlane />
                </button>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div
            style={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 9999,
                width: 320,
                maxWidth: "90vw",
            }}
        >
            {chatbotContent}
        </div>,
        document.body
    );
};

export default ChatBot;


