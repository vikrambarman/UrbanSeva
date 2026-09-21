import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SpecialOffers() {
  return (
    <section className="py-12 container mx-auto px-4">
      <div className="gradient-orange rounded-3xl p-8 md:p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="text-center md:text-left">
            <span className="inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full mb-3">
              🎉 Limited Time Offer
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Pehli Booking pe 50% OFF!
            </h2>
            <p className="text-white/80 text-sm mb-4">
              Maximum discount ₹200 tak. New users ke liye special offer.
            </p>

            {/* Coupon Code */}
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <span className="text-white text-sm font-medium">
                Coupon Code:
              </span>
              <code className="text-yellow-200 font-bold text-lg tracking-wider">
                FIRST50
              </code>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-bold px-8 shrink-0"
          >
            <Link href="/services">Abhi Book Karo →</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
