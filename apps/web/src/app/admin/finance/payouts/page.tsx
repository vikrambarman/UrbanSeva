"use client"

import { useEffect, useState, useMemo } from "react"
import { PayoutTable } from "@/components/admin/PayoutTable"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
    ArrowLeft, 
    IndianRupee, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    RefreshCw,
    Search,
    Download,
    Calendar,
    TrendingUp,
    Users,
    Wallet,
    Filter,
    MoreVertical,
    Eye,
    CheckSquare,
    Square,
    FileText,
    Activity
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([])
    const [allPayouts, setAllPayouts] = useState<any[]>([]) // For filtering
    const [status, setStatus] = useState("ALL")
    const [searchQuery, setSearchQuery] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [loading, setLoading] = useState(true)
    const [selectedPayouts, setSelectedPayouts] = useState<Set<string>>(new Set())

    // Process Payout Dialog
    const [processDialogOpen, setProcessDialogOpen] = useState(false)
    const [selectedPayout, setSelectedPayout] = useState<any>(null)
    const [processingNotes, setProcessingNotes] = useState('')
    const [processing, setProcessing] = useState(false)

    // Bulk Process Dialog
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
    const [bulkProcessing, setBulkProcessing] = useState(false)

    // Summary
    const [summary, setSummary] = useState<any>(null)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    const fetchPayouts = async () => {
        setLoading(true)
        try {
            const res = await apiFetch(`/api/admin/finance/payouts?status=${status}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.success) {
                setAllPayouts(data.data)
                setPayouts(data.data)
            } else toast.error(data.error)
        } catch { toast.error("Failed to fetch payouts") } 
        finally { setLoading(false) }
    }

    const fetchSummary = async () => {
        try {
            const res = await apiFetch('/api/admin/finance/payouts/summary', { cache: 'no-store' })
            const data = await res.json()
            if (data.success) setSummary(data.data)
        } catch (error) {
            console.error('Summary fetch error:', error)
        }
    }

    useEffect(() => { 
        fetchPayouts()
        fetchSummary()
    }, [status])

    // Filter payouts based on search and date
    useEffect(() => {
        let filtered = allPayouts

        if (searchQuery) {
            filtered = filtered.filter(p => 
                p.provider?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.provider?.user?.phone?.includes(searchQuery) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (dateFrom) {
            filtered = filtered.filter(p => new Date(p.createdAt) >= new Date(dateFrom))
        }

        if (dateTo) {
            filtered = filtered.filter(p => new Date(p.createdAt) <= new Date(dateTo + 'T23:59:59'))
        }

        setPayouts(filtered)
        setCurrentPage(1)
    }, [searchQuery, dateFrom, dateTo, allPayouts])

    // Pagination logic
    const paginatedPayouts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return payouts.slice(startIndex, startIndex + itemsPerPage)
    }, [payouts, currentPage, itemsPerPage])

    const totalPages = Math.ceil(payouts.length / itemsPerPage)

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedPayouts.size === paginatedPayouts.length) {
            setSelectedPayouts(new Set())
        } else {
            setSelectedPayouts(new Set(paginatedPayouts.map(p => p.id)))
        }
    }

    const toggleSelectPayout = (id: string) => {
        const newSet = new Set(selectedPayouts)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedPayouts(newSet)
    }

    // Process single payout
    const handleProcessPayout = (payoutId: string) => {
        const payout = payouts.find(p => p.id === payoutId)
        if (!payout) {
            toast.error('Payout not found')
            return
        }
        setSelectedPayout(payout)
        setProcessingNotes('')
        setProcessDialogOpen(true)
    }

    const confirmProcessPayout = async () => {
        if (!selectedPayout) return

        setProcessing(true)
        try {
            const res = await apiFetch('/api/admin/finance/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    payoutId: selectedPayout.id,
                    notes: processingNotes 
                })
            })
            const data = await res.json()
            if (data.success) { 
                toast.success("Payout marked as paid successfully!")
                setProcessDialogOpen(false)
                setSelectedPayout(null)
                fetchPayouts()
                fetchSummary()
            } else toast.error(data.error)
        } catch { toast.error("Failed to process payout") }
        finally { setProcessing(false) }
    }

    // Bulk process
    const handleBulkProcess = async () => {
        if (selectedPayouts.size === 0) {
            toast.error('No payouts selected')
            return
        }

        setBulkProcessing(true)
        let successCount = 0
        let errorCount = 0

        for (const payoutId of selectedPayouts) {
            try {
                const res = await apiFetch('/api/admin/finance/payouts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ payoutId })
                })
                const data = await res.json()
                if (data.success) successCount++
                else errorCount++
            } catch {
                errorCount++
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} payout(s) processed successfully!`)
        }
        if (errorCount > 0) {
            toast.error(`${errorCount} payout(s) failed to process`)
        }

        setBulkProcessing(false)
        setBulkDialogOpen(false)
        setSelectedPayouts(new Set())
        fetchPayouts()
        fetchSummary()
    }

    // Export to CSV
    const exportToCSV = () => {
        if (payouts.length === 0) {
            toast.error('No data to export')
            return
        }

        const headers = ['ID', 'Provider Name', 'Phone', 'Amount', 'Method', 'Status', 'Created At', 'Processed At']
        const rows = payouts.map(p => [
            p.id,
            p.provider?.user?.name || 'Unnamed',
            p.provider?.user?.phone || '',
            p.amount,
            p.method,
            p.status,
            new Date(p.createdAt).toLocaleDateString(),
            p.processedAt ? new Date(p.processedAt).toLocaleDateString() : ''
        ])

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `payouts_${status}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Payouts exported successfully!')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
            case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/admin/finance"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
                        <p className="text-muted-foreground">Review and process provider payouts with full details.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV} disabled={payouts.length === 0}>
                        <Download className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchPayouts} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">₹{Number(summary.totalPaid || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.completedCount || 0} payouts completed</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-amber-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">₹{Number(summary.totalPending || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.pendingCount || 0} awaiting payment</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">₹{Number(summary.thisMonth || 0).toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">{summary.thisMonthCount || 0} payouts</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Providers Paid</CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{summary.uniqueProviders || 0}</div>
                            <p className="text-xs text-muted-foreground">Unique providers</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters & Actions */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-3 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by provider name, phone, or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Range */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-[150px]"
                                    placeholder="From"
                                />
                                <span className="text-muted-foreground">to</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-[150px]"
                                    placeholder="To"
                                />
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {selectedPayouts.size > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{selectedPayouts.size} selected</Badge>
                                <Button 
                                    size="sm" 
                                    onClick={() => setBulkDialogOpen(true)}
                                    disabled={bulkProcessing}
                                >
                                    <CheckSquare className="h-4 w-4 mr-2" />
                                    {bulkProcessing ? 'Processing...' : 'Bulk Process'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedPayouts(new Set())}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Payouts Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Payouts List</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showing {paginatedPayouts.length} of {payouts.length} payouts
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : paginatedPayouts.length === 0 ? (
                        <div className="text-center py-12">
                            <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No payouts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All Checkbox */}
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleSelectAll}>
                                        {selectedPayouts.size === paginatedPayouts.length ? (
                                            <CheckSquare className="h-4 w-4" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                    <span className="text-sm font-medium">Select All</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {selectedPayouts.size} of {paginatedPayouts.length} selected
                                </span>
                            </div>

                            {/* Payout Items */}
                            {paginatedPayouts.map((payout) => (
                                <div 
                                    key={payout.id} 
                                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                                        selectedPayouts.has(payout.id) ? 'bg-primary/5 border-primary' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <button onClick={() => toggleSelectPayout(payout.id)}>
                                                {selectedPayouts.has(payout.id) ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                            
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-semibold">{payout.provider?.user?.name || 'Unnamed Provider'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {payout.provider?.user?.phone} • {payout.method.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-bold">₹{Number(payout.amount).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge className={getStatusColor(payout.status)}>
                                                    {payout.status}
                                                </Badge>
                                                {payout.status === 'PENDING' && (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleProcessPayout(payout.id)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" /> Review
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Process Payout Dialog */}
            <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review & Confirm Payout</DialogTitle>
                        <DialogDescription>
                            Verify all details before marking this payout as completed.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayout && (
                        <div className="space-y-6 py-4">
                            {/* Provider Details */}
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Provider Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="font-medium">{selectedPayout.provider?.user?.name || 'Unnamed'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedPayout.provider?.user?.phone}</p>
                                    </div>
                                    {selectedPayout.provider?.user?.email && (
                                        <div>
                                            <p className="text-muted-foreground">Email</p>
                                            <p className="font-medium">{selectedPayout.provider.user.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4" /> Payment Details
                                </h4>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Amount</span>
                                    <span className="text-2xl font-bold text-primary">₹{Number(selectedPayout.amount).toLocaleString()}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Payment Method</p>
                                        <p className="font-medium">{selectedPayout.method.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Requested On</p>
                                        <p className="font-medium">{new Date(selectedPayout.createdAt).toLocaleDateString('en-IN')}</p>
                                    </div>
                                </div>

                                {selectedPayout.method === 'BANK_TRANSFER' && (
                                    <div className="pt-3 border-t space-y-2">
                                        <p className="text-sm font-semibold">Bank Account Details</p>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            {selectedPayout.bankAccount && (
                                                <div>
                                                    <p className="text-muted-foreground">Account Number</p>
                                                    <p className="font-medium font-mono">{selectedPayout.bankAccount}</p>
                                                </div>
                                            )}
                                            {selectedPayout.bankIFSC && (
                                                <div>
                                                    <p className="text-muted-foreground">IFSC Code</p>
                                                    <p className="font-medium font-mono">{selectedPayout.bankIFSC}</p>
                                                </div>
                                            )}
                                            {selectedPayout.bankName && (
                                                <div>
                                                    <p className="text-muted-foreground">Bank Name</p>
                                                    <p className="font-medium">{selectedPayout.bankName}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedPayout.method === 'UPI' && selectedPayout.upiId && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm font-semibold">UPI Details</p>
                                        <p className="font-medium font-mono mt-1">{selectedPayout.upiId}</p>
                                    </div>
                                )}

                                {selectedPayout.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-sm font-semibold">Provider Notes</p>
                                        <p className="text-sm mt-1">{selectedPayout.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            <div className="space-y-2">
                                <Label>Admin Notes (Optional)</Label>
                                <Input
                                    value={processingNotes}
                                    onChange={(e) => setProcessingNotes(e.target.value)}
                                    placeholder="Add transaction reference, UTR number, or any notes..."
                                />
                            </div>

                            {/* Confirmation Warning */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-semibold text-amber-900">Confirm Payment</p>
                                        <p className="text-amber-800 mt-1">
                                            Please ensure you have actually transferred ₹{Number(selectedPayout.amount).toLocaleString()} to the provider via {selectedPayout.method.replace('_', ' ')}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmProcessPayout} disabled={processing}>
                            {processing ? 'Processing...' : '✓ Confirm & Mark as Paid'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Process Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Process Payouts</DialogTitle>
                        <DialogDescription>
                            You are about to process {selectedPayouts.size} payout(s). This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-900">Warning</p>
                                <p className="text-amber-800 mt-1">
                                    Make sure you have transferred the amounts to all selected providers before confirming.
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkProcess} disabled={bulkProcessing}>
                            {bulkProcessing ? 'Processing...' : `Process ${selectedPayouts.size} Payout(s)`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}