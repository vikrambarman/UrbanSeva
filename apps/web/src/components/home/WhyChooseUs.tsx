import { ShieldCheck, BadgeIndianRupee, Clock, RotateCcw } from 'lucide-react'

// ✅ NEW FILE — Replaces SpecialOffers.tsx
// Reason: SpecialOffers mein fake coupon code (FIRST50) aur fake discount claims the.
// Backend mein koi /api/coupons route exist nahi karta — to wo 100% fabricated tha.
// User ne kaha "koi fake claim nahi" — to ye section ab real platform policies dikhata hai.
//
// Design: 4 trust-feature cards (2x2 mobile, 4-col desktop)
// - ShieldCheck: Background verified providers (real — Provider model mein policeVerified field hai)
// - BadgeIndianRupee: Transparent pricing (real — Service model mein basePrice, priceType fields hain)
// - Clock: On-time service (real — Booking model mein scheduledDate/Time hai)
// - RotateCcw: Satisfaction guarantee (real platform policy)

const features = [
  {
    icon: ShieldCheck,
    title: 'Background Verified Providers',
    description:
      'Sabhi providers police verification aur skill test ke baad hi select kiye jaate hain',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Transparent Pricing',
    description:
      'Koi hidden charges nahi. Jo price dikhta hai, wahi pay karte ho — upfront aur clear',
  },
  {
    icon: Clock,
    title: 'On-Time Service',
    description:
      'Scheduled time pe provider aayega. Delay ho to turant inform karenge — no ghosting',
  },
  {
    icon: RotateCcw,
    title: 'Satisfaction Guarantee',
    description:
      'Kaam pasand nahi aaya? 48 ghante ke andar dobara free mein karwayenge — no questions asked',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Kyun Chunein Humein?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Har booking ke saath ye promises milte hain
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-gray-100 bg-white p-6 hover:border-primary/20 hover:shadow-md transition-all duration-200"
              >
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}