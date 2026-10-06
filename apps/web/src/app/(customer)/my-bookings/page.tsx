/**
 * WHAT: My Bookings page with production status flow
 * WHY: 
 * - Support new statuses (PAYMENT_RECEIVED, PENDING_CONFIRMATION, etc.)
 * - Remove emojis, use Lucide icons only
 * - Better status visualization
 * NOTE: Backward compatible with old statuses
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, ChevronRight, ClipboardList, Plus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

interface Booking {
  id: string
  bookingNumber: string
  status: string
  scheduledDate: string
  scheduledTime: string
  totalAmount: number
  service: {
    name: string
    image: string | null
    subCategory: {
      category: { name: string }
    }
  }
  address: {
    area: string
  }
  provider: {
    user: { name: string }
  } | null
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/bookings/my-bookings?status=${statusFilter}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }
      )
      const data = await response.json()
      if (data.success) {
        setBookings(data.data.bookings)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // New production flow
      PAYMENT_RECEIVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PENDING_CONFIRMATION: 'bg-blue-100 text-blue-800 border-blue-200',
      RESCHEDULE_PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
      
      // Existing statuses
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
      PENDING_CONFIRMATION: 'Awaiting Confirmation',
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">Track and manage your service bookings</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'PENDING_CONFIRMATION', label: 'Awaiting Confirmation' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'SERVICE_COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter.value)}
              size="sm"
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all' ? "You haven't made any bookings yet" : `No ${statusFilter.replace(/_/g, ' ').toLowerCase()} bookings`}
              </p>
              <Link href="/services">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Book a Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link key={booking.id} href={`/my-bookings/${booking.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Service Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <ServiceImageWithFallback
                          src={booking.service.image}
                          alt={booking.service.name}
                          categorySlug={booking.service.subCategory.category.name.toLowerCase()}
                          className="object-cover"
                        />
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              #{booking.bookingNumber}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {booking.scheduledTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.address.area}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            {booking.provider && (
                              <p className="text-sm">
                                Provider: <span className="font-medium">{booking.provider.user.name}</span>
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                              ₹{booking.totalAmount}
                            </span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}