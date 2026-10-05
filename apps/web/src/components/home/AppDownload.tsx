import { Smartphone, Bell, MapPin, Zap } from 'lucide-react'

// ✅ NEW FILE — App download promotion section
// Placement: Homepage pe Footer se just pehle
// Content: Real features only — koi fake claim nahi
// - Mobile app actually exist karta hai (Expo/React Native)
// - Features: faster booking, real-time tracking, push notifications
// - CTA: "Coming Soon on Play Store" (actual Play Store link nahi hai abhi)
// - Design: Teal gradient background (primary color), premium feel

const features = [
  {
    icon: Zap,
    text: 'Faster booking experience',
  },
  {
    icon: MapPin,
    text: 'Real-time provider tracking',
  },
  {
    icon: Bell,
    text: 'Instant booking notifications',
  },
]

export default function AppDownload() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-6 py-10 md:px-12 md:py-14">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                <Smartphone className="h-3.5 w-3.5 text-white" />
                <span className="text-white/90 text-xs font-medium">
                  Mobile App
                </span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ab App Pe Bhi Book Karo
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-6 max-w-lg">
                Faster booking, real-time tracking, aur exclusive app-only features — sab kuch ek tap mein.
              </p>

              {/* Feature bullets */}
              <div className="space-y-2.5 mb-8">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.text} className="flex items-center gap-3 text-white/90 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 shrink-0">
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span>{feature.text}</span>
                    </div>
                  )
                })}
              </div>

              {/* CTA Button */}
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary shadow-lg hover:bg-white/95 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Smartphone className="h-4 w-4" />
                Download App
                <span className="ml-1 text-xs font-medium text-primary/60">
                  (Coming Soon)
                </span>
              </button>
            </div>

            {/* Right — Phone Mockup (CSS-only, no image needed) */}
            <div className="hidden md:flex shrink-0">
              <div className="relative w-56 h-80 rounded-[2.5rem] border-[6px] border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl overflow-hidden">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/20 rounded-b-xl" />
                
                {/* Phone screen content */}
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <Smartphone className="h-12 w-12 text-white/60 mb-4" />
                  <p className="text-white/80 text-sm font-medium">
                    Your services,
                  </p>
                  <p className="text-white/80 text-sm font-medium">
                    in your pocket
                  </p>
                  <div className="mt-4 w-full h-px bg-white/20" />
                  <p className="mt-4 text-white/50 text-xs">
                    Launching soon on Play Store
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}