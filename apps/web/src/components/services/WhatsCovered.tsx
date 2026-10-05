'use client'

import { motion } from 'framer-motion'
import { Check, X, CircleCheck, CircleX } from 'lucide-react'

// ✅ ENHANCED — Premium "What's Covered" section
// Changes:
// 1. Hero header with icon + inclusion/exclusion count badges
// 2. Better visual separation between sections
// 3. Enhanced list items with subtle background on hover
// 4. Consistent design language with FAQs and Providers sections

interface Inclusion {
  id: string
  text: string
}

interface Exclusion {
  id: string
  text: string
}

interface WhatsCoveredProps {
  inclusions: Inclusion[]
  exclusions: Exclusion[]
}

export function WhatsCovered({ inclusions, exclusions }: WhatsCoveredProps) {
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
              <CircleCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                What&apos;s Covered
              </h2>
              <p className="text-xs text-muted-foreground">
                Service scope and exclusions
              </p>
            </div>
          </div>
          {/* Count badges */}
          <div className="hidden sm:flex items-center gap-2">
            {inclusions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" />
                <span>{inclusions.length} included</span>
              </div>
            )}
            {exclusions.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <X className="w-3 h-3" />
                <span>{exclusions.length} excluded</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Inclusions */}
          {inclusions.length > 0 && (
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="w-3.5 h-3.5" />
                </div>
                What&apos;s Included
              </h3>
              <ul className="space-y-2.5">
                {inclusions.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-sm rounded-lg px-3 py-2 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
                  >
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {exclusions.length > 0 && (
            <div>
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <X className="w-3.5 h-3.5" />
                </div>
                Not Included
              </h3>
              <ul className="space-y-2.5">
                {exclusions.map((item, index) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 text-sm rounded-lg px-3 py-2 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}