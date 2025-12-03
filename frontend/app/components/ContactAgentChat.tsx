"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, X, Minimize2, Maximize2, User, Loader2, Headphones, Clock, CheckCircle } from "lucide-react";
import socket from "../lib/socket";

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderType: "customer" | "handyman" | "agent" | "admin";
  message: string;
  read: boolean;
  timestamp: Date;
}

interface Conversation {
  _id: string;
  userId: string;
  userName: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  assignedAgentName?: string;
  messages: Message[];
  lastMessageAt: Date;
}

interface ContactAgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: "customer" | "handyman" | null;
  userId?: string;
  onChatEnded?: () => void;
}

const EXPRESS_BASE_URL = "http://localhost:7000";

export default function ContactAgentChat({ isOpen, onClose, userType, userId: propUserId, onChatEnded }: ContactAgentChatProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extract userId from token if not provided
  const getUserId = (): string | null => {
    if (propUserId) return propUserId;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || null;
      }
    } catch (e) {
      console.error("Error extracting user ID from token:", e);
    }
    return null;
  };

  const userId = getUserId();

  useEffect(() => {
    if (isOpen && userId) {
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }
      loadOrCreateConversation();
    }

    return () => {
      socket.off("support_message");
      socket.off("conversation_updated");
      socket.off("typing");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, userId]);

  // Setup socket listeners when conversation is loaded
  useEffect(() => {
    if (conversation?._id) {
      setupSocketListeners();
      // Join the support room for this conversation
      socket.emit("join_support_room", { conversationId: conversation._id });
      console.log("Joined support room:", conversation._id);
      
      // Check if conversation is already closed when loaded
      if (conversation.status === "closed" && onChatEnded) {
        setTimeout(() => {
          onChatEnded();
        }, 4000); // Give user 4 seconds to read the message
      }
    }
  }, [conversation?._id, conversation?.status]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const setupSocketListeners = () => {
    // Remove existing listeners to avoid duplicates
    socket.off("support_message");
    socket.off("conversation_updated");
    socket.off("typing");
    
    socket.on("support_message", (data: { conversationId: string; message: Message }) => {
      console.log("Client received support_message:", data, "Current conversation:", conversation?._id);
      // Hide typing indicator when message arrives
      setIsTyping(false);
      
      // Use the current conversation ID from state
      setConversation(prev => {
        if (!prev || prev._id !== data.conversationId) {
          return prev;
        }
        
        // Check if message already exists to avoid duplicates
        const messageExists = prev.messages.some(m => 
          m._id === data.message._id || 
          (m._id?.toString().startsWith('temp-') && m.message === data.message.message)
        );
        
        if (messageExists) {
          // Replace temp message with real one
          return {
            ...prev,
            messages: prev.messages.map(m => 
              (m._id?.toString().startsWith('temp-') && m.message === data.message.message) 
                ? data.message 
                : m
            ).filter((m, idx, arr) => 
              // Remove duplicates
              arr.findIndex(msg => msg._id === m._id) === idx
            ),
            lastMessageAt: new Date()
          };
        }
        
        return {
          ...prev,
          messages: [...prev.messages, data.message],
          lastMessageAt: new Date()
        };
      });
    });
    
    // Listen for typing indicators
    socket.on("typing", (data: { conversationId: string; isTyping: boolean; senderType: string }) => {
      if (conversation?._id === data.conversationId && data.senderType !== (userType === "handyman" ? "handyman" : "customer")) {
        setIsTyping(data.isTyping);
        if (data.isTyping && typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    socket.on("conversation_updated", (data: { conversation: Conversation }) => {
      setConversation(prev => {
        if (prev?._id === data.conversation._id) {
          // If chat was closed, trigger the callback
          if (data.conversation.status === "closed" && prev?.status !== "closed") {
            setTimeout(() => {
              if (onChatEnded) {
                onChatEnded();
              }
            }, 3000); // Give user 3 seconds to read the message
          }
          return data.conversation;
        }
        return prev;
      });
    });
  };

  const loadOrCreateConversation = async () => {
    setLoadingConversation(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Try to get existing conversations
      const res = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversations && data.conversations.length > 0) {
          // Only load open/active conversations (exclude resolved/closed)
          const openConv = data.conversations.find((c: Conversation) => 
            ["open", "assigned", "in_progress"].includes(c.status)
          );

          if (openConv) {
            // Fetch full conversation details
            const convRes = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations/${openConv._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (convRes.ok) {
              const convData = await convRes.json();
              // Double check it's still active
              if (["open", "assigned", "in_progress"].includes(convData.conversation.status)) {
                setConversation(convData.conversation);
                // Join socket room
                socket.emit("join_support_room", { conversationId: openConv._id });
                setLoadingConversation(false);
                return;
              }
            }
          }
          // If no active conversation found, create a new one
        }
      }

      // No active conversation exists, create one
      createNewConversation();
    } catch (error) {
      console.error("Error loading conversation:", error);
      createNewConversation();
    } finally {
      setLoadingConversation(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subject: "Support Request",
          initialMessage: "Hello, I need assistance."
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Conversation created:", data.conversation);
        setConversation(data.conversation);
        socket.emit("join_support_room", { conversationId: data.conversation._id });
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create conversation:", errorData);
        alert(`Failed to create conversation: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Emit typing indicator
    if (conversation?._id) {
      socket.emit("typing", {
        conversationId: conversation._id,
        isTyping: e.target.value.trim().length > 0,
        senderType: userType === "handyman" ? "handyman" : "customer"
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          conversationId: conversation._id,
          isTyping: false,
          senderType: userType === "handyman" ? "handyman" : "customer"
        });
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !conversation) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);
    
    // Stop typing indicator
    if (conversation?._id) {
      socket.emit("typing", {
        conversationId: conversation._id,
        isTyping: false,
        senderType: userType === "handyman" ? "handyman" : "customer"
      });
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Optimistically add message
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        senderId: userId || "",
        senderName: "You",
        senderType: userType === "handyman" ? "handyman" : "customer",
        message: messageText,
        read: false,
        timestamp: new Date()
      };

      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage]
        };
      });

      const res = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations/${conversation._id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: messageText })
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      setConversation(data.conversation);
      
      // Socket event is now emitted by the backend, no need to emit from frontend
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(m => !m._id.startsWith("temp-"))
        };
      });
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { text: "Waiting for agent", color: "bg-yellow-100 text-yellow-700" },
      assigned: { text: "Agent assigned", color: "bg-blue-100 text-blue-700" },
      in_progress: { text: "In progress", color: "bg-purple-100 text-purple-700" },
      resolved: { text: "Resolved", color: "bg-green-100 text-green-700" },
      closed: { text: "Closed", color: "bg-gray-100 text-gray-700" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="mb-4 mr-4 px-6 py-3 bg-[#D4A574] text-[#5C4033] rounded-t-xl rounded-l-xl shadow-2xl font-semibold hover:bg-[#C4956A] transition flex items-center gap-2"
        >
          <Maximize2 className="w-5 h-5" />
          <span>Open Agent Chat</span>
        </button>
      ) : (
        <div className="mb-4 mr-4 w-96 h-[600px] bg-white rounded-t-xl rounded-l-xl shadow-2xl flex flex-col border-2 border-[#EED9C4] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D4A574] to-[#C4956A] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Headphones className="w-6 h-6 text-[#5C4033]" />
              </div>
              <div>
                <h3 className="font-bold text-[#5C4033] text-lg">Contact Agent</h3>
                <p className="text-xs text-[#5C4033]/80">
                  {loadingConversation ? "Loading..." : conversation?.assignedAgentName || "Waiting for agent"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Minimize"
              >
                <Minimize2 className="w-5 h-5 text-[#5C4033]" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#5C4033]" />
              </button>
            </div>
          </div>

          {/* Status Banner */}
          {conversation && (
            <div className={`px-4 py-2 border-b border-[#EED9C4] flex items-center justify-between ${
              conversation.status === "closed" ? "bg-red-50" : conversation.status === "resolved" ? "bg-green-50" : "bg-[#FFF8F2]"
            }`}>
              {getStatusBadge(conversation.status)}
              {conversation.assignedAgentName && conversation.status !== "closed" && (
                <span className="text-xs text-[#5C4033]/70">
                  Agent: {conversation.assignedAgentName}
                </span>
              )}
              {conversation.status === "closed" && (
                <span className="text-xs text-red-600 font-semibold animate-pulse">
                  Chat Ended by Support Agent
                </span>
              )}
              {conversation.status === "resolved" && (
                <span className="text-xs text-green-600 font-semibold">
                  Resolved
                </span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFF8F2]">
            {loadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-[#D4A574] animate-spin" />
              </div>
            ) : !conversation ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Clock className="w-12 h-12 text-[#5C4033]/30 mx-auto mb-2" />
                  <p className="text-[#5C4033]/70">No conversation found</p>
                </div>
              </div>
            ) : conversation.messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Headphones className="w-12 h-12 text-[#5C4033]/30 mx-auto mb-2" />
                  <p className="text-[#5C4033]/70">Start the conversation below</p>
                </div>
              </div>
            ) : (
              conversation.messages.map((message) => {
                const isUser = message.senderType === (userType === "handyman" ? "handyman" : "customer");
                const isAgent = message.senderType === "agent" || message.senderType === "admin";

                return (
                  <div
                    key={message._id}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isAgent ? "bg-blue-500" : "bg-gray-400"
                      }`}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? "bg-[#D4A574] text-[#5C4033] rounded-br-sm"
                          : isAgent
                          ? "bg-blue-50 text-[#5C4033] border border-blue-200 rounded-bl-sm"
                          : "bg-white text-[#5C4033] border border-[#EED9C4] rounded-bl-sm"
                      }`}
                    >
                      {!isUser && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {isUser && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5C4033] flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="bg-blue-50 text-[#5C4033] border border-blue-200 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#5C4033] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-[#5C4033] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-[#5C4033] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            {isSending && (
              <div className="flex gap-3 justify-end">
                <div className="bg-[#D4A574] rounded-2xl rounded-br-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-[#5C4033] animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#EED9C4] p-4 bg-white">
            {(conversation?.status === "resolved" || conversation?.status === "closed") ? (
              <div className="text-center py-4 space-y-3">
                <div className="flex items-center justify-center mb-2">
                  {conversation.status === "closed" ? (
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                      <X className="w-6 h-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-[#5C4033] font-bold">
                  {conversation.status === "closed" 
                    ? "Chat Ended by Support Agent" 
                    : "Conversation Resolved"}
                </p>
                <p className="text-xs text-[#5C4033]/70">
                  {conversation.status === "closed"
                    ? "The support agent has ended this chat. You'll be returned to the AI assistant shortly..."
                    : "This conversation has been marked as resolved. You can start a new conversation if needed."}
                </p>
                {conversation.status === "closed" && (
                  <p className="text-xs text-[#5C4033]/50 mt-2 italic">
                    Returning to AI chatbot...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={conversation ? "Type your message..." : "Creating conversation..."}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#EED9C4] focus:outline-none focus:border-[#D4A574] text-[#5C4033] placeholder:text-[#5C4033]/50"
                  disabled={isSending || !conversation}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isSending || !conversation}
                  className="px-5 py-2.5 bg-[#D4A574] text-[#5C4033] rounded-xl font-semibold hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
            <p className="text-xs text-[#5C4033]/60 mt-2 text-center">
              Real human agents • Usually respond within minutes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

