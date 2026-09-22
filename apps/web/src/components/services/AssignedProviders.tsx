'use client'

import { motion } from 'framer-motion'
import { Star, Briefcase, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
      className="rounded-2xl border bg-card p-6"
    >
      <h2 className="text-xl font-bold mb-4">
        Available Providers in Ambikapur
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Verified professionals jo ye service dete hain
      </p>

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
              className="flex items-center gap-4 rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">
                    {provider.user.name || 'Service Provider'}
                  </h3>
                  {provider.isAvailable && (
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
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
    </motion.div>
  )
}