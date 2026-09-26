"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"

interface Payout {
    id: string
    amount: number
    method: string
    status: string
    reference: string | null
    processedAt: string | null
    createdAt: string
    provider: {
        user: { name: string | null, phone: string }
    }
}

interface PayoutTableProps {
    payouts: Payout[]
    onProcess: (id: string) => void
}

export function PayoutTable({ payouts, onProcess }: PayoutTableProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'PROCESSING': return <Clock className="h-4 w-4 text-yellow-600" />
            case 'FAILED': return <AlertCircle className="h-4 w-4 text-destructive" />
            default: return <Clock className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payouts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No payouts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        payouts.map((payout) => (
                            <TableRow key={payout.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{payout.provider.user.name || "Unnamed"}</span>
                                        <span className="text-xs text-muted-foreground">{payout.provider.user.phone}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-semibold">₹{payout.amount.toLocaleString()}</TableCell>
                                <TableCell>{payout.method}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(payout.status)}
                                        <Badge variant={payout.status === 'COMPLETED' ? 'default' : payout.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                            {payout.status}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{new Date(payout.createdAt).toLocaleDateString()}</span>
                                        {payout.processedAt && (
                                            <span className="text-xs text-muted-foreground">Processed: {new Date(payout.processedAt).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payout.status === 'PENDING' && (
                                        <Button size="sm" onClick={() => onProcess(payout.id)}>
                                            Mark Paid
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}