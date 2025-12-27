// src/utils/hematologyApi.js

const BASE_URL = 'http://127.0.0.1:8000/api/hematology'

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
export const hematologyApi = {
    // Get scheduled patients
    async getScheduledPatients() {
        const response = await fetch(`${BASE_URL}/scheduled-patients/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Accession a sample
    async accessionSample(testOrderId) {
        const response = await fetch(`${BASE_URL}/accession/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ test_order_id: testOrderId })
        })
        return safeJson(response)
    },

    // Get dashboard samples
    async getDashboard() {
        const response = await fetch(`${BASE_URL}/dashboard/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Get queue
    async getQueue() {
        const response = await fetch(`${BASE_URL}/queue/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Add sample to queue
    async addToQueue(sampleId) {
        const response = await fetch(`${BASE_URL}/queue/add/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ sample_id: sampleId })
        })
        return safeJson(response)
    },

    // Complete processing
    async completeProcessing(sampleId) {
        const response = await fetch(`${BASE_URL}/samples/${sampleId}/complete/`, {
            method: 'POST',
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Get analytes
    async getAnalytes(testName = null) {
        const url = testName 
            ? `${BASE_URL}/analytes/?test_name=${testName}`
            : `${BASE_URL}/analytes/`
        const response = await fetch(url, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Enter results
    async enterResults(sampleId, results) {
        const response = await fetch(`${BASE_URL}/samples/${sampleId}/results/enter/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ results })
        })
        return safeJson(response)
    },

    // Get sample results
    async getSampleResults(sampleId) {
        const response = await fetch(`${BASE_URL}/samples/${sampleId}/results/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Validate results
    async validateResults(sampleId) {
        const response = await fetch(`${BASE_URL}/samples/${sampleId}/validate/`, {
            method: 'POST',
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Get QC log
    async getQCLog() {
        const response = await fetch(`${BASE_URL}/qc-log/`, {
            headers: getAuthHeaders()
        })
        return safeJson(response)
    },

    // Create QC log entry
    async createQCLog(eventType, description) {
        const response = await fetch(`${BASE_URL}/qc-log/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ event_type: eventType, description })
        })
        return safeJson(response)
    }
}