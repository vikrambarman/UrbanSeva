import Link from 'next/link'

const serviceLinks = [
  { label: 'Home Cleaning', href: '/services/home-cleaning' },
  { label: 'Electrical', href: '/services/electrical' },
  { label: 'Plumbing', href: '/services/plumbing' },
  { label: 'AC Service', href: '/services/ac-appliance' },
  { label: 'Painting', href: '/services/painting' },
  { label: 'Pest Control', href: '/services/pest-control' },
]

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Become a Provider', href: '/provider/register' },
  { label: 'Help & Support', href: '/support' },
]

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Column 1: Logo + Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <span className="font-bold text-xl text-primary">
                ServiceApp
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ambikapur ka #1 home services platform.
              Verified professionals, fixed pricing,
              quality guarantee.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Available in Ambikapur
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Our Services
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5">📞</span>
                <div>
                  <p className="font-medium text-foreground">
                    +91-XXXXXXXXXX
                  </p>
                  <p className="text-xs">Mon-Sat, 8AM - 8PM</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5">📧</span>
                <div>
                  <p className="font-medium text-foreground">
                    support@serviceapp.com
                  </p>
                  <p className="text-xs">Reply within 24 hours</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5">📍</span>
                <div>
                  <p className="font-medium text-foreground">
                    Ambikapur
                  </p>
                  <p className="text-xs">
                    Chhattisgarh - 497001
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 ServiceApp. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ in Ambikapur, Chhattisgarh
          </p>
        </div>
      </div>
    </footer>
  )
}
