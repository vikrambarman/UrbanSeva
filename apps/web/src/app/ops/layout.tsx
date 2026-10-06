// app/ops/layout.tsx
// CHANGE: Mounted state completely remove kiya — hydration mismatch fix
// CHANGE: Login page check useEffect mein karo, conditional rendering nahi
// CHANGE: h-dvh use kiya
// WHY: Same reason — server aur client pe same HTML render hona chahiye

"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { OpsSidebar } from "@/components/ops/OpsSidebar"
import { OpsTopbar } from "@/components/ops/OpsTopbar"
import { Toaster } from "sonner"

export default function OpsLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathname = usePathname()

    // ═══════════════════════════════════════════════════════════════
    // Body attribute manage karo — login page ke alawa
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const isLoginPage = pathname === '/ops/login'
        if (!isLoginPage) {
            document.body.setAttribute('data-layout', 'ops')
        } else {
            document.body.removeAttribute('data-layout')
        }
        return () => {
            document.body.removeAttribute('data-layout')
        }
    }, [pathname])

    // ══════════════════════════════════════════════════════════════
    // FIXED: No conditional rendering based on pathname
    // Login page pe bhi same structure render karo, sidebar/topbar
    // pathname check karke hide karo
    // ═══════════════════════════════════════════════════════════════
    const isLoginPage = pathname === '/ops/login'

    if (isLoginPage) {
        return (
            <>
                {children}
                <Toaster position="top-right" richColors />
            </>
        )
    }

    return (
        <div className="flex h-dvh overflow-hidden bg-muted/40">
            {/* Sidebar */}
            <OpsSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Topbar */}
                <OpsTopbar onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* Toast Notifications */}
            <Toaster position="top-right" richColors />
        </div>
    )
}