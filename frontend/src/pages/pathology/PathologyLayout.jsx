import { Outlet, redirect, useLoaderData, useRevalidator } from "react-router-dom"
import { useState, useCallback, useEffect } from "react"
import PathologySidebar from "../../components/PathologySidebar"
import '../../styles/pathology/Layout.css'

// Utility function to check authentication
export function requireAuth() {
    const token = localStorage.getItem('token')
    if (!token) {
        throw redirect('/login')
    }
    return token
}

// Safe JSON parsing helper
async function safeJson(res) {
    try {
        if (!res.ok) {
            return { error: true, status: res.status }
        }
        return await res.json()
    } catch (e) {
        console.error('JSON parse error:', e)
        return { error: true, message: 'Invalid JSON response' }
    }
}

// Main loader for Pathology module
export async function loader() {
    const token = requireAuth()
    const base = 'http://127.0.0.1:8000/api/pathology'
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    }

    try {
        // Fetch scheduled patients and queue in parallel
        const [scheduledRes, queueRes] = await Promise.all([
            fetch(`${base}/scheduled-patients/`, { headers }),
            fetch(`${base}/queue/`, { headers })
        ])

        // Check for auth errors
        const allResponses = [scheduledRes, queueRes]
        if (allResponses.some(r => r.status === 401 || r.status === 403)) {
            localStorage.removeItem('token')
            throw redirect('/login')
        }

        const [scheduledPatients, queue] = await Promise.all([
            safeJson(scheduledRes),
            safeJson(queueRes)
        ])

        return {
            scheduledPatients: Array.isArray(scheduledPatients) ? scheduledPatients : [],
            queue: Array.isArray(queue) ? queue : [],
            error: null
        }
    } catch (error) {
        console.error('Error loading pathology data:', error)
        
        // If it's a redirect, rethrow it
        if (error instanceof Response) {
            throw error
        }
        
        // Return error state instead of redirecting for network errors
        return {
            scheduledPatients: [],
            queue: [],
            error: 'Failed to load data. Please check your connection and try again.'
        }
    }
}

export default function PathologyLayout() {
    const loaderData = useLoaderData()
    const revalidator = useRevalidator()
    const [contextData, setContextData] = useState(loaderData)

    // Update context when loader data changes
    useEffect(() => {
        setContextData(loaderData)
    }, [loaderData])

    // Manual refresh function
    const refreshData = useCallback(() => {
        revalidator.revalidate()
    }, [revalidator])

    return (
        <main className="pathology-layout">
            <PathologySidebar />
            <div className="pathology-content">
                <div className="pathology-main-wrapper">
                    {contextData.error && (
                        <div className="alert alert-error" style={{marginBottom: '20px'}}>
                            ⚠️ {contextData.error}
                        </div>
                    )}
                    <Outlet context={{ 
                        ...contextData, 
                        refreshData,
                        isRefreshing: revalidator.state === 'loading'
                    }} />
                </div>
            </div>
        </main>
    )
}