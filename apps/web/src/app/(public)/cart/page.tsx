'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalAmount, clearCart } = useCartStore()

  const totalAmount = getTotalAmount()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="text-8xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some services to get started
            </p>
            <Link href="/services">
              <Button className="bg-primary hover:bg-primary/90">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">
              {items.length} item{items.length > 1 ? 's' : ''} in your cart
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              clearCart()
              toast.success('Cart cleared')
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      {item.serviceImage ? (
                        <Image
                          src={item.serviceImage}
                          alt={item.serviceName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.serviceName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.selectedPricingLabel}
                      </p>

                      {/* Add-ons */}
                      {item.addOns.length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Add-ons: {item.addOns.map((a) => a.name).join(', ')}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            ₹{((item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(0)}
                          </div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-muted-foreground">
                              ₹{item.selectedPrice + item.addOns.reduce((sum, a) => sum + a.price, 0)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeItem(item.id)
                        toast.success('Item removed')
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{totalAmount.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{(totalAmount * 0.18).toFixed(0)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{(totalAmount * 1.18).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <Input placeholder="Enter coupon code" />
                    <Button variant="outline">Apply</Button>
                  </div>
                </div>

                <Link href="/booking/checkout">
                  <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                    Proceed to Checkout →
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}