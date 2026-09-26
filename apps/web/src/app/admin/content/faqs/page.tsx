"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FAQForm } from "@/components/admin/FAQForm"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminFAQsPage() {
    const [faqs, setFaqs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingFaq, setEditingFaq] = useState<any>(null)

    const fetchFaqs = async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/api/admin/content/faqs')
            const data = await res.json()
            if (data.success) setFaqs(data.data)
        } catch { toast.error("Failed to fetch FAQs") } 
        finally { setLoading(false) }
    }

    useEffect(() => { fetchFaqs() }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this FAQ?")) return
        try {
            const res = await apiFetch(`/api/admin/content/faqs/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success) { toast.success("FAQ deleted"); fetchFaqs() }
        } catch { toast.error("Failed to delete") }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
                    <p className="text-muted-foreground">Manage frequently asked questions for customers.</p>
                </div>
                <Button onClick={() => { setEditingFaq(null); setDialogOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" /> Add FAQ
                </Button>
            </div>

            <Card>
                <CardHeader><CardTitle>All FAQs</CardTitle></CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Question</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {faqs.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No FAQs found.</TableCell></TableRow>
                                    ) : (
                                        faqs.map((faq) => (
                                            <TableRow key={faq.id}>
                                                <TableCell className="font-medium max-w-md truncate">{faq.question}</TableCell>
                                                <TableCell>{faq.category ? <Badge variant="outline">{faq.category}</Badge> : '-'}</TableCell>
                                                <TableCell><Badge variant={faq.isActive ? 'default' : 'secondary'}>{faq.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingFaq(faq); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
                    </DialogHeader>
                    <FAQForm 
                        initialData={editingFaq} 
                        onSuccess={() => { setDialogOpen(false); fetchFaqs() }} 
                        onCancel={() => setDialogOpen(false)} 
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}