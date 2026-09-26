// lib/api-client.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    console.log('🔑 API Fetch:', {
        url,
        hasToken: !!token,
    })
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    }
    
    if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`
    } else {
        console.warn('⚠️ No valid token for:', url)
    }
    
    try {
        const res = await fetch(url, { 
            ...options, 
            headers 
        })
        
        console.log('📡 Response:', {
            url,
            status: res.status,
            ok: res.ok
        })
        
        // ✅ Handle 401 before returning
        if (res.status === 401) {
            console.error('🚫 Unauthorized!')
            localStorage.removeItem('token')
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin-login')) {
                setTimeout(() => {
                    window.location.href = '/admin-login'
                }, 1000)
            }
        }
        
        return res
    } catch (error) {
        console.error('❌ Fetch failed:', error)
        throw error
    }
}