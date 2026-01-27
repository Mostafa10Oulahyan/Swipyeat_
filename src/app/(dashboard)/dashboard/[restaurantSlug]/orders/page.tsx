"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Printer,
  X,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Armchair,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { UIOrderStatus } from "@/types/order";
import CancellationModal from "@/components/CancellationModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { getOrdersAction, updateOrderStatusAction, cancelOrderAction, deleteOrderAction } from "@/app/actions/orders";
import { getRestaurantBySlugAction } from "@/app/actions/restaurant";
import { transformOrderForUI } from "@/lib/orderUtils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function OrdersPage() {
  const params = useParams();
  const restaurantSlug = params.restaurantSlug as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<UIOrderStatus | 'ALL'>('ALL');
  const [filterTableType, setFilterTableType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const itemsPerPage = 9;


  const [showCancellation, setShowCancellation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch restaurant and orders from database
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        // Get current user for actions
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        // Get restaurant ID
        const restoRes = await getRestaurantBySlugAction(restaurantSlug);
        if (restoRes.success && restoRes.data) {
          setRestaurant(restoRes.data);

          // Fetch initial orders
          await fetchOrders(restoRes.data.id);

          // SET UP REALTIME SUBSCRIPTION
          const channel = supabase
            .channel('orders-realtime')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `restaurant_id=eq.${restoRes.data.id}`
              },
              (payload) => {
                // Refresh orders on any change
                fetchOrders(restoRes.data.id);
              }
            )
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (error) {
        console.error("Error initializing:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, [restaurantSlug]);

  // Separate fetch function to be called by filters/realtime
  const fetchOrders = async (restaurantId: string) => {
    try {
      const ordersRes = await getOrdersAction(restaurantId, {
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        tableType: filterTableType === 'ALL' ? undefined : filterTableType
      });

      if (ordersRes.success && ordersRes.data) {
        const transformedOrders = ordersRes.data.map(transformOrderForUI);
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (restaurant?.id) {
      fetchOrders(restaurant.id);
    }
  }, [filterStatus, filterTableType]);

  // Filter Logic (now applied to fetched data)
  const filteredOrders = orders.filter(order => {
    const statusMatch = filterStatus === 'ALL' ||
      (order.status === filterStatus) || // Both are Uppercase now
      (filterStatus === 'SERVED' && order.status === 'SERVED') ||
      (filterStatus === 'CANCELLED' && order.status === 'CANCELLED');
    const tableMatch = filterTableType === 'ALL' ||
      (filterTableType === 'Table' && order.table.startsWith('Table')) ||
      order.table.includes(filterTableType);
    return statusMatch && tableMatch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const STATUS_FILTERS: (UIOrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

  // Status Badge Colors - updated to handle database status
  const getStatusColor = (status: string) => {
    const dbStatus = status.toLowerCase();
    switch (dbStatus) {
      case "ordered":
      case "pending":
        return "bg-gray-100 text-gray-500 border-gray-200";
      case "confirmed":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "preparing":
        return "bg-green-100 text-green-700 border-green-200";
      case "ready":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "served":
      case "delivered":
        return "bg-gray-800 text-white border-gray-800";
      case "paid":
        return "bg-[#559701] text-white border-[#559701]";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  // Timeline Helper with live updates
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1); // Force re-render every second
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const TimelineItem = ({ status, time, user, duration, isLive, isCompleted, isCurrent, isLast }: any) => {
    return (
      <div className="relative pl-8 pb-6 last:pb-0">
        {!isLast && (
          <div className={`absolute left-[11px] top-3 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`}></div>
        )}
        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-all
          ${isCompleted ? 'bg-green-500 border-green-500' :
            isCurrent ? 'bg-green-500 border-green-200 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]' :
              'bg-white border-gray-200'
          }`}>
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm font-bold uppercase tracking-wide ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
              {status}
            </h4>
            {duration && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLive
                ? 'bg-red-50 text-red-500 border border-red-200'
                : duration.startsWith('Expected')
                  ? 'text-gray-400'
                  : 'text-gray-500'
                }`}>
                {isLive ? 'Live: ' : duration.startsWith('Expected') ? '' : 'Final: '}
                {duration.replace('Expected: ', 'Expected: ')}
              </span>
            )}
          </div>
          {time && (
            <div className="text-xs text-gray-500">
              {time}
            </div>
          )}
          {!time && !isCompleted && (
            <div className="text-xs text-gray-400 italic">
              {status === 'PAID' ? 'Waiting for payment' : 'Waiting for kitchen signal'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-gray-50/50 overflow-hidden font-sans">
      {/* LEFT PANEL: Grid of Active Orders */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
        {/* Header - REMOVED Filter Button */}
        <div className="px-8 py-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Active Orders</h1>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                {filteredOrders.length} Results
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              if (restaurant) fetchOrders(restaurant.id).finally(() => setIsLoading(false));
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all active:scale-[0.98]"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="px-8 py-4 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide bg-gray-50/50">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all
                ${filterStatus === status
                  ? 'bg-green-600 text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100'}
              `}
            >
              {status}
              {filterStatus === status && <CheckCircle2 className="w-3 h-3" />}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="p-8 pt-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedOrders.map((order) => {
              const isActive = selectedOrderId === order.id;
              const isLate = parseInt(order.elapsedTime) > 20;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white group hover:shadow-lg
                    ${isActive ? "border-[#559701] shadow-md ring-1 ring-[#559701]/20" : "border-gray-100 hover:border-[#559701]/50"}
                  `}
                >
                  {isActive && <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#559701] rounded-l-2xl"></div>}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Table</span>
                      <h3 className="text-xl font-bold text-gray-900 mt-0.5">{order.table}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{order.items.reduce((acc: number, i: any) => acc + i.quantity, 0)} Items</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-sm font-bold ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
                      <Clock className="w-4 h-4" />
                      {order.elapsedTime}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Creative Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between px-8">
            <span className="text-sm text-gray-500 font-medium">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>

            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>

              <div className="flex items-center px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                  .map((page, idx, arr) => (
                    <div key={page} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-400 px-2">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all mx-0.5
                                            ${currentPage === page
                            ? 'bg-[#559701] text-white shadow-md'
                            : 'text-gray-500 hover:bg-white hover:text-[#559701]'}
                                        `}
                      >
                        {page}
                      </button>
                    </div>
                  ))
                }
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Advanced Order Detail */}
      <div className="w-[480px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
        {selectedOrder ? (
          <>
            {/* Detail Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Advanced Order Detail</h2>
                <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
              </div>

              {/* Staff Card REMOVED as requested */}
              {/* <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between mb-6">...</div> */}
              <div className="bg-gray-50/50 p-3 rounded-xl mb-6 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Elapsed Time</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{selectedOrder.elapsedTime}</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Order No.</span>
                  <span className="text-base font-bold text-gray-900">{selectedOrder.orderNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Table</span>
                  <span className="text-base font-bold text-gray-900">{selectedOrder.table}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Total</span>
                  <span className="text-base font-bold text-green-600">{selectedOrder.total.toFixed(2)} DH</span>
                </div>
              </div>
            </div>

            {/* Timeline & Details Scroll */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Notes Section - New */}
              {(selectedOrder.customerNote || selectedOrder.waiterNotes) && (
                <div className="mb-6 space-y-3">
                  {selectedOrder.customerNote && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Customer Note</span>
                      <p className="text-sm text-gray-700 italic">"{selectedOrder.customerNote}"</p>
                    </div>
                  )}
                  {selectedOrder.waiterNotes && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Waiter Note</span>
                      <p className="text-sm text-gray-700 italic">"{selectedOrder.waiterNotes}"</p>
                    </div>
                  )}
                </div>
              )}
              {/* Live Time Event Workflow */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  Live Time Event Workflow
                </h3>
                <div className="pl-2">
                  {selectedOrder.timeline.map((event: any, idx: number) => (
                    <TimelineItem
                      key={idx}
                      {...event}
                      isCompleted={event.completed}
                      isCurrent={!event.completed && selectedOrder.timeline[idx - 1]?.completed}
                      isLast={idx === selectedOrder.timeline.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Detailed Event Log */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  Detailed Event Log
                </h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-100">
                        <th className="text-left py-2.5 px-3 font-bold text-gray-600 uppercase tracking-wider">Event</th>
                        <th className="text-right py-2.5 px-3 font-bold text-gray-600 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.timeline
                        .filter((event: any) => event.time)
                        .map((event: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                            <td className="py-2.5 px-3 font-medium text-gray-700">Status: {event.status}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600 font-mono">{event.time}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white space-y-3">
              {selectedOrder.status !== 'CANCELLED' && (
                <button
                  onClick={async () => {
                    if (!restaurant || !selectedOrder) return;

                    // Determine next status based on current status
                    let nextStatus = 'SERVED';
                    if (selectedOrder.status === 'ordered' || selectedOrder.status === 'PENDING') nextStatus = 'CONFIRMED';
                    else if (selectedOrder.status === 'CONFIRMED') nextStatus = 'PREPARING';
                    else if (selectedOrder.status === 'PREPARING') nextStatus = 'READY';
                    else if (selectedOrder.status === 'READY') nextStatus = 'SERVED';
                    else if (selectedOrder.status === 'SERVED') nextStatus = 'PAID';

                    console.log("Updating order:", {
                      id: selectedOrder.id,
                      currentStatus: selectedOrder.status,
                      nextStatus,
                      userId: currentUserId
                    });

                    if (!selectedOrder.id) {
                      toast.error("Invalid order ID");
                      return;
                    }

                    // For PAID status, we might want to capture payment method (Cash by default or prompt)
                    // For now, we'll default to Cash as per request implication "Facture just with cash" or similar
                    const paymentDetails = nextStatus === 'PAID' ? { paymentMethod: 'Cash', customerEmail: '' } : undefined;

                    const result = await updateOrderStatusAction(
                      selectedOrder.id,
                      nextStatus,
                      currentUserId || 'system',
                      undefined,
                      paymentDetails
                    );
                    if (result.success) {
                      toast.success(`Order marked as ${nextStatus.toLowerCase()}`);
                      if (nextStatus === 'PAID') {
                        setSelectedOrderId(null); // Clear selection as it will vanish
                      }
                    } else {
                      toast.error("Failed to update order");
                    }
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                  ${(selectedOrder.status === 'PAID' || selectedOrder.status === 'CANCELLED')
                      ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed hidden' // Hide if already done/archived
                      : 'bg-[#559701] hover:bg-[#4a8501] text-white shadow-[#559701]/20'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {selectedOrder.status === 'SERVED' ? 'Confirm Payment' :
                    selectedOrder.status === 'READY' ? 'Mark as Served' :
                      selectedOrder.status === 'PREPARING' ? 'Mark as Ready' :
                        selectedOrder.status === 'CONFIRMED' ? 'Start Preparing' :
                          'Confirm Order'}
                </button>
              )}

              <div className="flex items-center gap-3">
                {selectedOrder.status === 'CANCELLED' ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex-1 py-3 border border-red-100 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete Order
                  </button>
                ) : selectedOrder.status === 'SERVED' ? null : (
                  <button
                    onClick={() => setShowCancellation(true)}
                    className="flex-1 py-3 border border-red-100 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Layers className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Selection</h3>
            <p>Select an order to view details</p>
          </div>
        )}
      </div>



      {/* Cancellation Modal */}
      {
        showCancellation && selectedOrder && (
          <CancellationModal
            orderId={selectedOrder.orderNumber}
            table={selectedOrder.table}
            onClose={() => setShowCancellation(false)}
            onConfirm={async (reason, restore) => {
              if (!restaurant || !selectedOrder) return;
              console.log(`Cancelled Order ${selectedOrder.id}:`, { reason, restore });
              const result = await cancelOrderAction(
                selectedOrder.id,
                reason,
                restaurant.id,
                restore
              );
              if (result.success) {
                toast.success("Order cancelled");
                setShowCancellation(false);
                // Real-time will handle refresh
              } else {
                toast.error("Failed to cancel order");
              }
            }}
          />
        )
      }

      {/* Delete Confirmation Modal */}
      {
        showDeleteConfirm && selectedOrder && (
          <ConfirmationModal
            title="Delete Order"
            message={`Are you sure you want to permanently delete Order ${selectedOrder.orderNumber}? This action cannot be undone.`}
            confirmLabel="Delete Permanently"
            variant="danger"
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={async () => {
              if (!selectedOrder) return;
              const result = await deleteOrderAction(selectedOrder.id);
              if (result.success) {
                toast.success("Order deleted successfully");
                setSelectedOrderId(null);
                setShowDeleteConfirm(false);
              } else {
                toast.error("Failed to delete order");
              }
            }}
          />
        )
      }
    </div >
  );
}
