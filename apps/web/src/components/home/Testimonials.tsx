'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const reviews = [
  {
    name: 'Ramesh Kumar',
    location: 'Ward 12, Ambikapur',
    rating: 5,
    service: 'Electrical Service',
    comment:
      'Bahut achha kaam kiya electrician ne. Time pe aaye aur kaam bhi clean kiya. Definitely recommend karunga!',
    avatar: 'R',
  },
  {
    name: 'Priya Sharma',
    location: 'Civil Lines, Ambikapur',
    rating: 5,
    service: 'AC Service',
    comment:
      'AC service bilkul perfect thi. Price bhi reasonable tha. App se booking karna bahut easy tha.',
    avatar: 'P',
  },
  {
    name: 'Suresh Patel',
    location: 'Kali Mandir Road',
    rating: 4,
    service: 'Home Cleaning',
    comment:
      'Cleaning team ne ghar ekdum chamka diya. Sab corners clean kiye. Next month phir booking karenge.',
    avatar: 'S',
  },
  {
    name: 'Anita Singh',
    location: 'Gandhi Nagar, Ambikapur',
    rating: 5,
    service: 'Plumbing',
    comment:
      'Plumber bahut professional tha. Leak fix ho gaya ek ghante mein. Bahut satisfied hoon service se.',
    avatar: 'A',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-12 container mx-auto px-4">
      {/* Heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Customers Ka Kehna
        </h2>
        <p className="text-muted-foreground mt-2">
          Ambikapur ke happy customers ki real reviews
        </p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reviews.map((review, i) => (
          <motion.div
            key={review.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-3 hover:shadow-md transition-all"
          >
            {/* Stars */}
            <StarRating rating={review.rating} />

            {/* Comment */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>

            {/* User Info */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {review.avatar}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {review.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {review.location}
                </p>
              </div>
            </div>

            {/* Service Badge */}
            <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {review.service}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
