import { redirect } from "react-router-dom";

// Session storage helpers - allows multiple logins in different tabs
export function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
}

export function getUsername() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('username') : null;
}

export function getUserRole() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('userRole') : null;
}

export function setAuthData(token, username, role) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('userRole', role);
  }
}

export function clearAuthData() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userRole');
  }
}

export async function requireAuth(){
  const token = getToken();
  if (!token) {
    throw redirect('/login');
  }
}

// Role-specific auth check
export async function requirePatientAuth() {
  const token = getToken();
  const role = getUserRole();
  
  if (!token) {
    throw redirect('/login');
  }
  
  if (role !== 'patient') {
    // User is logged in but not as patient - redirect to appropriate portal
    if (role === 'admin') throw redirect('/admin');
    if (role === 'lab_tech') throw redirect('/hematology');
    if (role === 'pathologist') throw redirect('/pathology');
    throw redirect('/login');
  }
}
