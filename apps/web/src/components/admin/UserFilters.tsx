// src/components/admin/UserFilters.tsx

"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw } from "lucide-react"

interface UserFiltersProps {
    search: string
    role: string
    status: string
    onSearchChange: (value: string) => void
    onRoleChange: (value: string) => void
    onStatusChange: (value: string) => void
    onReset: () => void
}

export function UserFilters({
    search, role, status,
    onSearchChange, onRoleChange, onStatusChange, onReset
}: UserFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, phone or email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            
            <Select value={role} onValueChange={onRoleChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="PROVIDER">Provider</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
            </Select>

            <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Blocked</SelectItem>
                </SelectContent>
            </Select>

            <Button variant="outline" onClick={onReset} className="sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
            </Button>
        </div>
    )
}