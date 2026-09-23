'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Calendar, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmationPage() {
  const router = useRouter()

  useEffect(() => {
    // Show success message after 5 seconds
    const timer = setTimeout(() => {
      // Could redirect to bookings page or show additional info
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your booking has been successfully created
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">What's Next?</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• We'll assign a verified professional to your booking</li>
                  <li>• You'll receive a confirmation SMS/WhatsApp shortly</li>
                  <li>• Professional will contact you before the scheduled time</li>
                  <li>• Track your booking status in "My Bookings"</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Need Help?</p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Contact us at +91-98765-43210 or support@serviceapp.com
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/bookings" className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                View My Bookings
              </Button>
            </Link>
            <Link href="/services" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Book More Services
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center pt-4 border-t">
            Thank you for choosing ServiceApp! We're committed to providing you the best service experience.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}