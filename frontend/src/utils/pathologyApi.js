// src/utils/pathologyApi.js

const BASE_URL = 'http://127.0.0.1:8000/api/pathology'

// Get auth headers
export function getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    }
}

// Safe JSON parser
export async function safeJson(response) {
    try {
        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.json()
    } catch (e) {
        if (e.message.includes('HTTP')) {
            throw e
        }
        throw new Error('Invalid server response')
    }
}

// API Functions
export const pathologyApi = {
    // ==========================================
    // LAB TECHNICIAN ENDPOINTS
    // ==========================================
    
    // Get scheduled pathology patients
    async getScheduledPatients() {
        const response = await fetch(`${BASE_URL}/scheduled-patients/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Accession sample (Check-in patient)
    async accessionSample(testOrderId) {
        const response = await fetch(`${BASE_URL}/accession/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ test_order_id: testOrderId })
        })
        return safeJson(response)
    },

    // Upload DICOM file
    async uploadDicom(caseId, dicomFile) {
        const formData = new FormData()
        formData.append('case_id', caseId)
        formData.append('dicom_file', dicomFile)

        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/upload/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
                // Don't set Content-Type, browser will set it with boundary for FormData
            },
            body: formData
        })
        return safeJson(response)
    },

    // ==========================================
    // PATHOLOGIST ENDPOINTS
    // ==========================================

    // Get pathologist review queue (awaiting_review cases)
    async getQueue() {
        const response = await fetch(`${BASE_URL}/queue/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Get case details
    async getCaseDetails(caseId) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Update report (save draft)
    async updateReport(caseId, data) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/update-report/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        })
        return safeJson(response)
    },

    // Finalize report
    async finalizeReport(caseId) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/finalize/`, {
            method: 'POST',
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // ==========================================
    // COMMON ENDPOINTS
    // ==========================================

    // List all cases (with optional patient filter)
    async listCases(patientId = null) {
        const url = patientId 
            ? `${BASE_URL}/list/?patient_id=${patientId}`
            : `${BASE_URL}/list/`
        const response = await fetch(url, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Save annotations
    async saveAnnotations(caseId, annotations) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/save-annotations/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ annotations })
        })
        return safeJson(response)
    },

    // Alternative save endpoint
    async saveCase(caseId, data) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/save/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        })
        return safeJson(response)
    },

    // Run AI analysis
    async runAIAnalysis(caseId) {
        const response = await fetch(`${BASE_URL}/case/${caseId}/ai-analyze/`, {
            method: 'POST',
            headers: getAuthHeaders()
        })
        return safeJson(response)
    }
}