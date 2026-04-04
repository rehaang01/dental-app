import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true, // Always send the httpOnly auth cookie
});
// ── Auth ──────────────────────────────────────────────────────────
export const login    = (data) => api.post('/auth/login', data);
export const logout   = ()     => api.post('/auth/logout');
export const getMe    = ()     => api.get('/auth/me');


export const getPatients   = (search) => api.get('/patients', { params: { search } });
export const getPatient    = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.patch(`/patients/${id}`, data);
export const updateTreatment = (id, data) => api.patch(`/patients/${id}/treatment`, data);
export const addVisit      = (data) => api.post('/visits', data);
export const updateBilling = (patientId, data) => api.patch(`/billing/${patientId}`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}`);
export const getDashboard       = () => api.get('/dashboard');
export const getDashboardDetail = (type) => api.get('/dashboard/detail', { params: { type } });