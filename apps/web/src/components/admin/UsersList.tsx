// src/components/admin/UsersList.tsx

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { UserFilters } from "@/components/admin/UserFilters"
import { UserTable } from "@/components/admin/UserTable"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface UsersListProps {
    initialData: {
        users: any[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export function UsersList({ initialData }: UsersListProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const [users, setUsers] = useState(initialData.users)
    const [pagination, setPagination] = useState(initialData.pagination)
    
    const [search, setSearch] = useState(searchParams.get('search') || "")
    const [role, setRole] = useState(searchParams.get('role') || "ALL")
    const [status, setStatus] = useState(searchParams.get('status') || "ALL")

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Sync local state with server initialData whenever server props change
    useEffect(() => {
        setUsers(initialData.users)
        setPagination(initialData.pagination)
    }, [initialData])

    // Sync filter state whenever URL parameters change
    useEffect(() => {
        setSearch(searchParams.get('search') || "")
        setRole(searchParams.get('role') || "ALL")
        setStatus(searchParams.get('status') || "ALL")
    }, [searchParams])

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    const updateURL = (newSearch: string, newRole: string, newStatus: string, newPage: number = 1) => {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newRole && newRole !== 'ALL') params.set('role', newRole)
        if (newStatus && newStatus !== 'ALL') params.set('status', newStatus)
        if (newPage > 1) params.set('page', newPage.toString())
        
        const queryString = params.toString()
        router.push(queryString ? `/admin/users?${queryString}` : '/admin/users')
    }

    const handleSearchChange = (value: string) => {
        setSearch(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
            updateURL(value, role, status, 1)
        }, 400)
    }

    const handleRoleChange = (value: string) => {
        setRole(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        updateURL(search, value, status, 1)
    }

    const handleStatusChange = (value: string) => {
        setStatus(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        updateURL(search, role, value, 1)
    }

    const handleReset = () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        setSearch("")
        setRole("ALL")
        setStatus("ALL")
        router.push('/admin/users')
    }

    const handlePageChange = (page: number) => {
        updateURL(search, role, status, page)
    }

    // Optimistic update for block/unblock
    const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? 'block' : 'unblock'
        const newStatus = !currentStatus
        
        // Optimistic update
        setUsers(prev => prev.map(user => 
            user.id === userId 
                ? { ...user, isActive: newStatus } 
                : user
        ))

        try {
            const res = await apiFetch(`/api/admin/users/${userId}/${action}`, { 
                method: 'POST' 
            })
            
            if (!res || !res.ok) {
                // Revert on error
                setUsers(prev => prev.map(user => 
                    user.id === userId 
                        ? { ...user, isActive: currentStatus } 
                        : user
                ))
                toast.error("Failed to update user")
                return
            }
            
            const data = await res.json()
            
            if (data.success) {
                toast.success(`User ${action}ed successfully`)
            } else {
                // Revert on error
                setUsers(prev => prev.map(user => 
                    user.id === userId 
                        ? { ...user, isActive: currentStatus } 
                        : user
                ))
                toast.error(data.error || "Failed to update user")
            }
        } catch (error) {
            console.error('Block toggle error:', error)
            // Revert on error
            setUsers(prev => prev.map(user => 
                user.id === userId 
                    ? { ...user, isActive: currentStatus } 
                    : user
            ))
            toast.error("Action failed")
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to deactivate this user?")) return

        try {
            const res = await apiFetch(`/api/admin/users/${userId}`, { 
                method: 'DELETE' 
            })
            
            if (!res || !res.ok) {
                toast.error("Failed to delete user")
                return
            }
            
            const data = await res.json()
            
            if (data.success) {
                toast.success("User deactivated successfully")
                router.refresh()
            } else {
                toast.error(data.error || "Failed to delete user")
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error("Delete failed")
        }
    }

    return (
        <>
            <UserFilters
                search={search}
                role={role}
                status={status}
                onSearchChange={handleSearchChange}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                onReset={handleReset}
            />

            <UserTable
                users={users}
                pagination={pagination}
                onPageChange={handlePageChange}
                onBlockToggle={handleBlockToggle}
                onDelete={handleDelete}
            />
        </>
    )
}