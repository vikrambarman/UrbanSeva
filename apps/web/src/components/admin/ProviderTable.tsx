"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, Clock, AlertCircle, Eye } from "lucide-react"

interface Payout {
    id: string
    amount: number
    method: string
    status: string
    reference: string | null
    processedAt: string | null
    createdAt: string
    bankAccount?: string | null
    bankIFSC?: string | null
    bankName?: string | null
    upiId?: string | null
    notes?: string | null
    provider: {
        user: { name: string | null, phone: string, email?: string | null }
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

    const getPaymentDetails = (payout: Payout) => {
        if (payout.method === 'BANK_TRANSFER') {
            return (
                <div className="text-xs space-y-0.5">
                    <p className="font-medium">Bank Transfer</p>
                    {payout.bankAccount && <p className="text-muted-foreground">A/C: {payout.bankAccount}</p>}
                    {payout.bankIFSC && <p className="text-muted-foreground">IFSC: {payout.bankIFSC}</p>}
                    {payout.bankName && <p className="text-muted-foreground">{payout.bankName}</p>}
                </div>
            )
        } else if (payout.method === 'UPI') {
            return (
                <div className="text-xs space-y-0.5">
                    <p className="font-medium">UPI</p>
                    {payout.upiId && <p className="text-muted-foreground">{payout.upiId}</p>}
                </div>
            )
        } else if (payout.method === 'CASH') {
            return (
                <div className="text-xs">
                    <p className="font-medium">Cash</p>
                    <p className="text-muted-foreground">Offline</p>
                </div>
            )
        }
        return <p className="text-xs">{payout.method}</p>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Details</TableHead>
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
                                        {payout.provider.user.email && (
                                            <span className="text-xs text-muted-foreground">{payout.provider.user.email}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-semibold">₹{payout.amount.toLocaleString()}</TableCell>
                                <TableCell>{getPaymentDetails(payout)}</TableCell>
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
                                            <span className="text-xs text-muted-foreground">
                                                Paid: {new Date(payout.processedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                        {payout.reference && (
                                            <span className="text-xs text-muted-foreground">Ref: {payout.reference}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {payout.status === 'PENDING' && (
                                        <Button size="sm" onClick={() => onProcess(payout.id)}>
                                            <Eye className="h-4 w-4 mr-1" /> Review & Pay
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