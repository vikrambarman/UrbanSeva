'use client'

import Image from 'next/image'
import { useState } from 'react'

const CATEGORY_COLORS: Record<string, string> = {
  'home-cleaning': 'from-blue-400 to-blue-600',
  'electrical': 'from-yellow-400 to-yellow-600',
  'plumbing': 'from-teal-400 to-teal-600',
  'ac-appliance': 'from-sky-400 to-sky-600',
  'painting': 'from-purple-400 to-purple-600',
  'pest-control': 'from-green-400 to-green-600',
  'beauty-wellness': 'from-pink-400 to-pink-600',
  'carpentry': 'from-amber-600 to-amber-800',
  'home-improvement': 'from-orange-400 to-orange-600',
  'vehicle-services': 'from-gray-400 to-gray-600',
  'property-services': 'from-red-400 to-red-600',
  'education-tuition': 'from-indigo-400 to-indigo-600',
  'healthcare': 'from-teal-300 to-teal-500',
  'pet-care': 'from-lime-400 to-lime-600',
  'events-occasions': 'from-yellow-300 to-amber-500',
  'packers-movers': 'from-blue-700 to-blue-900',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'home-cleaning': '🧹',
  'electrical': '⚡',
  'plumbing': '🔧',
  'ac-appliance': '❄️',
  'painting': '🎨',
  'pest-control': '🐛',
  'beauty-wellness': '💆',
  'carpentry': '🪚',
  'home-improvement': '🏠',
  'vehicle-services': '🚗',
  'property-services': '🏢',
  'education-tuition': '📚',
  'healthcare': '🏥',
  'pet-care': '🐾',
  'events-occasions': '🎉',
  'packers-movers': '📦',
}

interface ServiceImageWithFallbackProps {
  src: string | null
  alt: string
  categorySlug?: string
  className?: string
}

export function ServiceImageWithFallback({
  src,
  alt,
  categorySlug = 'home-cleaning',
  className = '',
}: ServiceImageWithFallbackProps) {
  const [imgError, setImgError] = useState(false)

  const gradient = CATEGORY_COLORS[categorySlug] || 'from-gray-400 to-gray-600'
  const emoji = CATEGORY_EMOJIS[categorySlug] || '🏠'

  // Fallback: Gradient with emoji
  if (!src || imgError) {
    return (
      <div className={`bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <span className="text-6xl opacity-50">{emoji}</span>
      </div>
    )
  }

  // Success: Next.js Image
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      onError={() => setImgError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}
    />
  )
}