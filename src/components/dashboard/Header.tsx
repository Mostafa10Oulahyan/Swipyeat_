"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Bell } from "lucide-react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { updateProfileAction } from "@/app/actions/profile";
import { useProfile, useAuth } from "@/contexts/AuthProvider";

interface HeaderProps {
    title?: string;
    showStatus?: boolean;
}

export default function Header({ title = "Admin Overview", showStatus = true }: HeaderProps) {
    const { profile, loading } = useProfile();
    const { refreshAuth } = useAuth();

    const [showProfileModal, setShowProfileModal] = useState(false);

    // Derive user display info from profile
    const user = profile ? {
        name: profile.name || profile.email?.split('@')[0] || "Admin",
        email: profile.email || "",
        avatar: profile.avatar_url,
        id: profile.id,
        phone: profile.phone ?? undefined,
        role: profile.role || "restaurant_admin"
    } : null;

    const handleUpdateProfile = async (data: any) => {
        if (!user?.id) return;
        const result = await updateProfileAction(user.id, data);
        if (result.success) {
            // Refresh auth context to get updated profile
            await refreshAuth();
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
                            <p className="text-sm font-semibold text-[#1a202c]">{loading ? "Loading..." : user?.name || "Admin"}</p>
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
