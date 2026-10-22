"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash2, Search, RotateCcw, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

interface Service {
    id: string
    name: string
    slug: string
    image: string | null
    basePrice: number
    isActive: boolean
    isTrending: boolean
    isFeatured: boolean
    // ═══════════════════════════════════════════════════════════════
    // NEW: Service-level override fields
    // ═══════════════════════════════════════════════════════════════
    gstEnabled: boolean | null
    gstPercentage: number | null
    subCategory: { 
        name: string
        category: { 
            name: string
            gstEnabled: boolean
            gstPercentage: number
        } 
    }
    _count: { bookings: number, reviews: number }
}

interface ServiceTableProps {
    services: Service[]
    search: string
    status: string
    // ═══════════════════════════════════════════════════════════════
    // NEW: Category filter props
    // ═══════════════════════════════════════════════════════════════
    categoryId: string
    categories: { id: string; name: string; _count: { subCategories: number } }[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
    onSearchChange: (val: string) => void
    onStatusChange: (val: string) => void
    // ═══════════════════════════════════════════════════════════════
    // NEW: Category change callback
    // ═══════════════════════════════════════════════════════════════
    onCategoryChange: (val: string) => void
    onReset: () => void
    onToggleActive: (id: string, currentStatus: boolean) => void
    onDelete: (id: string) => void
    onPageChange: (page: number) => void
    isLoading?: boolean
}

export function ServiceTable({ 
    services, search, status, categoryId, categories, pagination, 
    onSearchChange, onStatusChange, onCategoryChange,
    onReset, onToggleActive, onDelete, onPageChange, isLoading = false
}: ServiceTableProps) {

    // ═══════════════════════════════════════════════════════════════
    // NEW: Helper to get effective GST info for a service
    // ═══════════════════════════════════════════════════════════════
    const getEffectiveGST = (service: Service) => {
        if (service.gstEnabled === null) {
            // Using category default
            const cat = service.subCategory?.category
            return {
                enabled: cat?.gstEnabled ?? false,
                rate: cat?.gstPercentage ?? 0,
                source: 'category' as const
            }
        }
        // Custom override
        return {
            enabled: service.gstEnabled,
            rate: service.gstPercentage ?? 0,
            source: 'custom' as const
        }
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search services..." 
                            value={search} 
                            onChange={(e) => onSearchChange(e.target.value)} 
                            className="pl-9" 
                        />
                    </div>
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    {/* NEW: Category Filter Dropdown */}
                    {/* ═══════════════════════════════════════════════════════════════ */}
                    <Select value={categoryId} onValueChange={onCategoryChange}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name} ({cat._count.subCategories})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={onReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />Reset
                    </Button>
                    <Button asChild>
                        <Link href="/admin/services/create">Add Service</Link>
                    </Button>
                </div>

                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center rounded-md">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Base Price</TableHead>
                                    {/* ═══════════════════════════════════════════════════════════════ */}
                                    {/* NEW: GST Status Column */}
                                    {/* ═══════════════════════════════════════════════════════════════ */}
                                    <TableHead>GST</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No services found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    services.map((service) => {
                                        const gstInfo = getEffectiveGST(service)
                                        return (
                                            <TableRow key={service.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {service.image ? (
                                                            <img 
                                                                src={service.image} 
                                                                alt={service.name} 
                                                                className="w-10 h-10 rounded-md object-cover" 
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs">
                                                                No Img
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{service.name}</span>
                                                            <span className="text-xs text-muted-foreground">{service.slug}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{service.subCategory?.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {service.subCategory?.category?.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>₹{service.basePrice}</TableCell>
                                                {/* ═══════════════════════════════════════════════════════════════ */}
                                                {/* NEW: GST Status Badge */}
                                                {/* ═══════════════════════════════════════════════════════════════ */}
                                                <TableCell>
                                                    {gstInfo.enabled ? (
                                                        <div className="flex flex-col">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={gstInfo.source === 'custom' 
                                                                    ? 'text-orange-600 border-orange-300 bg-orange-50' 
                                                                    : 'text-blue-600 border-blue-300 bg-blue-50'
                                                                }
                                                            >
                                                                {gstInfo.source === 'custom' ? '⚡' : '📋'} {gstInfo.rate}%
                                                            </Badge>
                                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                {gstInfo.source === 'custom' ? 'Custom' : 'Category'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col">
                                                            <Badge variant="secondary" className="text-muted-foreground">
                                                                No GST
                                                            </Badge>
                                                            {gstInfo.source === 'custom' && (
                                                                <span className="text-[10px] text-orange-500 mt-0.5">
                                                                    ⚡ Custom
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={service.isActive ? 'default' : 'secondary'}>
                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {service.isTrending && (
                                                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                                                                Trending
                                                            </Badge>
                                                        )}
                                                        {service.isFeatured && (
                                                            <Badge variant="outline" className="text-purple-500 border-purple-500">
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button asChild variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
                                                                    <Link href={`/admin/services/${service.id}/edit`}>
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit Service</p></TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => onToggleActive(service.id, service.isActive)}
                                                                    className={service.isActive 
                                                                        ? "hover:bg-green-50 hover:text-green-600" 
                                                                        : "hover:bg-orange-50 hover:text-orange-600"
                                                                    }
                                                                >
                                                                    {service.isActive ? (
                                                                        <Eye className="h-4 w-4 text-green-600" />
                                                                    ) : (
                                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{service.isActive ? 'Deactivate Service' : 'Activate Service'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => onDelete(service.id)}
                                                                    className="hover:bg-red-50 hover:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Delete Service</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} services
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