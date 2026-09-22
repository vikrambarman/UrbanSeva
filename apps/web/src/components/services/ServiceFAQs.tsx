'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

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
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        Frequently Asked Questions
      </h2>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={faq.id} value={`item-${index}`}>
            <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}