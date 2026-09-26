"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "cn"
import { 
    LayoutDashboard, Briefcase, IndianRupee, Star, User, 
    FileText, Building2, Calendar, X, LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ProviderSidebarProps {
    isOpen: boolean
    onClose: () => void
}

const navigation = [
    {
        title: "Main",
        items: [
            { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/provider/jobs", label: "My Jobs", icon: Briefcase },
            { href: "/provider/earnings", label: "Earnings", icon: IndianRupee },
            { href: "/provider/reviews", label: "Reviews", icon: Star },
        ]
    },
    {
        title: "Account",
        items: [
            { href: "/provider/profile", label: "My Profile", icon: User },
            { href: "/provider/documents", label: "Documents", icon: FileText },
            { href: "/provider/bank-details", label: "Bank Details", icon: Building2 },
            { href: "/provider/availability", label: "Availability", icon: Calendar },
        ]
    }
]

export function ProviderSidebar({ isOpen, onClose }: ProviderSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/login')
    }

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" 
                    onClick={onClose} 
                />
            )}

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <Link href="/provider/dashboard" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Provider</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-muted">
                        <X className="h-5 w-5" />
                    </button>
                </div>

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

                <div className="p-4 border-t space-y-2">
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>
        </>
    )
}