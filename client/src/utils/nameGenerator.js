// Generador de nombres aleatorios tipo Reddit
// Formato: Adjetivo + Sustantivo + Verbo + 3 dígitos

const adjectives = [
  "Rápido", "Astuto", "Veloz", "Sabio", "Loco",
  "Feliz", "Triste", "Épico", "Noble", "Valiente",
  "Bravo", "Audaz", "Fuerte", "Ágil", "Listo",
  "Genial", "Único", "Feroz", "Calmo", "Leal"
];

const nouns = [
  "Gato", "Perro", "León", "Tigre", "Oso",
  "Águila", "Lobo", "Zorro", "Búho", "Halcón",
  "Puma", "Dragón", "Fénix", "Ninja", "Héroe",
  "Mago", "Pirata", "Caballero", "Guerrero", "Rey"
];

const verbs = [
  "Salta", "Corre", "Vuela", "Nada", "Baila",
  "Canta", "Juega", "Ríe", "Grita", "Pelea",
  "Ataca", "Defiende", "Gana", "Triunfa", "Brilla",
  "Explora", "Caza", "Vigila", "Rueda", "Trepa"
];

/**
 * Genera un nombre aleatorio tipo Reddit
 * Formato: AdjetivoSustantivoVerbo123
 * Ejemplo: RápidoGatoSalta456
 */
export function generateRandomName() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${adjective}${noun}${verb}${numbers}`;
}

/**
 * Obtiene o genera un nombre de usuario
 * Si ya existe en localStorage, lo devuelve
 * Si no, genera uno nuevo y lo guarda
 */
export function getUserName() {
  let name = localStorage.getItem("playerName");

  if (!name) {
    name = generateRandomName();
    localStorage.setItem("playerName", name);
  }

  return name;
}

/**
 * Actualiza el nombre de usuario
 */
export function setUserName(newName) {
  localStorage.setItem("playerName", newName);
}
