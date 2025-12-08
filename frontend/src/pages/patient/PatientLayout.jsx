import {Outlet, redirect} from "react-router-dom"
import { useLoaderData } from "react-router-dom";
import PatientSidebar from "../../components/patient/PatientSidebar"
import { requireAuth } from "../../utls";
import '../../styles/patient/Patient.css'

export async function loader() {
  await requireAuth()
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const base = 'http://127.0.0.1:8000/api/patient-portal';
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` };

  const [profileRes, appointmentsRes, testOrdersRes, invoicesRes, availableSlots] = await Promise.all([
    fetch("http://127.0.0.1:8000/api/accounts/login"),
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
    availableSlots: await safeJson(availableSlots)
  };
}

export default function PatientLayout(){
    const res = useLoaderData()
    console.log(res)
    return(
    <main className="patient-layout">
      <PatientSidebar profile={res.profile} />
      <Outlet context={res} />
    </main>
    )
}