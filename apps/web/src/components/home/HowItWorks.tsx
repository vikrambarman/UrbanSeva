import { Search, CalendarDays, Home } from 'lucide-react'

// ✅ REWRITE — Production-ready version
// Changes:
// 1. Emoji icons (🔍📅🏠) → Lucide React icons (established rule)
// 2. Container width: `container mx-auto` → `max-w-[1400px] mx-auto px-4 md:px-6`
//    (Tailwind v4 mein `container` koi max-width set nahi karta — width mismatch bug fix)
// 3. Connector line positioning fix: `left-1/4 right-1/4` → proper grid-based alignment
//    (3-column grid mein columns ke centers 16.67% aur 83.33% par hote hain)
// 4. Icon circles ka size badhaya (w-16→w-20) for better visual hierarchy
// 5. Step number badge positioning refined
// 6. Mobile: vertical stack, no connector line (cleaner on small screens)

const steps = [
  {
    icon: Search,
    title: 'Service Chuniye',
    description: '100+ services mein se apni zaroorat ki service choose karo',
  },
  {
    icon: CalendarDays,
    title: 'Book Kariye',
    description: 'Apna preferred date aur time slot select karo',
  },
  {
    icon: Home,
    title: 'Expert Aayega',
    description: 'Verified professional aapke ghar aayega aur kaam karega',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-12 md:py-16 bg-muted/40">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Kaise Kaam Karta Hai?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            3 simple steps mein booking complete karo
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connector Line (Desktop only) — properly aligned to circle centers */}
          <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-px bg-primary/20" />

          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon Circle + Step Badge */}
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {index + 1}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed max-w-56">
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}