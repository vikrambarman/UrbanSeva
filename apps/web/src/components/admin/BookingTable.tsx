"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, UserPlus, XCircle } from "lucide-react"
import Link from "next/link"

interface Booking {
    id: string
    bookingNumber: string
    scheduledDate: string
    scheduledTime: string
    status: string
    totalAmount: number
    user: { name: string | null, phone: string }
    service: { name: string, image: string | null }
    provider: { user: { name: string | null } } | null
}

interface BookingTableProps {
    bookings: Booking[]
    onAssign: (id: string) => void
    onCancel: (id: string) => void
}

export function BookingTable({ bookings, onAssign, onCancel }: BookingTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary'
            case 'CONFIRMED': return 'default'
            case 'PROVIDER_ASSIGNED': return 'outline'
            case 'SERVICE_COMPLETED': return 'default'
            case 'CANCELLED': return 'destructive'
            default: return 'secondary'
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Booking #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No bookings found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{booking.user.name || "Guest"}</span>
                                        <span className="text-xs text-muted-foreground">{booking.user.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {booking.service.image && <img src={booking.service.image} alt="" className="w-8 h-8 rounded object-cover" />}
                                        <span className="text-sm">{booking.service.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{booking.provider?.user.name || <span className="text-muted-foreground text-xs">Unassigned</span>}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                                        <span className="text-xs text-muted-foreground">{booking.scheduledTime}</span>
                                    </div>
                                </TableCell>
                                <TableCell>₹{booking.totalAmount}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(booking.status) as any}>
                                        {booking.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button asChild variant="ghost" size="icon">
                                            <Link href={`/admin/bookings/${booking.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {booking.status === 'PENDING' && (
                                            <Button variant="ghost" size="icon" onClick={() => onAssign(booking.id)} title="Assign Provider">
                                                <UserPlus className="h-4 w-4 text-blue-600" />
                                            </Button>
                                        )}
                                        {booking.status !== 'CANCELLED' && booking.status !== 'SERVICE_COMPLETED' && (
                                            <Button variant="ghost" size="icon" onClick={() => onCancel(booking.id)} title="Cancel Booking">
                                                <XCircle className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}