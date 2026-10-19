/**
 * WHAT: Schedule selection page - Step 1 of booking flow
 * WHY: Customer selects date & time before address selection
 * NOTE: Protected route - requires authentication
 * 
 * ✅ FIX: Added pricing validation for each cart item
 * ✅ FIX: Show pricing info for each item before continue
 * ✅ FIX: Redirect to service page if pricing is missing/wrong
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowLeft, ArrowRight, AlertCircle, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

export default function SchedulePage() {
  const router = useRouter()
  const params = useParams()
  const { items, updateSchedule, removeItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [pricingIssues, setPricingIssues] = useState<string[]>([])

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/booking/${params.serviceId}/schedule`)
      router.push(`/login?redirect=${returnUrl}`)
    }
  }, [isAuthenticated, router, params.serviceId])

  // Cart check + Pricing validation
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/services')
      return
    }

    // ✅ FIX: Validate pricing for each item
    const issues: string[] = []
    items.forEach((item, index) => {
      if (!item.selectedPricingLabel || !item.selectedPrice || item.selectedPrice <= 0) {
        issues.push(`Item ${index + 1}: ${item.serviceName} - Pricing not selected`)
      }
    })

    if (issues.length > 0) {
      setPricingIssues(issues)
      toast.error('Some items have pricing issues. Please reselect services.')
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

    // ✅ FIX: Final pricing validation before continue
    const hasPricingIssues = items.some(
      item => !item.selectedPricingLabel || !item.selectedPrice || item.selectedPrice <= 0
    )

    if (hasPricingIssues) {
      toast.error('Some items have invalid pricing. Please remove and reselect them.')
      return
    }

    // Update schedule for all cart items
    items.forEach(item => {
      updateSchedule(item.id, scheduledDate, scheduledTime)
    })

    // Navigate to address page
    router.push(`/booking/${params.serviceId}/address`)
  }

  const handleRemoveItem = (itemId: string, serviceName: string) => {
    removeItem(itemId)
    toast.success(`${serviceName} removed from cart`)
  }

  const handleReselectService = (serviceId: string) => {
    router.push(`/services/${serviceId}`)
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
              { num: 1, label: 'Schedule', active: true },
              { num: 2, label: 'Address', active: false },
              { num: 3, label: 'Review', active: false },
              { num: 4, label: 'Payment', active: false },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    step.active
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step.active ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ✅ FIX: Pricing Issues Warning */}
        {pricingIssues.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-2">Pricing Issues Detected</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {pricingIssues.map((issue, idx) => (
                    <li key={idx}>• {issue}</li>
                  ))}
                </ul>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push('/cart')}
                >
                  Go to Cart to Fix
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ FIX: Cart Items with Pricing Info */}
        <div className="mb-6 space-y-3">
          <h2 className="text-lg font-semibold">Services in Cart</h2>
          {items.map((item, index) => (
            <Card key={item.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <ServiceImageWithFallback
                      src={item.serviceImage || ''}
                      alt={item.serviceName}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.serviceName}</h3>
                        {/* ✅ FIX: Show selected pricing label */}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Wrench className="w-3 h-3 mr-1" />
                            {item.selectedPricingLabel || 'Package Not Selected'}
                          </Badge>
                          <span className="text-sm font-bold text-primary">
                            ₹{item.selectedPrice > 0 ? item.selectedPrice.toFixed(0) : '0'}
                          </span>
                        </div>
                        {/* ✅ FIX: Show warning if pricing is missing */}
                        {(!item.selectedPricingLabel || item.selectedPrice <= 0) && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Pricing not selected properly
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReselectService(item.serviceId)}
                        >
                          Reselect
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id, item.serviceName)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
              disabled={!scheduledDate || !scheduledTime || pricingIssues.length > 0}
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