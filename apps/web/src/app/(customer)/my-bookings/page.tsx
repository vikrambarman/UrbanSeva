'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
        { headers: { Authorization: `Bearer ${token}` } }
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROVIDER_ASSIGNED: 'bg-purple-100 text-purple-800',
      SERVICE_STARTED: 'bg-orange-100 text-orange-800',
      SERVICE_COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground mt-1">Track and manage your service bookings</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'PENDING', 'CONFIRMED', 'SERVICE_COMPLETED', 'CANCELLED'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              size="sm"
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all' ? 'You haven\'t made any bookings yet' : `No ${statusFilter} bookings`}
              </p>
              <Link href="/services">
                <Button className="bg-primary hover:bg-primary/90">Book a Service</Button>
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
                        {booking.service.image ? (
                          <Image
                            src={booking.service.image}
                            alt={booking.service.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
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
                            {booking.status.replace('_', ' ')}
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