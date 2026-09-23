'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MapPin, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotalAmount, clearCart } = useCartStore()
    const { user, isAuthenticated, token } = useAuthStore() // ← token add karo

    const [currentStep, setCurrentStep] = useState(1)
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledTime, setScheduledTime] = useState('')
    const [address, setAddress] = useState({
        label: 'Home',
        fullAddress: '',
        area: '',
        landmark: '',
        pincode: '',
    })
    const [specialInstructions, setSpecialInstructions] = useState('')
    const [loading, setLoading] = useState(false)

    const totalAmount = getTotalAmount()
    const gst = totalAmount * 0.18
    const finalTotal = totalAmount + gst

    // Check authentication
    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please login to continue')
            router.push('/login')
        }
    }, [isAuthenticated, router])

    // Check if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            toast.error('Your cart is empty')
            router.push('/cart')
        }
    }, [items, router])

    // Generate available dates (next 7 days)
    const availableDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        return date.toISOString().split('T')[0]
    })

    // Generate time slots (9 AM - 8 PM)
    const timeSlots = [
        '09:00', '10:00', '11:00', '12:00', '13:00',
        '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
    ]

    const handleCreateBooking = async () => {
        if (!scheduledDate || !scheduledTime) {
            toast.error('Please select date and time')
            return
        }
        if (!address.fullAddress || !address.area || !address.pincode) {
            toast.error('Please fill complete address')
            return
        }
        if (!isAuthenticated || !token) {
            toast.error('Please login to continue')
            router.push('/login')
            return
        }

        setLoading(true)
        try {
            // Step 1: Create bookings
            const bookings = await Promise.all(
                items.map(async (item) => {
                    const response = await fetch('/api/bookings/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            serviceId: item.serviceId,
                            scheduledDate,
                            scheduledTime,
                            address,
                            specialInstructions,
                            baseAmount: item.selectedPrice * item.quantity,
                            addOnAmount: item.addOns.reduce((sum, a) => sum + a.price, 0) * item.quantity,
                            totalAmount: (item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity,
                        }),
                    })
                    return response.json()
                })
            )

            const allSuccess = bookings.every(b => b.success)

            if (!allSuccess) {
                toast.error('Some bookings failed. Please try again.')
                return
            }

            const bookingIds = bookings.map(b => b.data.id)

            // Step 2: Create payment order
            const orderResponse = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookingIds }),
            })

            const orderData = await orderResponse.json()

            if (!orderData.success) {
                toast.error('Failed to create payment order')
                return
            }

            // Step 3: Open Razorpay checkout
            const options = {
                key: orderData.data.keyId,
                amount: orderData.data.amount,
                currency: orderData.data.currency,
                name: 'ServiceApp',
                description: 'Service Booking Payment',
                order_id: orderData.data.orderId,
                handler: async function (response: any) {
                    // Step 4: Verify payment
                    const verifyResponse = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            bookingIds,
                        }),
                    })

                    const verifyData = await verifyResponse.json()

                    if (verifyData.success) {
                        toast.success('Payment successful!')
                        clearCart()
                        router.push('/booking/confirmation')
                    } else {
                        toast.error('Payment verification failed')
                    }
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || '',
                },
                theme: {
                    color: '#F97316', // Your brand color
                },
                modal: {
                    ondismiss: function () {
                        toast.info('Payment cancelled')
                    },
                },
            }

            const razorpay = new (window as any).Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.error('Booking error:', error)
            toast.error('Failed to create bookings')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
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
                    <h1 className="text-3xl font-bold">Checkout</h1>
                    <p className="text-muted-foreground mt-1">
                        Complete your booking in 3 simple steps
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-4">
                        {[
                            { num: 1, label: 'Schedule', icon: Calendar },
                            { num: 2, label: 'Address', icon: MapPin },
                            { num: 3, label: 'Confirm', icon: CreditCard },
                        ].map((step, idx) => {
                            const Icon = step.icon
                            return (
                                <div key={step.num} className="flex items-center">
                                    <div
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentStep >= step.num
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{step.label}</span>
                                    </div>
                                    {idx < 2 && (
                                        <div className={`w-12 h-0.5 mx-2 ${currentStep > step.num ? 'bg-primary' : 'bg-muted'
                                            }`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Step 1: Schedule */}
                        {currentStep === 1 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Select Date & Time
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label className="text-base font-semibold mb-3 block">
                                            Select Date
                                        </Label>
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
                                                        className="h-auto py-3 flex flex-col"
                                                    >
                                                        <span className="text-xs">{dayName}</span>
                                                        <span className="text-lg font-bold">{dayNum}</span>
                                                        <span className="text-xs">{month}</span>
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-base font-semibold mb-3 block">
                                            Select Time Slot
                                        </Label>
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
                                                        className="h-auto py-3"
                                                    >
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        {displayTime}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setCurrentStep(2)}
                                        disabled={!scheduledDate || !scheduledTime}
                                        className="w-full"
                                        size="lg"
                                    >
                                        Continue to Address
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Address */}
                        {currentStep === 2 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        Service Address
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Address Label</Label>
                                        <Input
                                            value={address.label}
                                            onChange={(e) => setAddress({ ...address, label: e.target.value })}
                                            placeholder="Home, Office, etc."
                                        />
                                    </div>

                                    <div>
                                        <Label>Full Address *</Label>
                                        <Textarea
                                            value={address.fullAddress}
                                            onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })}
                                            placeholder="House no., Street, Society name"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <Label>Area/Locality *</Label>
                                        <Input
                                            value={address.area}
                                            onChange={(e) => setAddress({ ...address, area: e.target.value })}
                                            placeholder="e.g., Civil Lines, Gandhi Nagar"
                                        />
                                    </div>

                                    <div>
                                        <Label>Landmark (Optional)</Label>
                                        <Input
                                            value={address.landmark}
                                            onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                                            placeholder="Near temple, opposite to school"
                                        />
                                    </div>

                                    <div>
                                        <Label>Pincode *</Label>
                                        <Input
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                            placeholder="497001"
                                            maxLength={6}
                                        />
                                    </div>

                                    <div>
                                        <Label>Special Instructions (Optional)</Label>
                                        <Textarea
                                            value={specialInstructions}
                                            onChange={(e) => setSpecialInstructions(e.target.value)}
                                            placeholder="Any specific requirements or instructions"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(1)}
                                            className="flex-1"
                                            size="lg"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setCurrentStep(3)}
                                            disabled={!address.fullAddress || !address.area || !address.pincode}
                                            className="flex-1"
                                            size="lg"
                                        >
                                            Review Order
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Confirm */}
                        {currentStep === 3 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Review & Confirm
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Schedule Summary */}
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="font-semibold">Schedule</span>
                                        </div>
                                        <p className="text-sm">
                                            {new Date(scheduledDate).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })} at {scheduledTime}
                                        </p>
                                    </div>

                                    {/* Address Summary */}
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4" />
                                            <span className="font-semibold">Address</span>
                                        </div>
                                        <p className="text-sm font-medium">{address.label}</p>
                                        <p className="text-sm text-muted-foreground">{address.fullAddress}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {address.area}, {address.pincode}
                                        </p>
                                    </div>

                                    {/* Services Summary */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Services ({items.length})</h3>
                                        <div className="space-y-2">
                                            {items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                                    <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                                        {item.serviceImage ? (
                                                            <Image
                                                                src={item.serviceImage}
                                                                alt={item.serviceName}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-muted" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{item.serviceName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Qty: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold">
                                                        ₹{((item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(0)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentStep(2)}
                                            className="flex-1"
                                            size="lg"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleCreateBooking}
                                            disabled={loading}
                                            className="flex-1 bg-primary hover:bg-primary/90"
                                            size="lg"
                                        >
                                            {loading ? 'Processing...' : 'Confirm Booking'}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
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
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">GST (18%)</span>
                                        <span>₹{gst.toFixed(0)}</span>
                                    </div>
                                    <div className="border-t pt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span className="text-primary">₹{finalTotal.toFixed(0)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                                    <p>✓ Secure booking</p>
                                    <p>✓ Verified professionals</p>
                                    <p>✓ Quality guarantee</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}