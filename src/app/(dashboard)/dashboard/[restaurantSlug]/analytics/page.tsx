"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    TrendingUp,
    Clock,
    Users,
    ShoppingBag,
    ChevronDown,
    Search,
    Filter,
    Download,
    Calendar,
    AlertCircle,
    Loader2,
    CheckCircle2,
    PieChart,
    BarChart3,
    Flame,
    User
} from "lucide-react";
import { getAnalyticsDataAction } from "@/app/actions/analytics";
import { createClient } from "@/lib/supabase/client";

export default function AnalyticsPage() {
    const params = useParams();
    const restaurantSlug = params.restaurantSlug as string;
    const supabase = createClient();

    const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days'>('today');
    const [isLoading, setIsLoading] = useState(true);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInitialData();
    }, [restaurantSlug]);

    useEffect(() => {
        if (restaurant) {
            fetchAnalytics();
        }
    }, [timeframe, restaurant]);

    const fetchInitialData = async () => {
        if (!restaurantSlug) return;
        try {
            const { data: restData, error } = await supabase
                .from("restaurants")
                .select("id, name")
                .eq("slug", restaurantSlug)
                .single();

            if (error) {
                console.error("Supabase error fetching restaurant:", error);
                setError("Failed to load restaurant details");
                return;
            }
            setRestaurant(restData);
        } catch (error) {
            console.error("Error fetching restaurant:", error);
            setError("Unexpected error loading restaurant");
        }
    };

    const fetchAnalytics = async () => {
        if (!restaurant?.id) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAnalyticsDataAction(restaurant.id, timeframe);
            if (result.success) {
                setData(result.data);
            } else {
                console.error("Analytics fetch failed:", result.error);
                setError("Failed to load analytics data. Please try again.");
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
            setError("Network error loading analytics");
        } finally {
            setIsLoading(false);
        }
    };

    const timeframeLabels = {
        today: "Today",
        '7days': "Last 7 Days",
        '30days': "Last 30 Days"
    };

    if (isLoading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#559701]" />
                    <p className="text-gray-500 font-medium font-outfit">Cooking your data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 font-outfit">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-[#1a202c] tracking-tight">Kitchen Intelligence</h1>
                    <p className="text-gray-500 mt-1 font-medium">Real-time operational suite for <span className="text-[#559701] font-bold">{restaurant?.name}</span></p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
                        {(['today', '7days', '30days'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTimeframe(t)}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ease-in-out ${timeframe === t
                                    ? "bg-white text-[#559701] shadow-lg shadow-gray-100 ring-1 ring-black/5"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                    }`}
                            >
                                {timeframeLabels[t]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-3xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Orders",
                        value: data?.totalOrders || "0",
                        trend: "+12%", // Calculate real trend if possible later
                        icon: ShoppingBag,
                        color: "bg-blue-500",
                        bg: "bg-blue-50"
                    },
                    {
                        label: "Avg. Prep Time",
                        value: data?.avgPrepTime || "0m",
                        trend: "-5%",
                        icon: Clock,
                        color: "bg-orange-500",
                        bg: "bg-orange-50"
                    },
                    {
                        label: "Revenue",
                        value: `${(data?.totalRevenue || 0).toLocaleString()} DH`,
                        trend: "+3.2%",
                        icon: TrendingUp,
                        color: "bg-[#559701]",
                        bg: "bg-green-50"
                    },
                    {
                        label: "Order Accuracy",
                        value: data?.orderAccuracy || "0%",
                        trend: "-0.2%",
                        icon: CheckCircle2,
                        color: "bg-purple-500",
                        bg: "bg-purple-50"
                    },
                ].map((stat, i) => (
                    <div key={i} className="group relative bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300`}>
                                <stat.icon className={`w-7 h-7 ${stat.color.replace('bg-', 'text-')}`} />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-[#1a202c] tracking-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Revenue/Sales Chart */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-[#1a202c]">Sales Performance</h3>
                                <p className="text-sm text-gray-400 font-medium">Daily revenue insights</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full flex items-end justify-between gap-4 px-2">
                            {data?.revenueTrends?.length > 0 ? (
                                data.revenueTrends.map((d: any, i: number) => {
                                    const maxVal = Math.max(...data.revenueTrends.map((t: any) => t.value)) || 1;
                                    const heightPct = (d.value / maxVal) * 80 + 10;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                            <div
                                                className="w-full bg-gray-50 rounded-2xl relative overflow-hidden group-hover/bar:bg-[#559701]/10 transition-colors"
                                                style={{ height: `${heightPct}%` }}
                                            >
                                                <div className="absolute bottom-0 left-0 right-0 bg-[#559701] h-full opacity-80 group-hover/bar:opacity-100 transition-all duration-500" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{d.day}</span>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">No sales data yet</div>
                            )}
                        </div>
                    </div>

                    {/* Hourly Sales Heatmap */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-[#1a202c]">Hourly Heatmap</h3>
                                <p className="text-sm text-gray-400 font-medium">Peak traffic identification</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-[#559701] rounded-full" />
                                <span className="text-xs font-bold text-gray-500 uppercase">High Traffic</span>
                            </div>
                        </div>
                        <div className="h-24 w-full flex items-end gap-1">
                            {data?.hourlyTraffic?.map((h: any, i: number) => {
                                const intensityClass = h.count === 0 ? 'bg-gray-50' :
                                    h.count < 3 ? 'bg-[#559701]/20' :
                                        h.count < 6 ? 'bg-[#559701]/50' :
                                            'bg-[#559701]';
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group/heat">
                                        <div
                                            className={`w-full rounded-md transition-all duration-500 ${intensityClass} hover:opacity-80`}
                                            style={{ height: '100%' }}
                                        >
                                            {h.count > 0 && (
                                                <div className="opacity-0 group-hover/heat:opacity-100 absolute -mt-8 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-10">
                                                    {h.count} orders
                                                </div>
                                            )}
                                        </div>
                                        {(i % 3 === 0) && (
                                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{i}:00</span>
                                        )}
                                    </div>
                                )
                            })}
                            {!data?.hourlyTraffic && <div className="flex items-center justify-center w-full text-gray-400 font-medium">No hourly data</div>}
                        </div>
                    </div>

                    {/* Top Categories & Modifiers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Categories */}
                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-black text-[#1a202c] mb-6">Top Categories</h3>
                            <div className="space-y-6">
                                {data?.topCategories?.map((cat: any, i: number) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="font-bold text-gray-700">{cat.name}</span>
                                            <span className="text-sm font-black text-[#1a202c]">{cat.value} sold</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#559701] rounded-full transition-all duration-1000 group-hover:bg-[#437a01]"
                                                style={{ width: `${(cat.value / (data.topCategories[0]?.value || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(!data?.topCategories?.length) && <p className="text-gray-400 italic">No category data available.</p>}
                            </div>
                        </div>

                        {/* Popular Modifiers (Tag Cloud Style) */}
                        <div className="bg-[#1a202c] p-8 rounded-[3rem] text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#559701] rounded-full blur-[100px] opacity-20 pointer-events-none" />
                            <h3 className="text-xl font-black mb-6 relative z-10">Popular Add-ons</h3>
                            <div className="flex flex-wrap gap-3 relative z-10">
                                {data?.popularModifiers?.map((mod: any, i: number) => (
                                    <span key={i} className={`
                                        px-4 py-2 rounded-xl text-sm font-bold border 
                                        ${i === 0 ? 'bg-[#559701] border-[#559701] text-white shadow-lg shadow-[#559701]/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}
                                    `}>
                                        {mod.name} <span className="opacity-60 ml-1 text-xs">x{mod.count}</span>
                                    </span>
                                ))}
                                {(!data?.popularModifiers?.length) && <p className="text-gray-400 italic">No modifier data yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Items Enhanced */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-[#1a202c]">Menu Superstars</h3>
                            <span className="text-xs font-bold text-[#559701] uppercase tracking-widest">Top 5 Items</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data?.topItems?.map((item: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-lg transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden relative flex-shrink-0">
                                        <div className="absolute top-0 left-0 bg-[#1a202c] text-white text-[10px] font-black px-2 py-1 rounded-br-lg z-10">
                                            #{i + 1}
                                        </div>
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBag className="w-6 h-6" /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#1a202c] leading-tight mb-1">{item.name}</h4>
                                        <p className="text-xs font-medium text-gray-500">{item.sales} orders · <span className="text-[#559701] font-bold">{item.revenue.toLocaleString()} DH</span></p>
                                    </div>
                                </div>
                            ))}
                            {(!data?.topItems?.length) && <p className="text-gray-400 italic col-span-2 text-center py-4">No top items data available.</p>}
                        </div>
                    </div>

                </div>

                {/* Right Sidebar - Kitchen Efficiency & Staff */}
                <div className="space-y-8">
                    {/* Live Occupancy Gauge */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="mb-8 text-center">
                            <h3 className="text-xl font-black text-[#1a202c]">Live Occupancy</h3>
                            <p className="text-sm text-gray-400 font-medium">Real-time table status</p>
                        </div>
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="w-48 h-48 rounded-full border-[16px] border-gray-50 flex flex-col items-center justify-center relative">
                                <div
                                    className="absolute inset-0 rounded-full border-[16px] border-[#559701] border-l-transparent border-b-transparent transition-all duration-1000"
                                    style={{ transform: `rotate(${((data?.liveOccupancy?.percentage || 0) / 100) * 360}deg)` }} // Dynamic rotation based on percentage (simplified visual)
                                />
                                {/* Circular Progress - Simplified with solid colors for now or SVG for better control */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f9fafb" strokeWidth="10" />
                                    <circle
                                        cx="50" cy="50" r="40" fill="none" stroke="#559701" strokeWidth="10"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 - (251.2 * (data?.liveOccupancy?.percentage || 0)) / 100}
                                        className="transition-all duration-1000 ease-out"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                <div className="z-10 flex flex-col items-center">
                                    <h4 className="text-4xl font-black text-[#1a202c]">
                                        {data?.liveOccupancy?.occupied}/{data?.liveOccupancy?.capacity}
                                    </h4>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Tables Busy</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-[#559701] rounded-full" />
                                    <span className="text-xs font-bold text-gray-600">Occupancy Rate</span>
                                </div>
                                <span className="text-sm font-black text-[#1a202c]">{data?.liveOccupancy?.percentage}%</span>
                            </div>

                            {/* Status Breakdown (Mini) */}
                            {[
                                { label: "Ready", count: data?.statusBreakdown?.ready || 0, color: "bg-[#559701]" },
                                { label: "Preparing", count: data?.statusBreakdown?.preparing || 0, color: "bg-orange-500" },
                                { label: "Pending", count: data?.statusBreakdown?.pending || 0, color: "bg-gray-400" },
                            ].map((status, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 ${status.color} rounded-full`} />
                                        <span className="text-xs font-bold text-gray-500">{status.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-[#1a202c]">{status.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Staff */}
                    <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-[#1a202c]">Top Staff</h3>
                        </div>
                        <div className="space-y-4">
                            {data?.topStaff?.length > 0 ? data.topStaff.map((staff: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden relative border border-transparent group-hover:border-[#559701] transition-all">
                                            {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1a202c] text-sm">{staff.name}</p>
                                            <p className="text-[9px] text-[#559701] font-bold uppercase tracking-widest leading-none">Rank #{i + 1}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-[#1a202c]">{staff.avgPrep}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase leading-none">Avg Time</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-4 text-center text-gray-400 text-sm italic">No staff data found</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
