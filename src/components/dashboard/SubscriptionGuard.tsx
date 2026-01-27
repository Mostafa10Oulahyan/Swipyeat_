"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, MessageSquare } from "lucide-react";

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const restaurantSlug = params?.restaurantSlug as string;
    const supabase = createClient();

    const [status, setStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (restaurantSlug) {
            checkSubscription();
        }
    }, [restaurantSlug, pathname]);

    const checkSubscription = async () => {
        // If we're on the subscription page, don't show the modal to allow reactivation
        if (pathname.endsWith("/subscription") || pathname.endsWith("/subscription/payment-method")) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("restaurants")
                .select(`
                    subscriptions(
                        is_current,
                        status
                    )
                `)
                .eq("slug", restaurantSlug)
                .single();

            if (!error && data) {
                const subs = data.subscriptions as any[];
                const currentSub = subs?.find((s: any) => s.is_current === true) || subs?.[0];
                setStatus(currentSub?.status || "active");
            }
        } catch (error) {
            console.error("Error checking subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return null; // Or a subtle loader
    }

    const isSuspended = status === "canceled" || status === "suspended";

    if (isSuspended && !pathname.endsWith("/subscription")) {
        return (
            <div className="relative">
                {/* Blurred Content */}
                <div className="filter blur-sm pointer-events-none select-none">
                    {children}
                </div>

                {/* Overlaid Modal */}
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 font-sans">
                    <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Lock Icon */}
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto relative">
                            <div className="absolute inset-0 bg-red-100/50 rounded-full animate-ping opacity-20" />
                            <Lock className="w-10 h-10 text-red-500 relative z-10" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3">
                                <span className="text-2xl">🔒</span> Subscription Suspended
                            </h2>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                Your subscription is currently inactive. To regain full access to your dashboard and features, please reactivate your plan.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => router.push(`/dashboard/${restaurantSlug}/subscription?reactivate=true`)}
                                className="w-full bg-[#559701] hover:bg-[#4a8001] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#559701]/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                <span className="text-xl">👉</span> Reactivate with Pro
                            </button>

                            <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 mx-auto uppercase">
                                Contact support if you think this is a mistake
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
