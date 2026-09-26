"use client"

import { useState } from "react"
import { ProviderSidebar } from "@/components/provider/ProviderSidebar"
import { ProviderTopbar } from "@/components/provider/ProviderTopbar"

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen overflow-hidden bg-muted/40">
            <ProviderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <div className="flex flex-col flex-1 overflow-hidden">
                <ProviderTopbar onMenuClick={() => setIsSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}