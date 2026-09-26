"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

interface DocumentUploadProps {
    initialData: any
}

export function DocumentUpload({ initialData }: DocumentUploadProps) {
    const [loading, setLoading] = useState(false)
    const [aadharNumber, setAadharNumber] = useState(initialData?.aadharNumber || "")
    const [panNumber, setPanNumber] = useState(initialData?.panNumber || "")
    const [aadharImage, setAadharImage] = useState(initialData?.aadharImage || "")
    const [panImage, setPanImage] = useState(initialData?.panImage || "")

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
        // ✅ FIX: Response object milega
        const res = await apiFetch('/api/provider/documents', {
            method: 'PUT',
            body: JSON.stringify({ aadharNumber, panNumber, aadharImage, panImage })
        })
        // ✅ FIX: Parse karo
        const data = await res.json()

        if (data.success) toast.success("Documents submitted for review!")
        else toast.error(data.error)
    } catch (error) { 
        console.error("Document submit error:", error)
        toast.error("Failed to update") 
    }
    finally { setLoading(false) }
}

    const getStatusBadge = () => {
        switch (initialData?.status) {
            case 'APPROVED': return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>
            case 'UNDER_REVIEW': return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Under Review</Badge>
            case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>
            default: return <Badge variant="outline">Pending</Badge>
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Verification Status</h3>
                {getStatusBadge()}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Aadhar Card</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Aadhar Number</Label>
                        <Input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                        <Label>Aadhar Image URL</Label>
                        <Input value={aadharImage} onChange={(e) => setAadharImage(e.target.value)} placeholder="https://..." />
                    </div>
                    {aadharImage && (
                        <div className="md:col-span-2">
                            <img src={aadharImage} alt="Aadhar" className="w-full h-40 object-cover rounded-md border" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> PAN Card</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>PAN Number</Label>
                        <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
                    </div>
                    <div className="space-y-2">
                        <Label>PAN Image URL</Label>
                        <Input value={panImage} onChange={(e) => setPanImage(e.target.value)} placeholder="https://..." />
                    </div>
                    {panImage && (
                        <div className="md:col-span-2">
                            <img src={panImage} alt="PAN" className="w-full h-40 object-cover rounded-md border" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" /> {loading ? 'Submitting...' : 'Submit Documents'}
            </Button>
        </form>
    )
}