// components/admin/ProviderTable.tsx
"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, CheckCircle, XCircle, Star, Search, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
interface Provider {
    id: string
    status: string
    avgRating: number
    totalJobs: number
    totalEarnings: number
    commissionRate: number
    user: {
        name: string | null
        phone: string
        email: string | null
        avatar: string | null
    }
    _count?: {
        services: number
        bookings: number
    }
}
interface ProviderTableProps {
    providers: Provider[]
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    isApplicationView?: boolean
    search: string
    status: string
    onSearchChange: (val: string) => void
    onStatusChange: (val: string) => void
    onReset: () => void
    onPageChange?: (page: number) => void
}
export function ProviderTable({ 
    providers,
    pagination,
    onApprove,
    onReject,
    isApplicationView,
    search,
    status,
    onSearchChange,
    onStatusChange,
    onReset,
    onPageChange
}: ProviderTableProps) {
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default'
            case 'PENDING': return 'secondary'
            case 'UNDER_REVIEW': return 'outline'
            case 'REJECTED': return 'destructive'
            case 'SUSPENDED': return 'destructive'
            default: return 'secondary'
        }
    }
    return (
        <TooltipProvider>
            <div className="space-y-4">
                {!isApplicationView && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by name or phone..." 
                                value={search} 
                                onChange={(e) => onSearchChange(e.target.value)} 
                                className="pl-9" 
                            />
                        </div>
                        <Select value={status} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={onReset}>
                            <RotateCcw className="h-4 w-4 mr-2" />Reset
                        </Button>
                    </div>
                )}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Services</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Jobs</TableHead>
                                <TableHead>Commission</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {providers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No providers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                providers.map((provider) => (
                                    <TableRow key={provider.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{provider.user.name || "Unnamed"}</span>
                                                <span className="text-xs text-muted-foreground">{provider.user.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(provider.status) as any}>
                                                {provider.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{provider._count?.services || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                {provider.avgRating?.toFixed(1) || '0.0'}
                                            </div>
                                        </TableCell>
                                        <TableCell>{provider.totalJobs || 0}</TableCell>
                                        <TableCell>{provider.commissionRate}%</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            asChild 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Link href={`/admin/providers/${provider.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Details</TooltipContent>
                                                </Tooltip>
                                                {isApplicationView && provider.status !== 'APPROVED' && provider.status !== 'REJECTED' && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => onApprove?.(provider.id)}
                                                                    className="hover:bg-green-50"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Approve Provider</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => onReject?.(provider.id)}
                                                                    className="hover:bg-red-50"
                                                                >
                                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Reject Provider</TooltipContent>
                                                        </Tooltip>
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
                {pagination && pagination.totalPages > 1 && onPageChange && (
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} providers
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                                    let page: number
                                    if (pagination.totalPages <= 5) {
                                        page = i + 1
                                    } else if (pagination.page <= 3) {
                                        page = i + 1
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        page = pagination.totalPages - 4 + i
                                    } else {
                                        page = pagination.page - 2 + i
                                    }
                                    
                                    return (
                                        <Button
                                            key={page}
                                            variant={page === pagination.page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onPageChange(page)}
                                            className="w-9 h-9 p-0"
                                        >
                                            {page}
                                        </Button>
                                    )
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}