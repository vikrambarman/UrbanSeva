'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Search, Users, Star, CheckCircle, XCircle, Ban, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function OpsProvidersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [providers, setProviders] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchProviders = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/ops/providers?page=${page}&limit=20&search=${search}&status=${statusFilter}`, { 
                    cache: 'no-store',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setProviders(data.data.providers || []);
                    setTotal(data.data.total || 0);
                } else {
                    setProviders([]);
                    setTotal(0);
                }
            } catch (error) {
                console.error('Failed to fetch providers', error);
                setProviders([]);
                setTotal(0);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProviders();
    }, [page, search, statusFilter, token]);

    const totalPages = Math.ceil(total / 20);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { variant: any; icon: any; color: string }> = {
            'PENDING': { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
            'UNDER_REVIEW': { variant: 'outline', icon: Clock, color: 'text-blue-600' },
            'APPROVED': { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
            'REJECTED': { variant: 'destructive', icon: XCircle, color: 'text-red-600' },
            'SUSPENDED': { variant: 'destructive', icon: Ban, color: 'text-red-600' },
        };

        const c = config[status] || config['PENDING'];
        const Icon = c.icon;

        return (
            <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${c.color}`} />
                <Badge variant={c.variant}>{status.replace('_', ' ')}</Badge>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Provider Helpdesk</h1>
                    <p className="text-muted-foreground">Verify documents, manage services, and track earnings.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Total: {total}</span>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Providers</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, phone, or email..."
                                    className="pl-9"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </form>

                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                    ) : providers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No providers found.</p>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Performance</TableHead>
                                            <TableHead>Experience</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {providers.map((p: any) => (
                                            <TableRow key={p.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{p.user?.name || 'Unnamed'}</span>
                                                        <span className="text-xs text-muted-foreground">{p.user?.phone || '-'}</span>
                                                        <span className="text-xs text-muted-foreground">{p.user?.email || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(p.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-medium">{p.avgRating?.toFixed(1) || '0.0'}</span>
                                                        <span className="text-xs text-muted-foreground">({p.completedJobs || 0} jobs)</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{p.experience || 0} yrs</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/ops/providers/${p.id}`}>
                                                        <Button variant="outline" size="sm">View Details</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <Button variant="outline" size="sm" onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1}>
                                    Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setPage(prev => prev + 1)} disabled={page >= totalPages}>
                                    Next
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}