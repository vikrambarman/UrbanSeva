/**
 * WHAT: Order review page - Step 3 of booking flow
 * WHY: Customer reviews complete order summary before payment
 * NOTE: Shows all details - schedule, address, services, pricing
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

interface Address {
  id: string
  label: string
  fullAddress: string
  area: string
  landmark?: string
  pincode: string
}

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const { items, addressId, getTotalAmount } = useCartStore()
  const { isAuthenticated, token } = useAuthStore()

  const [address, setAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(true)

  const totalAmount = getTotalAmount()

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(`/booking/${params.serviceId}/review`)
      router.push(`/login?redirect=${returnUrl}`)
    }
  }, [isAuthenticated, router, params.serviceId])

  // Fetch address details
  useEffect(() => {
    const fetchAddress = async () => {
      if (!addressId || !token) return

      try {
        const response = await fetch('/api/addresses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (data.success) {
          const selectedAddr = data.data.find((a: Address) => a.id === addressId)
          setAddress(selectedAddr || null)
        }
      } catch (error) {
        console.error('Fetch address error:', error)
        toast.error('Failed to load address')
      } finally {
        setLoading(false)
      }
    }

    fetchAddress()
  }, [addressId, token])

  // Cart check
  useEffect(() => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      router.push('/services')
    }
  }, [items, router])

  // Check if schedule and address are set
  useEffect(() => {
    if (items.length > 0 && (!items[0].scheduledDate || !items[0].scheduledTime)) {
      toast.error('Please select schedule first')
      router.push(`/booking/${params.serviceId}/schedule`)
    }
  }, [items, router, params.serviceId])

  useEffect(() => {
    if (!addressId) {
      toast.error('Please select address first')
      router.push(`/booking/${params.serviceId}/address`)
    }
  }, [addressId, router, params.serviceId])

  if (loading || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const firstItem = items[0]
  const scheduledDate = firstItem?.scheduledDate
  const scheduledTime = firstItem?.scheduledTime

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/booking/${params.serviceId}/address`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Address
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Review Your Order</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Please verify all details before proceeding
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: 'Schedule', active: false },
              { num: 2, label: 'Address', active: false },
              { num: 3, label: 'Review', active: true },
              { num: 4, label: 'Payment', active: false },
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${step.active
                      ? 'bg-primary text-white'
                      : 'bg-muted text-muted-foreground'
                    }`}
                >
                  <span className="text-sm font-medium">{step.num}</span>
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${step.active ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Schedule Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold">
                    {scheduledDate && new Date(scheduledDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    at {scheduledTime}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Address Summary */}
            {address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Service Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-semibold">{address.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{address.fullAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.area}{address.landmark && `, ${address.landmark}`} - {address.pincode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Services ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <ServiceImageWithFallback
                        src={item.serviceImage}
                        alt={item.serviceName}
                        categorySlug={item.categorySlug}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.serviceName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.selectedPricingLabel} × {item.quantity}
                      </p>
                      {item.addOns.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          + {item.addOns.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">
                      ₹{((item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalAmount.toFixed(0)}</span>
                  </div>
                  {/* Deleted:                  <div className="flex justify-between"> */}
                  {/* Deleted:                    <span className="text-muted-foreground">GST (18%)</span> */}
                  {/* Deleted:                    <span>₹{gst.toFixed(0)}</span> */}
                  {/* Deleted:                  </div> */}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount.toFixed(0)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Inclusive of all taxes)
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/booking/${params.serviceId}/payment`)}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  Proceed to Payment
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}