import {
  Sparkles,
  Zap,
  Wrench,
  Snowflake,
  PaintBucket,
  Bug,
  Scissors,
  Hammer,
  Building2,
  Home,
  type LucideIcon,
} from 'lucide-react'

interface IconRule {
  keywords: string[]
  icon: LucideIcon
}

// NOTE: Ye keyword-matching generic hai kyunki exact DB category names/slugs
// is waqt maloom nahi the. Agar koi category galat/fallback icon dikhaye,
// bata dena — yahan ek naya rule add karne se turant fix ho jayega.
const ICON_RULES: IconRule[] = [
  { keywords: ['clean'], icon: Sparkles },
  { keywords: ['electric'], icon: Zap },
  { keywords: ['plumb'], icon: Wrench },
  { keywords: ['ac', 'appliance', 'cooling', 'fridge', 'refrigerat'], icon: Snowflake },
  { keywords: ['paint'], icon: PaintBucket },
  { keywords: ['pest'], icon: Bug },
  { keywords: ['salon', 'beauty', 'spa', 'groom'], icon: Scissors },
  { keywords: ['carpenter', 'furniture', 'wood'], icon: Hammer },
  { keywords: ['property', 'real estate', 'rent'], icon: Building2 },
]

const DEFAULT_ICON: LucideIcon = Home

/**
 * DB ke emoji 'icon' field ki jagah consistent, brand-colorable Lucide icon
 * deta hai — category name/slug mein keyword match karke.
 */
export function getCategoryIcon(nameOrSlug: string): LucideIcon {
  const normalized = nameOrSlug.toLowerCase()
  const match = ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword))
  )
  return match?.icon ?? DEFAULT_ICON
}