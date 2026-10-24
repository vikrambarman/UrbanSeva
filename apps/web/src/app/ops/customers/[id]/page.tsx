'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Wallet,
    ShoppingBag, Star, Clock, CheckCircle, XCircle,
    CreditCard, User, Activity, FileText, TrendingUp,
    TrendingDown, Award, Crown, Medal, Ban, Edit,
    Eye, ChevronDown, ChevronUp, IndianRupee
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage() {
    const { id } = useParams();
    const { token } = useAuthStore();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!token || !id) return;
        const fetchCustomer = async () => {
            try {
                const res = await fetch(`/api/ops/customers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setCustomer(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [token, id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading customer details...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
            {/* Back Button */}
            <Link href="/ops/customers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
                <ArrowLeft size={16} /> Back to Customers
            </Link>

            {/* Profile Header with Wallet Balance */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white mb-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                        {customer.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold">{customer.name || 'Unnamed User'}</h1>
                            {customer.isVerified && <CheckCircle size={20} className="text-blue-200" />}
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                                {customer.loyaltyTier}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm">
                            <span className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</span>
                            {customer.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {customer.email}</span>}
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(customer.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Wallet Balance - Prominent Display */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[200px]">
                        <div className="flex items-center gap-2 text-blue-100 text-xs font-medium mb-1">
                            <Wallet size={14} /> Wallet Balance
                        </div>
                        <div className="text-3xl font-bold">₹{customer.walletBalance?.toLocaleString() || 0}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-blue-200">
                            <span className="flex items-center gap-1">
                                <TrendingUp size={12} /> +₹{customer.totalWalletCredit?.toLocaleString() || 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <TrendingDown size={12} /> -₹{customer.totalWalletDebit?.toLocaleString() || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <StatCard title="Total Bookings" value={customer.totalBookings} icon={ShoppingBag} color="blue" />
                <StatCard title="Completed" value={customer.completedBookings} icon={CheckCircle} color="green" />
                <StatCard title="Cancelled" value={customer.cancelledBookings} icon={XCircle} color="red" />
                <StatCard title="Total Spent" value={`₹${customer.totalSpent?.toLocaleString() || 0}`} icon={CreditCard} color="purple" />
                <StatCard title="Loyalty Points" value={customer.loyaltyPoints || 0} icon={Star} color="amber" />
                <StatCard title="Reviews Given" value={customer.totalReviews || 0} icon={FileText} color="pink" />
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex gap-6 px-6 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: User },
                            { id: 'bookings', label: 'Bookings', icon: ShoppingBag, count: customer.totalBookings },
                            { id: 'wallet', label: 'Wallet', icon: Wallet, count: customer.walletTxns?.length },
                            { id: 'reviews', label: 'Reviews', icon: Star, count: customer.totalReviews },
                            { id: 'addresses', label: 'Addresses', icon: MapPin, count: customer.totalAddresses },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && <OverviewTab customer={customer} />}
                    {activeTab === 'bookings' && <BookingsTab bookings={customer.bookings} />}
                    {activeTab === 'wallet' && <WalletTab transactions={customer.walletTxns} balance={customer.walletBalance} />}
                    {activeTab === 'reviews' && <ReviewsTab reviews={customer.reviews} />}
                    {activeTab === 'addresses' && <AddressesTab addresses={customer.addresses} />}
                </div>
            </div>
        </div>
    );
}

// Overview Tab
function OverviewTab({ customer }: any) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Details */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={20} /> Account Details
                </h3>
                <dl className="space-y-3">
                    <DetailRow label="User ID" value={customer.id} />
                    <DetailRow label="Status" value={customer.isActive ? 'Active' : 'Inactive'} isSuccess={customer.isActive} />
                    <DetailRow label="Verified" value={customer.isVerified ? 'Yes' : 'No'} isSuccess={customer.isVerified} />
                    <DetailRow label="Loyalty Tier" value={customer.loyaltyTier} />
                    <DetailRow label="Loyalty Points" value={customer.loyaltyPoints || 0} />
                    <DetailRow label="Referral Code" value={customer.referralCode} />
                    <DetailRow label="Last Login" value={customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString() : 'Never'} />
                    <DetailRow label="Login Count" value={customer.loginCount || 0} />
                    <DetailRow label="Joined On" value={new Date(customer.createdAt).toLocaleString()} />
                </dl>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={20} /> Recent Activity
                </h3>
                <div className="space-y-3">
                    {customer.bookings?.slice(0, 5).map((booking: any) => (
                        <div key={booking.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <ShoppingBag size={18} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{booking.service?.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(booking.scheduledDate).toLocaleDateString()} • ₹{booking.totalAmount}
                                </p>
                            </div>
                            <StatusBadge status={booking.status} />
                        </div>
                    ))}
                    {(!customer.bookings || customer.bookings.length === 0) && (
                        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Bookings Tab
function BookingsTab({ bookings }: any) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (!bookings || bookings.length === 0) {
        return <p className="text-center text-gray-500 py-12">No bookings found.</p>;
    }

    return (
        <div className="space-y-3">
            {bookings.map((booking: any) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {booking.bookingNumber?.slice(-2) || 'B'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">{booking.service?.name}</p>
                                    <StatusBadge status={booking.status} />
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTime}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="font-bold text-gray-900">₹{booking.totalAmount}</p>
                                <p className="text-xs text-gray-500">{booking.paymentStatus}</p>
                            </div>
                            {expandedId === booking.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                    </div>

                    {expandedId === booking.id && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Booking ID</p>
                                    <p className="text-sm text-gray-900">{booking.bookingNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Payment Method</p>
                                    <p className="text-sm text-gray-900">{booking.paymentMethod || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                                    <p className="text-sm text-gray-900">{booking.address?.fullAddress}, {booking.address?.area}</p>
                                </div>
                                {booking.provider && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">Provider</p>
                                        <p className="text-sm text-gray-900">{booking.provider.user?.name}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Base Amount</p>
                                    <p className="text-sm text-gray-900">₹{booking.baseAmount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Discount</p>
                                    <p className="text-sm text-gray-900">₹{booking.discountAmount}</p>
                                </div>
                                {booking.specialInstructions && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Special Instructions</p>
                                        <p className="text-sm text-gray-900">{booking.specialInstructions}</p>
                                    </div>
                                )}
                                {booking.review && (
                                    <div className="md:col-span-2 bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Customer Review</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star size={14} className="text-amber-500 fill-amber-500" />
                                            <span className="text-sm font-medium">{booking.review.overallRating}/5</span>
                                        </div>
                                        {booking.review.comment && <p className="text-sm text-gray-700">{booking.review.comment}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Wallet Tab
function WalletTab({ transactions, balance }: any) {
    if (!transactions || transactions.length === 0) {
        return <p className="text-center text-gray-500 py-12">No wallet transactions found.</p>;
    }

    return (
        <div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-700 font-medium mb-1">Current Wallet Balance</p>
                        <p className="text-3xl font-bold text-green-900">₹{balance?.toLocaleString() || 0}</p>
                    </div>
                    <Wallet size={48} className="text-green-600 opacity-20" />
                </div>
            </div>

            <div className="space-y-2">
                {transactions.map((txn: any) => (
                    <div key={txn.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.type === 'CREDIT' || txn.type === 'REFUND' || txn.type === 'CASHBACK'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                {txn.type === 'CREDIT' || txn.type === 'REFUND' || txn.type === 'CASHBACK' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{txn.description}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {new Date(txn.createdAt).toLocaleString()} • Type: {txn.type}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold ${txn.type === 'CREDIT' || txn.type === 'REFUND' || txn.type === 'CASHBACK'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}>
                                {txn.type === 'CREDIT' || txn.type === 'REFUND' || txn.type === 'CASHBACK' ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">Balance: ₹{txn.balance.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Reviews Tab
function ReviewsTab({ reviews }: any) {
    if (!reviews || reviews.length === 0) {
        return <p className="text-center text-gray-500 py-12">No reviews given yet.</p>;
    }

    return (
        <div className="space-y-3">
            {reviews.map((review: any) => (
                <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <p className="font-medium text-gray-900">{review.service?.name}</p>
                            <p className="text-xs text-gray-500">Booking: {review.booking?.bookingNumber}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star size={16} className="text-amber-500 fill-amber-500" />
                            <span className="font-bold text-gray-900">{review.overallRating}</span>
                            <span className="text-gray-500">/5</span>
                        </div>
                    </div>
                    {review.comment && (
                        <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

// Addresses Tab
function AddressesTab({ addresses }: any) {
    if (!addresses || addresses.length === 0) {
        return <p className="text-center text-gray-500 py-12">No saved addresses.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr: any) => (
                <div key={addr.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <MapPin size={18} className="text-blue-600" />
                            <p className="font-medium text-gray-900">{addr.label}</p>
                        </div>
                        {addr.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Default</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{addr.fullAddress}</p>
                    <p className="text-sm text-gray-600 mt-1">{addr.area} - {addr.pincode}</p>
                    {addr.landmark && (
                        <p className="text-xs text-gray-500 mt-1">Landmark: {addr.landmark}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                        Added: {new Date(addr.createdAt).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

// Helper Components
function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
        pink: 'bg-pink-50 text-pink-600',
    };
    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon size={20} />
            </div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

function DetailRow({ label, value, isSuccess }: any) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className={`text-sm font-medium ${isSuccess === true ? 'text-green-600' : isSuccess === false ? 'text-red-600' : 'text-gray-900'}`}>
                {value}
            </dd>
        </div>
    );
}

function StatusBadge({ status }: any) {
    const getStatusStyle = (status: string) => {
        if (status === 'SERVICE_COMPLETED') return 'bg-green-100 text-green-700';
        if (status.includes('CANCELLED')) return 'bg-red-100 text-red-700';
        if (['PENDING', 'CONFIRMED', 'PROVIDER_ASSIGNED'].includes(status)) return 'bg-blue-100 text-blue-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(status)}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}