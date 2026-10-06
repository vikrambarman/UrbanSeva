// app/admin/layout.tsx
// CHANGE: Mounted state completely remove kiya — hydration mismatch ka root cause tha
// CHANGE: Sirf useEffect se data-layout attribute set kiya — no conditional rendering
// CHANGE: h-dvh use kiya for proper viewport height
// WHY: Server aur client pe EXACT same HTML render hona chahiye.
//       useEffect baad mein chalta hai, to pehli render mein dono same structure dikhaenge.
//       data-layout attribute CSS ke liye hai, HTML structure change nahi karta.

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/admin/Sidebar"
import { Topbar } from "@/components/admin/Topbar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // ═══════════════════════════════════════════════════════════════
    // Body pe data-layout attribute set karo — CSS ke liye
    // ═══════════════════════════════════════════════════════════════
    // KYA: useEffect mein attribute set karo, cleanup mein hata do
    // KYUN: Ye sirf CSS selector ke liye hai — HTML structure change nahi hota
    //       isliye hydration mismatch nahi hoga
    useEffect(() => {
        document.body.setAttribute('data-layout', 'dashboard')
        return () => {
            document.body.removeAttribute('data-layout')
        }
    }, [])

    // ═══════════════════════════════════════════════════════════════
    // FIXED: No conditional rendering — server aur client same structure
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="flex h-dvh overflow-hidden bg-muted/40">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Topbar */}
                <Topbar onMenuClick={() => setIsSidebarOpen(true)} />

                {/* Page Content — Only this scrolls */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}