export async function requireAuth(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw redirect('/login');
  }

}