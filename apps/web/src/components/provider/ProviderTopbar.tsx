"use client"

import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

interface ProviderTopbarProps {
    onMenuClick: () => void
}

export function ProviderTopbar({ onMenuClick }: ProviderTopbarProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold hidden sm:block">Provider Panel</h2>
                
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    </Button>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>PR</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}