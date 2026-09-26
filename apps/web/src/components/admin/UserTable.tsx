// src/components/admin/UserTable.tsx

"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight, Wallet, Award } from "lucide-react"
import Link from "next/link"

interface User {
    id: string
    name: string | null
    phone: string
    email: string | null
    avatar?: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    createdAt: string
    walletBalance: number
    loyaltyTier: string
    _count: {
        bookings: number
        reviews: number
    }
}

interface Pagination {
    page: number
    limit: number
    total: number
    totalPages: number
}

interface UserTableProps {
    users: User[]
    pagination: Pagination
    onPageChange: (page: number) => void
    onBlockToggle: (userId: string, currentStatus: boolean) => void
    onDelete: (userId: string) => void
}

export function UserTable({ users, pagination, onPageChange, onBlockToggle, onDelete }: UserTableProps) {
    // Role badge colors
    const getRoleBadge = (role: string) => {
        const colors = {
            SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
            ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
            PROVIDER: 'bg-blue-100 text-blue-800 border-blue-200',
            CUSTOMER: 'bg-green-100 text-green-800 border-green-200',
        }
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    // Loyalty tier colors
    const getLoyaltyColor = (tier: string) => {
        const colors = {
            BRONZE: 'text-orange-700 border-orange-300',
            SILVER: 'text-gray-600 border-gray-400',
            GOLD: 'text-yellow-600 border-yellow-400',
            PLATINUM: 'text-purple-600 border-purple-400',
        }
        return colors[tier as keyof typeof colors] || 'text-gray-600 border-gray-300'
    }

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Wallet</TableHead>
                                <TableHead>Loyalty</TableHead>
                                <TableHead className="text-center">Activity</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        {/* User Info with Avatar */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img 
                                                        src={user.avatar} 
                                                        alt={user.name || 'User'} 
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" 
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name || "Unnamed User"}</span>
                                                    <span className="text-xs text-muted-foreground">{user.phone}</span>
                                                    {user.email && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                            {user.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Role Badge */}
                                        <TableCell>
                                            <Badge className={getRoleBadge(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>

                                        {/* Status with Verification */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                                    {user.isActive ? 'Active' : 'Blocked'}
                                                </Badge>
                                                {user.isVerified && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>Verified User</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Wallet Balance */}
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Wallet className="h-4 w-4 text-green-600" />
                                                <span className="font-medium">₹{user.walletBalance.toFixed(2)}</span>
                                            </div>
                                        </TableCell>

                                        {/* Loyalty Tier */}
                                        <TableCell>
                                            <Badge variant="outline" className={getLoyaltyColor(user.loyaltyTier)}>
                                                <Award className="h-3 w-3 mr-1" />
                                                {user.loyaltyTier}
                                            </Badge>
                                        </TableCell>

                                        {/* Activity Stats */}
                                        <TableCell>
                                            <div className="text-sm text-center">
                                                <div className="font-medium">{user._count.bookings} bookings</div>
                                                <div className="text-muted-foreground">{user._count.reviews} reviews</div>
                                            </div>
                                        </TableCell>

                                        {/* Join Date */}
                                        <TableCell>
                                            <div className="text-sm">
                                                {new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </TableCell>

                                        {/* Actions with Tooltips */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* View Details */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button 
                                                            asChild 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Link href={`/admin/users/${user.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Details</TooltipContent>
                                                </Tooltip>

                                                {/* Block/Unblock */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onBlockToggle(user.id, user.isActive)}
                                                            className={user.isActive 
                                                                ? "hover:bg-orange-50 hover:text-orange-600" 
                                                                : "hover:bg-green-50 hover:text-green-600"
                                                            }
                                                        >
                                                            {user.isActive ? (
                                                                <Ban className="h-4 w-4 text-destructive" />
                                                            ) : (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {user.isActive ? 'Block User' : 'Unblock User'}
                                                    </TooltipContent>
                                                </Tooltip>

                                                {/* Delete/Deactivate */}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onDelete(user.id)}
                                                            className="hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Deactivate User</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Enhanced Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                            <span className="font-medium">{pagination.total}</span> users
                        </p>
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
                            
                            {/* Page Numbers */}
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