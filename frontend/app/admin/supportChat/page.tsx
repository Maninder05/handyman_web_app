"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Filter, User, Clock, CheckCircle, XCircle, MessageSquare, Loader2, Headphones, ArrowLeft } from "lucide-react";
import Link from "next/link";
import socket from "../../lib/socket";

const EXPRESS_BASE_URL = "http://localhost:7000";

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
  userEmail: string;
  userType: "customer" | "handyman";
  subject: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed";
  assignedTo?: string;
  assignedAgentName?: string;
  priority: "low" | "normal" | "high" | "urgent";
  messages: Message[];
  lastMessageAt: Date;
  createdAt: Date;
}

export default function AdminSupportChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("active"); // Default to active (excludes resolved/closed)
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Join admin support room immediately
    socket.emit("join_admin_support");
    
    fetchConversations();
    setupSocketListeners();

    return () => {
      socket.off("support_message");
      socket.off("new_support_message");
      socket.off("conversation_updated");
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit("join_support_room", { conversationId: selectedConversation._id });
      socket.emit("join_admin_support");
      console.log("Admin joined support room:", selectedConversation._id);
      
      // Re-setup listeners for this conversation
      setupSocketListeners();
      
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages, isTyping]);

  const setupSocketListeners = () => {
    // Remove existing listeners to avoid duplicates
    socket.off("support_message");
    socket.off("new_support_message");
    socket.off("conversation_updated");
    
    socket.on("support_message", (data: { conversationId: string; message: Message }) => {
      console.log("Admin received support_message:", data, "Selected:", selectedConversation?._id);
      
      // Hide typing indicator when message arrives
      setIsTyping(false);
      
      // Update selected conversation if it matches
      setSelectedConversation(prev => {
        if (prev?._id === data.conversationId) {
          // Check if message already exists (check by _id or by message content + senderId + timestamp)
          const messageExists = prev.messages.some(m => {
            if (m._id && data.message._id) {
              return m._id.toString() === data.message._id.toString();
            }
            // Fallback: check by content, sender, and approximate timestamp (within 5 seconds)
            return (
              m.message === data.message.message &&
              m.senderId?.toString() === data.message.senderId?.toString() &&
              Math.abs(new Date(m.timestamp).getTime() - new Date(data.message.timestamp).getTime()) < 5000
            );
          });
          
          if (messageExists) {
            // Update the existing message if needed (in case _id was assigned later)
            return {
              ...prev,
              messages: prev.messages.map(m => {
                if (!m._id && data.message._id && 
                    m.message === data.message.message &&
                    m.senderId?.toString() === data.message.senderId?.toString()) {
                  return data.message;
                }
                return m;
              }),
              lastMessageAt: new Date()
            };
          }
          
          console.log("Admin: Adding new message via socket:", data.message);
          return {
            ...prev,
            messages: [...prev.messages, data.message],
            lastMessageAt: new Date()
          };
        }
        return prev;
      });
      
      // Refresh conversations list to update unread counts
      fetchConversations();
    });
    
    // Listen for typing indicators
    socket.on("typing", (data: { conversationId: string; isTyping: boolean; senderType: string }) => {
      console.log("Admin received typing event:", data);
      if (selectedConversation?._id === data.conversationId && data.senderType !== "admin" && data.senderType !== "agent") {
        setIsTyping(data.isTyping);
        if (data.isTyping && typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            console.log("Admin typing indicator timeout - hiding");
          }, 3000);
        } else {
          setIsTyping(false);
        }
      }
    });

    socket.on("new_support_message", (data) => {
      console.log("New support message received:", data);
      fetchConversations();
    });

    socket.on("conversation_updated", (data: { conversation: Conversation }) => {
      setConversations(prev => prev.map(c => 
        c._id === data.conversation._id ? data.conversation : c
      ));
      setSelectedConversation(prev => {
        if (prev?._id === data.conversation._id) {
          return data.conversation;
        }
        return prev;
      });
    });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in as admin");
        return;
      }

      let url = `${EXPRESS_BASE_URL}/api/support/admin/conversations`;
      
      // Filter logic: "active" means exclude resolved/closed
      if (filterStatus === "active") {
        // We'll filter on frontend to exclude resolved/closed
        url = `${EXPRESS_BASE_URL}/api/support/admin/conversations`;
      } else if (filterStatus !== "all") {
        url = `${EXPRESS_BASE_URL}/api/support/admin/conversations?status=${filterStatus}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        if (res.status === 403) {
          alert(`Admin access required. ${errorData.error || "You don't have permission to access this page."}`);
          return;
        }
        if (res.status === 401) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/signup?mode=login";
          return;
        }
        throw new Error(errorData.error || "Failed to fetch conversations");
      }

      const data = await res.json();
      console.log("Fetched conversations:", data);
      
      // Filter out resolved/closed if filterStatus is "active"
      let filtered = data.conversations || [];
      if (filterStatus === "active") {
        filtered = filtered.filter((conv: Conversation) => 
          conv.status !== "resolved" && conv.status !== "closed"
        );
      }
      
      setConversations(filtered);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      alert(`Failed to load conversations: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Admin: Fetched conversation:", data.conversation._id, "Messages count:", data.conversation.messages?.length);
        if (data.conversation.messages && Array.isArray(data.conversation.messages)) {
          const messagesSummary = (data.conversation.messages as Message[]).map((m) => ({ 
            senderType: m.senderType, 
            senderName: m.senderName, 
            message: (m.message || "").substring(0, 50)
          }));
          console.log("Admin: Messages:", messagesSummary);
        }
        setSelectedConversation(data.conversation);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error fetching conversation:", errorData);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Emit typing indicator
    if (selectedConversation?._id) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        isTyping: e.target.value.trim().length > 0,
        senderType: "admin"
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing indicator after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          conversationId: selectedConversation._id,
          isTyping: false,
          senderType: "admin"
        });
      }, 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation || isSending) return;

    const messageText = message.trim();
    setMessage("");
    setIsSending(true);
    
    // Stop typing indicator
    if (selectedConversation?._id) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        isTyping: false,
        senderType: "admin"
      });
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${EXPRESS_BASE_URL}/api/support/conversations/${selectedConversation._id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: messageText })
        }
      );

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      
      // Merge messages properly to avoid losing any messages
      setSelectedConversation(prev => {
        if (!prev || prev._id !== data.conversation._id) {
          return data.conversation;
        }
        // Merge messages, avoiding duplicates
        const existingMessageIds = new Set(prev.messages.map((m: Message) => m._id?.toString()));
        const newMessages = (data.conversation.messages as Message[]).filter(
          (m: Message) => !existingMessageIds.has(m._id?.toString())
        );
        return {
          ...data.conversation,
          messages: [...prev.messages, ...newMessages]
        };
      });
      
      // Socket event is now emitted by the backend, no need to emit from frontend
      // The socket listener will automatically update the conversation

      // Refresh conversations list
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
      setMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedConversation) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${EXPRESS_BASE_URL}/api/support/admin/conversations/${selectedConversation._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
        fetchConversations();
        
        // If marked as resolved or closed, show success message
        if (status === "resolved" || status === "closed") {
          alert(`Conversation ${status === "resolved" ? "marked as resolved" : "ended"}. It will no longer appear in your active inbox.`);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update conversation status");
    }
  };

  const handleEndChat = async () => {
    if (!selectedConversation) return;
    
    const confirmEnd = window.confirm("Are you sure you want to end this chat? The conversation will be closed and removed from active inbox.");
    if (!confirmEnd) return;
    
    await handleUpdateStatus("closed");
  };

  const handleAssignToMe = async () => {
    if (!selectedConversation) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get current user ID from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;

      const res = await fetch(
        `${EXPRESS_BASE_URL}/api/support/admin/conversations/${selectedConversation._id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ assignedTo: userId, status: "assigned" })
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSelectedConversation(data.conversation);
        fetchConversations();
      }
    } catch (error) {
      console.error("Error assigning conversation:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { text: "Open", color: "bg-yellow-100 text-yellow-700" },
      assigned: { text: "Assigned", color: "bg-blue-100 text-blue-700" },
      in_progress: { text: "In Progress", color: "bg-purple-100 text-purple-700" },
      resolved: { text: "Resolved", color: "bg-green-100 text-green-700" },
      closed: { text: "Closed", color: "bg-gray-100 text-gray-700" }
    };
    const config = configs[status as keyof typeof configs] || configs.open;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      low: { text: "Low", color: "bg-gray-100 text-gray-700" },
      normal: { text: "Normal", color: "bg-blue-100 text-blue-700" },
      high: { text: "High", color: "bg-orange-100 text-orange-700" },
      urgent: { text: "Urgent", color: "bg-red-100 text-red-700" }
    };
    const config = configs[priority as keyof typeof configs] || configs.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === "" || 
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = conversations.filter(c => 
    c.messages.some(m => !m.read && m.senderType !== "admin" && m.senderType !== "agent")
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A574]" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin" 
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Back to admin dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#5C4033]">Admin Support Center</h1>
            <p className="text-sm text-gray-600">Manage and respond to customer support conversations</p>
          </div>
        </div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-[#D4A574] text-[#5C4033] rounded-lg font-semibold hover:bg-[#C4956A] transition flex items-center gap-2"
        >
          <Loader2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 2-Column Layout - Always visible, never collapses */}
      <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Left Column - Conversations List - Always visible, fixed width */}
        <div className="w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-[#FFF8F2]">
            <h2 className="text-lg font-bold text-[#5C4033] mb-2">Support Conversations</h2>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-[#5C4033]" />
              <span className="text-sm text-[#5C4033]/80">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {unreadCount} new
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["active", "all", "open", "assigned", "in_progress", "resolved", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    fetchConversations();
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    filterStatus === status
                      ? "bg-[#D4A574] text-[#5C4033]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "all" ? "All" : status === "active" ? "Active" : status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const lastMessage = conv.messages[conv.messages.length - 1];
                const hasUnread = conv.messages.some(
                  m => !m.read && m.senderType !== "admin" && m.senderType !== "agent"
                );

                return (
                  <div
                    key={conv._id}
                    onClick={() => fetchConversation(conv._id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                      selectedConversation?._id === conv._id ? "bg-[#FFF8F2] border-l-4 border-l-[#D4A574]" : ""
                    } ${hasUnread ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{conv.userName}</span>
                          {hasUnread && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.userEmail}</p>
                      </div>
                      {getStatusBadge(conv.status)}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">{conv.subject}</p>
                    {lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {lastMessage.senderName}: {lastMessage.message}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(conv.lastMessageAt).toLocaleString()}
                      </span>
                      {getPriorityBadge(conv.priority)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Main Chat Area - Always visible, takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedConversation.userName}</h2>
                  <p className="text-sm text-gray-600">{selectedConversation.userEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedConversation.status)}
                  {getPriorityBadge(selectedConversation.priority)}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {selectedConversation.status === "open" && (
                  <button
                    onClick={handleAssignToMe}
                    className="px-4 py-2 bg-[#D4A574] text-[#5C4033] rounded-lg font-semibold hover:bg-[#C4956A] transition text-sm"
                  >
                    Assign to Me
                  </button>
                )}
                <select
                  value={selectedConversation.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574] text-sm"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Mark as Resolved</option>
                  <option value="closed">End Chat</option>
                </select>
                {(selectedConversation.status === "open" || selectedConversation.status === "assigned" || selectedConversation.status === "in_progress") && (
                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition text-sm"
                  >
                    Mark as Resolved
                  </button>
                )}
                {(selectedConversation.status === "open" || selectedConversation.status === "assigned" || selectedConversation.status === "in_progress" || selectedConversation.status === "resolved") && (
                  <button
                    onClick={handleEndChat}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                  >
                    End Chat
                  </button>
                )}
                {selectedConversation.assignedAgentName && (
                  <span className="text-sm text-gray-600">
                    Assigned to: {selectedConversation.assignedAgentName}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {selectedConversation.messages.map((msg) => {
                const isAgent = msg.senderType === "agent" || msg.senderType === "admin";
                return (
                  <div
                    key={msg._id}
                    className={`flex gap-3 ${isAgent ? "justify-end" : "justify-start"}`}
                  >
                    {!isAgent && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isAgent
                          ? "bg-[#D4A574] text-[#5C4033] rounded-br-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-70">{msg.senderName}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                    </div>
                    {isAgent && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#5C4033] flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
            <div className="bg-white border-t border-gray-200 p-4">
              {(selectedConversation.status === "resolved" || selectedConversation.status === "closed") ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 font-semibold">
                    {selectedConversation.status === "closed" 
                      ? "This chat has been ended." 
                      : "This conversation has been marked as resolved."}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedConversation.status === "closed" 
                      ? "The conversation is closed and archived." 
                      : "The conversation is resolved and archived."}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A574]"
                    disabled={isSending || (selectedConversation.status as string) === "resolved" || (selectedConversation.status as string) === "closed"}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending || (selectedConversation.status as string) === "resolved" || (selectedConversation.status as string) === "closed"}
                    className="px-6 py-3 bg-[#D4A574] text-[#5C4033] rounded-lg font-semibold hover:bg-[#C4956A] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

