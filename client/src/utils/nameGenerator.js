// Generador de nombres aleatorios mejorado
// Formato: Sustantivo + Verbo + 3 dígitos
// Ejemplo: GatoSalta456, LeónCorre123

import { api } from '../services/api';

// Listas locales de fallback (si el servidor falla o está vacío)
const fallbackNouns = [
  "Gato", "Perro", "León", "Tigre", "Águila", "Lobo", "Zorro", "Oso",
  "Dragón", "Fénix", "Ninja", "Pirata", "Rey", "Reina", "Héroe", "Mago",
  "Guerrero", "Caballero", "Samurai", "Robot", "Alien", "Zombie", "Vampiro", "Unicornio"
];

const fallbackVerbs = [
  "Corre", "Salta", "Vuela", "Nada", "Baila", "Canta", "Lucha", "Gana",
  "Brilla", "Ríe", "Grita", "Juega", "Ataca", "Defiende", "Conquista", "Explora",
  "Crea", "Destruye", "Salva", "Protege", "Domina", "Reina", "Triunfa", "Sorprende"
];

/**
 * Genera un nombre aleatorio local (solo fallback)
 * Formato: SustantivoVerbo123
 * Ejemplo: GatoSalta456
 */
function generateRandomNameFallback() {
  const noun = fallbackNouns[Math.floor(Math.random() * fallbackNouns.length)];
  const verb = fallbackVerbs[Math.floor(Math.random() * fallbackVerbs.length)];
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${noun}${verb}${numbers}`;
}

/**
 * Genera un nombre aleatorio desde el servidor
 * Usa listas de la base de datos (nouns[], verbs[])
 * Si falla, usa fallback local
 */
export async function generateRandomName() {
  try {
    const response = await api.get('/names/generate');
    console.log('📛 Nombre generado desde servidor:', response.data.name);
    return response.data.name;
  } catch (error) {
    console.warn('⚠️ Error al generar nombre desde servidor, usando fallback:', error);
    return generateRandomNameFallback();
  }
}

/**
 * Obtiene el nombre de usuario desde localStorage (síncrono)
 * Devuelve "Usuario" como placeholder si no existe
 */
export function getUserName() {
  return localStorage.getItem("playerName") || "Usuario";
}

/**
 * Inicializa o refresca el nombre de usuario desde el servidor (async)
 * Llama al servidor para obtener nombres con las listas de la base de datos
 * Con sistema de refresh cada 24h (excepto si fue editado manualmente)
 *
 * Esta función debe llamarse al inicio de la app para sincronizar con el servidor
 */
export async function initializeUserName() {
  let name = localStorage.getItem("playerName");
  const lastUpdate = localStorage.getItem("playerNameLastUpdate");
  const manuallyEdited = localStorage.getItem("playerNameManuallyEdited") === "true";

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  // Si no hay nombre o no hay timestamp, generar uno nuevo desde servidor
  if (!name || !lastUpdate) {
    name = await generateRandomName();
    localStorage.setItem("playerName", name);
    localStorage.setItem("playerNameLastUpdate", now.toString());
    localStorage.setItem("playerNameManuallyEdited", "false");
    console.log('📛 Nuevo nombre generado desde servidor:', name);
    return name;
  }

  // Si fue editado manualmente, no refrescar
  if (manuallyEdited) {
    console.log('📛 Nombre editado manualmente, no se refresca:', name);
    return name;
  }

  // Si han pasado 24h, generar nombre nuevo desde servidor
  const timeSinceUpdate = now - parseInt(lastUpdate);
  if (timeSinceUpdate > twentyFourHours) {
    name = await generateRandomName();
    localStorage.setItem("playerName", name);
    localStorage.setItem("playerNameLastUpdate", now.toString());
    console.log('📛 24h pasadas, nombre refrescado desde servidor:', name);
  }

  return name;
}

/**
 * Actualiza el nombre de usuario (marca como editado manualmente)
 */
export function setUserName(newName) {
  localStorage.setItem("playerName", newName);
  localStorage.setItem("playerNameLastUpdate", Date.now().toString());
  localStorage.setItem("playerNameManuallyEdited", "true");
  console.log('📛 Nombre editado manualmente:', newName);
}
