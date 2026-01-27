"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Search, Bell } from "lucide-react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { createClient } from "@/lib/supabase/client";
import { updateProfileAction } from "@/app/actions/profile";

interface HeaderProps {
    title?: string;
    showStatus?: boolean;
}

export default function Header({ title = "Admin Overview", showStatus = true }: HeaderProps) {
    const params = useParams();
    const restaurantSlug = params?.restaurantSlug as string;

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string; avatar?: string; id?: string; phone?: string; role?: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                // Fetch profile from public.users table
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, phone, role')
                    .eq('id', authUser.id)
                    .single();

                setUser({
                    name: profile?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || "Admin",
                    email: authUser.email || "",
                    avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url,
                    id: authUser.id,
                    phone: profile?.phone,
                    role: profile?.role || authUser.user_metadata?.role || "restaurant_admin"
                });
            } else if (restaurantSlug) {
                // Fallback for when Auth is disabled/dev mode: fetch admin by restaurant slug
                const { data: restaurant } = await supabase
                    .from("restaurants")
                    .select("id")
                    .eq("slug", restaurantSlug)
                    .single();

                if (restaurant) {
                    const { data: fetchedUser } = await supabase
                        .from("users")
                        .select("id, name, email, avatar_url, phone, role")
                        .eq("restaurant_id", restaurant.id)
                        .eq("role", "restaurant_admin")
                        .limit(1)
                        .maybeSingle();

                    if (fetchedUser) {
                        setUser({
                            name: fetchedUser.name || "Admin",
                            email: fetchedUser.email || "",
                            avatar: fetchedUser.avatar_url,
                            id: fetchedUser.id,
                            phone: fetchedUser.phone,
                            role: fetchedUser.role || "restaurant_admin"
                        });
                    } else {
                        setUser({
                            name: "Restaurant Admin",
                            email: "admin@example.com",
                            avatar: undefined,
                            id: undefined,
                            phone: "",
                            role: "restaurant_admin"
                        });
                    }
                }
            }
        };
        fetchUser();
    }, [restaurantSlug]);

    const handleUpdateProfile = async (data: any) => {
        if (!user?.id) return;
        const result = await updateProfileAction(user.id, data);
        if (result.success) {
            setUser(prev => prev ? {
                ...prev,
                ...data,
                avatar: data.avatar_url || prev.avatar
            } : null);
        } else {
            throw new Error(result.error);
        }
    };

    return (
        <>
            <header className="h-16 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
                {/* Left - Page Title + Status */}
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-[#1a202c]">{title}</h1>
                    {showStatus && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0fff4] border border-[#c6f6d5]">
                            <span className="w-2 h-2 bg-[#48bb78] rounded-full animate-pulse"></span>
                            <span className="text-xs font-medium text-[#276749]">System Online</span>
                        </span>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Search Button */}
                    <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <Search className="w-5 h-5 text-gray-500" />
                    </button>

                    {/* Notifications */}
                    <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f17900] rounded-full"></span>
                    </button>

                    {/* User Profile */}
                    <div
                        className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => setShowProfileModal(true)}
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-[#1a202c]">{user?.name || "Loading..."}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace(/_/g, " ") || "Restaurant Admin"}</p>
                        </div>
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border border-white shadow-sm">
                            {user?.avatar ? (
                                <Image
                                    src={user.avatar}
                                    alt="User Avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover w-full h-full"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-white font-bold text-lg">
                                    {user?.name?.charAt(0).toUpperCase() || "A"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {showProfileModal && user && (
                <ProfileSettingsModal
                    user={{ ...user, avatar_url: user.avatar }}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleUpdateProfile}
                />
            )}
        </>
    );
}
