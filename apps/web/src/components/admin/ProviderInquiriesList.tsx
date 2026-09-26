// components/admin/ProviderInquiriesList.tsx

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Eye, UserPlus, X, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ProviderInquiriesListProps {
    initialData: {
        inquiries: any[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export function ProviderInquiriesList({ initialData }: ProviderInquiriesListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")
    const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    
    // Provider creation form
    const [providerData, setProviderData] = useState({
        password: "",
        commissionRate: "15"
    })

    const updateURL = (newStatus: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newPage > 1) params.set('page', newPage.toString())
        router.push(`/admin/provider-inquiries?${params.toString()}`)
    }

    const handleStatusChange = (value: string) => {
        setStatus(value)
        updateURL(value, 1)
    }

    const handlePageChange = (page: number) => {
        updateURL(status, page)
    }

    const handleViewInquiry = (inquiry: any) => {
        setSelectedInquiry(inquiry)
    }

    const handleCreateProvider = (inquiry: any) => {
        setSelectedInquiry(inquiry)
        setProviderData({
            password: Math.random().toString(36).slice(-8), // Generate random password
            commissionRate: "15"
        })
        setShowCreateDialog(true)
    }

    const submitCreateProvider = async () => {
        if (!selectedInquiry) return

        setCreateLoading(true)
        try {
            const res = await apiFetch('/api/admin/provider-inquiries/create-provider', {
                method: 'POST',
                body: JSON.stringify({
                    inquiryId: selectedInquiry.id,
                    password: providerData.password,
                    commissionRate: parseFloat(providerData.commissionRate)
                })
            })

            if (!res || !res.ok) {
                toast.error("Failed to create provider")
                return
            }

            const data = await res.json()
            if (data.success) {
                toast.success("Provider created successfully!")
                setShowCreateDialog(false)
                router.refresh()
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Create provider error:', error)
            toast.error("Failed to create provider")
        } finally {
            setCreateLoading(false)
        }
    }

    const handleReject = async (inquiryId: string) => {
        if (!confirm("Are you sure you want to reject this application?")) return

        try {
            const res = await apiFetch(`/api/admin/provider-inquiries/${inquiryId}/reject`, {
                method: 'POST'
            })

            if (!res || !res.ok) {
                toast.error("Failed to reject")
                return
            }

            const data = await res.json()
            if (data.success) {
                toast.success("Application rejected")
                router.refresh()
            } else {
                toast.error(data.error)
            }
        } catch (error) {
            console.error('Reject error:', error)
            toast.error("Failed to reject")
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'secondary'
            case 'APPROVED': return 'default'
            case 'REJECTED': return 'destructive'
            case 'CONTACTED': return 'outline'
            default: return 'secondary'
        }
    }

    return (
        <>
            <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-4">
                    <Select value={status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Experience</TableHead>
                                <TableHead>Services</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applied</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialData.inquiries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No applications found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialData.inquiries.map((inquiry) => (
                                    <TableRow key={inquiry.id}>
                                        <TableCell className="font-medium">{inquiry.name}</TableCell>
                                        <TableCell>{inquiry.phone}</TableCell>
                                        <TableCell>{inquiry.experience || 0} years</TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {inquiry.services || 'Not specified'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(inquiry.status) as any}>
                                                {inquiry.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(inquiry.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewInquiry(inquiry)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {inquiry.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleCreateProvider(inquiry)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <UserPlus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleReject(inquiry.id)}
                                                            className="text-destructive hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {initialData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {((initialData.pagination.page - 1) * initialData.pagination.limit) + 1} to{' '}
                            {Math.min(initialData.pagination.page * initialData.pagination.limit, initialData.pagination.total)} of{' '}
                            {initialData.pagination.total} applications
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(initialData.pagination.page - 1)}
                                disabled={initialData.pagination.page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(initialData.pagination.page + 1)}
                                disabled={initialData.pagination.page === initialData.pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Inquiry Dialog */}
            {selectedInquiry && !showCreateDialog && (
                <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Name</Label>
                                <p className="font-medium">{selectedInquiry.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Phone</Label>
                                    <p className="font-medium">{selectedInquiry.phone}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedInquiry.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Experience</Label>
                                    <p className="font-medium">{selectedInquiry.experience || 0} years</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">City</Label>
                                    <p className="font-medium">{selectedInquiry.city || 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Services</Label>
                                <p className="font-medium">{selectedInquiry.services || 'Not specified'}</p>
                            </div>
                            {selectedInquiry.message && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">Message</Label>
                                    <p className="text-sm">{selectedInquiry.message}</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            {selectedInquiry.status === 'PENDING' && (
                                <Button onClick={() => handleCreateProvider(selectedInquiry)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Create Provider
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Create Provider Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Provider Account</DialogTitle>
                        <DialogDescription>
                            Create provider account for {selectedInquiry?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number (Login ID)</Label>
                            <Input value={selectedInquiry?.phone} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Password</Label>
                            <Input
                                value={providerData.password}
                                onChange={(e) => setProviderData({ ...providerData, password: e.target.value })}
                                placeholder="Auto-generated password"
                            />
                            <p className="text-xs text-muted-foreground">
                                This password will be sent to the provider via SMS
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Commission Rate (%)</Label>
                            <Input
                                type="number"
                                value={providerData.commissionRate}
                                onChange={(e) => setProviderData({ ...providerData, commissionRate: e.target.value })}
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitCreateProvider} disabled={createLoading}>
                            {createLoading ? "Creating..." : "Create Provider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}