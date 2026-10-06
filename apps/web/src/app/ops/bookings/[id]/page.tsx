// apps/web/src/app/ops/bookings/[id]/page.tsx
// CHANGE: Provider Change feature add kiya (jab provider already assigned ho)
// CHANGE: Internal Notes feature add kiya (Add Note button + modal)
// CHANGE: Note API call add kiya
// WHY: Ops team ko provider change karne ka option chahiye (agar customer bole ya provider unavailable ho)
//      Internal notes team coordination ke liye zaroori hain

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    ArrowLeft, Phone, User, MapPin, Calendar, Clock,
    CheckCircle2, XCircle, Truck, Wrench, AlertCircle,
    IndianRupee, CreditCard, Headphones, Search,
    UserPlus, CalendarClock, XCircleIcon, FileText, Star,
    Mail, MessageCircle, Briefcase, RefreshCw, StickyNote
} from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"
import Link from "next/link"

interface BookingDetail {
    id: string
    bookingNumber: string
    status: string
    scheduledDate: string
    scheduledTime: string
    baseAmount: number
    addOnAmount: number
    discountAmount: number
    totalAmount: number
    specialInstructions: string | null
    cancelReason: string | null
    createdAt: string
    user: { id: string; name: string | null; phone: string; email: string | null }
    service: {
        id: string; name: string; image: string | null; basePrice: number
        subCategory: { name: string; category: { name: string } }
    }
    provider: {
        id: string
        bio: string | null
        experience: number
        avgRating: number
        user: { name: string | null; phone: string; email: string | null }
        services: {
            service: {
                id: string
                name: string
                subCategory: { category: { name: string } }
            }
        }[]
    } | null
    address: { label: string; fullAddress: string; area: string; landmark: string | null; pincode: string }
    payment: { id: string; amount: number; status: string; method: string | null; paidAt: string | null } | null
    statusHistory: { id: string; status: string; note: string | null; createdAt: string }[]
    assignmentLogs: {
        id: string; action: string; fromValue: string | null; toValue: string | null
        notes: string | null; createdAt: string
        assignedBy: { name: string | null; phone: string }
    }[]
}

interface Provider {
    id: string
    user: { name: string | null; phone: string; email: string | null }
    bio: string | null
    experience: number
    avgRating: number
    isAvailable: boolean
    completedJobs: number
    services: { id: string; name: string; category: string }[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
    PROVIDER_ASSIGNED: { label: 'Assigned', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    PROVIDER_TRAVELLING: { label: 'Travelling', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Truck },
    SERVICE_STARTED: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Wrench },
    SERVICE_COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
}

export default function OpsBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { user } = useAuthStore()
    const [bookingId, setBookingId] = useState<string>('')
    const [booking, setBooking] = useState<BookingDetail | null>(null)
    const [loading, setLoading] = useState(true)

    // Modals
    const [assignModal, setAssignModal] = useState(false)
    const [rescheduleModal, setRescheduleModal] = useState(false)
    const [cancelModal, setCancelModal] = useState(false)
    const [noteModal, setNoteModal] = useState(false) // CHANGE: Note modal

    // CHANGE: Track if we're changing provider (vs initial assign)
    const [isChangingProvider, setIsChangingProvider] = useState(false)

    // Assign form
    const [providers, setProviders] = useState<Provider[]>([])
    const [searchProvider, setSearchProvider] = useState('')
    const [selectedProvider, setSelectedProvider] = useState('')
    const [assignNotes, setAssignNotes] = useState('')
    const [searchingProviders, setSearchingProviders] = useState(false)
    const [providersLoaded, setProvidersLoaded] = useState(false)

    // Reschedule form
    const [newDate, setNewDate] = useState('')
    const [newTime, setNewTime] = useState('')
    const [rescheduleNotes, setRescheduleNotes] = useState('')

    // Cancel form
    const [cancelReason, setCancelReason] = useState('')
    const [cancelNotes, setCancelNotes] = useState('')

    // CHANGE: Note form
    const [noteText, setNoteText] = useState('')
    const [noteLoading, setNoteLoading] = useState(false)

    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        params.then(p => setBookingId(p.id))
    }, [params])

    useEffect(() => {
        if (bookingId) fetchBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId])

    const fetchBooking = async () => {
        if (!bookingId) return
        setLoading(true)
        try {
            const res = await apiFetch(`/api/ops/bookings/${bookingId}`, {
                cache: 'no-store',
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                setBooking(data.data)
            } else {
                toast.error(data.error || 'Failed to load booking')
            }
        } catch {
            toast.error('Failed to load booking')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (assignModal && !providersLoaded && booking) {
            fetchProvidersForCategory()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignModal])

    const fetchProvidersForCategory = async () => {
        setSearchingProviders(true)
        try {
            const categoryName = booking?.service.subCategory.category.name || ''
            const res = await apiFetch(`/api/ops/providers/search?category=${encodeURIComponent(categoryName)}`, {
                cache: 'no-store',
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                setProviders(data.data)
                setProvidersLoaded(true)
            }
        } catch {
            toast.error('Failed to load providers')
        } finally {
            setSearchingProviders(false)
        }
    }

    const searchProviders = async () => {
        if (!searchProvider.trim()) {
            fetchProvidersForCategory()
            return
        }
        setSearchingProviders(true)
        try {
            const res = await apiFetch(`/api/ops/providers/search?query=${encodeURIComponent(searchProvider)}`, {
                cache: 'no-store',
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                setProviders(data.data)
            }
        } catch {
            toast.error('Failed to search providers')
        } finally {
            setSearchingProviders(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedProvider) { toast.error('Select a provider'); return }
        setActionLoading(true)
        try {
            const res = await apiFetch(`/api/ops/bookings/${bookingId}/assign`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ providerId: selectedProvider, notes: assignNotes }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setAssignModal(false)
                setSelectedProvider('')
                setAssignNotes('')
                setProvidersLoaded(false)
                setIsChangingProvider(false)
                fetchBooking()
            } else {
                toast.error(data.error || 'Failed to assign')
            }
        } catch {
            toast.error('Failed to assign provider')
        } finally {
            setActionLoading(false)
        }
    }

    // CHANGE: Provider change handler
    const handleChangeProvider = () => {
        setIsChangingProvider(true)
        setProvidersLoaded(false) // Force reload providers
        setAssignModal(true)
    }

    // CHANGE: Add note handler
    const handleAddNote = async () => {
        if (!noteText.trim()) {
            toast.error('Note cannot be empty')
            return
        }
        setNoteLoading(true)
        try {
            const res = await apiFetch(`/api/ops/bookings/${bookingId}/note`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ note: noteText.trim() }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Note added successfully')
                setNoteModal(false)
                setNoteText('')
                fetchBooking()
            } else {
                toast.error(data.error || 'Failed to add note')
            }
        } catch {
            toast.error('Failed to add note')
        } finally {
            setNoteLoading(false)
        }
    }

    const handleReschedule = async () => {
        if (!newDate || !newTime) { toast.error('Select date and time'); return }
        setActionLoading(true)
        try {
            const res = await apiFetch(`/api/ops/bookings/${bookingId}/reschedule`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ newDate, newTime, notes: rescheduleNotes }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message)
                setRescheduleModal(false)
                setNewDate('')
                setNewTime('')
                setRescheduleNotes('')
                fetchBooking()
            } else {
                toast.error(data.error || 'Failed to reschedule')
            }
        } catch {
            toast.error('Failed to reschedule')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!cancelReason) { toast.error('Reason is required'); return }
        setActionLoading(true)
        try {
            const res = await apiFetch(`/api/ops/bookings/${bookingId}/cancel`, {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({ reason: cancelReason, notes: cancelNotes }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Booking cancelled')
                setCancelModal(false)
                setCancelReason('')
                setCancelNotes('')
                fetchBooking()
            } else {
                toast.error(data.error || 'Failed to cancel')
            }
        } catch {
            toast.error('Failed to cancel booking')
        } finally {
            setActionLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || statusConfig.PENDING
        const Icon = config.icon
        return (
            <Badge className={`${config.color} border text-sm`}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        )
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
    }

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-96 lg:col-span-2" />
                    <Skeleton className="h-96" />
                </div>
            </div>
        )
    }

    if (!booking) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Booking not found</p>
                    <Button onClick={() => router.push('/ops/bookings')} className="mt-4">
                        Back to Bookings
                    </Button>
                </div>
            </div>
        )
    }

    const canAssign = ['PENDING', 'CONFIRMED'].includes(booking.status)
    const canChangeProvider = ['PROVIDER_ASSIGNED', 'PROVIDER_TRAVELLING'].includes(booking.status) && booking.provider
    const canReschedule = !['CANCELLED', 'REFUNDED', 'SERVICE_COMPLETED'].includes(booking.status)
    const canCancel = !['CANCELLED', 'REFUNDED'].includes(booking.status)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/ops/bookings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Headphones className="h-6 w-6 text-primary" />
                            #{booking.bookingNumber}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(booking.status)}
                            <span className="text-sm text-muted-foreground">
                                {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    {canAssign && (
                        <Button onClick={() => { setIsChangingProvider(false); setAssignModal(true) }} size="sm">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Provider
                        </Button>
                    )}
                    {canChangeProvider && (
                        <Button onClick={handleChangeProvider} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Change Provider
                        </Button>
                    )}
                    {canReschedule && (
                        <Button onClick={() => setRescheduleModal(true)} variant="outline" size="sm">
                            <CalendarClock className="h-4 w-4 mr-1" />
                            Reschedule
                        </Button>
                    )}
                    {canCancel && (
                        <Button onClick={() => setCancelModal(true)} variant="destructive" size="sm">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                    )}
                    {/* CHANGE: Add Note Button */}
                    <Button onClick={() => setNoteModal(true)} variant="outline" size="sm">
                        <StickyNote className="h-4 w-4 mr-1" />
                        Add Note
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left — Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{booking.user.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        <a href={`tel:${booking.user.phone}`} className="text-primary hover:underline">
                                            {booking.user.phone}
                                        </a>
                                    </p>
                                </div>
                                {booking.user.email && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{booking.user.email}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-primary" />
                                Service Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                {booking.service.image && (
                                    <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                                        <img src={booking.service.image} alt={booking.service.name} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-medium">{booking.service.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {booking.service.subCategory.category.name} → {booking.service.subCategory.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Base Price: ₹{booking.service.basePrice}
                                    </p>
                                </div>
                            </div>
                            {booking.specialInstructions && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm font-medium text-amber-800">Special Instructions:</p>
                                    <p className="text-sm text-amber-700 mt-1">{booking.specialInstructions}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Address */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                <p className="font-medium">{booking.address.label}</p>
                                <p className="text-sm">{booking.address.fullAddress}</p>
                                <p className="text-sm text-muted-foreground">
                                    {booking.address.area}{booking.address.landmark ? ` (Near: ${booking.address.landmark})` : ''} — {booking.address.pincode}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Log */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.assignmentLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {booking.assignmentLogs.map((log) => (
                                        <div key={log.id} className="flex gap-3 p-3 rounded-lg border">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                {log.action === 'PROVIDER_ASSIGNED' && <UserPlus className="h-4 w-4 text-primary" />}
                                                {log.action === 'RESCHEDULED' && <CalendarClock className="h-4 w-4 text-blue-500" />}
                                                {log.action === 'CANCELLED' && <XCircle className="h-4 w-4 text-destructive" />}
                                                {log.action === 'NOTE_ADDED' && <StickyNote className="h-4 w-4 text-amber-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                    {log.action === 'NOTE_ADDED' ? 'Note Added' : log.action.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    by {log.assignedBy.name || log.assignedBy.phone} • {formatDateTime(log.createdAt)}
                                                </p>
                                                {log.fromValue && log.toValue && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {log.fromValue} → {log.toValue}
                                                    </p>
                                                )}
                                                {log.notes && (
                                                    <p className={`text-xs mt-1 p-2 rounded ${
                                                        log.action === 'NOTE_ADDED' 
                                                            ? 'bg-amber-50 border border-amber-200 text-amber-800' 
                                                            : 'bg-muted'
                                                    }`}>
                                                        {log.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Sidebar Info */}
                <div className="space-y-6">
                    {/* Enhanced Provider Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Assigned Provider
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.provider ? (
                                <div className="space-y-4">
                                    {/* Provider Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg font-bold text-primary">
                                                {(booking.provider.user.name || 'P').charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-base">{booking.provider.user.name || 'N/A'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    <span className="font-medium">{booking.provider.avgRating.toFixed(1)}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground">{booking.provider.experience} yrs exp</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {booking.provider.bio && (
                                        <div className="p-3 bg-muted/50 rounded-lg">
                                            <p className="text-xs text-muted-foreground mb-1">About</p>
                                            <p className="text-sm">{booking.provider.bio}</p>
                                        </div>
                                    )}

                                    {/* Contact Buttons */}
                                    <div className="flex gap-2">
                                        <a 
                                            href={`tel:${booking.provider.user.phone}`}
                                            className="flex-1"
                                        >
                                            <Button variant="outline" size="sm" className="w-full">
                                                <Phone className="h-3 w-3 mr-1" />
                                                Call
                                            </Button>
                                        </a>
                                        <a 
                                            href={`https://wa.me/91${booking.provider.user.phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button variant="outline" size="sm" className="w-full bg-green-50 hover:bg-green-100 border-green-200">
                                                <MessageCircle className="h-3 w-3 mr-1 text-green-600" />
                                                WhatsApp
                                            </Button>
                                        </a>
                                    </div>

                                    {/* Email */}
                                    {booking.provider.user.email && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{booking.provider.user.email}</span>
                                        </div>
                                    )}

                                    {/* Services List */}
                                    {booking.provider.services && booking.provider.services.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                Can Provide ({booking.provider.services.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {booking.provider.services.slice(0, 5).map((ps, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {ps.service.name}
                                                    </Badge>
                                                ))}
                                                {booking.provider.services.length > 5 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{booking.provider.services.length - 5} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* CHANGE: Change Provider Button */}
                                    {canChangeProvider && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full mt-2"
                                            onClick={handleChangeProvider}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Change Provider
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No provider assigned</p>
                                    {canAssign && (
                                        <Button size="sm" className="mt-3" onClick={() => { setIsChangingProvider(false); setAssignModal(true) }}>
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Assign Now
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Base Amount</span>
                                    <span>₹{booking.baseAmount}</span>
                                </div>
                                {booking.addOnAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Add-ons</span>
                                        <span>₹{booking.addOnAmount}</span>
                                    </div>
                                )}
                                {booking.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{booking.discountAmount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Total</span>
                                    <span className="flex items-center gap-1">
                                        <IndianRupee className="h-4 w-4" />
                                        {booking.totalAmount}
                                    </span>
                                </div>
                                {booking.payment && (
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Status</span>
                                            <Badge variant={booking.payment.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                                                {booking.payment.status}
                                            </Badge>
                                        </div>
                                        {booking.payment.method && (
                                            <div className="flex justify-between text-sm mt-1">
                                                <span className="text-muted-foreground">Method</span>
                                                <span>{booking.payment.method}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium">{formatDate(booking.scheduledDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="font-medium">{booking.scheduledTime}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Booked On</span>
                                    <span>{formatDate(booking.createdAt)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ASSIGN/CHANGE PROVIDER MODAL */}
            <Dialog open={assignModal} onOpenChange={(open) => {
                setAssignModal(open)
                if (!open) {
                    setSelectedProvider('')
                    setAssignNotes('')
                    setSearchProvider('')
                    setIsChangingProvider(false)
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isChangingProvider ? 'Change Provider' : 'Assign Provider'}</DialogTitle>
                        <DialogDescription>
                            {isChangingProvider 
                                ? `Current provider: ${booking.provider?.user.name}. Select a new provider for booking #${booking.bookingNumber}`
                                : `Select a provider for booking #${booking.bookingNumber}`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchProvider}
                                    onChange={(e) => setSearchProvider(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchProviders()}
                                    className="pl-10"
                                />
                            </div>
                            <Button onClick={searchProviders} disabled={searchingProviders} size="sm" variant="outline">
                                {searchingProviders ? '...' : 'Search'}
                            </Button>
                        </div>

                        {/* Provider List */}
                        <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-3">
                            {searchingProviders ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-28 w-full" />
                                    ))}
                                </div>
                            ) : providers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No providers found for this category
                                </p>
                            ) : (
                                providers.map((p) => (
                                    <div
                                        key={p.id}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                            selectedProvider === p.id 
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                                                : 'hover:bg-muted hover:border-primary/50'
                                        } ${!p.isAvailable ? 'opacity-70' : ''}`}
                                        onClick={() => p.isAvailable && setSelectedProvider(p.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-bold text-primary">
                                                    {(p.user.name || 'P').charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold truncate">{p.user.name || 'Unnamed'}</p>
                                                    {!p.isAvailable && (
                                                        <Badge variant="outline" className="text-xs text-amber-600">Busy Today</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{p.user.phone}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        <span className="font-medium">{p.avgRating.toFixed(1)}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">{p.experience}y exp</span>
                                                    <span className="text-xs text-muted-foreground">{p.completedJobs} jobs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {p.bio && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.bio}</p>
                                        )}

                                        {p.services.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-muted-foreground mb-1">Services:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {p.services.slice(0, 4).map((s, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {s.name}
                                                        </Badge>
                                                    ))}
                                                    {p.services.length > 4 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{p.services.length - 4}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-3 pt-3 border-t">
                                            <a 
                                                href={`tel:${p.user.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1"
                                            >
                                                <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                                                    <Phone className="h-3 w-3 mr-1" />
                                                    Call
                                                </Button>
                                            </a>
                                            <a 
                                                href={`https://wa.me/91${p.user.phone}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1"
                                            >
                                                <Button variant="outline" size="sm" className="w-full h-7 text-xs bg-green-50 hover:bg-green-100 border-green-200">
                                                    <MessageCircle className="h-3 w-3 mr-1 text-green-600" />
                                                    WhatsApp
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>{isChangingProvider ? 'Reason for Change (Optional)' : 'Notes (Optional)'}</Label>
                            <Textarea
                                placeholder={isChangingProvider ? 'Why are you changing the provider?' : 'Any special instructions for the provider...'}
                                value={assignNotes}
                                onChange={(e) => setAssignNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignModal(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={actionLoading || !selectedProvider}>
                            {actionLoading ? (isChangingProvider ? 'Changing...' : 'Assigning...') : (isChangingProvider ? 'Change Provider' : 'Assign Provider')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CHANGE: ADD NOTE MODAL */}
            <Dialog open={noteModal} onOpenChange={(open) => {
                setNoteModal(open)
                if (!open) setNoteText('')
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <StickyNote className="h-5 w-5 text-amber-500" />
                            Add Internal Note
                        </DialogTitle>
                        <DialogDescription>
                            Add a note for team coordination. This will be visible in activity log.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Note *</Label>
                            <Textarea
                                placeholder="e.g., Customer ne bola 5 baje ke baad aayein, Provider ko gate code bata do..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                rows={4}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteModal(false)}>Cancel</Button>
                        <Button onClick={handleAddNote} disabled={noteLoading || !noteText.trim()}>
                            {noteLoading ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <StickyNote className="h-4 w-4 mr-2" />
                                    Add Note
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* RESCHEDULE MODAL */}
            <Dialog open={rescheduleModal} onOpenChange={(open) => {
                setRescheduleModal(open)
                if (!open) {
                    setNewDate('')
                    setNewTime('')
                    setRescheduleNotes('')
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reschedule Booking</DialogTitle>
                        <DialogDescription>
                            Current: {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Date *</Label>
                            <Input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Time *</Label>
                            <Select value={newTime} onValueChange={setNewTime}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="08:00 AM">08:00 AM</SelectItem>
                                    <SelectItem value="09:00 AM">09:00 AM</SelectItem>
                                    <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                    <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                    <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                    <SelectItem value="01:00 PM">01:00 PM</SelectItem>
                                    <SelectItem value="02:00 PM">02:00 PM</SelectItem>
                                    <SelectItem value="03:00 PM">03:00 PM</SelectItem>
                                    <SelectItem value="04:00 PM">04:00 PM</SelectItem>
                                    <SelectItem value="05:00 PM">05:00 PM</SelectItem>
                                    <SelectItem value="06:00 PM">06:00 PM</SelectItem>
                                    <SelectItem value="07:00 PM">07:00 PM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder="Reason for rescheduling..."
                                value={rescheduleNotes}
                                onChange={(e) => setRescheduleNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRescheduleModal(false)}>Cancel</Button>
                        <Button onClick={handleReschedule} disabled={actionLoading || !newDate || !newTime}>
                            {actionLoading ? 'Rescheduling...' : 'Reschedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CANCEL MODAL */}
            <Dialog open={cancelModal} onOpenChange={(open) => {
                setCancelModal(open)
                if (!open) {
                    setCancelReason('')
                    setCancelNotes('')
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. {booking.payment?.status === 'PAID' && 'Refund will be initiated automatically.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cancellation Reason *</Label>
                            <Select value={cancelReason} onValueChange={setCancelReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Customer requested">Customer requested</SelectItem>
                                    <SelectItem value="Provider unavailable">Provider unavailable</SelectItem>
                                    <SelectItem value="Duplicate booking">Duplicate booking</SelectItem>
                                    <SelectItem value="Wrong service selected">Wrong service selected</SelectItem>
                                    <SelectItem value="Payment issue">Payment issue</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Additional Notes (Optional)</Label>
                            <Textarea
                                placeholder="Any additional details..."
                                value={cancelNotes}
                                onChange={(e) => setCancelNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelModal(false)}>Go Back</Button>
                        <Button variant="destructive" onClick={handleCancel} disabled={actionLoading || !cancelReason}>
                            {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}