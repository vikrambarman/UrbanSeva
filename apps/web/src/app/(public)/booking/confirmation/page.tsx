/**
 * WHAT: Booking confirmation page - Shows "Booking Received" status
 * WHY: 
 * - After payment, booking is NOT confirmed yet
 * - OPS team will verify slot and assign provider
 * - Customer should know what to expect next
 * NOTE: Removed emojis, using Lucide icons only
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Phone, Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmationPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Booking Received!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your booking has been successfully created and is being processed
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What Happens Next - Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              What Happens Next?
            </h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">OPS Team Verification</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our team will verify your selected slot and check provider availability
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Provider Assignment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A verified professional will be assigned to your booking
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Confirmation Notification</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll receive SMS/WhatsApp with provider details and final confirmation
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Service Delivery</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provider will arrive at your location at the scheduled time
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Processing Time</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your booking will be confirmed within 30 minutes. If slot is unavailable,
                  our team will contact you with alternative options.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Need Help?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact us at +91-98765-43210 or support@homeservices.com
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/my-bookings" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white" size="lg">
                <Calendar className="w-4 h-4 mr-2" />
                View My Bookings
              </Button>
            </Link>
            <Link href="/services" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Book More Services
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            Thank you for choosing HomeServices! We're committed to providing you the best service experience.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}