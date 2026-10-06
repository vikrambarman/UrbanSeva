// apps/web/src/app/ops/layout.tsx
// CHANGE: Auth check completely hata diya layout se (Admin layout jaisa)
// CHANGE: Sirf data-layout attribute set karna hai, baaki middleware handle karega
// WHY: Admin layout mein koi auth check nahi hai, sirf middleware handle karta hai.
//      Ops layout mein bhi same pattern follow karenge — no client-side auth redirect.

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
    // Body pe data-layout attribute set karo — CSS ke liye
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

    // ═══════════════════════════════════════════════════════════════
    // Login page — no sidebar/topbar
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

    // ═══════════════════════════════════════════════════════════════
    // Main layout — sidebar + topbar (NO auth check — middleware handles it)
    // ═══════════════════════════════════════════════════════════════
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