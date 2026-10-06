// components/ops/OpsTopbar.tsx
// KYA: Ops portal ka topbar — mobile menu button + page title
// KYUN: Admin topbar se simpler hai — sirf menu toggle aur basic info

"use client"

import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OpsTopbarProps {
    onMenuClick: () => void
}

export function OpsTopbar({ onMenuClick }: OpsTopbarProps) {
    return (
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-4 md:px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Mobile Menu Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onMenuClick} 
                className="lg:hidden"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Page Title Area */}
            <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                    HomeServices Ops
                </h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications (placeholder — future mein implement hoga) */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </div>
        </header>
    )
}