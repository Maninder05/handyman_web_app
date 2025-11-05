"use client";

import React, { useEffect, useState } from "react";
import socket from "../../lib/socket";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface Notification {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface Props {
  user?: { _id: string };
}

export default function NotificationBell({ user }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    // setup socket connection
    socket.auth = { token: localStorage.getItem("token") };
    socket.connect();
    socket.emit("setup", { userId: user._id });

    socket.on("notification", ({ notification }: { notification: Notification }) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnread((u) => u + 1);
    });

    fetchNotifications();

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNotifications(data.notifications);
      setUnread(data.unreadCount || 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"}/api/notifications/mark-read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
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
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000"}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
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
          if (!open) setUnread(0);
        }}
        className="relative"
      >
        <svg
          className="w-6 h-6 text-gray-800 dark:text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
        </svg>

        {/* Unread Badge */}
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center p-2 border-b">
            <strong>Notifications</strong>
            <button onClick={markAllRead} className="text-xs text-blue-600">
              Mark all read
            </button>
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-600">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 border-b cursor-pointer ${
                    n.read ? "bg-gray-50" : "bg-white"
                  }`}
                  onClick={() => markRead(n._id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-gray-600">{n.body}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {dayjs(n.createdAt).fromNow()}
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
