"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface BannerFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function BannerForm({ initialData, onSuccess, onCancel }: BannerFormProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(initialData?.title || "")
    const [image, setImage] = useState(initialData?.image || "")
    const [link, setLink] = useState(initialData?.link || "")
    const [position, setPosition] = useState(initialData?.position || "HOME_TOP")
    const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 0)
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const url = initialData ? `/api/admin/content/banners/${initialData.id}` : '/api/admin/content/banners'
            const method = initialData ? 'PUT' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, image, link, position, sortOrder, isActive })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(initialData ? "Banner updated!" : "Banner created!")
                onSuccess()
            } else toast.error(data.error)
        } catch { toast.error("Failed to save banner") } 
        finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={image} onChange={(e) => setImage(e.target.value)} required placeholder="https://..." />
            </div>
            <div className="space-y-2">
                <Label>Link (Optional)</Label>
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/services/cleaning" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HOME_TOP">Home Top</SelectItem>
                            <SelectItem value="HOME_BOTTOM">Home Bottom</SelectItem>
                            <SelectItem value="CATEGORY_PAGE">Category Page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="banner-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="banner-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Banner'}</Button>
            </div>
        </form>
    )
}