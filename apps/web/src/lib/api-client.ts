// apps/web/src/lib/api-client.ts
// CHANGE: credentials: 'include' default add kiya
// CHANGE: 401 par redirect logic improve kiya (ops portal ke liye bhi)
// WHY: Pehle API calls mein cookie nahi ja rahi thi, isliye middleware ko token nahi milta tha.
//      Ab har request mein cookie automatically include hogi.

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
        // CHANGE: credentials: 'include' added by default
        const res = await fetch(url, { 
            ...options, 
            headers,
            credentials: 'include', // CHANGE: Ensure cookies are sent with every request
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
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname
                
                // CHANGE: Ops portal ke liye alag redirect
                if (currentPath.startsWith('/ops')) {
                    setTimeout(() => {
                        window.location.href = '/ops/login'
                    }, 500)
                } else if (!currentPath.includes('/admin-login') && !currentPath.includes('/login')) {
                    setTimeout(() => {
                        window.location.href = '/admin-login'
                    }, 500)
                }
            }
        }
        
        return res
    } catch (error) {
        console.error('❌ Fetch failed:', error)
        throw error
    }
}