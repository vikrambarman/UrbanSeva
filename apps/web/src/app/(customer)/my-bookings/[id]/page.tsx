/**
 * WHAT: Booking detail page with visual timeline
 * WHY: 
 * - Visual timeline for status tracking
 * - Remove emojis, use Lucide icons only
 * - Better provider section with contact options
 * - Support new status flow
 * NOTE: Backward compatible
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  Star,
  MessageCircle,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

interface BookingDetail {
  id: string
  bookingNumber: string
  status: string
  scheduledDate: string
  scheduledTime: string
  baseAmount: number
  addOnAmount: number
  totalAmount: number
  specialInstructions?: string
  razorpayPaymentId?: string
  paymentStatus: string
  paymentMethod?: string
  createdAt: string
  service: {
    id: string
    name: string
    image: string | null
    description: string
    subCategory: {
      name: string
      category: {
        name: string
      }
    }
  }
  address: {
    label: string
    fullAddress: string
    area: string
    landmark?: string
    pincode: string
  }
  provider?: {
    id: string
    user: {
      name: string
      phone: string
      avatar?: string
    }
    avgRating: number
    totalJobs: number
  }
  statusHistory: Array<{
    id: string
    status: string
    note?: string
    createdAt: string
  }>
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBooking()
  }, [params.id])


  useEffect(() => {
    fetchBooking()
  }, [params.id])

  // ✅ NEW: Auto-refresh every 10 seconds for active bookings
  useEffect(() => {
    if (!booking) return

    // Terminal states jahan polling band ho jani chahiye
    const terminalStatuses = [
      'SERVICE_COMPLETED', 'CANCELLED', 'CANCELLED_BY_CUSTOMER',
      'CANCELLED_BY_OPS', 'CANCELLED_BY_PROVIDER', 'REFUNDED', 'REFUND_INITIATED'
    ]
    const isTerminal = terminalStatuses.includes(booking.status)

    // Agar booking active hai, toh har 10 second mein refresh karo
    if (isTerminal) return

    const interval = setInterval(() => {
      fetchBooking(true) // silent refresh
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [booking?.status, params.id])

  // ✅ FIX: silent parameter add kiya taaki polling mein UI flash na ho
  const fetchBooking = async (silent = false) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
      const data = await response.json()
      if (data.success) {
        setBooking(data.data)
      } else {
        if (!silent) {
          toast.error('Booking not found')
          router.push('/my-bookings')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      if (!silent) toast.error('Failed to load booking')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // ✅ FIX: PAYMENT_RECEIVED means money actually received (ONLINE) → green
      PAYMENT_RECEIVED: 'bg-green-100 text-green-800 border-green-200',
      // ✅ FIX: PENDING_CONFIRMATION means waiting (POD/COD not paid yet) → amber
      PENDING_CONFIRMATION: 'bg-amber-100 text-amber-800 border-amber-200',
      RESCHEDULE_PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      PROVIDER_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
      PROVIDER_TRAVELLING: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      SERVICE_STARTED: 'bg-orange-100 text-orange-800 border-orange-200',
      SERVICE_COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED_BY_CUSTOMER: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED_BY_OPS: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED_BY_PROVIDER: 'bg-red-100 text-red-800 border-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAYMENT_RECEIVED: 'Payment Received',
      // ✅ FIX: Clearer label for POD/COD pending state
      PENDING_CONFIRMATION: 'Pending Confirmation',
      RESCHEDULE_PENDING: 'Reschedule Pending',
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      PROVIDER_ASSIGNED: 'Provider Assigned',
      PROVIDER_TRAVELLING: 'Provider On Way',
      SERVICE_STARTED: 'In Progress',
      SERVICE_COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      CANCELLED_BY_CUSTOMER: 'Cancelled',
      CANCELLED_BY_OPS: 'Cancelled',
      CANCELLED_BY_PROVIDER: 'Cancelled',
    }
    return labels[status] || status.replace(/_/g, ' ')
  }

  const getTimelineIcon = (status: string, isCurrent: boolean) => {
    if (status.includes('CANCELLED')) {
      return <AlertCircle className="w-4 h-4 text-red-600" />
    }
    if (status === 'SERVICE_COMPLETED') {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />
    }
    if (isCurrent) {
      return <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
    }
    return <Circle className="w-3 h-3 text-muted-foreground" />
  }

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking? Refund will be processed based on cancellation policy.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${params.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: 'Cancelled by customer',
          cancelledBy: 'CUSTOMER',
        }),
      })

      const data = await response.json()
      if (data.success) {
        const { refundAmount, refundPercentage } = data.data
        if (refundAmount > 0) {
          toast.success(`Booking cancelled. Refund of ₹${refundAmount} (${refundPercentage}%) will be processed.`)
        } else {
          toast.success('Booking cancelled successfully.')
        }
        fetchBooking()
      } else {
        toast.error(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Booking not found</p>
          <Button onClick={() => router.push('/my-bookings')} className="mt-4">
            Back to Bookings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <ServiceImageWithFallback
                      src={booking.service.image}
                      alt={booking.service.name}
                      categorySlug={booking.service.subCategory.category.name.toLowerCase()}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{booking.service.name}</h1>
                    <p className="text-sm text-muted-foreground mb-2">
                      {booking.service.subCategory.category.name} → {booking.service.subCategory.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        #{booking.bookingNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{booking.service.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    {booking.scheduledTime}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{booking.address.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {booking.address.fullAddress}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.address.area}, {booking.address.pincode}
                  </p>
                  {booking.address.landmark && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Landmark: {booking.address.landmark}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Provider Info */}
            {booking.provider && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    Service Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {booking.provider.user.name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{booking.provider.user.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{booking.provider.avgRating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({booking.provider.totalJobs} jobs)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${booking.provider.user.phone}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`https://wa.me/91${booking.provider.user.phone}`} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Timeline */}
            {booking.statusHistory && booking.statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {booking.statusHistory.map((history, index) => {
                      const isCurrent = index === booking.statusHistory.length - 1
                      return (
                        <div key={history.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            {getTimelineIcon(history.status, isCurrent)}
                            {index < booking.statusHistory.length - 1 && (
                              <div className="w-0.5 h-12 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="font-medium">{getStatusLabel(history.status)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(history.createdAt).toLocaleString('en-IN')}
                            </p>
                            {history.note && (
                              <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Instructions */}
            {booking.specialInstructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{booking.specialInstructions}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{booking.totalAmount}</span>
                </div>
                <div className="pt-2 space-y-2">
                  {/* ✅ FIX: Show meaningful label based on payment method, not just raw status */}
                  <Badge className={
                    booking.paymentStatus === 'PAID'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }>
                    {booking.paymentStatus === 'PAID'
                      ? 'Paid'
                      : booking.paymentMethod === 'POD'
                        ? 'Pay on Delivery - Pending'
                        : booking.paymentMethod === 'COD'
                          ? 'Cash on Delivery - Pending'
                          : booking.paymentStatus}
                  </Badge>
                  {booking.paymentMethod && (
                    <p className="text-xs text-muted-foreground">
                      Payment Method: {booking.paymentMethod}
                    </p>
                  )}
                  {booking.razorpayPaymentId && (
                    <p className="text-xs text-muted-foreground">
                      Payment ID: {booking.razorpayPaymentId}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'PENDING_CONFIRMATION') && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                  >
                    Cancel Booking
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Cancellation charges may apply
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Booking Info */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="text-xs text-muted-foreground">
                  <p>Booked on: {new Date(booking.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}