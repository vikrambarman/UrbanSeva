"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard, Calendar, Activity, X, LogOut,
    DollarSign, CreditCard, Users, UserCircle, ShieldCheck
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

interface OpsSidebarProps { isOpen: boolean; onClose: () => void }

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
    disabled?: boolean
}

interface NavSection {
    title: string
    items: NavItem[]
}

const navigation: NavSection[] = [
    {
        title: "Operations",
        items: [
            { href: "/ops/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/ops/bookings", label: "All Bookings", icon: Calendar },
            { href: "/ops/activity", label: "Activity Log", icon: Activity },
        ]
    },
    {
        title: "Finance Hub",
        items: [
            { href: "/ops/finance", label: "Financial Overview", icon: DollarSign },
            { href: "/ops/payouts", label: "Payout Management", icon: CreditCard },
        ]
    },
    {
        title: "Helpdesk",
        items: [
            { href: "/ops/providers", label: "Providers", icon: Users },
            { href: "/ops/customers", label: "Customer Support", icon: UserCircle },
        ]
    }
]

export function OpsSidebar({ isOpen, onClose }: OpsSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuthStore()

    const handleLogout = () => {
        logout()
        toast.success('Logged out successfully')
        router.push('/ops/login')
    }

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <Link href="/ops/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight leading-tight">Ops Panel</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">Enterprise Hub</span>
                        </div>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted"><X className="h-5 w-5" /></button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                                    return (
                                        <Link key={item.label} href={item.disabled ? "#" : item.href}
                                            onClick={(e) => { if (item.disabled) { e.preventDefault(); toast.info("Coming Soon"); } else { onClose(); } }}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                                                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{(user?.name || 'CT').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium truncate">{user?.name || 'Calling Team'}</span>
                            <span className="text-xs text-muted-foreground truncate">{user?.phone || ''}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
                        <LogOut className="h-4 w-4" /> Logout
                    </button>
                </div>
            </aside>
        </>
    )
}