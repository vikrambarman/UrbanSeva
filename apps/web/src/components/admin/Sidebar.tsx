// components/admin/Sidebar.tsx
// CHANGE: "Staff" navigation item add kiya Operations section mein
// WHY: Admin ko calling team manage karne ka option chahiye sidebar se

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard, Users, Briefcase, UserPlus, Wrench, Calendar,
    IndianRupee, Wallet, RotateCcw, Image, HelpCircle, Settings, X,
    FileText, TrendingUp, Headphones,
    FolderOpen
} from "lucide-react"

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navigation = [
    {
        title: "Main",
        items: [
            { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/analytics", label: "Analytics", icon: TrendingUp },
        ]
    },
    {
        title: "User Management",
        items: [
            { href: "/admin/users", label: "All Users", icon: Users },
            { href: "/admin/providers", label: "Providers", icon: Briefcase },
            { href: "/admin/provider-inquiries", label: "Provider Applications", icon: UserPlus },
        ]
    },
    {
        title: "Operations",
        items: [
            { href: "/admin/categories", label: "Categories", icon: FolderOpen },  // ✅ NEW
            { href: "/admin/services", label: "Services", icon: Wrench },
            { href: "/admin/bookings", label: "Bookings", icon: Calendar },
            { href: "/admin/staff", label: "Calling Team", icon: Headphones },
        ]
    },
    {
        title: "Finance",
        items: [
            { href: "/admin/finance", label: "Overview", icon: IndianRupee },
            { href: "/admin/finance/payouts", label: "Payouts", icon: Wallet },
            { href: "/admin/finance/refunds", label: "Refunds", icon: RotateCcw },
        ]
    },
    {
        title: "Content & Settings",
        items: [
            { href: "/admin/content/banners", label: "Banners", icon: Image },
            { href: "/admin/content/faqs", label: "FAQs", icon: HelpCircle },
            { href: "/admin/reports", label: "Reports", icon: FileText },
            { href: "/admin/settings", label: "Settings", icon: Settings },
        ]
    }
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo / Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">HomeServ</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title} className="space-y-2">
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

                {/* Footer */}
                <div className="p-4 border-t">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">AD</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Admin User</span>
                            <span className="text-xs text-muted-foreground">Super Admin</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}