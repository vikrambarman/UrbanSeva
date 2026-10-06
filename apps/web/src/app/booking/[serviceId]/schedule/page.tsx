/**
 * WHAT: Schedule selection page - Step 1 of booking flow
 * WHY: Customer selects date & time before address selection
 * NOTE: Protected route - requires authentication
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function SchedulePage() {
  const router = useRouter()
  const params = useParams()
  const { items, updateSchedule } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/booking/${params.serviceId}/schedule`)
      router.push(`/login?redirect=${returnUrl}`)
    }
  }, [isAuthenticated, router, params.serviceId])

  // Cart check
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/services')
    }
  }, [items, router])

  // Generate available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date.toISOString().split('T')[0]
  })

  // Time slots (9 AM - 8 PM)
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ]

  const handleContinue = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time')
      return
    }

    // Update schedule for all cart items
    items.forEach(item => {
      updateSchedule(item.id, scheduledDate, scheduledTime)
    })

    // Navigate to address page
    router.push(`/booking/${params.serviceId}/address`)
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/cart')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Select Schedule</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Choose your preferred date and time
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Schedule', icon: Calendar, active: true },
              { num: 2, label: 'Address', icon: Calendar, active: false },
              { num: 3, label: 'Review', icon: Calendar, active: false },
              { num: 4, label: 'Payment', icon: Calendar, active: false },
            ].map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.num} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      step.active
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                    <span className="text-sm font-medium sm:hidden">{step.num}</span>
                  </div>
                  {idx < 3 && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step.active ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Schedule Selection */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Select Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div>
              <label className="text-base font-semibold mb-3 block">
                Select Date
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableDates.map((date) => {
                  const dateObj = new Date(date)
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNum = dateObj.getDate()
                  const month = dateObj.toLocaleDateString('en-US', { month: 'short' })

                  return (
                    <Button
                      key={date}
                      variant={scheduledDate === date ? 'default' : 'outline'}
                      onClick={() => setScheduledDate(date)}
                      className={`h-auto py-3 flex flex-col ${
                        scheduledDate === date ? 'bg-primary text-white' : ''
                      }`}
                    >
                      <span className="text-xs">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      <span className="text-xs">{month}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <label className="text-base font-semibold mb-3 block">
                Select Time Slot
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const hour = parseInt(time.split(':')[0])
                  const displayTime = hour > 12
                    ? `${hour - 12}:00 PM`
                    : hour === 12
                    ? '12:00 PM'
                    : `${hour}:00 AM`

                  return (
                    <Button
                      key={time}
                      variant={scheduledTime === time ? 'default' : 'outline'}
                      onClick={() => setScheduledTime(time)}
                      className={`h-auto py-3 ${
                        scheduledTime === time ? 'bg-primary text-white' : ''
                      }`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {displayTime}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              disabled={!scheduledDate || !scheduledTime}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              Continue to Address
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}