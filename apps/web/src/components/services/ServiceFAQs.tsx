'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle, MessageCircleQuestion } from 'lucide-react'

// ✅ ENHANCED — Better FAQ section design
// Changes:
// 1. Hero header with icon (consistent with other sections)
// 2. Better accordion styling
// 3. FAQ count badge

interface FAQ {
  id: string
  question: string
  answer: string
}

interface ServiceFAQsProps {
  faqs: FAQ[]
}

export function ServiceFAQs({ faqs }: ServiceFAQsProps) {
  if (faqs.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200 bg-card overflow-hidden">
      {/* ✅ Hero header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircleQuestion className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-muted-foreground">
                Common queries about this service
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
            <span>{faqs.length}</span>
            <span>{faqs.length === 1 ? 'FAQ' : 'FAQs'}</span>
          </div>
        </div>
      </div>

      {/* Accordion */}
      <div className="p-6">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.id} value={`item-${index}`} className="border-gray-100">
              <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}