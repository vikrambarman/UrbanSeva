/**
 * WHAT: Cart page with updated checkout redirect (FIXED)
 * WHY: 
 * - Old /booking/checkout page deleted
 * - New flow: /booking/[serviceId]/schedule → address → review → payment
 * - If single item → redirect to that service's schedule
 * - If multiple items → redirect to first item's schedule (payment page handles all)
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle,
  Shield,
  Clock,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ServiceImageWithFallback } from '@/components/services/ServiceImageWithFallback'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotalAmount, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const totalAmount = getTotalAmount()
  // Deleted:const gstAmount = totalAmount * 0.18
  // Deleted:const grandTotal = totalAmount + gstAmount

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
  } | null>(null)

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    const mockCoupons: Record<string, number> = {
      WELCOME10: 10,
      FIRST20: 20,
      SAVE50: 50,
    }

    const discount = mockCoupons[couponCode.toUpperCase()]

    if (discount) {
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount })
      toast.success(`Coupon "${couponCode.toUpperCase()}" applied! ${discount}% off`)
      setCouponCode('')
    } else {
      toast.error('Invalid coupon code. Try WELCOME10, FIRST20, or SAVE50')
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.info('Coupon removed')
  }


  const discountAmount = appliedCoupon
    ? (totalAmount * appliedCoupon.discount) / 100
    : 0
  const finalTotal = totalAmount - discountAmount

  // ═══════════════════════════════════════════════════════════════
  // NEW: Checkout handler with login check
  // ═══════════════════════════════════════════════════════════════
  const handleCheckout = () => {
    // Login check
    if (!isAuthenticated) {
      toast.info('Please login to continue')
      router.push('/login?redirect=/cart')
      return
    }

    // Cart empty check
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Redirect to first item's schedule page
    // Payment page will handle all items
    const firstItem = items[0]
    router.push(`/booking/${firstItem.serviceId}/schedule`)
  }

  // ─────────────────────────────────────────────────────────────
  // EMPTY CART STATE
  // ─────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Explore our services and add something to get started
            </p>
            <Link href="/services">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Browse Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // CART WITH ITEMS
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <Link
            href="/services"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Continue Shopping
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Your Cart</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {items.length} service{items.length > 1 ? 's' : ''} selected
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                clearCart()
                toast.success('Cart cleared')
              }}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CART ITEMS */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const unitPrice =
                item.selectedPrice +
                item.addOns.reduce((sum, a) => sum + a.price, 0)
              const lineTotal = unitPrice * item.quantity

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-28 h-40 sm:h-28 rounded-lg overflow-hidden flex-shrink-0">
                        <ServiceImageWithFallback
                          src={item.serviceImage || ''}
                          alt={item.serviceName}
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {item.serviceName}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.selectedPricingLabel}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              removeItem(item.id)
                              toast.success('Item removed')
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {item.addOns.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.addOns.map((a) => (
                              <span
                                key={a.name}
                                className="inline-flex items-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                              >
                                + {a.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              disabled={item.quantity <= 1}
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                              }}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              ₹{lineTotal.toFixed(0)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-muted-foreground">
                                ₹{unitPrice.toFixed(0)} each
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{totalAmount.toFixed(0)}</span>
                  </div>
                  {/* Deleted:                  <div className="flex justify-between text-sm"> */}
                  {/* Deleted:                    <span className="text-muted-foreground">GST (18%)</span> */}
                  {/* Deleted:                    <span className="font-medium">₹{gstAmount.toFixed(0)}</span> */}
                  {/* Deleted:                  </div> */}

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Discount ({appliedCoupon.code})
                      </span>
                      <span className="font-medium">-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{finalTotal.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Inclusive of all taxes)
                    </p>
                  </div>
                </div>

                {/* Coupon Section */}
                <div className="border-t pt-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {appliedCoupon.code} ({appliedCoupon.discount}% off)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600 hover:text-green-800 hover:bg-green-100"
                        onClick={handleRemoveCoupon}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Have a coupon code?
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleApplyCoupon()
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          className="flex-shrink-0"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* UPDATED: Checkout Button with proper redirect */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Instant booking confirmation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}