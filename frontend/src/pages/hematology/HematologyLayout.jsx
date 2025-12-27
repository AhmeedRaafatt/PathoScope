import { Outlet, redirect, useLoaderData, useRevalidator } from "react-router-dom"
import { useState, useCallback, useEffect } from "react"
import HematologySidebar from "../../components/HematologySidebar"
import { getToken, getUserRole, clearAuthData } from "../../utls"
import '../../styles/hematology/Layout.css'

// Utility function to check authentication and role
export function requireAuth() {
    const token = getToken()
    const role = getUserRole()
    
    if (!token) {
        throw redirect('/login')
    }
    
    // Only lab_tech can access hematology
    if (role !== 'lab_tech') {
        if (role === 'patient') throw redirect('/patient')
        if (role === 'admin') throw redirect('/admin')
        if (role === 'pathologist') throw redirect('/pathology')
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

// Enhanced loader - includes pathology scheduled data
export async function loader() {
    const token = requireAuth()
    const hemBase = 'http://127.0.0.1:8000/api/hematology'
    const pathBase = 'http://127.0.0.1:8000/api/pathology'
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    }

    try {
        const [
            scheduledRes, 
            dashboardRes, 
            queueRes, 
            analytesRes,
            pathScheduledRes
        ] = await Promise.all([
            fetch(`${hemBase}/scheduled-patients/`, { headers }),
            fetch(`${hemBase}/dashboard/`, { headers }),
            fetch(`${hemBase}/queue/`, { headers }),
            fetch(`${hemBase}/analytes/`, { headers }),
            fetch(`${pathBase}/scheduled-patients/`, { headers })  // Add pathology
        ])

        // Check for auth errors
        const allResponses = [scheduledRes, dashboardRes, queueRes, analytesRes, pathScheduledRes]
        if (allResponses.some(r => r.status === 401 || r.status === 403)) {
            clearAuthData()
            throw redirect('/login')
        }

        const [
            scheduledPatients, 
            samples, 
            queue, 
            analytes,
            pathologyScheduled
        ] = await Promise.all([
            safeJson(scheduledRes),
            safeJson(dashboardRes),
            safeJson(queueRes),
            safeJson(analytesRes),
            safeJson(pathScheduledRes)
        ])

        return {
            scheduledPatients: Array.isArray(scheduledPatients) ? scheduledPatients : [],
            samples: Array.isArray(samples) ? samples : [],
            queue: Array.isArray(queue) ? queue : [],
            analytes: Array.isArray(analytes) ? analytes : [],
            pathologyScheduled: Array.isArray(pathologyScheduled) ? pathologyScheduled : [],
            error: null
        }
    } catch (error) {
        console.error('Error loading hematology data:', error)
        
        // If it's a redirect, rethrow it
        if (error instanceof Response) {
            throw error
        }
        
        // Return error state instead of redirecting for network errors
        return {
            scheduledPatients: [],
            samples: [],
            queue: [],
            analytes: [],
            pathologyScheduled: [],
            error: 'Failed to load data. Please check your connection and try again.'
        }
    }
}

export default function HematologyLayout() {
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
        <main className="hematology-layout">
            <HematologySidebar />
            <div className="hematology-content">
                <div className="hematology-main-wrapper">
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