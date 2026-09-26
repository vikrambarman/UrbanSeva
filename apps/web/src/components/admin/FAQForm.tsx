"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

interface FAQFormProps {
    initialData?: any
    onSuccess: () => void
    onCancel: () => void
}

export function FAQForm({ initialData, onSuccess, onCancel }: FAQFormProps) {
    const [loading, setLoading] = useState(false)
    const [question, setQuestion] = useState(initialData?.question || "")
    const [answer, setAnswer] = useState(initialData?.answer || "")
    const [category, setCategory] = useState(initialData?.category || "")
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const url = initialData ? `/api/admin/content/faqs/${initialData.id}` : '/api/admin/content/faqs'
            const method = initialData ? 'PUT' : 'POST'
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer, category, isActive })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(initialData ? "FAQ updated!" : "FAQ created!")
                onSuccess()
            } else toast.error(data.error)
        } catch { toast.error("Failed to save FAQ") } 
        finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Question</Label>
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>Answer</Label>
                <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} required />
            </div>
            <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Booking, Payments" />
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="faq-active" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="faq-active">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save FAQ'}</Button>
            </div>
        </form>
    )
}