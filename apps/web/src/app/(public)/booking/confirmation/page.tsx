'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, CalendarDays, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api-client' // Ensure this import exists

export default function BookingConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clearCart = useCartStore((state) => state.clearCart)
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const bookingNumber = searchParams.get('booking')
    const paymentLinkId = searchParams.get('razorpay_payment_link_id')
    const paymentId = searchParams.get('razorpay_payment_id')

    // Cart clear karo
    clearCart()

    // Agar URL mein details hain, toh verify karo
    if (bookingNumber && paymentLinkId) {
      const verifyPayment = async () => {
        try {
          const res = await apiFetch('/api/bookings/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
              bookingNumber,
              paymentLinkId,
              paymentId
            })
          })
          const data = await res.json()

          if (data.success) {
            setStatus('success')
            setMessage('Payment successful! Your booking is confirmed.')
          } else {
            setStatus('error')
            setMessage(data.error || 'Payment verification failed. Please contact support.')
          }
        } catch (error) {
          console.error(error)
          setStatus('error')
          setMessage('Network error during verification.')
        }
      }
      verifyPayment()
    } else {
      // Agar params nahi hain (e.g. direct visit), toh success maan lo (fallback)
      setStatus('success')
      setMessage('Booking received.')
    }

    // Auto redirect after 8 seconds
    const timer = setTimeout(() => {
      router.push('/my-bookings')
    }, 8000)
    
    return () => clearTimeout(timer)
  }, [router, searchParams, clearCart])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 text-center">
        <CardContent className="pt-10 pb-8 px-6">
          
          {status === 'verifying' && (
            <>
              <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h1>
              <p className="text-gray-600">Please wait while we confirm your transaction.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Booking Successful!
              </h1>
              <p className="text-gray-600 mb-8">{message}</p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">What's Next?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      You will receive an SMS and In-App notification once our OPS team confirms your booking and assigns a professional.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => router.push('/my-bookings')} className="w-full" size="lg">
                  View My Bookings <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              <Button onClick={() => router.push('/my-bookings')} className="w-full">
                Go to My Bookings
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Redirecting to bookings in 8 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}