// app/admin/bookings/[id]/page.tsx

"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft,
    MapPin,
    User,
    Calendar,
    Phone,
    Clock,
    CreditCard,
    FileText,
    UserPlus,
    Star,
} from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"
import { AssignProviderToBookingModal } from "@/components/admin/AssignProviderToBookingModal"

export default function AdminBookingDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [booking, setBooking] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [assignModalOpen, setAssignModalOpen] = useState(false)

    // ═══════════════════════════════════════════════════════════════
    // ✅ FIX: useCallback se wrap kiya — stable reference milega
    // aur onAssigned callback mein bhi same function call hoga
    // ═══════════════════════════════════════════════════════════════
    const fetchBooking = useCallback(async () => {
        try {
            // ✅ FIX: Cache-busting timestamp add kiya — har baar fresh data aaye
            // Pehle bina timestamp ke browser/Next.js cache se purana data aa raha tha
            // jisme provider: null hota tha
            const timestamp = Date.now()
            const res = await apiFetch(`/api/admin/bookings/${params.id}?t=${timestamp}`)
            const data = await res.json()
            if (data.success) {
                setBooking(data.data)
            } else {
                toast.error(data.error)
                router.push('/admin/bookings')
            }
        } catch {
            toast.error("Failed to fetch details")
        } finally {
            setLoading(false)
        }
    }, [params.id, router])

    useEffect(() => {
        fetchBooking()
    }, [fetchBooking])

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!booking) return null

    // Status badge styling
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'PROVIDER_ASSIGNED':
                return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'PROVIDER_TRAVELLING':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'SERVICE_STARTED':
                return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'SERVICE_COMPLETED':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'REFUND_INITIATED':
            case 'REFUNDED':
                return 'bg-gray-100 text-gray-700 border-gray-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // ✅ FIX: Assignment ke baad proper refresh — multiple strategies
    // 1. fetchBooking() — client state update
    // 2. router.refresh() — server component cache clear
    // 3. Small delay — DB update propagate hone do
    // ═══════════════════════════════════════════════════════════════
    const handleProviderAssigned = async () => {
        // Chhota delay — DB mein update propagate hone do
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Fresh data fetch karo
        await fetchBooking()
        
        // Server cache bhi clear karo
        router.refresh()
        
        toast.success('Provider assigned — details refreshed')
    }

    return (
        <div className="p-6 space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.push('/admin/bookings')} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
            </Button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Booking #{booking.bookingNumber}</h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        Created on {new Date(booking.createdAt).toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`text-sm px-3 py-1 border ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.replace(/_/g, ' ')}
                    </Badge>

                    {/* Assign Provider button — only when no provider & not cancelled */}
                    {!booking.provider && booking.status !== 'CANCELLED' && (
                        <Button
                            onClick={() => setAssignModalOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Provider
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Service Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Service Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            {booking.service.image && (
                                <img
                                    src={booking.service.image}
                                    alt={booking.service.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                />
                            )}
                            <div>
                                <h3 className="text-lg font-semibold">{booking.service.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Duration: {booking.service.duration}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-sm text-muted-foreground">Base Amount</p>
                                <p className="font-medium">₹{booking.baseAmount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Add-ons</p>
                                <p className="font-medium">₹{booking.addOnAmount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Discount</p>
                                <p className="font-medium text-green-600">-₹{booking.discountAmount}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-lg font-bold text-primary">₹{booking.totalAmount}</p>
                            </div>
                        </div>
                        {booking.specialInstructions && (
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                                <p className="text-sm bg-muted p-3 rounded-lg">{booking.specialInstructions}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Customer & Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Customer & Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">{booking.user.name || "Guest"}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {booking.user.phone}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">{booking.address.label}</p>
                                <p className="text-sm text-muted-foreground">{booking.address.fullAddress}</p>
                                <p className="text-sm text-muted-foreground">
                                    {booking.address.area}, {booking.address.pincode}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-medium">
                                    {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {booking.scheduledTime}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="provider" className="w-full">
                <TabsList>
                    <TabsTrigger value="provider">
                        Provider
                        {/* CHANGE: Badge — provider assigned hai toh green dot dikhao */}
                        {booking.provider && (
                            <span className="ml-2 w-2 h-2 rounded-full bg-green-500 inline-block" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                    <TabsTrigger value="history">Status History</TabsTrigger>
                </TabsList>

                {/* ═══════════════════════════════════════════════════════ */}
                {/* PROVIDER TAB — ✅ FIX: Better display + reassign option */}
                {/* ═══════════════════════════════════════════════════════ */}
                <TabsContent value="provider">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Assigned Provider</CardTitle>
                            {/* Provider already assigned hai toh "Reassign" button */}
                            {booking.provider && booking.status !== 'CANCELLED' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAssignModalOpen(true)}
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Reassign
                                </Button>
                            )}
                            {/* No provider — show assign button */}
                            {!booking.provider && booking.status !== 'CANCELLED' && (
                                <Button
                                    size="sm"
                                    onClick={() => setAssignModalOpen(true)}
                                    className="bg-primary hover:bg-primary/90 text-white"
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Assign
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {booking.provider ? (
                                <div className="space-y-4">
                                    {/* Provider Info Card */}
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            {booking.provider.user.avatar ? (
                                                <img
                                                    src={booking.provider.user.avatar}
                                                    alt={booking.provider.user.name}
                                                    className="w-14 h-14 rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-7 w-7 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg">
                                                {booking.provider.user.name || 'Provider'}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {booking.provider.user.phone}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                {booking.provider.avgRating > 0 && (
                                                    <span className="text-sm flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                        {booking.provider.avgRating}
                                                    </span>
                                                )}
                                                {booking.provider.totalJobs > 0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {booking.provider.totalJobs} jobs completed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                            Assigned
                                        </Badge>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground mb-4">
                                        No provider assigned yet.
                                    </p>
                                    {booking.status !== 'CANCELLED' && (
                                        <Button
                                            onClick={() => setAssignModalOpen(true)}
                                            className="bg-primary hover:bg-primary/90 text-white"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Assign Provider Now
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Payment Tab */}
                <TabsContent value="payment">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.payment ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge
                                            className={
                                                booking.payment.status === 'PAID'
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : booking.payment.status === 'FAILED'
                                                        ? 'bg-red-100 text-red-700 border-red-200'
                                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }
                                        >
                                            {booking.payment.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className="font-semibold">₹{booking.payment.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Method</span>
                                        <span>{booking.payment.method || 'Online (Razorpay)'}</span>
                                    </div>
                                    {booking.payment.razorpayPaymentId && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Payment ID</span>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                {booking.payment.razorpayPaymentId}
                                            </span>
                                        </div>
                                    )}
                                    {booking.payment.razorpayOrderId && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Order ID</span>
                                            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                                {booking.payment.razorpayOrderId}
                                            </span>
                                        </div>
                                    )}
                                    {booking.payment.paidAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Paid At</span>
                                            <span>{new Date(booking.payment.paidAt).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">No payment record found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Status History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.statusHistory && booking.statusHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {booking.statusHistory.map((h: any) => (
                                        <div key={h.id} className="flex gap-4 border-l-2 border-primary/20 pl-4 py-1">
                                            <div>
                                                <p className="font-medium">{h.status.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {h.note || 'No notes'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(h.createdAt).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">No history available.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Assign Provider Modal */}
            <AssignProviderToBookingModal
                bookingId={booking.id}
                bookingNumber={booking.bookingNumber}
                serviceName={booking.service.name}
                scheduledDate={booking.scheduledDate}
                scheduledTime={booking.scheduledTime}
                open={assignModalOpen}
                onOpenChange={setAssignModalOpen}
                onAssigned={handleProviderAssigned}
            />
        </div>
    )
}