"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Hello! I am your TaxFiling24 assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            text: msg.text
          }))
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: `Error: ${data.error || "Failed to get response"}` }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "model", text: "Something went wrong. Please check connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageSquare className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-24 z-50 w-[350px] sm:w-[400px] h-[500px] max-h-[70vh] flex flex-col rounded-2xl border border-blue-100 bg-white shadow-2xl overflow-hidden"

          >
            {/* Header */}
            <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="font-semibold">TaxFiling24 Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user" ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border border-blue-50 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({ ...props }) => <li className="mb-0" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-inherit" {...props} />,
                        h1: ({ ...props }) => <h1 className="text-lg font-bold mb-1 text-inherit" {...props} />,
                        h2: ({ ...props }) => <h2 className="text-md font-bold mb-1 text-inherit" {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                </div>
              ))}
              {isLoading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-white text-gray-800 border border-blue-50 rounded-bl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-gray-400">Typing...</span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex items-center gap-2 bg-white">
              <input
                type="text"
                placeholder="Ask representing a query..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white text-gray-800"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send Message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

