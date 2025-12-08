import {Outlet, redirect} from "react-router-dom"
import { useLoaderData } from "react-router-dom";
import { useState, useCallback } from "react";
import PatientSidebar from "../../components/patient/PatientSidebar"
import { requireAuth } from "../../utls";
import '../../styles/patient/Patient.css'

export async function loader() {
  await requireAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const base = 'http://127.0.0.1:8000/api/patient-portal';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };

  const [profileRes, appointmentsRes, testOrdersRes, invoicesRes, availableSlotsRes] = await Promise.all([
    fetch(`${base}/profile/`, { headers }),
    fetch(`${base}/appointments/`, { headers }),
    fetch(`${base}/test-orders/`, { headers }),
    fetch(`${base}/invoices/`, { headers }),
    fetch(`${base}/appointments/available-slots/`, { headers }),
  ]);
  const safeJson = async (res) => {
    try {
      return res.ok ? await res.json() : { error: true, status: res.status };
    } catch (e) {
      return { error: true, message: 'Invalid JSON' };
    }
  };
  if ([profileRes, appointmentsRes, testOrdersRes, invoicesRes].some(r => r.status === 401 || r.status === 403)) {
    throw redirect('/login');
  }

  return {
    profile: await safeJson(profileRes),
    appointments: await safeJson(appointmentsRes),
    testOrders: await safeJson(testOrdersRes),
    invoices: await safeJson(invoicesRes),
    availableSlots: await safeJson(availableSlotsRes)
  };
}

// Helper to refetch patient portal data
export async function refetchPatientData() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const base = 'http://127.0.0.1:8000/api/patient-portal';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };

  try {
    const [profileRes, appointmentsRes, testOrdersRes, invoicesRes] = await Promise.all([
      fetch(`${base}/profile/`, { headers }),
      fetch(`${base}/appointments/`, { headers }),
      fetch(`${base}/test-orders/`, { headers }),
      fetch(`${base}/invoices/`, { headers }),
    ]);

    const safeJson = async (res) => {
      try {
        return res.ok ? await res.json() : { error: true, status: res.status };
      } catch (e) {
        return { error: true, message: 'Invalid JSON' };
      }
    };

    return {
      profile: await safeJson(profileRes),
      appointments: await safeJson(appointmentsRes),
      testOrders: await safeJson(testOrdersRes),
      invoices: await safeJson(invoicesRes),
    };
  } catch (error) {
    console.error('Error refetching data:', error);
    return null;
  }
}

export default function PatientLayout(){
    const initialData = useLoaderData()
    const [contextData, setContextData] = useState(initialData);

    // Callback to refresh data (called after successful actions like booking)
    const refreshData = useCallback(async () => {
      const newData = await refetchPatientData();
      if (newData) {
        setContextData(prev => ({ ...prev, ...newData }));
      }
    }, []);

    return(
      <main className="patient-layout">
        <PatientSidebar profile={contextData.profile} />
        <Outlet context={{ ...contextData, refreshData }} />
      </main>
    )
}