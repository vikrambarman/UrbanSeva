'use client'

import { motion } from 'framer-motion'
import { Star, Briefcase, Clock, Users, CheckCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SITE_CONFIG } from '@/lib/config'

// ✅ ENHANCED — Premium provider cards design
// Changes:
// 1. 🔴 FIX: Hardcoded "Ambikapur" → SITE_CONFIG.city
// 2. Hero header with icon + provider count badge
// 3. Enhanced provider cards with better hover effects
// 4. Availability indicator with label

interface User {
  id: string
  name: string | null
  avatar: string | null
}

interface Provider {
  id: string
  userId: string
  bio: string | null
  experience: number
  avgRating: number
  totalJobs: number
  isAvailable: boolean
  user: User
}

interface AssignedProvidersProps {
  providers: Provider[]
}

export function AssignedProviders({ providers }: AssignedProvidersProps) {
  if (providers.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-gray-200 bg-card overflow-hidden"
    >
      {/* ✅ Hero header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Available Providers
              </h2>
              {/* ✅ FIX: Hardcoded "Ambikapur" → SITE_CONFIG.city */}
              <p className="text-xs text-muted-foreground">
                Verified professionals in {SITE_CONFIG.city}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
            <span>{providers.length}</span>
            <span>{providers.length === 1 ? 'Provider' : 'Providers'}</span>
          </div>
        </div>
      </div>

      {/* Provider cards */}
      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {providers.map((provider) => {
            const initials = provider.user.name
              ? provider.user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'SP'

            return (
              <div
                key={provider.id}
                className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <Avatar className="w-14 h-14 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate text-foreground">
                      {provider.user.name || 'Service Provider'}
                    </h3>
                    {provider.isAvailable && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {provider.avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium text-foreground">
                          {provider.avgRating}
                        </span>
                      </div>
                    )}
                    {provider.totalJobs > 0 && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{provider.totalJobs} jobs</span>
                      </div>
                    )}
                    {provider.experience > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{provider.experience} yrs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}