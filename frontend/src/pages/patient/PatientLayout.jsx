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

  const [profileRes, appointmentsRes, testOrdersRes, invoicesRes, availableTestsRes, availableSlotsRes] = await Promise.all([
    fetch(`${base}/profile/`, { headers }),
    fetch(`${base}/appointments/`, { headers }),
    fetch(`${base}/test-orders/`, { headers }),
    fetch(`${base}/invoices/`, { headers }),
    fetch(`${base}/available-tests/`, { headers }),
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
  const profile = await safeJson(profileRes);
  const appointments = await safeJson(appointmentsRes);
  const testOrders = await safeJson(testOrdersRes);
  const invoices = await safeJson(invoicesRes);
  const availableTestsRaw = await safeJson(availableTestsRes);
  const availableSlots = await safeJson(availableSlotsRes);

  // Convert TEST_PRICES mapping to a flat array usable by the frontend
  let available_tests = null;
  try {
    if (availableTestsRaw && typeof availableTestsRaw === 'object') {
      available_tests = [];
      Object.entries(availableTestsRaw).forEach(([type, testsMap]) => {
        if (testsMap && typeof testsMap === 'object') {
          Object.entries(testsMap).forEach(([testName, price]) => {
            const id = `${type}-${testName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            available_tests.push({ id, name: testName, type, price });
          });
        }
      });
    }
  } catch (e) {
    console.error('Error parsing available tests:', e);
    available_tests = null;
  }

  return {
    profile,
    appointments,
    testOrders,
    invoices,
    availableSlots,
    available_tests
  };
}

// Helper to refetch patient portal data
export async function refetchPatientData() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const base = 'http://127.0.0.1:8000/api/patient-portal';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };

  try {
    const [profileRes, appointmentsRes, testOrdersRes, invoicesRes, availableTestsRes] = await Promise.all([
      fetch(`${base}/profile/`, { headers }),
      fetch(`${base}/appointments/`, { headers }),
      fetch(`${base}/test-orders/`, { headers }),
      fetch(`${base}/invoices/`, { headers }),
      fetch(`${base}/available-tests/`, { headers }),
    ]);

    const safeJson = async (res) => {
      try {
        return res.ok ? await res.json() : { error: true, status: res.status };
      } catch (e) {
        return { error: true, message: 'Invalid JSON' };
      }
    };

    const profile = await safeJson(profileRes);
    const appointments = await safeJson(appointmentsRes);
    const testOrders = await safeJson(testOrdersRes);
    const invoices = await safeJson(invoicesRes);
    const availableTestsRaw = await safeJson(availableTestsRes);

    // parse available tests similar to loader
    let available_tests = null;
    try {
      if (availableTestsRaw && typeof availableTestsRaw === 'object') {
        available_tests = [];
        Object.entries(availableTestsRaw).forEach(([type, testsMap]) => {
          if (testsMap && typeof testsMap === 'object') {
            Object.entries(testsMap).forEach(([testName, price]) => {
              const id = `${type}-${testName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              available_tests.push({ id, name: testName, type, price });
            });
          }
        });
      }
    } catch (e) {
      console.error('Error parsing available tests:', e);
      available_tests = null;
    }

    return { profile, appointments, testOrders, invoices, available_tests };
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