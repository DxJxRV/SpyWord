import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Obtiene una palabra aleatoria usando selección ponderada
 * Las palabras con mayor peso tienen mayor probabilidad de ser seleccionadas
 * @param {string} category - Categoría opcional para filtrar palabras
 * @returns {Promise<Object>} Objeto con la palabra seleccionada
 */
async function getRandomWordWeighted(category = null) {
  try {
    // Construir filtro dinámico
    const where = { is_active: true };
    if (category) {
      where.category = category;
    }

    // Obtener todas las palabras activas (con sus pesos)
    const words = await prisma.word.findMany({
      where,
      select: {
        id: true,
        word: true,
        category: true,
        weight: true,
      },
    });

    if (words.length === 0) {
      throw new Error('No hay palabras disponibles');
    }

    // Calcular suma total de pesos
    const totalWeight = words.reduce((sum, w) => sum + w.weight, 0);

    // Generar número aleatorio entre 0 y totalWeight
    let random = Math.random() * totalWeight;

    // Seleccionar palabra usando algoritmo de ruleta ponderada
    for (const word of words) {
      random -= word.weight;
      if (random <= 0) {
        return {
          id: word.id,
          word: word.word,
          category: word.category,
          weight: word.weight,
        };
      }
    }

    // Fallback: retornar última palabra (por si acaso)
    const lastWord = words[words.length - 1];
    return {
      id: lastWord.id,
      word: lastWord.word,
      category: lastWord.category,
      weight: lastWord.weight,
    };
  } catch (error) {
    console.error('❌ Error al obtener palabra ponderada:', error);
    throw error;
  }
}

/**
 * Registra feedback de una palabra y actualiza su peso
 * @param {number} wordId - ID de la palabra
 * @param {string} resultType - Tipo de resultado: 'impostor_won', 'players_won', 'abandoned'
 * @returns {Promise<Object>} Palabra actualizada con nuevo peso
 */
async function logWordFeedback(wordId, resultType) {
  try {
    // Validar tipo de resultado
    const validResults = ['impostor_won', 'players_won', 'abandoned'];
    if (!validResults.includes(resultType)) {
      throw new Error(`Tipo de resultado inválido: ${resultType}`);
    }

    // Determinar ajuste de peso según resultado
    let weightChange = 0;
    switch (resultType) {
      case 'players_won':
        weightChange = 5; // Partida completada exitosamente
        break;
      case 'impostor_won':
        weightChange = 3; // Palabra funcionó bien (impostor no fue descubierto)
        break;
      case 'abandoned':
        weightChange = -10; // Penalizar palabras en partidas abandonadas
        break;
    }

    // Obtener peso actual antes de la transacción (para logging)
    const currentWord = await prisma.word.findUnique({
      where: { id: wordId },
      select: { weight: true, word: true },
    });

    if (!currentWord) {
      throw new Error(`Palabra con ID ${wordId} no encontrada`);
    }

    const oldWeight = currentWord.weight;

    // Calcular nuevo peso (mínimo 10, máximo 500)
    const newWeight = Math.max(10, Math.min(500, currentWord.weight + weightChange));

    // Actualizar peso de forma transaccional
    const updatedWord = await prisma.word.update({
      where: { id: wordId },
      data: { weight: newWeight },
      select: {
        id: true,
        word: true,
        category: true,
        weight: true,
      },
    });

    console.log(`✅ Peso actualizado: "${updatedWord.word}" (${oldWeight} → ${updatedWord.weight})`);
    return updatedWord;
  } catch (error) {
    console.error('❌ Error al registrar feedback:', error);
    throw error;
  }
}

/**
 * Obtiene las palabras más populares (mayor peso)
 * @param {number} limit - Número máximo de palabras a retornar
 * @returns {Promise<Array>} Lista de palabras ordenadas por peso descendente
 */
async function getTopWords(limit = 20) {
  try {
    const topWords = await prisma.word.findMany({
      where: { is_active: true },
      orderBy: { weight: 'desc' },
      take: limit,
      select: {
        id: true,
        word: true,
        category: true,
        weight: true,
      },
    });

    return topWords;
  } catch (error) {
    console.error('❌ Error al obtener top palabras:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas generales de palabras
 * @returns {Promise<Object>} Estadísticas agregadas
 */
async function getWordStats() {
  try {
    const [totalWords, avgWeight, maxWeight, minWeight] = await Promise.all([
      prisma.word.count({ where: { is_active: true } }),
      prisma.word.aggregate({
        where: { is_active: true },
        _avg: { weight: true },
      }),
      prisma.word.aggregate({
        where: { is_active: true },
        _max: { weight: true },
      }),
      prisma.word.aggregate({
        where: { is_active: true },
        _min: { weight: true },
      }),
    ]);

    return {
      totalWords,
      avgWeight: Math.round(avgWeight._avg.weight || 0),
      maxWeight: maxWeight._max.weight || 0,
      minWeight: minWeight._min.weight || 0,
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
}

/**
 * Cierra la conexión de Prisma (útil para testing y shutdown)
 */
async function disconnect() {
  await prisma.$disconnect();
}

export {
  getRandomWordWeighted,
  logWordFeedback,
  getTopWords,
  getWordStats,
  disconnect,
};
