import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import {
  getRandomWordWeighted,
  logWordFeedback,
  getTopWords,
  getWordStats,
} from './services/word.service.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

const allowedOrigins = [
  "http://impostorword.com",
  "https://impostorword.com",
  "http://www.impostorword.com",
  "https://www.impostorword.com",
  "http://localhost:5173",
  "https://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origen (como Postman, apps nativas, etc)
      if (!origin) return callback(null, true);

      // En desarrollo, permitir cualquier origen de localhost o IP local
      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.match(/^https?:\/\/192\.168\.\d+\.\d+/) || origin.match(/^https?:\/\/10\.\d+\.\d+\.\d+/)) {
          return callback(null, true);
        }
      }

      // Verificar si está en la lista de permitidos
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Si no coincide, rechazar
      console.log(`❌ CORS bloqueado para origen: ${origin}`);
      return callback(new Error("No autorizado por CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());

// Almacenamiento en memoria
const rooms = {};

// Array WORDS eliminado - Ahora usamos base de datos con Prisma


// Función para generar roomId de 6 caracteres
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

// Función obsoleta eliminada - Ahora usamos Prisma con getRandomWordWeighted()

// Función para limpiar jugadores inactivos (más de 10 segundos sin actividad)
function cleanInactivePlayers(room) {
  const now = Date.now();
  const INACTIVE_THRESHOLD = 50 * 1000; // 50 segundos

  const activePlayerIds = [];

  for (const [playerId, playerData] of Object.entries(room.players)) {
    if (now - playerData.lastSeen < INACTIVE_THRESHOLD) {
      activePlayerIds.push(playerId);
    } else {
      delete room.players[playerId];
      console.log(`🗑️ Jugador inactivo eliminado: ${playerId}`);
    }
  }

  return activePlayerIds;
}

// Función para obtener jugadores activos
function getActivePlayers(room) {
  return Object.keys(room.players);
}

// Limpiar partidas inactivas después de 15 minutos
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  for (const roomId in rooms) {
    if (now - rooms[roomId].lastActivity > fifteenMinutes) {
      console.log(`🧹 Limpiando sala inactiva: ${roomId}`);
      delete rooms[roomId];
    }
  }
}, 60 * 1000); // Revisar cada minuto

// ➕ POST /api/rooms/create
app.post('/api/rooms/create', async (req, res) => {
  try {
    const { adminName } = req.body;
    const roomId = generateRoomId();
    const adminId = uuidv4();

    // Obtener palabra aleatoria ponderada de la base de datos
    const wordData = await getRandomWordWeighted();

    rooms[roomId] = {
      adminId,
      adminName: adminName || "Admin", // Guardar nombre del admin
      word: wordData.word,
      wordId: wordData.id, // Guardar ID para feedback
      category: wordData.category,
      round: 1,
      players: {
        // El admin también es un jugador
        [adminId]: { lastSeen: Date.now(), name: adminName || "Admin", isAlive: true, hasVoted: false }
      },
      impostorId: null, // ID del impostor actual
      starterPlayerId: null, // ID del jugador que inicia la partida
      lastStarterPlayerId: null, // ID del último jugador que inició (para no repetir)
      lastWord: wordData.word, // Última palabra usada (para no repetir)
      lastActivity: Date.now(),
      nextRoundAt: null, // Timestamp para countdown sincronizado
      // Campos de votación
      status: 'IN_GAME', // Estados: 'IN_GAME', 'VOTING', 'RESULTS'
      votes: {}, // { "target-id": ["voter-id-1", "voter-id-2"], ... }
      votersRemaining: 0,
      eliminatedPlayerId: null
    };

    console.log(`✅ Sala creada: ${roomId} - Admin: ${adminId} (${adminName || "Admin"}) - Palabra: ${wordData.word}`);

    // Establecer cookie de sesión
    res.cookie('sid', adminId, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.json({
      roomId,
      word: wordData.word,
      round: 1
    });
  } catch (error) {
    console.error('❌ Error al crear sala:', error);
    res.status(500).json({ error: 'Error al crear sala' });
  }
});

// 👥 POST /api/rooms/:roomId/join
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  if (!playerName || playerName.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre del jugador es requerido' });
  }

  const room = rooms[roomId];
  const playerId = uuidv4();

  // Registrar jugador con nombre y timestamp
  room.players[playerId] = {
    lastSeen: Date.now(),
    name: playerName.trim(),
    isAlive: true,
    hasVoted: false
  };

  room.lastActivity = Date.now();

  const activePlayers = getActivePlayers(room);
  console.log(`👤 Jugador unido a ${roomId}: ${playerId} (Nombre: ${playerName}) (Total activos: ${activePlayers.length})`);

  // Establecer cookie de sesión
  res.cookie('sid', playerId, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  });

  // Determinar si es impostor
  const isImpostor = playerId === room.impostorId;

  res.json({
    word: isImpostor ? "???" : room.word,
    isImpostor,
    round: room.round,
    playerName: playerName.trim()
  });
});

// 🔁 POST /api/rooms/:roomId/restart
app.post('/api/rooms/:roomId/restart', async (req, res) => {
  try {
    const { roomId } = req.params;
    const adminId = req.cookies.sid; // Obtener de la cookie

    if (!rooms[roomId]) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    const room = rooms[roomId];

    if (room.adminId !== adminId) {
      return res.status(403).json({ error: 'Solo el admin puede reiniciar la partida' });
    }

    // Configurar countdown de 5 segundos
    const nextRoundAt = Date.now() + 5000; // 5 segundos en el futuro
    room.nextRoundAt = nextRoundAt;
    room.lastActivity = Date.now();

    // Obtener nueva palabra de la base de datos
    const wordData = await getRandomWordWeighted();
    room.word = wordData.word;
    room.wordId = wordData.id;
    room.category = wordData.category;
    room.lastWord = wordData.word;
    const activePlayers = cleanInactivePlayers(room);

  // Seleccionar el jugador que va a iniciar la partida (al azar, sin repetir el anterior)
  if (activePlayers.length > 0) {
    let availablePlayers = activePlayers;
    if (activePlayers.length > 1 && room.starterPlayerId && activePlayers.includes(room.starterPlayerId)) {
      availablePlayers = activePlayers.filter(id => id !== room.starterPlayerId);
    }
    const starterIndex = Math.floor(Math.random() * availablePlayers.length);
    room.starterPlayerId = availablePlayers[starterIndex];
  } else {
    room.starterPlayerId = null;
  }

  // Seleccionar impostor aleatorio solo de jugadores activos
  if (activePlayers.length > 0) {
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    room.impostorId = activePlayers[randomIndex];
  } else {
    room.impostorId = null;
  }

  // Resetear estado de votación para nueva ronda
  room.status = 'IN_GAME';
  room.votes = {};
  room.votersRemaining = 0;
  room.eliminatedPlayerId = null;
  // Resetear hasVoted y asegurar que jugadores vivos mantengan isAlive
  for (const playerId in room.players) {
    room.players[playerId].hasVoted = false;
    if (room.players[playerId].isAlive === undefined) {
      room.players[playerId].isAlive = true;
    }
  }

  console.log(`⏳ Countdown iniciado en ${roomId} - Nueva ronda en 5 segundos`);
  console.log(`🔮 Pre-asignado: Palabra=${room.word}, Starter=${room.starterPlayerId}, Impostor=${room.impostorId}`);

  // Programar la actualización automática después de 5 segundos
  setTimeout(() => {
    if (rooms[roomId]) {
      room.round++;
      room.nextRoundAt = null;
      // No reasignar palabra/impostor/starter aquí, ya están asignados arriba
      console.log(`🔄 Partida reiniciada en ${roomId} - Ronda: ${room.round} - Nueva palabra: ${room.word}`);
    }
  }, 5000);

  // 🔔 Notificar a todos los clientes en espera
  if (waitingClients[roomId]) {
    waitingClients[roomId].forEach(client => {
      const starterName = room.starterPlayerId ? room.players[room.starterPlayerId]?.name : null;
      const word = room.word;

      client.json({
        round: room.round,
        word,
        totalPlayers: Object.keys(room.players).length,
        nextRoundAt: room.nextRoundAt || null,
        isAdmin: false,
        starterName: starterName || null
      });
    });
    waitingClients[roomId] = [];
  }


  res.json({
    nextRoundAt,
    word: room.word,
    impostorId: room.impostorId,
    starterPlayerId: room.starterPlayerId,
    starterName: room.starterPlayerId ? room.players[room.starterPlayerId]?.name : null,
    message: 'Countdown iniciado'
  });
  } catch (error) {
    console.error('❌ Error al reiniciar partida:', error);
    res.status(500).json({ error: 'Error al reiniciar partida' });
  }
});

// ============================================
// 🗳️ ENDPOINTS DE VOTACIÓN
// ============================================

// Función para resolver la votación
function resolveVoting(room) {
  // Contar jugadores vivos
  const alivePlayers = Object.keys(room.players).filter(id => room.players[id].isAlive);
  const totalActivePlayers = alivePlayers.length;
  const majorityNeeded = Math.ceil(totalActivePlayers / 2);

  console.log(`🗳️ Resolviendo votación - Total vivos: ${totalActivePlayers}, Mayoría necesaria: ${majorityNeeded}`);

  // Contar votos
  const voteCounts = {};
  for (const targetId in room.votes) {
    voteCounts[targetId] = room.votes[targetId].length;
  }

  // Encontrar quién tiene más votos
  let maxVotes = 0;
  let eliminatedId = null;
  let hasTie = false;

  for (const targetId in voteCounts) {
    const votes = voteCounts[targetId];
    if (votes > maxVotes) {
      maxVotes = votes;
      eliminatedId = targetId;
      hasTie = false;
    } else if (votes === maxVotes && maxVotes > 0) {
      hasTie = true;
    }
  }

  // Verificar mayoría absoluta y no empate
  if (eliminatedId && maxVotes >= majorityNeeded && !hasTie) {
    // Hay eliminación
    room.players[eliminatedId].isAlive = false;
    room.eliminatedPlayerId = eliminatedId;
    console.log(`❌ Jugador eliminado: ${room.players[eliminatedId].name} (${maxVotes} votos)`);
  } else {
    // No hay mayoría o hay empate
    room.eliminatedPlayerId = null;
    if (hasTie) {
      console.log(`🤝 Empate en la votación - Nadie eliminado`);
    } else {
      console.log(`📊 No se alcanzó mayoría (máximo: ${maxVotes}/${majorityNeeded}) - Nadie eliminado`);
    }
  }

  // Cambiar estado a RESULTS
  room.status = 'RESULTS';
  room.round++; // Incrementar ronda para forzar actualización en clientes

  // Resetear hasVoted para siguiente votación
  for (const playerId in room.players) {
    room.players[playerId].hasVoted = false;
  }

  // Forzar actualización
  room.lastActivity = Date.now();
}

// 🗳️ POST /api/rooms/:roomId/call_vote - Iniciar votación
app.post('/api/rooms/:roomId/call_vote', (req, res) => {
  const { roomId } = req.params;
  const callerId = req.cookies.sid;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];

  // Verificar que el jugador esté en la sala y vivo
  if (!room.players[callerId] || !room.players[callerId].isAlive) {
    return res.status(403).json({ error: 'Solo jugadores vivos pueden llamar a votación' });
  }

  // Verificar que el estado sea IN_GAME
  if (room.status !== 'IN_GAME') {
    return res.status(400).json({ error: 'Ya hay una votación en curso o en resultados' });
  }

  // Iniciar votación
  room.status = 'VOTING';
  room.votes = {};
  room.eliminatedPlayerId = null;

  // Contar jugadores vivos
  const alivePlayers = Object.keys(room.players).filter(id => room.players[id].isAlive);
  room.votersRemaining = alivePlayers.length;

  // Resetear hasVoted
  for (const playerId in room.players) {
    room.players[playerId].hasVoted = false;
  }

  // Forzar actualización
  room.lastActivity = Date.now();

  console.log(`🗳️ Votación iniciada en ${roomId} por ${room.players[callerId].name} - ${room.votersRemaining} votantes`);

  res.json({
    success: true,
    status: 'VOTING',
    votersRemaining: room.votersRemaining
  });
});

// 🗳️ POST /api/rooms/:roomId/vote - Registrar voto
app.post('/api/rooms/:roomId/vote', (req, res) => {
  const { roomId } = req.params;
  const { targetId } = req.body;
  const voterId = req.cookies.sid;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];

  // Verificar que el estado sea VOTING
  if (room.status !== 'VOTING') {
    return res.status(400).json({ error: 'No hay votación activa' });
  }

  // Verificar que el votante esté en la sala y vivo
  if (!room.players[voterId] || !room.players[voterId].isAlive) {
    return res.status(403).json({ error: 'Solo jugadores vivos pueden votar' });
  }

  // Verificar que no haya votado ya
  if (room.players[voterId].hasVoted) {
    return res.status(400).json({ error: 'Ya has votado' });
  }

  // Verificar que el target exista y esté vivo
  if (!room.players[targetId] || !room.players[targetId].isAlive) {
    return res.status(400).json({ error: 'El jugador objetivo no existe o está muerto' });
  }

  // Registrar voto
  if (!room.votes[targetId]) {
    room.votes[targetId] = [];
  }
  room.votes[targetId].push(voterId);
  room.players[voterId].hasVoted = true;
  room.votersRemaining--;

  console.log(`🗳️ Voto registrado: ${room.players[voterId].name} → ${room.players[targetId].name} (${room.votersRemaining} restantes)`);

  // Verificar si todos han votado
  if (room.votersRemaining === 0) {
    console.log(`🗳️ Todos votaron - Resolviendo votación`);
    resolveVoting(room);
  } else {
    // Forzar actualización parcial
    room.lastActivity = Date.now();
  }

  res.json({
    success: true,
    votersRemaining: room.votersRemaining,
    status: room.status
  });
});

// 🔄 POST /api/rooms/:roomId/continue_game - Continuar después de resultados
app.post('/api/rooms/:roomId/continue_game', (req, res) => {
  const { roomId } = req.params;
  const playerId = req.cookies.sid;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];

  // Solo el admin puede continuar
  if (room.adminId !== playerId) {
    return res.status(403).json({ error: 'Solo el admin puede continuar el juego' });
  }

  // Verificar que el estado sea RESULTS
  if (room.status !== 'RESULTS') {
    return res.status(400).json({ error: 'No hay resultados para continuar' });
  }

  // Volver al estado IN_GAME
  room.status = 'IN_GAME';
  room.votes = {};
  room.votersRemaining = 0;
  room.eliminatedPlayerId = null;

  // Forzar actualización
  room.lastActivity = Date.now();

  console.log(`▶️ Juego continuado en ${roomId}`);

  res.json({
    success: true,
    status: 'IN_GAME'
  });
});

// 📡 GET /api/rooms/:roomId/state
// Al principio del archivo
const LONG_POLL_TIMEOUT = 30000; // 30 segundos

// Mantenemos una lista de "clientes esperando" por sala
const waitingClients = {}; // { roomId: [res, res, ...] }

// 📡 GET /api/rooms/:roomId/state  (Long Polling)
app.get('/api/rooms/:roomId/state', async (req, res) => {
  const { roomId } = req.params;
  const playerId = req.cookies.sid; // ID del jugador
  const clientRound = Number(req.query.round || 0);
  const clientNextRound = Number(req.query.nextRoundAt || 0);
  const clientStatus = req.query.status || 'IN_GAME';

  if (!rooms[roomId]) {
    console.log(`❌ [STATE] Sala no encontrada: ${roomId}`);
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];
  room.lastActivity = Date.now();

  // Asegurar que el jugador exista o registrarlo
  if (playerId) {
    if (!room.players[playerId]) {
      room.players[playerId] = { lastSeen: Date.now(), name: "Anónimo" };
      console.log(`📝 Jugador registrado en ${roomId}: ${playerId}`);
    } else {
      room.players[playerId].lastSeen = Date.now();
    }
  }

  // Limpiar jugadores inactivos
  const activePlayers = cleanInactivePlayers(room);

  // --- Asignaciones automáticas de impostor / starter ---
  if (room.round === 1 && !room.impostorId && activePlayers.length >= 2) {
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    room.impostorId = activePlayers[randomIndex];
    console.log(`🕵️ Primer impostor asignado en ${roomId}: ${room.impostorId}`);
  }

  if (room.impostorId && !activePlayers.includes(room.impostorId) && activePlayers.length >= 2) {
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    room.impostorId = activePlayers[randomIndex];
    console.log(`🔄 Impostor reasignado en ${roomId}: ${room.impostorId}`);
  }

  // 🔍 Función para enviar respuesta con estado actual
  const sendState = (unchanged = false) => {
    const word = playerId === room.impostorId ? "???" : room.word;
    const starterName = room.starterPlayerId ? room.players[room.starterPlayerId]?.name : null;

    // Preparar datos de jugadores con estado de vida
    const playersData = {};
    for (const pId in room.players) {
      playersData[pId] = {
        name: room.players[pId].name,
        isAlive: room.players[pId].isAlive !== false, // Default true si no existe
        hasVoted: room.players[pId].hasVoted || false
      };
    }

    // Contar votos para cada jugador
    const votesTally = {};
    for (const targetId in room.votes) {
      votesTally[targetId] = room.votes[targetId].length;
    }

    const payload = {
      round: room.round,
      word,
      totalPlayers: activePlayers.length,
      nextRoundAt: room.nextRoundAt || null,
      isAdmin: playerId === room.adminId,
      starterName: starterName || null,
      unchanged,
      // Datos de votación
      status: room.status || 'IN_GAME',
      players: playersData,
      votesTally,
      votersRemaining: room.votersRemaining || 0,
      eliminatedPlayerId: room.eliminatedPlayerId || null,
      myId: playerId // ID del cliente actual
    };

    res.json(payload);
  };

  // --- Normalizar valores para comparación ---
  const serverRound = Number(room.round || 0);
  const serverNextRound = Number(room.nextRoundAt || 0);

  // Si el cliente no tiene datos (round = 0, nextRoundAt = 0), envía estado completo inmediatamente
  console.log("Client Round: ", clientRound)
  console.log("client Next Round: ", clientNextRound)
  if (clientRound === 0 && clientNextRound === 0) {
    console.log(`🚀 [INIT] Enviando estado inicial de la sala ${roomId}`);
    return sendState(false);
  }


  // --- Si algo cambió desde lo que el cliente tiene, responder de inmediato ---
  if (serverRound !== clientRound || serverNextRound !== clientNextRound) {
    console.log(`⚡ [UPDATE] Cambio detectado en ${roomId} → round=${serverRound}, nextRoundAt=${serverNextRound}`);
    return sendState(false);
  }

  // --- Si todo sigue igual, "colgar" la conexión hasta que haya cambio o timeout ---
  console.log(`🕓 [WAIT] Cliente esperando cambios en room ${roomId} (round=${serverRound})`);

  const startTime = Date.now();
  const timeout = 30000; // 30 segundos

  // Espera activa: revisa cada 500 ms si algo cambió
  const interval = setInterval(() => {
    const now = Date.now();
    const roundChanged = Number(room.round || 0) !== serverRound;
    const nextChanged = Number(room.nextRoundAt || 0) !== serverNextRound;

    if (roundChanged || nextChanged) {
      console.log(`✅ [CHANGE] Cambio detectado mientras esperaba en ${roomId}`);
      clearInterval(interval);
      sendState(false);
    } else if (now - startTime >= timeout) {
      console.log(`⌛ [TIMEOUT] Sin cambios en ${roomId}, respondiendo unchanged`);
      clearInterval(interval);
      sendState(true);
    }
  }, 500);
});



// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: Object.keys(rooms).length,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🔧 ENDPOINTS DE ADMINISTRACIÓN
// ============================================

// Importar PrismaClient para operaciones CRUD
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 📊 GET /api/admin/stats - Obtener estadísticas
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await getWordStats();
    const topWords = await getTopWords(10);

    res.json({
      stats,
      topWords
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// 📝 GET /api/admin/words - Obtener todas las palabras
app.get('/api/admin/words', async (req, res) => {
  try {
    const { category } = req.query;

    const where = category ? { category, is_active: true } : { is_active: true };

    const words = await prisma.word.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { word: 'asc' }
      ],
      select: {
        id: true,
        word: true,
        category: true,
        weight: true,
        is_active: true,
        createdAt: true
      }
    });

    res.json({ words });
  } catch (error) {
    console.error('❌ Error al obtener palabras:', error);
    res.status(500).json({ error: 'Error al obtener palabras' });
  }
});

// 🏷️ GET /api/admin/categories - Obtener todas las categorías
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.word.groupBy({
      by: ['category'],
      where: { is_active: true },
      _count: true,
      orderBy: {
        category: 'asc'
      }
    });

    const formatted = categories.map(cat => ({
      name: cat.category,
      count: cat._count
    }));

    res.json({ categories: formatted });
  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// ➕ POST /api/admin/words - Agregar nuevas palabras
app.post('/api/admin/words', async (req, res) => {
  try {
    const { words, category } = req.body;

    if (!words || !category) {
      return res.status(400).json({ error: 'Se requiere palabras y categoría' });
    }

    // Separar palabras por comas, limpiar espacios y capitalizar
    const wordList = words
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    if (wordList.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron palabras válidas' });
    }

    // Insertar palabras (evitar duplicados)
    const results = [];
    const errors = [];

    for (const word of wordList) {
      try {
        const created = await prisma.word.create({
          data: {
            word,
            category,
            weight: 100,
            is_active: true
          }
        });
        results.push(created);
      } catch (error) {
        if (error.code === 'P2002') {
          errors.push(`"${word}" ya existe`);
        } else {
          errors.push(`Error al crear "${word}"`);
        }
      }
    }

    res.json({
      success: true,
      created: results.length,
      words: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('❌ Error al agregar palabras:', error);
    res.status(500).json({ error: 'Error al agregar palabras' });
  }
});

// ✏️ PUT /api/admin/words/:id - Actualizar palabra
app.put('/api/admin/words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { word, category, weight, is_active } = req.body;

    const data = {};
    if (word !== undefined) data.word = word;
    if (category !== undefined) data.category = category;
    if (weight !== undefined) data.weight = weight;
    if (is_active !== undefined) data.is_active = is_active;

    const updated = await prisma.word.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ success: true, word: updated });
  } catch (error) {
    console.error('❌ Error al actualizar palabra:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Palabra no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al actualizar palabra' });
    }
  }
});

// 🗑️ DELETE /api/admin/words/:id - Eliminar palabra (soft delete)
app.delete('/api/admin/words/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await prisma.word.update({
      where: { id: parseInt(id) },
      data: { is_active: false }
    });

    res.json({ success: true, word: deleted });
  } catch (error) {
    console.error('❌ Error al eliminar palabra:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Palabra no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al eliminar palabra' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SpyWord escuchando en http://localhost:${PORT}`);
  console.log(`📝 Sistema de palabras: Base de datos con Prisma`);
});
