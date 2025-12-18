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

/**
 * Construye la URL completa para una imagen basándose en su ruta relativa.
 * Esto permite que las imágenes funcionen tanto en localhost como en dispositivos remotos.
 *
 * @param {string} relativePath - Ruta relativa de la imagen (ej: "uploads/imagen.png")
 * @returns {string} URL de la imagen
 *
 * Ejemplos:
 * - En desarrollo: buildImageUrl("uploads/img.png") -> "/uploads/img.png" (proxy de Vite lo maneja)
 * - En producción: buildImageUrl("uploads/img.png") -> "https://dominio.com/uploads/img.png"
 */
export function buildImageUrl(relativePath) {
  if (!relativePath) return '';

  // Si ya es una URL completa (por compatibilidad con datos antiguos), devolverla tal cual
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Asegurar que relativePath empiece con /
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Si BASE_URL es una ruta relativa (desarrollo con proxy de Vite)
  if (BASE_URL.startsWith('/')) {
    // Devolver ruta absoluta - el proxy de Vite lo redirigirá al backend
    return cleanPath;
  }

  // En producción con URL explícita, remover /api y combinar
  const serverBaseUrl = BASE_URL.replace('/api', '');
  return `${serverBaseUrl}${cleanPath}`;
}
