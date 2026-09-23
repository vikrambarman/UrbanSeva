'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([])
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
        `/api/admin/bookings?status=${statusFilter}`,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">All Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage all platform bookings</p>
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

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold">No bookings found</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                      <p className="text-sm text-muted-foreground">#{booking.bookingNumber}</p>
                    </div>
                    <Badge>{booking.status.replace('_', ' ')}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4" />
                      <div>
                        <p className="font-medium">{booking.user.name}</p>
                        <p className="text-muted-foreground">{booking.user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <p className="font-medium">
                          {new Date(booking.scheduledDate).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-muted-foreground">{booking.scheduledTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <p>{booking.address.area}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {booking.provider ? (
                        <p className="text-sm">
                          Provider: <span className="font-medium">{booking.provider.user.name}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No provider assigned</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-lg font-bold text-primary">₹{booking.totalAmount}</span>
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Button size="sm" variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}