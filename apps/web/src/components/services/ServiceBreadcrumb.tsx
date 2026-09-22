import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbProps {
  category: { name: string; slug: string }
  subCategory?: { name: string; slug: string }
  service?: { name: string; slug: string }
}

export function ServiceBreadcrumb({ category, subCategory, service }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      
      <ChevronRight className="w-4 h-4 flex-shrink-0" />
      
      <Link 
        href={`/services/${category.slug}`}
        className="hover:text-foreground transition-colors"
      >
        {category.name}
      </Link>

      {subCategory && (
        <>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <Link
            href={`/services/${category.slug}/${subCategory.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {subCategory.name}
          </Link>
        </>
      )}

      {service && (
        <>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[200px]">
            {service.name}
          </span>
        </>
      )}
    </nav>
  )
}