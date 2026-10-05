'use client'

import { Star, Quote } from 'lucide-react'
import { motion } from 'framer-motion'

// ✅ REWRITE — Real data based (no fake reviews)
// Changes:
// 1. Hardcoded fake reviews array → removed. Ab props se real data receive karta hai.
// 2. Homepage (server component) DB se real reviews fetch karega aur yahan pass karega.
// 3. Agar reviews.length === 0 hai to section render hi nahi hoga (homepage se conditional).
// 4. Location field removed (Review model mein location nahi hai).
//    Instead, SITE_CONFIG.city use karenge (homepage se pass hoga).
// 5. Star rating fill fix: `fill-muted` → `fill-gray-200` (proper Tailwind class)
// 6. Container width fix: `container mx-auto` → `max-w-[1400px] mx-auto px-4 md:px-6`
// 7. Avatar: user.name ka first letter (agar name null hai to "?" fallback)

interface TestimonialReview {
  id: string
  overallRating: number
  comment: string | null
  createdAt: Date | string
  user: {
    name: string | null
  }
  service: {
    name: string
  }
}

interface TestimonialsProps {
  reviews: TestimonialReview[]
  cityName: string // SITE_CONFIG.city se aayega
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function Testimonials({ reviews, cityName }: TestimonialsProps) {
  // Safety check — agar koi reviews nahi hain to kuch mat dikha
  if (!reviews || reviews.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Customers Ka Kehna
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {cityName} ke happy customers ki real reviews
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {reviews.map((review, i) => {
            const userName = review.user.name || 'Customer'
            const avatarLetter = userName.charAt(0).toUpperCase()

            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:shadow-md transition-all duration-200"
              >
                {/* Quote Icon + Stars */}
                <div className="flex items-start justify-between">
                  <Quote className="h-5 w-5 text-primary/30 shrink-0" />
                  <StarRating rating={Math.round(review.overallRating)} />
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                )}

                {/* User Info */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {avatarLetter}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cityName}
                    </p>
                  </div>
                </div>

                {/* Service Badge */}
                <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {review.service.name}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}