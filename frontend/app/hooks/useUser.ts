// app/hooks/useUser.ts

import { useState, useEffect } from 'react';

// Use the exact Profile type from your HandyDashboard component
type Profile = {
    _id: string;
    name: string;
    email: string;
    // ... all other profile properties (keep them for type compatibility) ...
    planType?: 'Basic' | 'Standard' | 'Premium';
    // Add any missing essential properties like 'username' if your backend uses it
    username?: string; 
};

// Define the Guest User profile object for fallback
const GUEST_USER_PROFILE: Profile = {
    _id: 'GUEST_ID_000',
    name: 'Guest User',
    email: 'guest.user@example.com',
    // Provide safe defaults for the required number fields
    jobsDone: 0,
    jobsInProgressCount: 0,
    rating: 0,
    earnings: 0,
    activeOrdersCount: 0,
    jobAcceptCount: 0,
    services: [], 
    recentOrders: [], 
    planType: 'Basic', // Default to basic plan for guest
    verified: false,
    notificationsCount: 0,
    reviewsCount: 0,
};


// NOTE: The backend URL from the HandyDashboard
const USER_PROFILE_ENDPOINT = "http://localhost:7000/api/handymen/me"; 

export const useUser = () => {
    const [user, setUser] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            // ✅ FALLBACK: No token found, set the default Guest User
            setUser(GUEST_USER_PROFILE);
            setIsLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch(USER_PROFILE_ENDPOINT, {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (res.ok) {
                    const data: Profile = await res.json();
                    setUser(data);
                } else if (res.status === 401) {
                    // Token expired/invalid - fall back to Guest User
                    setError("Session expired. Showing guest view.");
                    setUser(GUEST_USER_PROFILE);
                } else {
                    setError("Failed to fetch user data.");
                    setUser(GUEST_USER_PROFILE); // Fallback on other errors too
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                setError("Network or server error.");
                setUser(GUEST_USER_PROFILE); // Fallback on network error
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProfile();
    }, []);

    // Also return a flag if it's the Guest user, useful for disabling payment buttons
    const isGuest = user?._id === GUEST_USER_PROFILE._id;

    return { 
        user, 
        isLoading, 
        error,
        isGuest, // Use this flag to conditionally disable the final subscribe button
    };
};