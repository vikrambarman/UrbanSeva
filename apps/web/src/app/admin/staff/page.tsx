// apps/web/src/app/admin/staff/page.tsx
// CHANGE: Replaced apiFetch with direct fetch using cache: 'no-store'
// WHY: Next.js client-side fetch caching ki wajah se initial load par empty data aa raha tha. 
//      Search karne par URL change hota tha jisse cache bypass ho jata tha. 
//      Ab har request fresh fetch hogi.

"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    Search, Plus, MoreHorizontal, Edit, Trash2,
    UserCheck, UserX, Phone, Headphones,
    ChevronLeft, ChevronRight, Shield, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

interface StaffMember {
    id: string
    name: string | null
    phone: string
    email: string | null
    isActive: boolean
    lastLoginAt: string | null
    loginCount: number
    createdAt: string
    categories: { id: string; name: string; slug: string }[]
}

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; staff: StaffMember | null }>({
        open: false, staff: null
    })

    const fetchStaff = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', '20')
            if (search) params.set('search', search)

            const url = `/api/admin/staff?${params.toString()}`
            console.log('🔍 Fetching staff from:', url)

            // CHANGE: Using direct fetch with cache: 'no-store' to prevent Next.js caching
            const res = await apiFetch(url, {
                cache: 'no-store',
                credentials: 'include', // Ensure cookies/auth headers are sent
            })
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                console.error('❌ API Error:', res.status, errorData)
                throw new Error(errorData.error || `HTTP ${res.status}`)
            }

            const data = await res.json()
            console.log('✅ Staff API Response:', data)

            if (data.success) {
                setStaff(data.data.staff || [])
                setTotalPages(data.data.pagination?.totalPages || 1)
                setTotal(data.data.pagination?.total || 0)
            } else {
                console.error('❌ API returned success: false:', data)
                setError(data.error || 'Failed to load staff')
                toast.error(data.error || 'Failed to load staff')
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            console.error('❌ Failed to fetch staff:', error)
            setError(message)
            toast.error(`Failed to load staff: ${message}`)
        } finally {
            setLoading(false)
        }
    }, [page, search])

    useEffect(() => {
        fetchStaff()
    }, [fetchStaff])

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleToggleActive = async (staffMember: StaffMember) => {
        try {
            const res = await apiFetch(`/api/admin/staff/${staffMember.id}`, {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify({ isActive: !staffMember.isActive }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(staffMember.isActive ? 'Staff deactivated' : 'Staff activated')
                fetchStaff()
            } else {
                toast.error(data.error || 'Failed to update')
            }
        } catch {
            toast.error('Failed to update')
        }
    }

    const handleDelete = async () => {
        if (!deleteModal.staff) return
        try {
            const res = await apiFetch(`/api/admin/staff/${deleteModal.staff.id}`, {
                method: 'DELETE',
                credentials: 'include',
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Staff member deleted')
                setDeleteModal({ open: false, staff: null })
                fetchStaff()
            } else {
                toast.error(data.error || 'Failed to delete')
            }
        } catch {
            toast.error('Failed to delete')
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never'
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Headphones className="h-6 w-6 text-primary" />
                        Calling Team
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {total} staff members • Manage your operations team
                    </p>
                </div>
                <Link href="/admin/staff/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Staff Member
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, phone, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <div className="flex-1">
                                <p className="font-medium text-destructive">Failed to load staff</p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchStaff}>
                                Retry
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Staff Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-12">
                            <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">No staff members yet</p>
                            <Link href="/admin/staff/create">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Staff Member
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Categories</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead>Logins</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {staff.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-primary">
                                                                {(member.name || 'S').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {member.name || 'Unnamed'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Joined {formatDate(member.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {member.phone}
                                                        </p>
                                                        {member.email && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {member.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {member.categories.length > 0 ? (
                                                            member.categories.map(cat => (
                                                                <Badge key={cat.id} variant="secondary" className="text-xs">
                                                                    {cat.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                No categories
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={member.isActive ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {member.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p>{formatDate(member.lastLoginAt)}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">
                                                        {member.loginCount}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/admin/staff/${member.id}`} className="flex items-center cursor-pointer">
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleActive(member)}
                                                            >
                                                                {member.isActive ? (
                                                                    <>
                                                                        <UserX className="h-4 w-4 mr-2" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => setDeleteModal({ open: true, staff: member })}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page} of {totalPages} ({total} total)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm" variant="outline"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => p - 1)}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm" variant="outline"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, staff: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Staff Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{deleteModal.staff?.name || 'this staff member'}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteModal({ open: false, staff: null })}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}