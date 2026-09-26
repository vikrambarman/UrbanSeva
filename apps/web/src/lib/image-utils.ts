// Image URL optimizer for Cloudflare R2 or any CDN
export function getOptimizedImageUrl(url: string, width: number = 400, quality: number = 80): string {
    if (!url) return '/placeholder.png'
    
    // If it's already a CDN URL with params, return as is
    if (url.includes('?')) return url
    
    // For Cloudflare R2 Images (if configured)
    if (process.env.CDN_URL && url.startsWith('http')) {
        return `${process.env.CDN_URL}/cdn-cgi/image width=${width},quality=${quality},format=auto/${url}`
    }
    
    return url
}

// Generate placeholder for lazy loading
export function getImagePlaceholder(width: number, height: number): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E`
}