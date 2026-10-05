// components/admin/ServiceTable.tsx

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
    subCategory: { name: string, category: { name: string } }
    _count: { bookings: number, reviews: number }
}

interface ServiceTableProps {
    services: Service[]
    search: string
    status: string
    pagination: { page: number; limit: number; total: number; totalPages: number }
    onSearchChange: (val: string) => void
    onStatusChange: (val: string) => void
    onReset: () => void
    onToggleActive: (id: string, currentStatus: boolean) => void
    onDelete: (id: string) => void
    onPageChange: (page: number) => void
    // CHANGE: isLoading prop added — ServicesList se useTransition ka pending state aayega
    // Jab URL change hoga aur server component re-render hoga, tab tak loading dikhega
    isLoading?: boolean
}

export function ServiceTable({ 
    services, search, status, pagination, onSearchChange, onStatusChange, 
    onReset, onToggleActive, onDelete, onPageChange, isLoading = false
}: ServiceTableProps) {
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
                    <Select value={status} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full sm:w-[180px]">
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

                {/* CHANGE: Table wrapper mein relative positioning + loading overlay */}
                <div className="relative">
                    {/* CHANGE: Loading overlay — jab server navigation ho rahi ho */}
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No services found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    services.map((service) => (
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
                                    ))
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