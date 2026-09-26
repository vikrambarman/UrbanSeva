// components/admin/ServiceForm.tsx

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface ServiceFormProps {
    initialData?: any
    categories: any[]
}

export function ServiceForm({ initialData, categories }: ServiceFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    // Form State
    const [name, setName] = useState(initialData?.name || "")
    const [slug, setSlug] = useState(initialData?.slug || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [image, setImage] = useState(initialData?.image || "")
    const [basePrice, setBasePrice] = useState(initialData?.basePrice || 0)
    const [priceType, setPriceType] = useState(initialData?.priceType || "FIXED")
    const [duration, setDuration] = useState(initialData?.duration || "2 hours")
    const [professionals, setProfessionals] = useState(initialData?.professionals || 1)
    const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId || "")
    const [isTrending, setIsTrending] = useState(initialData?.isTrending || false)
    const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false)
    const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true)

    // Arrays State
    const [inclusions, setInclusions] = useState<string[]>(initialData?.inclusions?.map((i: any) => i.text) || [""])
    const [exclusions, setExclusions] = useState<string[]>(initialData?.exclusions?.map((i: any) => i.text) || [""])
    const [faqs, setFaqs] = useState(initialData?.faqs?.map((f: any) => ({ question: f.question, answer: f.answer })) || [{ question: "", answer: "" }])

    const handleArrayChange = (setter: any, index: number, value: any, key?: string) => {
        setter((prev: any) => {
            const newArr = [...prev]
            if (key) newArr[index][key] = value
            else newArr[index] = value
            return newArr
        })
    }

    const addArrayItem = (setter: any, defaultValue: any) => setter((prev: any) => [...prev, defaultValue])
    const removeArrayItem = (setter: any, index: number) => setter((prev: any) => prev.filter((_: any, i: number) => i !== index))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            description,
            image,
            basePrice: Number(basePrice),
            priceType,
            duration,
            professionals: Number(professionals),
            subCategoryId,
            isTrending,
            isFeatured,
            isActive,
            inclusions: inclusions.filter(i => i.trim() !== ""),
            exclusions: exclusions.filter(i => i.trim() !== ""),
            faqs: faqs.filter((f: { question: string; answer: string }) => f.question.trim() !== ""),
        }

        try {
            const url = initialData ? `/api/admin/services/${initialData.id}` : '/api/admin/services'
            const method = initialData ? 'PUT' : 'POST'

            const res = await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            })

            if (!res || !res.ok) {
                console.error('❌ Service save failed:', res)
                toast.error("Failed to save service")
                setLoading(false)
                return
            }

            const data = await res.json()

            if (data.success) {
                toast.success(initialData ? "Service updated!" : "Service created!")

                // ✅ FIX: Add timestamp to bust cache
                const timestamp = Date.now()
                window.location.href = `/admin/services?_t=${timestamp}`

            } else {
                toast.error(data.error || "Something went wrong")
                setLoading(false)
            }
        } catch (error) {
            console.error('Service submit error:', error)
            toast.error("Failed to save service")
            setLoading(false)
        }
    }

    const subCategoryOptions = categories.flatMap(cat =>
        cat.subCategories.map((sub: any) => ({ value: sub.id, label: `${cat.name} > ${sub.name}` }))
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Service Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Slug (URL friendly)</Label>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated-if-empty" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                        <Label>Category / Sub-Category</Label>
                        <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                            <SelectContent>
                                {subCategoryOptions.map((opt: any) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Pricing & Configuration</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                        <Label>Base Price (₹)</Label>
                        <Input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                        <Label>Price Type</Label>
                        <Select value={priceType} onValueChange={setPriceType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FIXED">Fixed</SelectItem>
                                <SelectItem value="STARTING_AT">Starting At</SelectItem>
                                <SelectItem value="PER_SQFT">Per Sqft</SelectItem>
                                <SelectItem value="CUSTOM_QUOTE">Custom Quote</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 2 hours" />
                    </div>
                    <div className="space-y-2">
                        <Label>Professionals Required</Label>
                        <Input type="number" value={professionals} onChange={(e) => setProfessionals(Number(e.target.value))} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="trending" checked={isTrending} onCheckedChange={setIsTrending} />
                        <Label htmlFor="trending" className="cursor-pointer">Mark as Trending</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                        <Label htmlFor="featured" className="cursor-pointer">Mark as Featured</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                        <Label htmlFor="active" className="cursor-pointer">Active</Label>
                    </div>
                </CardContent>
            </Card>

            {/* Inclusions & Exclusions */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>What's Included</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem(setInclusions, "")}><Plus className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {inclusions.map((item, i) => (
                            <div key={i} className="flex gap-2">
                                <Input value={item} onChange={(e) => handleArrayChange(setInclusions, i, e.target.value)} placeholder="Included item" />
                                <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem(setInclusions, i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>What's Excluded</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem(setExclusions, "")}><Plus className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {exclusions.map((item, i) => (
                            <div key={i} className="flex gap-2">
                                <Input value={item} onChange={(e) => handleArrayChange(setExclusions, i, e.target.value)} placeholder="Excluded item" />
                                <Button type="button" size="icon" variant="ghost" onClick={() => removeArrayItem(setExclusions, i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* FAQs */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>FAQs</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem(setFaqs, { question: "", answer: "" })}><Plus className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {faqs.map((faq: { question: string; answer: string }, i: number) => (
                        <div key={i} className="p-4 border rounded-md space-y-2 relative">
                            <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2" onClick={() => removeArrayItem(setFaqs, i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            <Input placeholder="Question" value={faq.question} onChange={(e) => handleArrayChange(setFaqs, i, e.target.value, 'question')} />
                            <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => handleArrayChange(setFaqs, i, e.target.value, 'answer')} rows={2} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" /> {loading ? 'Saving...' : (initialData ? 'Update Service' : 'Create Service')}
                </Button>
            </div>
        </form>
    )
}