'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, Search, Filter, ChevronLeft, ChevronRight, 
  Wallet, ShoppingBag, Mail, Phone, Calendar, 
  MoreHorizontal, Eye, Ban, CheckCircle, XCircle,
  Crown, Award, Medal, Star
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  avatar: string | null;
  isActive: boolean;
  isVerified: boolean;
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  lastLoginAt: string | null;
  createdAt: string;
  totalBookings: number;
  totalSpent: number;
  totalAddresses: number;
}

export default function CustomerHelpdeskPage() {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetchCustomers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(tierFilter && { tier: tierFilter }),
      });

      const res = await fetch(`/api/ops/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter, tierFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const getTierBadge = (tier: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      PLATINUM: { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-700', icon: Crown },
      GOLD: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Award },
      SILVER: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', icon: Medal },
      BRONZE: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: Star },
    };
    const c = config[tier] || config.BRONZE;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
        <Icon size={12} /> {tier}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Helpdesk</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your customers, view their bookings, and handle wallet adjustments.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Customers" value={pagination.total} icon={Users} color="blue" />
        <StatCard title="Total Bookings" value={customers.reduce((acc, c) => acc + c.totalBookings, 0)} icon={ShoppingBag} color="purple" />
        <StatCard title="Total Revenue" value={`₹${customers.reduce((acc, c) => acc + c.totalSpent, 0).toLocaleString()}`} icon={Wallet} color="green" />
        <StatCard title="Active Wallet Balance" value={`₹${customers.reduce((acc, c) => acc + c.walletBalance, 0).toLocaleString()}`} icon={Wallet} color="orange" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select 
              value={tierFilter} 
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Tiers</option>
              <option value="PLATINUM">Platinum</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="BRONZE">Bronze</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Loyalty Tier</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Bookings</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading customers...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No customers found.</td></tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {customer.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name || 'No Name'}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>
                            {customer.email && <span className="flex items-center gap-1"><Mail size={10} /> {customer.email}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTierBadge(customer.loyaltyTier)}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{customer.walletBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.totalBookings}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{customer.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      {customer.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle size={10} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/ops/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && customers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to <span className="font-medium">{Math.min(page * 20, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}