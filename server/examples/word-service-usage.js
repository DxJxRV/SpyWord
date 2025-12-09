/**
 * Ejemplos de uso del servicio de palabras con Prisma
 *
 * Este archivo muestra cómo integrar el word.service.js en tus endpoints
 */

import {
  getRandomWordWeighted,
  logWordFeedback,
  getTopWords,
  getWordStats,
  disconnect,
} from '../services/word.service.js';

// ============================================
// Ejemplo 1: Obtener palabra aleatoria ponderada
// ============================================
async function ejemploGetRandomWord() {
  console.log('\n🎲 Ejemplo 1: Obtener palabra aleatoria\n');

  try {
    // Obtener cualquier palabra
    const palabra = await getRandomWordWeighted();
    console.log('Palabra seleccionada:', palabra);

    // Obtener palabra de categoría específica
    const palabraComida = await getRandomWordWeighted('Comida');
    console.log('Palabra de Comida:', palabraComida);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Ejemplo 2: Registrar feedback de partida
// ============================================
async function ejemploLogFeedback() {
  console.log('\n📊 Ejemplo 2: Registrar feedback\n');

  try {
    // Obtener palabra para el ejemplo
    const palabra = await getRandomWordWeighted();
    console.log('Palabra usada en partida:', palabra.word);

    // Simular que los jugadores ganaron (palabra fue buena)
    const palabraActualizada = await logWordFeedback(palabra.id, 'players_won');
    console.log('Peso actualizado:', palabraActualizada.weight);

    // Otros tipos de feedback:
    // - 'impostor_won': El impostor ganó (palabra funcionó bien)
    // - 'players_won': Los jugadores ganaron (palabra fue buena)
    // - 'abandoned': Partida abandonada (penalizar palabra)
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Ejemplo 3: Obtener top palabras
// ============================================
async function ejemploTopWords() {
  console.log('\n🏆 Ejemplo 3: Top palabras más populares\n');

  try {
    const topWords = await getTopWords(10);
    console.log('Top 10 palabras:');
    topWords.forEach((word, index) => {
      console.log(`${index + 1}. ${word.word} (${word.category}) - Peso: ${word.weight}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Ejemplo 4: Obtener estadísticas
// ============================================
async function ejemploStats() {
  console.log('\n📈 Ejemplo 4: Estadísticas generales\n');

  try {
    const stats = await getWordStats();
    console.log('Estadísticas de palabras:');
    console.log(`  - Total de palabras activas: ${stats.totalWords}`);
    console.log(`  - Peso promedio: ${stats.avgWeight}`);
    console.log(`  - Peso máximo: ${stats.maxWeight}`);
    console.log(`  - Peso mínimo: ${stats.minWeight}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// ============================================
// Ejemplo 5: Integración completa en endpoint
// ============================================
async function ejemploIntegracionEndpoint() {
  console.log('\n🔌 Ejemplo 5: Integración en endpoint de Express\n');

  // Ejemplo de cómo usarlo en tu server.js:
  console.log(`
// En server.js, agregar estas rutas:

import {
  getRandomWordWeighted,
  logWordFeedback
} from './services/word.service.js';

// 🔹 Obtener palabra para nueva ronda
app.post('/rooms/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Obtener palabra aleatoria ponderada
    const wordData = await getRandomWordWeighted();

    // Asignar impostor aleatorio
    const players = Array.from(room.players.values());
    const impostorIndex = Math.floor(Math.random() * players.length);

    room.currentWord = wordData.word;
    room.currentWordId = wordData.id; // ⚠️ Guardar ID para feedback
    room.impostorId = players[impostorIndex].id;

    res.json({
      success: true,
      word: wordData.word,
      category: wordData.category
    });
  } catch (error) {
    console.error('Error al iniciar ronda:', error);
    res.status(500).json({ error: 'Error al obtener palabra' });
  }
});

// 🔹 Registrar resultado de partida
app.post('/rooms/:roomId/finish', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { result } = req.body; // 'players_won', 'impostor_won', 'abandoned'

    const room = rooms.get(roomId);

    if (!room || !room.currentWordId) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Registrar feedback de la palabra
    await logWordFeedback(room.currentWordId, result);

    res.json({ success: true });
  } catch (error) {
    console.error('Error al finalizar partida:', error);
    res.status(500).json({ error: 'Error al registrar resultado' });
  }
});

// 🔹 Obtener estadísticas (opcional)
app.get('/api/stats/words', async (req, res) => {
  try {
    const topWords = await getTopWords(20);
    const stats = await getWordStats();

    res.json({
      topWords,
      stats
    });
  } catch (error) {
    console.error('Error al obtener stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
  `);
}

// ============================================
// Ejecutar todos los ejemplos
// ============================================
async function runAllExamples() {
  try {
    await ejemploGetRandomWord();
    await ejemploLogFeedback();
    await ejemploTopWords();
    await ejemploStats();
    ejemploIntegracionEndpoint();
  } catch (error) {
    console.error('Error ejecutando ejemplos:', error);
  } finally {
    // Cerrar conexión de Prisma
    await disconnect();
    console.log('\n✅ Ejemplos completados. Conexión de Prisma cerrada.\n');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export { runAllExamples };
