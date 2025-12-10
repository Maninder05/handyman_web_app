"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Search, Filter, User, CheckCircle, XCircle, MessageSquare, Loader2, Headphones, ArrowLeft, Share2, Copy, Circle } from "lucide-react";
import Link from "next/link";
import socket from "../../lib/socket";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

const EXPRESS_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

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
  const [activeTab, setActiveTab] = useState<"inbox" | "resolved">("inbox"); // Default to inbox
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast, toastState, hideToast } = useToast();

  useEffect(() => {
    // Get current admin ID from token
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentAdminId(payload.id);
      }
    } catch (e) {
      console.error("Error extracting admin ID from token:", e);
    }

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
        window.location.href = "/admin/login";
        return;
      }

      // Always fetch all conversations, we'll filter on frontend
      const url = `${EXPRESS_BASE_URL}/api/support/admin/conversations`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        let errorText = "";
        let errorData: any = {};
        try {
          errorText = await res.text();
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError, "Response text:", errorText);
          errorData = { error: errorText || `Server error (${res.status}): ${res.statusText}` };
        }

        // Handle authentication errors - redirect to login
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          return;
        }
        throw new Error(errorData.error || errorData.details || errorData.message || `Failed to fetch conversations (${res.status})`);
      }

      const data = await res.json();
      console.log("Fetched conversations:", data);
      
      // Store all conversations, filtering will happen in filteredConversations
      setConversations(data.conversations || []);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching conversations:", error);
      showToast(`Failed to load conversations: ${errorMessage || "Unknown error. Please check the console for details."}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Debug: Log which admin user is fetching the conversation
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[ADMIN] Fetching conversation - Admin User ID:', payload.id, 'Conversation ID:', conversationId);
      } catch (e) {
        console.error('[ADMIN] Could not decode token:', e);
      }

      const res = await fetch(`${EXPRESS_BASE_URL}/api/support/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        let errorText = "";
        let errorData: any = {};
        try {
          errorText = await res.text();
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError, "Response text:", errorText);
          errorData = { error: errorText || `Server error (${res.status}): ${res.statusText}` };
        }
        
        // Handle authentication errors - redirect to login
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          return;
        }
        
        throw new Error(errorData.error || errorData.details || errorData.message || `Failed to fetch conversation (${res.status})`);
      }

      const data = await res.json();
      console.log("Admin: Fetched conversation:", data.conversation._id, "Messages count:", data.conversation.messages?.length);
      if (data.conversation.messages && Array.isArray(data.conversation.messages)) {
        const messagesSummary = (data.conversation.messages as Message[]).map((m) => ({ 
          _id: m._id,
          senderId: m.senderId,
          senderType: m.senderType, 
          senderName: m.senderName, 
          message: (m.message || "").substring(0, 50)
        }));
        console.log("Admin: Messages with senderType:", messagesSummary);
        // Verify senderTypes
        messagesSummary.forEach((msg, idx) => {
          if (!msg.senderType) {
            console.error(`Message ${idx} (${msg._id}) has no senderType!`, msg);
          }
        });
      }
      setSelectedConversation(data.conversation);
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

      if (!res.ok) {
        let errorText = "";
        let errorData: any = {};
        try {
          errorText = await res.text();
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError, "Response text:", errorText);
          errorData = { error: errorText || `Server error (${res.status}): ${res.statusText}` };
        }
        
        // Handle authentication errors - redirect to login
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          return;
        }
        
        throw new Error(errorData.error || errorData.details || errorData.message || `Failed to send message (${res.status})`);
      }

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
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error sending message:", error);
      showToast(`Failed to send message: ${errorMessage || "Unknown error. Please check the console for details."}`, "error");
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

      if (!res.ok) {
        // Handle authentication errors - redirect to login
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          return;
        }
        const errorData = await res.json().catch(() => ({ error: "Failed to update conversation status" }));
        throw new Error(errorData.error || "Failed to update conversation status");
      }

      const data = await res.json();
      setSelectedConversation(data.conversation);
      
      // Refresh conversations list to update the tabs
      await fetchConversations();
      
      // If marked as resolved or closed, switch to resolved tab and show success message
      if (status === "resolved" || status === "closed") {
        setActiveTab("resolved");
        showToast(`Conversation ${status === "resolved" ? "marked as resolved" : "ended"}. It will no longer appear in your active inbox.`, "success");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Failed to update conversation status", "error");
    }
  };

  const handleEndChat = async () => {
    if (!selectedConversation) return;
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

      if (!res.ok) {
        // Handle authentication errors - redirect to login
        if (res.status === 401 || res.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/admin/login";
          return;
        }
        const errorData = await res.json().catch(() => ({ error: "Failed to assign conversation" }));
        throw new Error(errorData.error || "Failed to assign conversation");
      }

      const data = await res.json();
      setSelectedConversation(data.conversation);
      fetchConversations();
      showToast("Conversation assigned to you", "success");
    } catch (error) {
      console.error("Error assigning conversation:", error);
      showToast(`Failed to assign conversation: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
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
      open: { text: "Open", color: "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-300" },
      assigned: { text: "Assigned", color: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-300" },
      in_progress: { text: "In Progress", color: "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-300" },
      resolved: { text: "Resolved", color: "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-300" },
      closed: { text: "Closed", color: "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-300" }
    };
    const config = configs[status as keyof typeof configs] || configs.open;
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      low: { text: "Low", color: "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-300" },
      normal: { text: "Normal", color: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-300" },
      high: { text: "High", color: "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-300" },
      urgent: { text: "Urgent", color: "bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-300" }
    };
    const config = configs[priority as keyof typeof configs] || configs.normal;
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const filteredConversations = conversations.filter(conv => {
    // Filter by tab (inbox vs resolved)
    const isResolved = conv.status === "resolved" || conv.status === "closed";
    const matchesTab = activeTab === "inbox" ? !isResolved : isResolved;
    
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
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

  const getStatusDot = (status: string) => {
    const configs: Record<string, string> = {
      open: "bg-yellow-500",
      waiting: "bg-red-500",
      assigned: "bg-blue-500",
      active: "bg-green-500",
      in_progress: "bg-green-500",
      inactive: "bg-orange-500",
      resolved: "bg-gray-400",
      closed: "bg-gray-400"
    };
    return configs[status] || "bg-gray-400";
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };


  return (
    <>
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        onClose={hideToast}
      />
      <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* 2-Column Layout - Always visible, never collapses */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Column - Conversations List - Professional Design */}
        <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Header - Clean and Simple */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <Link 
                href="/admin" 
                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </Link>
              <Link
                href="/admin/profile"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Profile
              </Link>
            </div>
            <h2 className="text-base font-semibold text-gray-900">My Chats</h2>
          </div>

          {/* Tabs - Inbox and Resolved */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "inbox"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Inbox ({conversations.filter(c => c.status !== "resolved" && c.status !== "closed").length})
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "resolved"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Resolved ({conversations.filter(c => c.status === "resolved" || c.status === "closed").length})
            </button>
          </div>

          {/* Search - Simple */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-400 bg-gray-50 text-gray-900 placeholder:text-gray-400"
              />
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

                // Debug: Log conversation details
                console.log(`[ADMIN] Conversation: ${conv.userName} (${conv.userEmail}) - UserType: ${conv.userType}, UserId: ${conv.userId}`);

                // Map status to display text
                const getStatusText = (status: string) => {
                  const statusMap: Record<string, string> = {
                    open: "Waiting",
                    waiting: "Waiting",
                    assigned: "Active",
                    active: "Active",
                    in_progress: "Active",
                    inactive: "Inactive",
                    resolved: "Resolved",
                    closed: "Closed"
                  };
                  return statusMap[status] || status;
                };

                return (
                  <div
                    key={conv._id}
                    onClick={() => fetchConversation(conv._id)}
                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedConversation?._id === conv._id 
                        ? "bg-blue-50" 
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Status Dot */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(conv.status)}`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* User Email - Clean */}
                        <p className="text-sm text-gray-900 truncate mb-1 font-medium">
                          {conv.userEmail || conv.userName}
                        </p>
                        
                        {/* Last Message - Truncated */}
                        {lastMessage && (
                          <p className="text-xs text-gray-600 truncate mb-1 leading-snug">
                            {lastMessage.message}
                          </p>
                        )}
                        
                        {/* Timestamp - Right aligned */}
                        <p className="text-xs text-gray-400">
                          {getRelativeTime(conv.lastMessageAt)}
                        </p>
                      </div>
                      
                      {/* Unread Badge */}
                      {hasUnread && (
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Main Chat Area - Professional Design */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white">
          {selectedConversation ? (
          <>
            {/* Top Bar - Clean Professional Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded transition" title="Share">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => {
                      const text = selectedConversation.messages.map(m => `${m.senderName}: ${m.message}`).join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    className="p-2 hover:bg-gray-100 rounded transition"
                    title="Copy chat"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Show "Assign to me" button if conversation is not assigned to current admin */}
                  {selectedConversation.status !== "closed" && 
                   selectedConversation.status !== "resolved" && 
                   (!selectedConversation.assignedTo || selectedConversation.assignedTo !== currentAdminId) && (
                    <button
                      onClick={handleAssignToMe}
                      className="px-4 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition"
                    >
                      Assign to me
                    </button>
                  )}
                  {/* Show assigned status if assigned to current admin */}
                  {selectedConversation.assignedTo === currentAdminId && selectedConversation.assignedAgentName && (
                    <span className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded font-medium">
                      Assigned to you
                    </span>
                  )}
                  {(selectedConversation.status === "open" || selectedConversation.status === "assigned" || selectedConversation.status === "in_progress") && (
                    <select
                      value={selectedConversation.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                  {(selectedConversation.status !== "closed" && selectedConversation.status !== "resolved") && (
                    <button
                      onClick={handleEndChat}
                      className="px-4 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition"
                    >
                      End chat
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages - Clean Professional Design */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
              {/* System Message - Chat Started */}
              {selectedConversation.messages.length > 0 && (
                <div className="text-center py-1.5">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded">
                    Live chat started. {new Date(selectedConversation.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })} {new Date(selectedConversation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              )}
              
              {/* System Message - Assigned */}
              {selectedConversation.assignedAgentName && selectedConversation.status !== 'open' && (
                <div className="text-center py-1.5">
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {selectedConversation.assignedAgentName} joined the chat. {new Date(selectedConversation.createdAt).toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })} {new Date(selectedConversation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              )}
              
              {selectedConversation.messages.map((msg, idx) => {
                const isAgent = msg.senderType === "agent" || msg.senderType === "admin";
                const isHandyman = msg.senderType === "handyman";
                const isCustomer = msg.senderType === "customer";
                
                // Get avatar initials
                const getInitials = (name: string) => {
                  const parts = name.split(' ');
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase() || name[0]?.toUpperCase() || 'U';
                };

                return (
                  <div key={msg._id} className={`flex gap-2.5 ${isAgent ? "justify-end" : "justify-start"}`}>
                    {/* Avatar - Left for visitor, Right for agent */}
                    {!isAgent && (
                      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                        isHandyman ? "bg-blue-500" : "bg-gray-400"
                      }`}>
                        {getInitials(msg.senderName)}
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      isAgent
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        isAgent ? "text-blue-100" : "text-gray-400"
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit",
                          hour12: true
                        })}
                      </p>
                    </div>
                    
                    {/* Avatar - Right for agent */}
                    {isAgent && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(msg.senderName)}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="bg-gray-200 rounded-lg rounded-bl-sm px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              {isSending && (
                <div className="flex gap-3 justify-end">
                  <div className="bg-gradient-to-br from-[#D4A574] to-[#C4956A] rounded-2xl rounded-br-sm px-5 py-4 shadow-lg">
                    <Loader2 className="w-5 h-5 text-[#5C4033] animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Clean Professional Design */}
            <div className="bg-white border-t border-gray-200 p-3">
              {(selectedConversation.status === "resolved" || selectedConversation.status === "closed") ? (
                <div className="text-center py-4 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">
                    {selectedConversation.status === "closed" 
                      ? "This chat has been ended." 
                      : "This conversation has been marked as resolved."}
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
                    placeholder="Reply..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400"
                    disabled={isSending || (selectedConversation.status as string) === "resolved" || (selectedConversation.status as string) === "closed"}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending || (selectedConversation.status as string) === "resolved" || (selectedConversation.status as string) === "closed"}
                    className="px-4 py-2.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm font-medium"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
}

