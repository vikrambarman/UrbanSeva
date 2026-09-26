"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Building2 } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function ProviderBankDetailsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [bankAccount, setBankAccount] = useState("")
    const [bankIFSC, setBankIFSC] = useState("")
    const [bankName, setBankName] = useState("")
    const [upiId, setUpiId] = useState("")

    useEffect(() => {
        const fetchBank = async () => {
            try {
                const res = await apiFetch('/api/provider/profile')
                const data = await res.json() // ✅ FIX
                if (data.success && data.data) {
                    setBankAccount(data.data.bankAccount || "")
                    setBankIFSC(data.data.bankIFSC || "")
                    setBankName(data.data.bankName || "")
                    setUpiId(data.data.upiId || "")
                }
            } catch { toast.error("Failed to load bank details") }
            finally { setLoading(false) }
        }
        fetchBank()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await apiFetch('/api/provider/bank-details', {
                method: 'PUT',
                body: JSON.stringify({ bankAccount, bankIFSC, bankName, upiId })
            })
            const data = await res.json() // ✅ FIX
            
            if (data.success) toast.success("Bank details saved!")
            else toast.error(data.error)
        } catch { toast.error("Failed to save") }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Bank Details</h1>
                <p className="text-muted-foreground">Add your bank account for receiving payouts.</p>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Bank Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="State Bank of India" />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Enter account number" />
                        </div>
                        <div className="space-y-2">
                            <Label>IFSC Code</Label>
                            <Input value={bankIFSC} onChange={(e) => setBankIFSC(e.target.value.toUpperCase())} placeholder="SBIN0001234" />
                        </div>
                        <div className="space-y-2">
                            <Label>UPI ID (Optional)</Label>
                            <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit" disabled={saving} className="mt-4">
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Bank Details'}
                </Button>
            </form>
        </div>
    )
}