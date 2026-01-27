"use client";

import { Edit2, Trash2, MoreVertical, Search, Filter, Key, Check, Copy, AlertTriangle, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { resetStaffPasswordAction } from "@/app/actions/staff";
import ConfirmationModal from "@/components/dashboard/ConfirmationModal";

interface StaffMember {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    avatar_url?: string;
}

interface StaffTableProps {
    staff: StaffMember[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export default function StaffTable({ staff, onEdit, onDelete, onToggleStatus }: StaffTableProps) {
    const params = useParams();
    const restaurantSlug = params.restaurantSlug as string;

    const [resetData, setResetData] = useState<{ id: string, code: string } | null>(null);
    const [isResetting, setIsResetting] = useState<string | null>(null);
    const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case "manager":
                return "bg-purple-50 text-purple-600 border-purple-100";
            case "head chef":
            case "chef":
                return "bg-orange-50 text-orange-600 border-orange-100";
            case "waiter":
                return "bg-green-50 text-green-600 border-green-100";
            default:
                return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const handleResetPassword = async () => {
        if (!confirmResetId) return;

        setIsResetting(confirmResetId);
        setConfirmResetId(null); // Clear the ID immediately after starting the reset
        try {
            const result = await resetStaffPasswordAction(confirmResetId, restaurantSlug);
            if (result.success && result.tempPassword) {
                setResetData({ id: confirmResetId, code: result.tempPassword });
            } else {
                alert("Failed to reset password: " + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsResetting(null);
        }
    };

    const copyToClipboard = () => {
        if (resetData) {
            navigator.clipboard.writeText(resetData.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={!!confirmResetId}
                onClose={() => setConfirmResetId(null)}
                onConfirm={handleResetPassword}
                title="Reset Password?"
                message="This will generate a temporary code. The staff member must change it on their next login."
                confirmText="Yes, Reset"
                type="warning"
                isLoading={isResetting === confirmResetId}
            />

            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => {
                    if (confirmDeleteId) {
                        onDelete(confirmDeleteId);
                        setConfirmDeleteId(null);
                    }
                }}
                title="Remove Staff?"
                message="Are you sure you want to remove this staff member? This action cannot be undone."
                confirmText="Yes, Remove"
                type="danger"
            />

            {/* Reset Success Modal */}
            {resetData && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-300">
                    <div className="bg-[#1a1a1a] text-white rounded-[40px] p-8 md:p-12 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-white/5 overflow-hidden relative">
                        {/* Red Header Bar */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-[#ff4d4d]/10 border-b border-[#ff4d4d]/20 flex items-center px-8 gap-4">
                            <div className="w-10 h-10 bg-[#ff4d4d] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#ff4d4d]/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#ff4d4d]">Critical Security Notice</h3>
                                <p className="text-[10px] text-[#ff4d4d]/80 font-bold max-w-[280px]">This code will never be shown again. Please share it with the staff member immediately.</p>
                            </div>
                            <button onClick={() => setResetData(null)} className="ml-auto p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        <div className="pt-24 space-y-12 text-center">
                            <div className="space-y-4 pt-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Temporary Credential</p>
                                <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-10 group hover:border-[#559701]/50 transition-colors">
                                    <span className="text-4xl md:text-5xl font-black tracking-[0.15em] text-white font-mono break-all leading-tight">
                                        {resetData.code}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={copyToClipboard}
                                    className="w-full bg-[#559701] hover:bg-[#4a8001] text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#559701]/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                    {copied ? "Copied to Clipboard" : "Copy to Clipboard"}
                                </button>

                                <button
                                    onClick={() => setResetData(null)}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black text-lg transition-all border border-white/10 flex items-center justify-center gap-3"
                                >
                                    <Check className="w-6 h-6 text-[#559701]" />
                                    I have securely saved this code
                                </button>
                            </div>

                            <p className="text-[9px] text-white/30 font-bold leading-relaxed max-w-[300px] mx-auto uppercase tracking-wider">
                                Security Policy: Temporary passwords expire after 24 hours if not used. This action has been logged in the audit trail.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-50 bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {staff.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 overflow-hidden">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                member.name.split(" ").map(n => n[0]).join("")
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{member.name}</p>
                                            <p className="text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(member.role)}`}>
                                        {member.role === 'kitchen_staff' ? 'Chef' : member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => onToggleStatus(member.id, member.is_active)}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${member.is_active ? "bg-[#559701]" : "bg-gray-200"}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${member.is_active ? "translate-x-5" : ""}`} />
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onEdit(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit Staff"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setConfirmResetId(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            disabled={isResetting === member.id}
                                            title="Reset Password"
                                        >
                                            {isResetting === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Staff"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {staff.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-gray-500">No staff members found.</p>
                </div>
            )}
        </div>
    );
}
