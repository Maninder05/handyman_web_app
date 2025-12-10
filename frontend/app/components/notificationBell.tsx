"use client";

import React, { useEffect, useState } from "react";
import socket from "../lib/socket";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

dayjs.extend(relativeTime);

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
  senderId?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  relatedId?: string;
  link?: string;
}

interface Props {
  user?: { _id: string; name: string; email: string };
}

export default function NotificationBell({ user }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (!user?._id) return;

    // Setup socket connection
    const token = localStorage.getItem("token");
    if (token) {
      socket.auth = { token };
      socket.connect();

      socket.on("connect", () => {
        socket.emit("join", { userId: user._id });
      });

      socket.on("notification", (data: any) => {
        setNotifications((prev) => [data.notification, ...prev]);
        setUnread((u) => u + 1);
      });

      socket.on("new_message", (data: any) => {
        setNotifications((prev) => [
          {
            _id: Date.now().toString(),
            title: "New Message",
            body: data.message?.content || "New message received",
            type: "message",
            createdAt: new Date().toISOString(),
            read: false,
            senderId: data.message?.sender,
            relatedId: data.message?.chatId,
          },
          ...prev,
        ]);
        setUnread((u) => u + 1);
      });
    }

    fetchNotifications();

    return () => {
      socket.off("notification");
      socket.off("new_message");
      socket.disconnect();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
        }/api/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.type === "message" && notification.relatedId) {
        setOpen(false);
        router.push(`/mutual/chat/${notification.relatedId}`);
      } else {
        await markRead(notification._id);
      }
    } catch (err) {
      console.error("Error handling notification:", err);
    }
  };

  const markRead = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
        }/api/notifications/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await axios.post(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
        }/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) {
            // Reset unread when opening
            const token = localStorage.getItem("token");
            if (token) {
              axios
                .post(
                  `${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"
                  }/api/notifications/mark-all-read`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                .then(() => setUnread(0));
            }
          }
        }}
        className="relative p-2 rounded-full hover:bg-[#2a2a2a] transition flex items-center justify-center"
      >
        <Bell size={22} className="text-white" />

        {/* Unread Badge */}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <div className="flex gap-2">
              <button
                onClick={markAllRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/mutual/notifications");
                }}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                View All
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          notification.type === "message"
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Bell
                          size={14}
                          className={
                            notification.type === "message"
                              ? "text-blue-600"
                              : "text-gray-600"
                          }
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 ml-2">
                          {dayjs(notification.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {notification.body}
                      </p>
                      {notification.senderId && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            From: {notification.senderId.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
