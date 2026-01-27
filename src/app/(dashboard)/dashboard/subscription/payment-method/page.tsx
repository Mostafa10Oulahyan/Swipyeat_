"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    CreditCard,
    Lock,
    HelpCircle,
    ShieldCheck,
    CheckCircle2,
    Info,
    ChevronRight,
    Wifi,
    Loader2
} from "lucide-react";
import { useRestaurant } from "@/contexts/AuthProvider";

export default function PaymentMethodPage() {
    const router = useRouter();
    const { restaurant } = useRestaurant();

    const [cardholderName, setCardholderName] = useState("Mostafa Oulahyan");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("12/22");
    const [cvc, setCvc] = useState("");
    const [isPrimary, setIsPrimary] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
        setCardNumber(value);
    };

    const formatDisplayCardNumber = (num: string) => {
        if (!num) return "4 5 4 3";
        return num.replace(/(\d{4})/g, '$1 ').trim();
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (value.length >= 3) {
            value = value.slice(0, 2) + " / " + value.slice(2);
        }
        setExpiryDate(value);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Save to localStorage for demo persistence
        const cardData = {
            last4: cardNumber.slice(-4) || "4543",
            brand: "VISA",
            expiry: expiryDate,
            name: cardholderName
        };
        localStorage.setItem(`payment_method_${restaurant?.slug}`, JSON.stringify(cardData));

        setIsSaving(false);
        router.push(`/dashboard/subscription`);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10 min-h-screen bg-white">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Link
                    href={`/dashboard/subscription`}
                    className="hover:text-[#559701] transition-colors"
                >
                    Billing Overview
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">Update Payment Method</span>
            </nav>

            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                    Secure Payment Method
                </h1>
                <p className="text-gray-500 text-lg font-medium max-w-2xl">
                    Add a new credit or debit card for your monthly subscription. Your billing cycle will remain unchanged.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column - Card Preview & Security */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Card Preview */}
                    <div className="aspect-[1.6/1] bg-[#111827] rounded-[32px] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                        {/* Glossy overlay */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Business Card</span>
                                <h3 className="text-xl font-bold">SwipyEat Pro</h3>
                            </div>
                            <Wifi className="w-8 h-8 text-white/40 rotate-90" />
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex gap-4">
                                <span className="text-2xl font-mono tracking-[0.2em]">
                                    {cardNumber ? formatDisplayCardNumber(cardNumber).split(' ')[0] : '4 5 4 3'}
                                </span>
                                <span className="text-2xl font-mono tracking-[0.2em]">••••</span>
                                <span className="text-2xl font-mono tracking-[0.2em]">••••</span>
                                <span className="text-2xl font-mono tracking-[0.2em]">••••</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Card Holder</span>
                                    <p className="text-sm font-bold tracking-wide transition-all">{cardholderName.toUpperCase() || "MOSTAFA OULAHYAN"}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[10px] uppercase tracking-widest font-black text-white/40">Expires</span>
                                    <p className="text-sm font-bold">{expiryDate || "12 / 22"}</p>
                                </div>
                                <div className="w-12 h-8 bg-white/10 rounded-lg backdrop-blur-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Security Badges */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 bg-[#f0f9eb]/50 rounded-[24px] border border-[#e1f3d8]">
                            <div className="w-10 h-10 rounded-full bg-[#f0f9eb] flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="w-6 h-6 text-[#559701]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-gray-900">Bank-level Security</h4>
                                <p className="text-sm text-gray-500 font-medium">256-bit SSL encrypted connection.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 bg-[#f0f9eb]/50 rounded-[24px] border border-[#e1f3d8]">
                            <div className="w-10 h-10 rounded-full bg-[#f0f9eb] flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-[#559701]" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-gray-900">PCI-DSS Compliant</h4>
                                <p className="text-sm text-gray-500 font-medium">We never store your full card details.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-7 space-y-8">
                    <form className="space-y-6" onSubmit={handleSave}>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Cardholder Name</label>
                            <input
                                type="text"
                                required
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                                placeholder="Mostafa Oulahyan"
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="space-y-2 relative">
                            <label className="text-sm font-bold text-gray-700 ml-1">Card Number</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={formatDisplayCardNumber(cardNumber)}
                                    onChange={handleCardNumberChange}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] outline-none transition-all placeholder:text-gray-300"
                                />
                                <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Expiry Date</label>
                                <input
                                    type="text"
                                    required
                                    value={expiryDate}
                                    onChange={handleExpiryChange}
                                    placeholder="MM / YY"
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-sm font-bold text-gray-700 ml-1">CVC / CVV</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={cvc}
                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="•••"
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 font-medium focus:ring-2 focus:ring-[#559701]/20 focus:border-[#559701] outline-none transition-all placeholder:text-gray-300"
                                    />
                                    <HelpCircle className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 cursor-help" />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer group py-2">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={isPrimary}
                                    onChange={() => setIsPrimary(!isPrimary)}
                                    className="peer appearance-none w-6 h-6 border-2 border-gray-200 rounded-lg checked:bg-[#559701] checked:border-[#559701] transition-all cursor-pointer"
                                />
                                <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                Set as primary payment method
                            </span>
                        </label>

                        <div className="space-y-6 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-[#559701] hover:bg-[#4a8001] text-white py-5 rounded-[20px] font-black text-lg transition-all shadow-[0_12px_24px_-8px_rgba(85,151,1,0.3)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <ShieldCheck className="w-6 h-6" />
                                )}
                                {isSaving ? "Saving..." : "Save New Payment Method"}
                            </button>

                            <div className="text-center">
                                <Link
                                    href={`/dashboard/subscription`}
                                    className="text-gray-500 font-bold hover:text-gray-900 transition-colors text-sm"
                                >
                                    Cancel and return to billing
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Privacy Info Box */}
            <div className="bg-[#f8faf7] p-8 rounded-[32px] border border-[#e1f3d8] flex flex-col md:flex-row gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#559701] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#559701]/20">
                    <Info className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-gray-900">About your data privacy</h4>
                    <p className="text-gray-600 font-medium leading-relaxed">
                        We use Stripe as our payment processor. Your card information is transmitted directly to Stripe over a secure SSL connection and never touches our servers. This ensures the highest level of security for your sensitive data.
                    </p>
                </div>
            </div>
        </div>
    );
}
