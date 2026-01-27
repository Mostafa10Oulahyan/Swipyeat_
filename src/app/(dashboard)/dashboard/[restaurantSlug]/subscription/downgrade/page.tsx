"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ChevronRight,
    BarChart3,
    Users,
    Headphones,
    Package,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
    CreditCard,
    Wallet,
    Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DowngradePage() {
    const params = useParams();
    const router = useRouter();
    const restaurantSlug = params.restaurantSlug as string;
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showRefundModal, setShowRefundModal] = useState(false);

    useEffect(() => {
        fetchSubscriptionData();
    }, [restaurantSlug]);

    const fetchSubscriptionData = async () => {
        setIsLoading(true);
        try {
            const { data: rest, error: rError } = await supabase
                .from("restaurants")
                .select("id, name")
                .eq("slug", restaurantSlug)
                .maybeSingle();

            if (rError) throw rError;
            if (!rest) throw new Error("Restaurant not found");
            setRestaurant(rest);

            const { data: subs, error: sError } = await supabase
                .from("subscriptions")
                .select(`
                    *,
                    subscription_plans (*)
                `)
                .eq("restaurant_id", rest.id)
                .order("created_at", { ascending: false });

            if (sError) throw sError;

            // Find current or latest as fallback
            const currentSub = subs?.find((s: any) => s.is_current) || subs?.[0];
            setSubscription(currentSub || null);
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDowngrade = async () => {
        if (!subscription) return;
        setIsSubmitting(true);
        try {
            // Update subscription status in DB
            const { error: uError } = await supabase
                .from("subscriptions")
                .update({
                    status: 'canceled',
                    is_current: false,
                    updated_at: new Date().toISOString()
                })
                .eq("id", subscription.id);

            if (uError) throw uError;

            // Success redirect
            router.push(`/dashboard/${restaurantSlug}/subscription?success=downgraded`);
        } catch (err: any) {
            console.error("Downgrade failed:", err);
            setError("Failed to process downgrade. Please try again.");
            setIsSubmitting(false);
            setShowRefundModal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#559701]" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
                <h2 className="text-2xl font-bold">No Active Subscription</h2>
                <p className="text-gray-500">You are already on the Free plan or have no active subscription to downgrade.</p>
                <Link
                    href={`/dashboard/${restaurantSlug}/subscription`}
                    className="inline-block bg-[#559701] text-white px-6 py-2 rounded-xl font-bold"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const nextPlan = subscription.subscription_plans?.plan_type === 'premium' ? 'Pro' : 'Free';
    const last4 = JSON.parse(localStorage.getItem(`payment_method_${restaurantSlug}`) || '{}').last4 || "4242";

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10 bg-gray-50/30 min-h-screen relative">
            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-sans animate-in fade-in duration-300">
                    <div className="bg-white rounded-[56px] p-8 md:p-14 max-w-xl w-full text-center space-y-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border border-gray-100">
                        {/* Summary Icon */}
                        <div className="w-24 h-24 bg-[#f0f9eb] rounded-full flex items-center justify-center mx-auto relative group">
                            <div className="absolute inset-0 bg-[#559701]/10 rounded-full animate-ping opacity-20" />
                            <div className="w-14 h-14 bg-[#559701] rounded-[24px] flex items-center justify-center shadow-2xl shadow-[#559701]/30 rotate-3 group-hover:rotate-0 transition-transform">
                                <Wallet className="w-7 h-7 text-white" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                                Refund & Downgrade Summary
                            </h2>
                            <p className="text-gray-500 font-bold text-lg max-w-[90%] mx-auto leading-relaxed">
                                Please review the financial adjustments before confirming your plan change.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Refund Amount Box */}
                            <div className="bg-[#f0f9eb]/60 rounded-[40px] p-10 border border-[#e1f3d8] space-y-6 text-left relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/40 rounded-full blur-3xl" />

                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-gray-500 font-black uppercase tracking-widest text-xs">Refund Amount</span>
                                    <span className="text-4xl font-black text-[#559701]">$42.50</span>
                                </div>
                                <div className="flex items-center gap-4 pt-6 border-t border-[#e1f3d8]/60 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm border border-[#e1f3d8]/50">
                                        <CreditCard className="w-6 h-6 text-[#559701]" strokeWidth={2.5} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">
                                        To be credited to your card ending in <span className="text-gray-900 font-black tracking-widest">{last4}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 px-2">
                                {/* Plan Update Info */}
                                <div className="flex items-center gap-5 text-left p-2">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50/80 border border-blue-100/50 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-7 h-7 text-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-gray-900">{nextPlan} Plan starts immediately</h4>
                                        <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                            Your feature set will be updated now.
                                        </p>
                                    </div>
                                </div>

                                {/* Expectation info */}
                                <div className="flex items-center gap-5 text-left p-2">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50/80 border border-gray-100/50 flex items-center justify-center flex-shrink-0">
                                        <Info className="w-7 h-7 text-gray-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-gray-900">What to expect</h4>
                                        <p className="text-xs text-gray-500 font-bold leading-relaxed">
                                            The pro-rated credit usually takes <span className="text-gray-900 font-black">5-10 business days</span> to appear.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-6">
                            <button
                                onClick={handleDowngrade}
                                disabled={isSubmitting}
                                className="w-full bg-[#1b1c0e] hover:bg-black text-white py-6 rounded-[32px] font-black text-xl transition-all shadow-2xl shadow-black/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-4 disabled:opacity-70"
                            >
                                {isSubmitting && <Loader2 className="w-6 h-6 animate-spin" />}
                                Acknowledge & Downgrade
                            </button>

                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-[0.3em] block mx-auto"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Link
                    href={`/dashboard/${restaurantSlug}/subscription`}
                    className="hover:text-[#559701] transition-colors"
                >
                    Subscription
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-bold">Downgrade</span>
            </nav>

            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    Confirm Plan Change
                </h1>
                <p className="text-gray-500 text-lg font-medium max-w-2xl">
                    Are you sure you want to change your plan? Review the changes below.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Before you go */}
                <div className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900">Before you go</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">
                        Downgrading means you will lose access to several premium features that help your kitchen run at peak efficiency:
                    </p>

                    <div className="space-y-6">
                        <FeatureLossItem
                            icon={<BarChart3 className="w-5 h-5 text-orange-500" />}
                            title="AI Analytics"
                            description="Lose predictive ordering insights and peak hour forecasting that saves you up to 15% on waste."
                            bgColor="bg-orange-50"
                        />
                        <FeatureLossItem
                            icon={<Users className="w-5 h-5 text-blue-500" />}
                            title="Unlimited Staff"
                            description="Your account will be limited to 5 active kitchen users. Existing extra users will be deactivated."
                            bgColor="bg-blue-50"
                        />
                        <FeatureLossItem
                            icon={<Headphones className="w-5 h-5 text-purple-500" />}
                            title="Priority Support"
                            description="Standard email support only with 24h response time. Phone and live chat support will be removed."
                            bgColor="bg-purple-50"
                        />
                        <FeatureLossItem
                            icon={<Package className="w-5 h-5 text-gray-500" />}
                            title="Advanced Inventory"
                            description="Real-time stock alerts and multi-location management will no longer be available."
                            bgColor="bg-gray-50"
                        />
                    </div>
                </div>

                {/* Right Side: Survey */}
                <div className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Why are you downgrading?</h2>

                        <div className="space-y-3">
                            {["Too expensive", "Missing specific features", "Closing restaurant", "Other"].map((item) => (
                                <label key={item} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${reason === item ? 'border-[#559701] bg-[#f0f9eb]/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${reason === item ? 'border-[#559701] bg-[#559701]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                        {reason === item && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="reason"
                                        className="hidden"
                                        value={item}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                    <span className="font-bold text-gray-700">{item}</span>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-900 ml-1">Anything else we should know?</label>
                            <textarea
                                placeholder="Tell us how we can improve..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                className="w-full p-4 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] outline-none transition-all min-h-[120px] resize-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-8">
                        <button
                            onClick={() => router.back()}
                            className="w-full bg-[#559701] hover:bg-[#4a8001] text-white py-4 rounded-2xl font-black transition-all shadow-lg shadow-[#559701]/20"
                        >
                            Keep My Current Plan
                        </button>

                        <button
                            onClick={() => setShowRefundModal(true)}
                            disabled={!reason || isSubmitting}
                            className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm to refund
                        </button>

                        <p className="text-center text-[10px] text-gray-400 font-medium">
                            Your current plan remains active until the end of the billing cycle on {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'Sept 30, 2023'}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureLossItem({ icon, title, description, bgColor }: any) {
    return (
        <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                {icon}
            </div>
            <div className="space-y-1">
                <h4 className="font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
