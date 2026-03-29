"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bot, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getSiteContact } from "@/lib/site-contact";

interface Message {
  role: "user" | "model";
  text: string;
}

const menuVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
    }
  },
  exit: { 
    opacity: 0, 
    y: 15, 
    transition: { 
      staggerChildren: 0.05, 
      staggerDirection: -1 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, x: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    x: 0, 
    transition: { type: "spring" as const, stiffness: 400, damping: 25 } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    x: 20, 
    transition: { duration: 0.15 } 
  }
};

export default function ChatBot({
  settings = {},
  content,
}: {
  settings?: Record<string, string>;
  content?: {
    whatsappLabel?: string;
    assistantLabel?: string;
    headerTitle?: string;
    welcomeMessage?: string;
    inputPlaceholder?: string;
    typingLabel?: string;
    errorPrefix?: string;
    connectionErrorMessage?: string;
  };
}) {
  const { whatsapp } = getSiteContact(settings);
  const whatsappLabel = content?.whatsappLabel || "WhatsApp";
  const assistantLabel = content?.assistantLabel || "AI Assistant";
  const headerTitle = content?.headerTitle || "TaxFiling24 Assistant";
  const welcomeMessage =
    content?.welcomeMessage || "Hello! I am your TaxFiling24 assistant. How can I help you today?";
  const inputPlaceholder = content?.inputPlaceholder || "Ask your question here...";
  const typingLabel = content?.typingLabel || "Typing...";
  const errorPrefix = content?.errorPrefix || "Error:";
  const connectionErrorMessage =
    content?.connectionErrorMessage || "Something went wrong. Please check your connection.";
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "model", text: welcomeMessage }]);
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

  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0]?.role === "model" ? [{ role: "model", text: welcomeMessage }] : prev
    );
  }, [welcomeMessage]);

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
        setMessages((prev) => [
          ...prev,
          { role: "model", text: `${errorPrefix} ${data.error || "Failed to get response"}` },
        ]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "model", text: connectionErrorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Speed Dial Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded Options */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-end gap-3"
            >
              {/* WhatsApp Option */}
              <motion.div variants={itemVariants} className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs font-bold text-[var(--fg-muted)] shadow-[var(--shadow-sm)] border border-[var(--border)] backdrop-blur-md">
                  {whatsappLabel}
                </span>
                <motion.a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-md)] overflow-hidden"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Chat on WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-5 w-5" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                </motion.a>
              </motion.div>

              {/* AI Chat Option */}
              <motion.div variants={itemVariants} className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs font-bold text-[var(--fg-muted)] shadow-[var(--shadow-sm)] border border-[var(--border)] backdrop-blur-md">
                  {assistantLabel}
                </span>
                <motion.button
                  onClick={() => {
                    setIsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[var(--shadow-md)]"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Open AI Chat"
                >
                  <Bot className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Trigger Button */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-lg)] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 border-4 border-double border-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Contact Menu"
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
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
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[500px] max-h-[70vh] flex flex-col rounded-2xl border border-[var(--border)] bg-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-[var(--primary)] p-4 text-white">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="font-semibold">{headerTitle}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user" ? "bg-[var(--primary)] text-white rounded-br-none" : "bg-white text-gray-800 border border-[var(--border)] rounded-bl-none shadow-sm"
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
                  <div className="flex items-center gap-2 max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-white text-gray-800 border border-[var(--border)] rounded-bl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
                    <span className="text-gray-400">{typingLabel}</span>
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex items-center gap-2 bg-white">
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-gray-50 bg-white text-gray-800"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

