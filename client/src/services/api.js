import axios from "axios";

// En desarrollo, usar URLs relativas para aprovechar el proxy de Vite
// En producción, usar la variable de entorno VITE_API_URL
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const AUTH_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true // Importante para enviar cookies
});

// Cliente separado para rutas de autenticación (sin prefijo /api)
export const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true // Importante para enviar cookies
});
