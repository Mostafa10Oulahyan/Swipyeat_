"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ChevronRight,
  Download,
  Layout,
  Users,
  Utensils,
  ShoppingCart,
  Crown,
  HelpCircle,
  Loader2,
  CheckCircle2,
  X,
  Receipt
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRestaurant } from "@/contexts/AuthProvider";

interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  icon: React.ReactNode;
  unit?: string;
}

export default function SubscriptionPage() {
  const { restaurant, loading: isLoadingRestaurant } = useRestaurant();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [savedCard, setSavedCard] = useState<any>(null);

  useEffect(() => {
    if (restaurant) {
      fetchSubscriptionData();
      loadSavedCard();
    }
  }, [restaurant]);

  const loadSavedCard = () => {
    if (!restaurant) return;
    const stored = localStorage.getItem(`payment_method_${restaurant.slug}`);
    if (stored) {
      try {
        setSavedCard(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved card", e);
      }
    }
  };

  const fetchSubscriptionData = async () => {
    if (!restaurant) return;

    setIsLoading(true);
    try {
      // 2. Get active subscription (fallback to latest if no current specified)
      const { data: subs, error: sError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (sError) throw sError;

      const subscription = subs?.find((s: any) => s.is_current) || subs?.[0];

      // 3. Get all available plans
      const { data: plans, error: pError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);

      if (pError) throw pError;

      // 4. Get usage counts
      const [staffCount, menuItemsCount, ordersCount] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
        supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
        supabase.from("orders").select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id)
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      ]);

      setData({
        restaurant,
        subscription: subscription || null,
        plan: subscription?.subscription_plans || null,
        allPlans: plans || [],
        usage: {
          tables: {
            current: restaurant.number_of_tables || 0,
            limit: subscription?.subscription_plans?.max_tables || 20
          },
          staff: {
            current: staffCount.count || 0,
            limit: subscription?.subscription_plans?.max_staff || 10
          },
          menuItems: {
            current: menuItemsCount.count || 0,
            limit: subscription?.subscription_plans?.max_menu_items || 100
          },
          orders: {
            current: ordersCount.count || 0,
            limit: 5000 // Static limit as requested
          }
        }
      });
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      setError(err.message || "An unknown error occurred");
      // Fallback for missing data if restaurant exists but queries fail
      if (!data && err.message?.includes('not found')) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#559701]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-500 font-bold text-center max-w-sm">
          {error || "Failed to load subscription data."}
        </p>
        <button
          onClick={() => {
            setError(null);
            fetchSubscriptionData();
          }}
          className="px-6 py-2 bg-[#559701] text-white rounded-xl font-bold shadow-lg shadow-green-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  const plan = data?.plan;
  const subscription = data?.subscription;



  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Subscription & Usage</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage your plan, billing history, and resource limits</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            Save 20% on Yearly
          </span>
          <Link
            href={`/dashboard/subscription/pricing`}
            className="bg-gradient-to-r from-[#559701] to-[#6fb301] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-200 hover:scale-[1.02] transition-all"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan Card */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{plan?.name || "Free Trial"}</h2>
                  <span className={`
                    text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md
                    ${(subscription?.status === 'canceled' || subscription?.status === 'cancelled')
                      ? "bg-red-500 text-white"
                      : "bg-green-500 text-white"}
                  `}>
                    {(subscription?.status === 'canceled' || subscription?.status === 'cancelled') ? "CANCELLED" : (subscription?.status || "Active")}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 font-bold text-sm">
                    ${plan?.price_monthly || "0"}/mo <span className="mx-2 text-gray-200">|</span>
                    <span>Next billing date:
                      {subscription?.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : " October 12, 2023"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={plan?.plan_type === 'free_trial' ? '#' : `/dashboard/subscription/downgrade`}
                  className={`px-6 py-2.5 border border-gray-200 font-bold rounded-xl text-gray-700 transition-colors ${plan?.plan_type === 'free_trial' ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-gray-50'}`}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>

          {/* Usage Metrics Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Usage Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UsageCard
                label="Tables"
                current={data.usage.tables.current}
                limit={data.usage.tables.limit}
                icon={<Layout className="w-5 h-5" />}
              />
              <UsageCard
                label="Staff Members"
                current={data.usage.staff.current}
                limit={data.usage.staff.limit}
                icon={<Users className="w-5 h-5" />}
              />
              <UsageCard
                label="Monthly Orders"
                current={data.usage.orders.current}
                limit={data.usage.orders.limit}
                unit="k"
                icon={<ShoppingCart className="w-5 h-5" />}
              />
              <UsageCard
                label="Menu Items"
                current={data.usage.menuItems.current}
                limit={data.usage.menuItems.limit}
                icon={<Utensils className="w-5 h-5" />}
              />
            </div>
          </div>

          {/* Billing History */}
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-gray-900">Billing History</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { date: "Sep 12, 2023", amount: "$49.00", status: "Paid" },
                    { date: "Aug 12, 2023", amount: "$49.00", status: "Paid" },
                    { date: "Jul 12, 2023", amount: "$49.00", status: "Paid" },
                  ].map((inv, i) => (
                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-700">{inv.date}</td>
                      <td className="px-8 py-5 font-bold text-gray-700">{inv.amount}</td>
                      <td className="px-8 py-5">
                        <span className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-sm font-bold text-gray-700">{inv.status}</span>
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-green-600 hover:text-green-700 transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Payment Method</h3>
            <div className="aspect-[1.6/1] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/5 rounded-full" />
              <div className="flex justify-between items-start relative z-10">
                <CreditCard className="w-10 h-10 text-white/40" />
                <span className="text-xs font-black tracking-widest uppercase opacity-40">
                  {savedCard?.brand || "VISA"}
                </span>
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-xl font-mono tracking-[0.2em] opacity-90">
                  •••• •••• •••• {savedCard?.last4 || "4242"}
                </p>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {savedCard?.name ? savedCard.name.toUpperCase() : (data.restaurant.name.toUpperCase() + " INC.")}
                  </p>
                  <p className="text-[10px] font-bold opacity-40">
                    {savedCard?.expiry || "12/25"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">Default payment method</p>
              <Link
                href={`/dashboard/subscription/payment-method`}
                className="text-green-600 font-bold text-sm hover:underline"
              >
                Edit
              </Link>
            </div>
          </div>

          {/* Upsell Card */}
          <div className="bg-black rounded-3xl p-8 text-white space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#559701]/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#559701]/30 transition-all" />
            <div className="w-12 h-12 bg-[#559701]/20 rounded-2xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#559701]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold leading-tight">Unlock Unlimited Kitchens</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Upgrade to Premium to get unlimited staff, 100+ tables, and priority 24/7 technical support.</p>
            </div>
            <ul className="space-y-3">
              {[
                "Unlimited Monthly Orders",
                "Advanced Analytics Dashboard",
                "Multi-unit Restaurant Sync"
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-[#559701]" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="space-y-4 pt-4">
              <button className="w-full bg-[#559701] hover:bg-[#4a8001] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#559701]/20 hover:scale-[1.02]">
                Get 20% Off Premium
              </button>
              <p className="text-center text-[10px] uppercase tracking-widest font-black text-gray-500">Limited time offer</p>
            </div>
          </div>

          {/* Help/Support */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900">Need help?</h4>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Have questions about your billing or want a custom enterprise plan?</p>
            <button className="flex items-center gap-3 text-sm font-bold text-gray-700 hover:text-green-600 transition-colors w-full p-2 hover:bg-green-50 rounded-lg group">
              <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              Contact Billing Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



function UsageCard({ label, current, limit, icon, unit = "" }: UsageMetric) {
  const percentage = Math.min(Math.round((current / limit) * 100), 100);
  const isHigh = percentage > 80;

  // Format numbers for display (e.g. 2.4k / 5k)
  const formatValue = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + (unit || "");
    return val;
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 group hover:border-green-100 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-50/80 rounded-xl group-hover:bg-green-50 transition-colors">
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 text-gray-400 group-hover:text-green-600" })}
          </div>
          <p className="font-bold text-gray-700">{label}</p>
        </div>
        <p className="text-sm font-bold text-gray-400">
          <span className="text-gray-900">{formatValue(current)}</span> / {formatValue(limit)}
        </p>
      </div>

      <div className="space-y-2">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out rounded-full ${isHigh ? 'bg-orange-400' : 'bg-green-500'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest ${isHigh ? 'text-orange-500' : 'text-gray-400'}`}>
          {percentage}% of capacity used
        </p>
      </div>
    </div>
  );
}
