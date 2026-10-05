'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  User,
  Wallet,
  LogOut,
  Building2,
  Briefcase,
  Gift,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Logo from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { SITE_CONFIG } from '@/lib/config'

const SEARCH_SUGGESTIONS = [
  'AC service',
  'Home deep cleaning',
  'Electrician',
  'Plumber',
  'Painting',
  'Pest control',
]

export default function Navbar() {
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const pathname = usePathname()
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const { user, isAuthenticated, logout } = useAuthStore()

  const totalCartItems = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    setIsAccountOpen(false)
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/services/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full bg-background transition-shadow duration-200',
          isScrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : 'border-b border-border/60'
        )}
      >
        {/* ✅ FIXED: 'container mx-auto' Tailwind v4 mein max-width define nahi
            karta (jab tak theme mein configure na ho) — isliye content poori
            screen-width tak stretch ho raha tha bade monitors par. Ab explicit
            max-width hai jo UC jaisa "centered, contained" feel deta hai. */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* ✅ FIXED: h-16 (64px) → h-20 (80px) — zyada breathing room */}
          <div className="flex items-center gap-2 md:gap-4 h-20">
            <Logo className="shrink-0" />

            {/* Location — desktop: bordered pill with text, mobile: icon only */}
            <button
              onClick={() => setIsLocationOpen(true)}
              className="flex items-center gap-1.5 h-10 px-2 md:px-4 rounded-full border border-border hover:border-foreground/30 transition-colors shrink-0"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden md:inline text-sm font-medium text-foreground">
                {SITE_CONFIG.city}
              </span>
              <ChevronDown className="hidden md:inline h-3.5 w-3.5 text-muted-foreground" />
            </button>

            {/* Search — desktop: full pill, mobile: icon only (UC jaisa) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full border border-border hover:border-foreground/30 focus-within:border-primary transition-colors w-[300px] lg:w-[380px]"
            >
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for "${SEARCH_SUGGESTIONS[placeholderIndex]}"`}
                className="border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent text-sm"
              />
            </form>

            <button
              onClick={() => router.push('/services/search')}
              className="md:hidden flex items-center justify-center h-10 w-10 rounded-full border border-border hover:border-foreground/30 transition-colors shrink-0"
            >
              <Search className="h-4.5 w-4.5 text-muted-foreground" />
            </button>

            {/* Spacer — UC jaisa generous gap, icons hamesha right edge par */}
            <div className="flex-1" />

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/cart"
                className="relative flex items-center justify-center h-10 w-10 rounded-full border border-border hover:border-foreground/30 transition-colors"
              >
                <ShoppingCart className="h-4.5 w-4.5 text-foreground" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold px-1">
                    {totalCartItems > 99 ? '99+' : totalCartItems}
                  </span>
                )}
              </Link>

              {/* Account — single entry point for everything else
                  (Services, Property, Become a Provider, Bookings, Theme, Login/Logout).
                  Desktop: dropdown. Mobile: sheet. Isse navbar sirf 5 visible
                  elements tak limited rehta hai, UC jaisa clean. */}
              {isDesktop ? (
                <DropdownMenu open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center h-10 w-10 rounded-full border border-border hover:border-foreground/30 transition-colors overflow-hidden">
                      {isAuthenticated && user ? (
                        <Avatar className="h-full w-full">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User className="h-4.5 w-4.5 text-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {isAuthenticated && user ? (
                      <>
                        <DropdownMenuLabel className="font-normal">
                          <p className="text-sm font-semibold truncate">{user.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/my-bookings" className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4" /> My Bookings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wallet" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Wallet
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/addresses" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Addresses
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/referral" className="flex items-center gap-2">
                            <Gift className="h-4 w-4" /> Refer & Earn
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : null}
                    <DropdownMenuItem asChild>
                      <Link href="/services" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" /> Services
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/property" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Property
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/become-provider" className="flex items-center gap-2 text-secondary">
                        <Briefcase className="h-4 w-4" /> Become a Provider
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    {isAuthenticated ? (
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="flex items-center gap-2 font-medium text-primary">
                          <User className="h-4 w-4" /> Login / Register
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => setIsAccountOpen(true)}
                  className="flex items-center justify-center h-10 w-10 rounded-full border border-border overflow-hidden"
                >
                  {isAuthenticated && user ? (
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-4.5 w-4.5 text-foreground" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Account Sheet — bottom tab bar (MobileNav) already covers
          Home/Services/Bookings/Profile, isliye yahan sirf secondary items hain */}
      <Sheet open={isAccountOpen && !isDesktop} onOpenChange={setIsAccountOpen}>
        <SheetContent side="right" className="w-72 flex flex-col">
          <SheetHeader>
            <SheetTitle><Logo showTagline={false} /></SheetTitle>
          </SheetHeader>

          {isAuthenticated && user && (
            <div className="flex items-center gap-3 px-1 py-3 border-b border-border">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.phone}</p>
              </div>
            </div>
          )}

          <nav className="mt-3 flex flex-col gap-1 flex-1">
            <Link
              href="/property"
              onClick={() => setIsAccountOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive('/property') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-3"><Building2 className="h-5 w-5" /> Property</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            {isAuthenticated && (
              <>
                <Link href="/wallet" onClick={() => setIsAccountOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                  <span className="flex items-center gap-3"><Wallet className="h-5 w-5" /> Wallet</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link href="/addresses" onClick={() => setIsAccountOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                  <span className="flex items-center gap-3"><MapPin className="h-5 w-5" /> Addresses</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link href="/referral" onClick={() => setIsAccountOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                  <span className="flex items-center gap-3"><Gift className="h-5 w-5" /> Refer & Earn</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </>
            )}

            <Link
              href="/become-provider"
              onClick={() => setIsAccountOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium text-secondary hover:bg-secondary/10"
            >
              <span className="flex items-center gap-3"><Briefcase className="h-5 w-5" /> Become a Provider</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </nav>

          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>

            {isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" /> Logout
              </Button>
            ) : (
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsAccountOpen(false)}
              >
                <Link href="/login">Login / Register</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Info Dialog */}
      <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Service Location
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-foreground">
              Abhi hum sirf <span className="font-semibold text-primary">{SITE_CONFIG.city}</span> mein
              service de rahe hain.
            </p>
            <p className="text-muted-foreground">
              Hum jaldi hi naye shehron mein expand kar rahe hain. Thoda intezaar karein! 🚀
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}