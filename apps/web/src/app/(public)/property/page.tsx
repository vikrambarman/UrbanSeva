import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Services | ServiceApp',
  description: 'Property listing and management services in Ambikapur',
}

export default function PropertyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-8xl mb-6">🏢</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Property Services
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Property listing, buying, selling, and rental services coming soon in Ambikapur!
          </p>
          
          <div className="rounded-2xl border bg-card p-6 text-left">
            <h2 className="font-semibold text-lg mb-4">What&apos;s Coming:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Property listing with photos and details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Buy, sell, or rent properties</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Verified property owners</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">✓</span>
                <span>Direct contact with owners</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <a
              href="/services"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Browse Other Services
            </a>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Expected Launch: Phase 11
          </p>
        </div>
      </div>
    </div>
  )
}