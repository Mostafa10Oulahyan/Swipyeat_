"use client";
import React, { useState, useEffect } from "react";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    TrendingUp,
    ShoppingCart,
    UtensilsCrossed,
    MonitorSmartphone,
    Users,
    CreditCard,
    Settings,
    LogOut,
    Receipt
} from "lucide-react";

const mainNavItems = [
    {
        name: "Dashboard",
        href: "",
        icon: LayoutDashboard,
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: TrendingUp,
    },
    {
        name: "Orders",
        href: "/orders",
        icon: ShoppingCart,
    },
    {
        name: "Menu",
        href: "/menu",
        icon: UtensilsCrossed,
    },
    {
        name: "Tables",
        href: "/QRCodetables",
        icon: MonitorSmartphone,
    },
    {
        name: "Staff",
        href: "/staff",
        icon: Users,
    },
    {
        name: "Payments History",
        href: "/paimentsHistory", // User requested path 'paimentsHistory'
        icon: CreditCard,
    },
];

const accountNavItems = [
    {
        name: "Subscription",
        href: "/subscription",
        icon: CreditCard,
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const params = useParams();
    const restaurantSlug = params?.restaurantSlug as string;
    const supabase = createClient();

    const [restaurant, setRestaurant] = useState<any>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (restaurantSlug) {
            fetchRestaurant();
            fetchUserRole();
        }
    }, [restaurantSlug]);

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            setUserRole(profile?.role || user.user_metadata?.role);
        }
    };

    // ... (fetchRestaurant logic remains the same)



    // Filter Items Logic
    const filteredMainNav = mainNavItems.filter(item => {
        if (userRole === 'manager') {
            // Manager cannot see Staff
            return item.name !== 'Staff';
        }
        return true;
    });

    const filteredAccountNav = accountNavItems.filter(item => {
        if (userRole === 'manager') {
            // Manager cannot see Settings
            return item.name !== 'Settings';
        }
        return true;
    });

    const fetchRestaurant = async () => {
        try {
            // Join with subscriptions and subscription_plans to get plan info
            const { data, error } = await supabase
                .from("restaurants")
                .select(`
                    name, 
                    logo_url,
                    subscriptions(
                        created_at,
                        is_current,
                        status,
                        plan_id,
                        subscription_plans(plan_type)
                    )
                `)
                .eq("slug", restaurantSlug)
                .single();

            if (!error && data) {
                const subs = (data.subscriptions as any[]) || [];

                // Sort by descending to get the latest one
                const sortedSubs = [...subs].sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                const currentSub = sortedSubs.find((s: any) => s.is_current === true) || sortedSubs[0];

                // Extract plan_type and status
                let planType = null;
                let subStatus = null;
                if (currentSub) {
                    const sp = currentSub.subscription_plans;
                    const spObj = Array.isArray(sp) ? sp[0] : sp;
                    planType = spObj?.plan_type || 'free_trial';
                    subStatus = currentSub.status;
                }

                setRestaurant({
                    name: data.name,
                    logo_url: data.logo_url,
                    plan_type: planType,
                    status: subStatus
                });
            }
        } catch (error) {
            console.error("Error fetching sidebar data:", error);
        }
    };

    const isActive = (href: string) => {
        const fullPath = `/dashboard/${restaurantSlug}${href}`;
        return pathname === fullPath;
    };

    const NavLink = ({ item }: { item: { name: string; href: string; icon: any } }) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
            <Link
                href={`/dashboard/${restaurantSlug}${item.href}`}
                className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm
          transition-all duration-200
          ${active
                        ? "bg-[#559701] text-white font-medium shadow-md"
                        : "text-[#4a5568] hover:bg-[#f7fafc] hover:text-[#1a202c]"
                    }
        `}
            >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span>{item.name}</span>
            </Link>
        );
    };

    return (
        <aside className="w-[220px] h-screen bg-white flex flex-col fixed left-0 top-0 border-r border-gray-100">
            {/* Logo & Restaurant Info */}
            <div className="p-5 pb-6">
                <div className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-50">
                        {restaurant?.logo_url ? (
                            <img
                                src={restaurant.logo_url}
                                alt="Logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-[#559701] font-bold text-2xl uppercase">
                                {restaurant?.name?.charAt(0) || 'R'}
                            </div>
                        )}
                    </div>
                    {/* Restaurant Name */}
                    <div className="flex flex-col gap-1 min-w-0">
                        <h2 className="text-sm font-bold text-[#1a202c] leading-tight capitalize break-words">
                            {restaurant?.name || restaurantSlug?.replace(/-/g, ' ') || 'Restaurant Name'}
                        </h2>
                        {(restaurant?.plan_type || restaurant?.status === 'canceled') && (
                            <div className="flex">
                                <span className={`
                                    text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border
                                    ${(restaurant?.status === 'canceled' || restaurant?.status === 'cancelled' || restaurant?.status === 'suspended')
                                        ? "bg-red-500 text-white border-red-600"
                                        : (restaurant.plan_type === 'pro' || restaurant.plan_type === 'premium')
                                            ? "bg-orange-50 text-orange-600 border-orange-100"
                                            : "bg-blue-50 text-blue-600 border-blue-100"}
                                `}>
                                    {(restaurant?.status === 'canceled' || restaurant?.status === 'cancelled') ? 'CANCELLED' : (restaurant?.status === 'suspended') ? 'SUSPENDED' : (restaurant.plan_type === 'pro' || restaurant.plan_type === 'premium' ? 'Professional' : 'Free Trial')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {filteredMainNav.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}

                {/* Account Section Label */}
                <div className="pt-6 pb-2">
                    <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Account
                    </span>
                </div>

                {filteredAccountNav.map((item) => (
                    <NavLink key={item.name} item={item} />
                ))}
            </nav>

            {/* Disconnect/Logout */}
            <div className="p-3 pb-6">
                <button
                    onClick={async () => {
                        await logoutAction();
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-left text-[#e53e3e] hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Disconnect</span>
                </button>
            </div>
        </aside>
    );
}
