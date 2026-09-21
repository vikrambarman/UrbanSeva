'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const popularChips = [
  'AC Service',
  'Cleaning',
  'Electrician',
  'Plumber',
  'Painting',
  'Pest Control',
]

export default function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/services?q=${encodeURIComponent(query)}`)
    }
  }

  const handleChipClick = (chip: string) => {
    router.push(`/services?q=${encodeURIComponent(chip)}`)
  }

  return (
    <section className="relative overflow-hidden gradient-orange py-16 md:py-24">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center mb-4"
        >
          <span className="bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full backdrop-blur-sm">
            ⭐ Ambikapur ka #1 Home Service Platform
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold text-white text-center mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-devanagari), var(--font-sans)' }}
        >
          Ambikapur ki Har Zaroorat,
          <br />
          <span className="text-yellow-200">Ek Jagah</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-white/90 text-center text-base md:text-lg mb-8 max-w-xl mx-auto"
        >
          Verified professionals, fixed pricing, quality guarantee.
          <br className="hidden md:block" />
          100+ services available in Ambikapur.
        </motion.p>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="max-w-xl mx-auto mb-6"
        >
          <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Kaunsi service chahiye?"
              className="border-0 shadow-none focus-visible:ring-0 text-base bg-transparent"
            />
            <Button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary/90 rounded-xl px-6"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Popular Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <span className="text-white/70 text-sm self-center mr-1">
            Popular:
          </span>
          {popularChips.map((chip, i) => (
            <motion.button
              key={chip}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onClick={() => handleChipClick(chip)}
              className="bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
            >
              {chip}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
