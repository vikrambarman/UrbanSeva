import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/config'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showTagline?: boolean
}

/**
 * Reusable wordmark logo — business name abhi finalize nahi hua hai,
 * isliye SITE_CONFIG.name se dynamic rakha hai. Jab actual logo image
 * ready ho, sirf is file ko update karna hoga — Navbar, Footer, Auth
 * pages sab jagah automatically reflect hoga.
 */
export default function Logo({ className, showTagline = true }: LogoProps) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 shrink-0', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-orange text-white font-bold text-lg shadow-sm">
        {SITE_CONFIG.name.charAt(0).toUpperCase()}
      </span>
      <span className="hidden sm:flex flex-col leading-tight">
        <span className="font-bold text-lg tracking-tight text-foreground">
          {SITE_CONFIG.name}
        </span>
        {showTagline && (
          <span className="text-[10px] text-muted-foreground font-medium -mt-0.5">
            {SITE_CONFIG.tagline}
          </span>
        )}
      </span>
    </Link>
  )
}