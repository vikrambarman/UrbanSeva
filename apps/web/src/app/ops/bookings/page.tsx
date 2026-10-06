// app/ops/bookings/page.tsx
// KYA: Bookings list page — filters + table + quick actions
// KYUN: Calling team member yahan se bookings manage karega
//       — assign provider, reschedule, cancel — sab yahan se

"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { 
    Search, Filter, Calendar, Phone, User, MapPin, 
    ChevronLeft, ChevronRight, Eye, Clock, CheckCircle2,
    XCircle, Truck, Wrench, AlertCircle
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"

interface Booking {
    id: string
    bookingNumber: string
    status: string
    scheduledDate: string
    scheduledTime: string
    totalAmount: number
    user: {
        id: string
        name: string | null
        phone: string
    }
    service: {
        id: string
        name: string
        image: string | null
        subCategory: {
            name: string
            category: {
                name: string
            }
        }
    }
    provider: {
        id: string
        user: {
            name: string | null
            phone: string
        }
    } | null
    address: {
        fullAddress: string
        area: string
    }
    payment: {
        status: string
        amount: number
    } | null
}

// Status badge config
const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
    PROVIDER_ASSIGNED: { label: 'Assigned', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    PROVIDER_TRAVELLING: { label: 'Travelling', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
    SERVICE_STARTED: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Wrench },
    SERVICE_COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    REFUND_INITIATED: { label: 'Refund', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    REFUNDED: { label: 'Refunded', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
}

export default function OpsBookingsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isAuthenticated } = useAuthStore()

    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState(
        searchParams.get('status') || 'ALL'
    )
    const [categoryFilter, setCategoryFilter] = useState(
        searchParams.get('categoryId') || ''
    )
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // ═══════════════════════════════════════════════════════════════
    // Auth check
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/ops/login')
        }
    }, [isAuthenticated, router])

    // ═══════════════════════════════════════════════════════════════
    // Fetch bookings
    // ═══════════════════════════════════════════════════════════════
    const fetchBookings = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', '20')
            if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter)
            if (categoryFilter) params.set('categoryId', categoryFilter)
            if (search) params.set('search', search)

            const res = await apiFetch(`/api/ops/bookings?${params.toString()}`)
            const data = await res.json()

            if (data.success) {
                setBookings(data.data.bookings)
                setTotalPages(data.data.pagination.totalPages)
                setTotal(data.data.pagination.total)
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error)
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, categoryFilter, search])

    useEffect(() => {
        fetchBookings()
    }, [fetchBookings])

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
            fetchBookings()
        }, 500)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || statusConfig.PENDING
        const Icon = config.icon
        return (
            <Badge className={`${config.color} border text-xs`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Header */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div>
                <h1 className="text-2xl font-bold">Bookings Management</h1>
                <p className="text-muted-foreground mt-1">
                    {total} total bookings • Page {page} of {totalPages}
                </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Filters */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by booking #, customer name, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1) }}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                <SelectItem value="PROVIDER_ASSIGNED">Assigned</SelectItem>
                                <SelectItem value="PROVIDER_TRAVELLING">Travelling</SelectItem>
                                <SelectItem value="SERVICE_STARTED">In Progress</SelectItem>
                                <SelectItem value="SERVICE_COMPLETED">Completed</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category Filter */}
                        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1) }}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Categories</SelectItem>
                                {/* Categories will be loaded from stats API or hardcoded for now */}
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                <SelectItem value="electrical">Electrical</SelectItem>
                                <SelectItem value="ac-service">AC Service</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Bookings Table */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        All Bookings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No bookings found</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking #</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Service</TableHead>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bookings.map((booking) => (
                                            <TableRow key={booking.id} className="hover:bg-muted/50">
                                                <TableCell className="font-mono text-sm font-medium">
                                                    #{booking.bookingNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {booking.user.name || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {booking.user.phone}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {booking.service.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {booking.service.subCategory.category.name}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {formatDate(booking.scheduledDate)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {booking.scheduledTime}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-[150px]">
                                                        <p className="text-sm truncate">
                                                            {booking.address.area}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            <MapPin className="h-3 w-3 inline mr-1" />
                                                            {booking.address.fullAddress.slice(0, 40)}...
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {booking.provider ? (
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {booking.provider.user.name || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {booking.provider.user.phone}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                            <User className="h-3 w-3 mr-1" />
                                                            Unassigned
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(booking.status)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/ops/bookings/${booking.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {bookings.map((booking) => (
                                    <Link key={booking.id} href={`/ops/bookings/${booking.id}`}>
                                        <div className="p-4 rounded-xl border hover:border-primary/50 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-mono text-sm font-bold">
                                                        #{booking.bookingNumber}
                                                    </p>
                                                    <p className="text-sm font-medium mt-1">
                                                        {booking.user.name || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {booking.user.phone}
                                                    </p>
                                                </div>
                                                {getStatusBadge(booking.status)}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    {booking.service.name}
                                                </span>
                                                <span className="font-medium">
                                                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                <span>
                                                    {formatDate(booking.scheduledDate)} • {booking.scheduledTime}
                                                </span>
                                                <span>
                                                    {booking.provider ? `👤 ${booking.provider.user.name}` : '⚠️ Unassigned'}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium">
                                            {page} / {totalPages}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}