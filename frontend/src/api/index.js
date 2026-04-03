import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getPatients   = (search) => api.get('/patients', { params: { search } });
export const getPatient    = (id) => api.get(`/patients/${id}`);
export const createPatient = (data) => api.post('/patients', data);
export const updatePatient = (id, data) => api.patch(`/patients/${id}`, data);
export const updateTreatment = (id, data) => api.patch(`/patients/${id}/treatment`, data);
export const addVisit      = (data) => api.post('/visits', data);
export const updateBilling = (patientId, data) => api.patch(`/billing/${patientId}`, data);
export const getDashboard  = () => api.get('/dashboard');