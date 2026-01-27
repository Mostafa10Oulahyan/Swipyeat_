"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// Types
interface UserProfile {
    id: string;
    restaurant_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: "super_admin" | "restaurant_admin" | "manager" | "waiter" | "kitchen_staff";
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    updated_at: string;
}

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    cover_image_url: string | null;
    phone: string | null;
    email: string | null;
    address: string;
    city: string | null;
    number_of_tables: number;
    is_active: boolean;
    pin: string | null;
    is_locked: boolean;
    google_map_url: string | null;
    instagram_url: string | null;
    created_at: string;
    updated_at: string;
    // Subscription info
    subscription?: {
        plan_type: "free_trial" | "pro";
        status: "active" | "canceled" | "expired" | "suspended";
        is_current: boolean;
    } | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    restaurant: Restaurant | null;
    loading: boolean;
    error: string | null;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    restaurant: null,
    loading: true,
    error: null,
    refreshAuth: async () => { },
});

// Hooks
export function useUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useUser must be used within an AuthProvider");
    }
    return { user: context.user, loading: context.loading };
}

export function useProfile() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useProfile must be used within an AuthProvider");
    }
    return { profile: context.profile, loading: context.loading };
}

export function useRestaurant() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useRestaurant must be used within an AuthProvider");
    }
    return { restaurant: context.restaurant, loading: context.loading };
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Fetch user profile from DB
    const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
                return null;
            }

            return data as UserProfile;
        } catch (err) {
            console.error("Error fetching profile:", err);
            return null;
        }
    }, [supabase]);

    // Fetch restaurant from DB based on restaurant_id
    const fetchRestaurant = useCallback(async (restaurantId: string): Promise<Restaurant | null> => {
        try {
            const { data, error } = await supabase
                .from("restaurants")
                .select(`
          *,
          subscriptions(
            is_current,
            status,
            subscription_plans(plan_type)
          )
        `)
                .eq("id", restaurantId)
                .single();

            if (error) {
                console.error("Error fetching restaurant:", error);
                return null;
            }

            // Process subscription data
            let subscription = null;
            if (data.subscriptions && Array.isArray(data.subscriptions)) {
                // Find current subscription or latest one
                const subs = data.subscriptions as any[];
                const currentSub = subs.find((s: any) => s.is_current === true) || subs[0];

                if (currentSub) {
                    const planInfo = Array.isArray(currentSub.subscription_plans)
                        ? currentSub.subscription_plans[0]
                        : currentSub.subscription_plans;

                    subscription = {
                        plan_type: planInfo?.plan_type || "free_trial",
                        status: currentSub.status,
                        is_current: currentSub.is_current,
                    };
                }
            }

            // Remove raw subscriptions array and add processed subscription
            const { subscriptions, ...restaurantData } = data;

            return {
                ...restaurantData,
                subscription,
            } as Restaurant;
        } catch (err) {
            console.error("Error fetching restaurant:", err);
            return null;
        }
    }, [supabase]);

    // Main auth refresh function
    const refreshAuth = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                // "Auth session missing" is expected when not logged in - don't log as error
                if (!authError.message?.includes("session missing")) {
                    console.error("Auth error:", authError);
                }
                setUser(null);
                setProfile(null);
                setRestaurant(null);
                return;
            }

            if (!authUser) {
                setUser(null);
                setProfile(null);
                setRestaurant(null);
                return;
            }

            setUser(authUser);

            // Fetch profile from users table
            const userProfile = await fetchProfile(authUser.id);
            setProfile(userProfile);

            // Fetch restaurant based on profile's restaurant_id
            if (userProfile?.restaurant_id) {
                const restaurantData = await fetchRestaurant(userProfile.restaurant_id);
                setRestaurant(restaurantData);
            } else {
                setRestaurant(null);
            }
        } catch (err) {
            console.error("Error refreshing auth:", err);
            setError("Failed to load authentication data");
        } finally {
            setLoading(false);
        }
    }, [supabase, fetchProfile, fetchRestaurant]);

    // Initialize auth on mount
    useEffect(() => {
        refreshAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    await refreshAuth();
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setProfile(null);
                    setRestaurant(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [refreshAuth, supabase.auth]);

    const value: AuthContextType = {
        user,
        profile,
        restaurant,
        loading,
        error,
        refreshAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
