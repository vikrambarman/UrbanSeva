'use client'

import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

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
      className="rounded-2xl border bg-card p-6"
    >
      <h2 className="text-xl font-bold mb-6">What&apos;s Covered</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inclusions */}
        {inclusions.length > 0 && (
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
              <Check className="w-5 h-5" />
              What&apos;s Included
            </h3>
            <ul className="space-y-2">
              {inclusions.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Exclusions */}
        {exclusions.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
              <X className="w-5 h-5" />
              Not Included
            </h3>
            <ul className="space-y-2">
              {exclusions.map((item, index) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  )
}