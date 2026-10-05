'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MapPin, Briefcase } from 'lucide-react'
import Logo from './Logo'
import { SITE_CONFIG } from '@/lib/config'

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  // ✅ FIXED: pehle '/provider/register' tha jo kabhi exist nahi karta.
  // Actual working route '/become-provider' hai.
  { label: 'Become a Provider', href: '/become-provider' },
  { label: 'Help & Support', href: '/support' },
]

interface PopularService {
  name: string
  categorySlug: string
  subCategorySlug: string
}

export default function Footer() {
  const [popularServices, setPopularServices] = useState<PopularService[]>([])

  // Dynamic subcategory links — hardcoded slugs galat ho sakte the aur
  // DB se mismatch ka risk tha. Ye hamesha real, working links guarantee
  // karta hai kyunki seedha /api/categories se aa raha hai.
  useEffect(() => {
    let isMounted = true

    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted || !json.success) return

        const flattened: PopularService[] = []
        for (const category of json.data) {
          for (const sub of category.subCategories) {
            flattened.push({
              name: sub.name,
              categorySlug: category.slug,
              subCategorySlug: sub.slug,
            })
            if (flattened.length >= 6) break
          }
          if (flattened.length >= 6) break
        }
        setPopularServices(flattened)
      })
      .catch(() => {
        // Silent fail — footer links optional hain, page break nahi hona chahiye
      })

    return () => {
      isMounted = false
    }
  }, [])

  const hasContactInfo = SITE_CONFIG.phone || SITE_CONFIG.email

  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Column 1: Logo + Description */}
          <div className="space-y-4">
            <Logo className="inverted" />
            <p className="text-sm text-white/60 leading-relaxed">
              {SITE_CONFIG.city} ka #1 home services platform. Verified professionals,
              fixed pricing, quality guarantee.
            </p>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Available in {SITE_CONFIG.city}
            </div>
          </div>

          {/* Column 2: Popular Services (dynamic) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white">
              Popular Services
            </h3>
            <ul className="space-y-2">
              {popularServices.length > 0 ? (
                popularServices.map((service) => (
                  <li key={`${service.categorySlug}-${service.subCategorySlug}`}>
                    <Link
                      href={`/services/${service.categorySlug}/${service.subCategorySlug}`}
                      className="text-sm text-white/60 hover:text-primary transition-colors"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-sm text-white/40">Loading services…</li>
              )}
              <li className="pt-1">
                <Link
                  href="/services"
                  className="text-sm font-medium text-primary hover:text-primary-light transition-colors"
                >
                  View all services →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-white">
              Contact Us
            </h3>
            <ul className="space-y-3">
              {SITE_CONFIG.phone && (
                <li className="flex items-start gap-2.5 text-sm text-white/60">
                  <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-white">{SITE_CONFIG.phone}</p>
                    <p className="text-xs">Mon-Sat, 8AM - 8PM</p>
                  </div>
                </li>
              )}
              {SITE_CONFIG.email && (
                <li className="flex items-start gap-2.5 text-sm text-white/60">
                  <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-white">{SITE_CONFIG.email}</p>
                    <p className="text-xs">Reply within 24 hours</p>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-white">{SITE_CONFIG.city}</p>
                  <p className="text-xs">
                    {SITE_CONFIG.address
                      ? `${SITE_CONFIG.address}${SITE_CONFIG.pincode ? ` - ${SITE_CONFIG.pincode}` : ''}`
                      : 'Chhattisgarh, India'}
                  </p>
                </div>
              </li>
              {!hasContactInfo && (
                <li className="flex items-start gap-2.5 text-sm text-white/60">
                  <Briefcase className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <p className="text-xs">
                    Support details coming soon — reach us via the app for now.
                  </p>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <p className="text-xs text-white/50">
            Made with ❤️ in {SITE_CONFIG.city}, Chhattisgarh
          </p>
        </div>
      </div>
    </footer>
  )
}