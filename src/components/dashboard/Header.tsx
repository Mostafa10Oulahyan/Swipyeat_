"use client";

import { useState } from "react";
import Image from "next/image";
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
            <header className="h-14 bg-white flex items-center justify-between px-3 sm:px-4 sticky top-0 z-30 border-b border-gray-100 lg:border-b-0">
                {/* Left - Page Title + Status */}
                <div className="flex items-center gap-2 sm:gap-3 ml-12 lg:ml-0">
                    <h1 className="text-sm sm:text-base lg:text-lg font-bold text-[#1a202c] truncate max-w-[120px] sm:max-w-none">{title}</h1>
                    {showStatus && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#f0fff4] border border-[#c6f6d5]">
                            <span className="w-1.5 h-1.5 bg-[#48bb78] rounded-full animate-pulse"></span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-[#276749]">System Online</span>
                        </span>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-3">


                    {/* User Profile */}
                    <div
                        className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-gray-200 cursor-pointer hover:bg-gray-50 p-1.5 sm:p-2 rounded-lg transition-colors"
                        onClick={() => setShowProfileModal(true)}
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-xs sm:text-sm font-semibold text-[#1a202c] truncate max-w-[100px] lg:max-w-none">{loading ? "Loading..." : user?.name || "Admin"}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 capitalize truncate max-w-[100px] lg:max-w-none">{user?.role?.replace(/_/g, " ") || "Restaurant Admin"}</p>
                        </div>
                        {/* Avatar */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border border-white shadow-sm flex-shrink-0">
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
                                <span className="text-white font-bold text-sm sm:text-lg">
                                    {user?.name?.charAt(0).toUpperCase() || "A"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {showProfileModal && user && (
                <ProfileSettingsModal
                    user={{ ...user, avatar_url: user.avatar ? user.avatar : undefined }}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleUpdateProfile}
                />
            )}
        </>
    );
}
