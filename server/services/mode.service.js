import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exportar prisma para que otros módulos puedan usarlo
export { prisma };

/**
 * Obtiene un item aleatorio de un modo usando selección ponderada
 * @param {number} modeId - ID del modo de juego
 * @returns {Promise<{label: string, imageUrl: string|null, weight: number, index: number}>}
 */
export async function getRandomItemWeighted(modeId) {
  const mode = await prisma.gameMode.findUnique({
    where: { id: modeId, isActive: true }
  });

  if (!mode || !mode.items || mode.items.length === 0) {
    throw new Error(`Modo ${modeId} no encontrado o no tiene items`);
  }

  const items = mode.items;

  // Calcular peso total
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 100), 0);

  // Selección aleatoria ponderada
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const weight = item.weight || 100;

    if (random < weight) {
      return {
        label: item.label,
        imageUrl: item.imageUrl || null,
        weight: weight,
        index: i
      };
    }

    random -= weight;
  }

  // Fallback (no debería llegar aquí)
  const fallbackItem = items[0];
  return {
    label: fallbackItem.label,
    imageUrl: fallbackItem.imageUrl || null,
    weight: fallbackItem.weight || 100,
    index: 0
  };
}

/**
 * Actualiza el peso de un item según el resultado de la partida
 * @param {number} modeId - ID del modo
 * @param {number} itemIndex - Índice del item en el array
 * @param {string} resultType - 'players_won' | 'impostor_won' | 'abandoned'
 */
export async function logItemFeedback(modeId, itemIndex, resultType) {
  const mode = await prisma.gameMode.findUnique({
    where: { id: modeId }
  });

  if (!mode || !mode.items || !mode.items[itemIndex]) {
    console.error(`Item ${itemIndex} no encontrado en modo ${modeId}`);
    return;
  }

  const items = [...mode.items];
  const item = items[itemIndex];
  let currentWeight = item.weight || 100;

  // Ajustar peso según resultado
  switch (resultType) {
    case 'players_won':
      currentWeight += 5; // Buenos items (balance correcto)
      break;
    case 'impostor_won':
      currentWeight += 3; // Items interesantes
      break;
    case 'abandoned':
      currentWeight -= 10; // Items que causan abandono
      break;
    default:
      console.warn(`Tipo de resultado desconocido: ${resultType}`);
  }

  // Límites de peso: 10 mínimo, 500 máximo
  currentWeight = Math.max(10, Math.min(500, currentWeight));

  // Actualizar el item
  items[itemIndex] = {
    ...item,
    weight: currentWeight
  };

  // Guardar en BD
  await prisma.gameMode.update({
    where: { id: modeId },
    data: { items: items }
  });

  console.log(`✅ Item ${itemIndex} del modo ${modeId} actualizado: ${currentWeight} peso (${resultType})`);
}

/**
 * Obtiene todos los modos activos
 * @returns {Promise<Array>}
 */
export async function getActiveModes() {
  return await prisma.gameMode.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Obtiene un modo específico por ID
 * @param {number} modeId
 * @returns {Promise<Object|null>}
 */
export async function getModeById(modeId) {
  return await prisma.gameMode.findUnique({
    where: { id: modeId }
  });
}

/**
 * Obtiene estadísticas de un modo
 * @param {number} modeId
 * @returns {Promise<Object>}
 */
export async function getModeStats(modeId) {
  const mode = await prisma.gameMode.findUnique({
    where: { id: modeId }
  });

  if (!mode || !mode.items) {
    return {
      totalItems: 0,
      avgWeight: 0,
      maxWeight: 0,
      minWeight: 0
    };
  }

  const items = mode.items;
  const weights = items.map(item => item.weight || 100);

  return {
    totalItems: items.length,
    avgWeight: Math.round(weights.reduce((a, b) => a + b, 0) / weights.length),
    maxWeight: Math.max(...weights),
    minWeight: Math.min(...weights)
  };
}

export default {
  getRandomItemWeighted,
  logItemFeedback,
  getActiveModes,
  getModeById,
  getModeStats
};
