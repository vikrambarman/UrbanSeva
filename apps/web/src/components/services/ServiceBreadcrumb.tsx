import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

// ✅ ENHANCED — Better breadcrumb styling
// Changes:
// 1. Better hover effects with underline
// 2. Improved spacing and typography
// 3. Current page (last item) styled differently

interface BreadcrumbProps {
  category: { name: string; slug: string }
  subCategory?: { name: string; slug: string }
  service?: { name: string; slug: string }
}

export function ServiceBreadcrumb({ category, subCategory, service }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm flex-wrap">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 hover:underline underline-offset-4"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/50" />

      <Link
        href={`/services/${category.slug}`}
        className="text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
      >
        {category.name}
      </Link>

      {subCategory && (
        <>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/50" />
          <Link
            href={`/services/${category.slug}/${subCategory.slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4"
          >
            {subCategory.name}
          </Link>
        </>
      )}

      {service && (
        <>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/50" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {service.name}
          </span>
        </>
      )}
    </nav>
  )
}