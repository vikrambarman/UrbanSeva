"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api-client"

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [terms, setTerms] = useState("")
    const [privacy, setPrivacy] = useState("")
    const [about, setAbout] = useState("")

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await apiFetch('/api/admin/content/settings')
                const data = await res.json()
                if (data.success) {
                    setTerms(data.data.TERMS_AND_CONDITIONS || "")
                    setPrivacy(data.data.PRIVACY_POLICY || "")
                    setAbout(data.data.ABOUT_US || "")
                }
            } catch { toast.error("Failed to load settings") } 
            finally { setLoading(false) }
        }
        fetchSettings()
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await apiFetch('/api/admin/content/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    TERMS_AND_CONDITIONS: terms,
                    PRIVACY_POLICY: privacy,
                    ABOUT_US: about
                })
            })
            const data = await res.json()
            if (data.success) toast.success("Settings saved successfully!")
            else toast.error(data.error)
        } catch { toast.error("Failed to save settings") } 
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
                    <p className="text-muted-foreground">Manage Terms, Privacy Policy, and About Us content.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader><CardTitle>About Us</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={6} placeholder="Write about your platform..." />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={12} placeholder="Enter terms and conditions..." />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Privacy Policy</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea value={privacy} onChange={(e) => setPrivacy(e.target.value)} rows={12} placeholder="Enter privacy policy..." />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}