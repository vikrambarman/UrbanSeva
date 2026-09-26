"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RotateCcw, Plus } from "lucide-react"

interface BookingFiltersProps {
    search: string
    status: string
    onSearchChange: (value: string) => void
    onStatusChange: (value: string) => void
    onReset: () => void
    onCreateManual: () => void
}

export function BookingFilters({
    search, status, onSearchChange, onStatusChange, onReset, onCreateManual
}: BookingFiltersProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by booking #, customer name, or phone..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9"
                />
            </div>
            
            <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PROVIDER_ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="SERVICE_COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
            </Select>

            <Button variant="outline" onClick={onReset} className="sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            
            <Button onClick={onCreateManual} className="sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Manual Booking
            </Button>
        </div>
    )
}