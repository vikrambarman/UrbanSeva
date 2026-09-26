// components/Navbar.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Search,
  X,
  Home,
  Wrench,
  Building2,
  Info,
  CalendarCheck,
  User,
  Wallet,
  LogOut,
  ChevronDown,
  ShoppingCart,
  MapPin,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'

const navLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Services', href: '/services', icon: Wrench },
  { label: 'Property', href: '/property', icon: Building2 },
  { label: 'Become Provider', href: '/become-provider', icon: Briefcase }, // ✅ NEW
  { label: 'About', href: '/about', icon: Info },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  
  const { user, isAuthenticated, logout } = useAuthStore()
  const { getTotalItems } = useCartStore()

  useEffect(() => {
    setCartItemsCount(getTotalItems())
  }, [getTotalItems])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-xl text-primary hidden sm:block">
              HomeServ
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/services')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Cart Icon */}
            <Link href="/cart" className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Section */}
            {isAuthenticated && user ? (
              /* Logged In — Avatar Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {user.name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/my-bookings" className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/addresses" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Logged Out — Login + Provider Buttons */
              <div className="hidden md:flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/become-provider">
                    <Briefcase className="h-4 w-4" />
                    Become Provider
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white"
                  size="sm"
                >
                  <Link href="/login">Login</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <span className="text-xl">🏠</span>
                    <span className="text-primary">HomeServ</span>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Nav Links */}
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                          pathname === link.href
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    )
                  })}

                  {/* Cart Link in Mobile */}
                  <Link
                    href="/cart"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                      pathname === '/cart'
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart
                    {cartItemsCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-semibold">
                        {cartItemsCount}
                      </span>
                    )}
                  </Link>
                </nav>

                {/* Mobile Auth */}
                <div className="mt-6 border-t border-border pt-6">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-white">
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive/30"
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/become-provider">
                          <Briefcase className="h-4 w-4" />
                          Become Provider
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href="/login">Login / Register</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}