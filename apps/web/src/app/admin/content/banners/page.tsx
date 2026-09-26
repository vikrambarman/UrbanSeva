"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BannerForm } from "@/components/admin/BannerForm"
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBanner, setEditingBanner] = useState<any>(null)

    const fetchBanners = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/admin/content/banners')
            const data = await res.json()
            if (data.success) setBanners(data.data)
        } catch { toast.error("Failed to fetch banners") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchBanners() }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this banner?")) return
        try {
            const res = await apiFetch(`/api/admin/content/banners/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) { toast.success("Banner deleted"); fetchBanners() }
        } catch { toast.error("Failed to delete") }
    }

    const openEdit = (banner: any) => {
        setEditingBanner(banner)
        setDialogOpen(true)
    }

    const openCreate = () => {
        setEditingBanner(null)
        setDialogOpen(true)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banner Management</h1>
                    <p className="text-muted-foreground">Manage promotional banners across the platform.</p>
                </div>
                <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Banner</Button>
            </div>

            <Card>
                <CardHeader><CardTitle>All Banners</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Preview</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {banners.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No banners found.</TableCell></TableRow>
                                    ) : (
                                        banners.map((banner) => (
                                            <TableRow key={banner.id}>
                                                <TableCell>
                                                    {banner.image ? (
                                                        <img src={banner.image} alt={banner.title} className="w-16 h-10 object-cover rounded" />
                                                    ) : (
                                                        <div className="w-16 h-10 bg-muted rounded flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{banner.title}</TableCell>
                                                <TableCell><Badge variant="outline">{banner.position}</Badge></TableCell>
                                                <TableCell><Badge variant={banner.isActive ? 'default' : 'secondary'}>{banner.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog for Create/Edit */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create New Banner'}</DialogTitle>
                    </DialogHeader>
                    <BannerForm 
                        initialData={editingBanner} 
                        onSuccess={() => { setDialogOpen(false); fetchBanners() }} 
                        onCancel={() => setDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}