// IMPORTAR LA CONFIGURACIÓN PRIMERO - Esto carga process.env antes que cualquier otra cosa
import './config.js';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import {
  getRandomWordWeighted,
  logWordFeedback,
  getTopWords,
  getWordStats,
} from './services/word.service.js';
import {
  getRandomItemWeighted,
  logItemFeedback,
  getModeById
} from './services/mode.service.js';
import { passport, checkAuth, setupAuthRoutes, requireAuth } from './auth.js';
import { setupPaymentRoutes } from './payment.js';
import { setupModesRoutes } from './modes.js';
import { setupRouletteRoutes } from './roulette.js';

// --- Control de Anuncios ---
const IS_PREMIUM_MODE_ACTIVE = false; // TRUE desactiva todos los anuncios globalmente
// ---------------------------

// --- Control de Modos Especiales ---
let SPECIAL_MODES_ENABLED = true; // TRUE muestra el botón de modos especiales en el home
// -----------------------------------

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - IMPORTANTE: El webhook de Stripe necesita el body raw
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next(); // No parsear el body para el webhook
  } else {
    express.json()(req, res, next);
  }
});

// Para el webhook, usar raw body
app.use('/webhook', express.raw({ type: 'application/json' }));

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

// Inicializar Passport para autenticación
app.use(passport.initialize());

// Configurar rutas de autenticación
setupAuthRoutes(app);

// Configurar rutas de pago con Stripe
setupPaymentRoutes(app, checkAuth, requireAuth);

// Configurar rutas de modos especiales
setupModesRoutes(app);

// Configurar rutas de ruleta
setupRouletteRoutes(app, checkAuth, requireAuth);

// Servir archivos estáticos de /uploads
app.use('/uploads', express.static('uploads'));

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
app.post('/api/rooms/create', checkAuth, async (req, res) => {
  try {
    const { adminName, modeId } = req.body; // modeId es opcional
    const roomId = generateRoomId();
    const adminId = uuidv4();

    // Obtener profilePicture si el usuario está autenticado
    let profilePicture = null;
    if (req.user && req.user.userId) {
      try {
        const userFromDB = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { profilePicture: true }
        });
        profilePicture = userFromDB?.profilePicture || null;
      } catch (error) {
        console.error('Error al obtener profilePicture del admin:', error);
      }
    }

    let roomData = {
      adminId,
      adminUserId: req.user ? req.user.userId : null,
      adminName: adminName || "Admin",
      round: 1,
      players: {
        [adminId]: { lastSeen: Date.now(), name: adminName || "Admin", isAlive: true, hasVoted: false, profilePicture: profilePicture }
      },
      impostorId: null,
      starterPlayerId: null,
      lastStarterPlayerId: null,
      lastActivity: Date.now(),
      nextRoundAt: null,
      status: 'IN_GAME',
      votes: {},
      votersRemaining: 0,
      eliminatedPlayerId: null
    };

    // Si hay modeId, usar modo especial con imágenes
    if (modeId) {
      const mode = await getModeById(modeId);

      if (!mode || !mode.isActive) {
        return res.status(400).json({ error: 'Modo no encontrado o inactivo' });
      }

      const itemData = await getRandomItemWeighted(modeId);

      roomData = {
        ...roomData,
        // Datos del modo especial
        modeId: mode.id,
        modeName: mode.name,
        modeType: mode.type,
        // Item actual (puede tener imagen)
        word: itemData.label, // El label es la "palabra secreta"
        itemImageUrl: itemData.imageUrl,
        itemIndex: itemData.index, // Para feedback posterior
        wordId: null, // No hay wordId en modos especiales
        category: mode.name, // La categoría es el nombre del modo
        lastWord: itemData.label
      };

      console.log(`✅ Sala creada con modo especial: ${roomId} - Modo: ${mode.name} - Item: ${itemData.label}`);
    } else {
      // Modo normal: usar palabra de la BD
      const wordData = await getRandomWordWeighted();

      roomData = {
        ...roomData,
        // Datos de palabra normal
        modeId: null,
        modeName: null,
        modeType: 'word',
        word: wordData.word,
        itemImageUrl: null,
        itemIndex: null,
        wordId: wordData.id,
        category: wordData.category,
        lastWord: wordData.word
      };

      console.log(`✅ Sala creada: ${roomId} - Admin: ${adminId} (${adminName || "Admin"}) - Palabra: ${wordData.word}`);
    }

    rooms[roomId] = roomData;

    if (req.user) {
      console.log(`👑 Admin autenticado: ${req.user.email} (userId: ${req.user.userId}) - Premium: ${req.user.isPremium}`);
    } else {
      console.log(`👤 Admin no autenticado - adminUserId: null`);
    }

    // Establecer cookie de sesión
    res.cookie('sid', adminId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    res.json({
      roomId,
      word: roomData.word,
      imageUrl: roomData.itemImageUrl || null,
      modeType: roomData.modeType,
      modeName: roomData.modeName || null,
      round: 1
    });
  } catch (error) {
    console.error('❌ Error al crear sala:', error);
    res.status(500).json({ error: 'Error al crear sala' });
  }
});

// 👥 POST /api/rooms/:roomId/join
app.post('/api/rooms/:roomId/join', checkAuth, async (req, res) => {
  const { roomId } = req.params;
  const { playerName } = req.body;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  if (!playerName || playerName.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre del jugador es requerido' });
  }

  const room = rooms[roomId];
  let playerId;

  // Obtener profilePicture si el usuario está autenticado
  let profilePicture = null;
  if (req.user && req.user.userId) {
    try {
      const userFromDB = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { profilePicture: true }
      });
      profilePicture = userFromDB?.profilePicture || null;
    } catch (error) {
      console.error('Error al obtener profilePicture:', error);
    }
  }

  // Verificar si el jugador ya tiene una sesión activa en esta sala
  const existingPlayerId = req.cookies.sid;
  if (existingPlayerId && room.players[existingPlayerId]) {
    // El jugador ya existe en esta sala, reutilizar el ID
    playerId = existingPlayerId;
    room.players[playerId].lastSeen = Date.now();
    room.players[playerId].profilePicture = profilePicture; // Actualizar foto si cambió
    console.log(`🔄 Jugador reconectado a ${roomId}: ${playerId} (${playerName})`);
  } else {
    // Crear nuevo jugador
    playerId = uuidv4();

    // Registrar jugador con nombre, timestamp y foto de perfil
    room.players[playerId] = {
      lastSeen: Date.now(),
      name: playerName.trim(),
      isAlive: true,
      hasVoted: false,
      profilePicture: profilePicture
    };

    const activePlayers = getActivePlayers(room);
    console.log(`👤 Jugador nuevo unido a ${roomId}: ${playerId} (Nombre: ${playerName}) (Total activos: ${activePlayers.length})`);

    // Solo notificar a clientes esperando si es un jugador nuevo
    notifyWaitingClients(roomId);
  }

  room.lastActivity = Date.now();

  // Establecer cookie de sesión
  res.cookie('sid', playerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

    console.log(`🔍 [RESTART] adminId from cookie: ${adminId}, room.adminId: ${room.adminId}`);

    if (room.adminId !== adminId) {
      console.log(`❌ [RESTART] Admin verification failed!`);
      return res.status(403).json({ error: 'Solo el admin puede reiniciar la partida' });
    }

    console.log(`✅ [RESTART] Admin verified successfully`);


    // Configurar countdown de 3 segundos
    const nextRoundAt = Date.now() + 3000; // 3 segundos en el futuro
    room.nextRoundAt = nextRoundAt;
    room.lastActivity = Date.now();

    // Obtener nueva palabra/item según el tipo de modo
    if (room.modeId) {
      // Modo especial: obtener item aleatorio
      const itemData = await getRandomItemWeighted(room.modeId);
      room.word = itemData.label;
      room.itemImageUrl = itemData.imageUrl;
      room.itemIndex = itemData.index;
      room.lastWord = itemData.label;
      // wordId se mantiene en null para modos especiales
    } else {
      // Modo normal: obtener palabra de la BD
      const wordData = await getRandomWordWeighted();
      room.word = wordData.word;
      room.wordId = wordData.id;
      room.category = wordData.category;
      room.lastWord = wordData.word;
    }

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
  // Resetear datos de victoria
  room.winner = null;
  room.winReason = null;
  // Resetear hasVoted y revivir a todos los jugadores
  for (const playerId in room.players) {
    room.players[playerId].hasVoted = false;
    room.players[playerId].isAlive = true; // Revivir a todos
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

      // Notificar a todos los clientes después de incrementar round
      notifyWaitingClients(roomId);
    }
  }, 5000);

  // Notificar inmediatamente sobre el countdown
  notifyWaitingClients(roomId);


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

// 🚫 POST /api/rooms/:roomId/kick - Eliminar un jugador de la sala
app.post('/api/rooms/:roomId/kick', (req, res) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  const adminId = req.cookies.sid;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];

  // Verificar que quien hace la petición es el admin
  if (room.adminId !== adminId) {
    return res.status(403).json({ error: 'Solo el admin puede eliminar jugadores' });
  }

  // Verificar que el jugador existe
  if (!room.players[playerId]) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  // No permitir que el admin se elimine a sí mismo
  if (playerId === adminId) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }

  // Eliminar el jugador
  const playerName = room.players[playerId].name;
  delete room.players[playerId];

  // Si el jugador eliminado era el impostor, seleccionar un nuevo impostor
  if (room.impostorId === playerId) {
    const activePlayers = getActivePlayers(room);
    if (activePlayers.length > 0) {
      const randomIndex = Math.floor(Math.random() * activePlayers.length);
      room.impostorId = activePlayers[randomIndex];
      console.log(`🎭 Nuevo impostor seleccionado: ${room.impostorId}`);
    }
  }

  // Si el jugador eliminado era el que iniciaba, seleccionar otro
  if (room.starterPlayerId === playerId) {
    const activePlayers = getActivePlayers(room);
    if (activePlayers.length > 0) {
      const randomIndex = Math.floor(Math.random() * activePlayers.length);
      room.starterPlayerId = activePlayers[randomIndex];
      console.log(`🎮 Nuevo jugador que inicia: ${room.starterPlayerId}`);
    }
  }

  room.lastActivity = Date.now();

  console.log(`🚫 Jugador eliminado de ${roomId}: ${playerId} (${playerName})`);

  // Notificar a todos los clientes
  notifyWaitingClients(roomId);

  res.json({ success: true, message: `${playerName} fue eliminado` });
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

    // 🏆 Verificar condiciones de victoria

    // Condición 1: Se eliminó al impostor → Jugadores ganan
    if (eliminatedId === room.impostorId) {
      room.status = 'GAME_OVER';
      room.winner = 'PLAYERS';
      room.winReason = 'impostor_eliminated';
      console.log(`🎉 ¡VICTORIA DE LOS JUGADORES! El impostor fue eliminado`);
    } else {
      // Condición 2: Verificar si solo quedan 2 jugadores vivos
      const remainingAlive = Object.keys(room.players).filter(
        id => room.players[id].isAlive !== false
      );

      if (remainingAlive.length <= 2 && remainingAlive.includes(room.impostorId)) {
        // El impostor sobrevivió y solo quedan 2 o menos jugadores
        room.status = 'GAME_OVER';
        room.winner = 'IMPOSTOR';
        room.winReason = 'impostor_survived';
        console.log(`🎉 ¡VICTORIA DEL IMPOSTOR! Solo quedan ${remainingAlive.length} jugadores`);
      } else {
        // El juego continúa
        room.status = 'RESULTS';
      }
    }
  } else {
    // No hay mayoría o hay empate
    room.eliminatedPlayerId = null;
    if (hasTie) {
      console.log(`🤝 Empate en la votación - Nadie eliminado`);
    } else {
      console.log(`📊 No se alcanzó mayoría (máximo: ${maxVotes}/${majorityNeeded}) - Nadie eliminado`);
    }
    room.status = 'RESULTS';
  }

  // Si el juego no terminó, incrementar ronda
  if (room.status !== 'GAME_OVER') {
    room.round++; // Incrementar ronda para forzar actualización en clientes
  }

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

  // Notificar a todos los clientes esperando
  notifyWaitingClients(roomId);

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
    // Notificar inmediatamente después de resolver
    notifyWaitingClients(roomId);
  } else {
    // Forzar actualización parcial
    room.lastActivity = Date.now();
    // Notificar para actualizar conteo de votos
    notifyWaitingClients(roomId);
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

  // Notificar a todos los clientes esperando
  notifyWaitingClients(roomId);

  res.json({
    success: true,
    status: 'IN_GAME'
  });
});

// 🏷️ POST /api/rooms/:roomId/update_name
// Actualizar el nombre de un jugador en una sala
app.post('/api/rooms/:roomId/update_name', (req, res) => {
  const { roomId } = req.params;
  const playerId = req.cookies.sid;
  const { newName } = req.body;

  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  if (!playerId || !rooms[roomId].players[playerId]) {
    return res.status(403).json({ error: 'No estás en esta sala' });
  }

  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'Nombre inválido' });
  }

  const room = rooms[roomId];
  const oldName = room.players[playerId].name;
  const trimmedName = newName.trim().substring(0, 25); // Máximo 25 caracteres

  // Actualizar el nombre
  room.players[playerId].name = trimmedName;
  room.lastActivity = Date.now();

  console.log(`✏️ Jugador ${playerId} cambió su nombre de "${oldName}" a "${trimmedName}" en ${roomId}`);

  // Notificar a todos los clientes esperando
  notifyWaitingClients(roomId);

  res.json({
    success: true,
    newName: trimmedName
  });
});

// 📡 GET /api/rooms/:roomId/state
// Al principio del archivo
const LONG_POLL_TIMEOUT = 30000; // 30 segundos

// Mantenemos una lista de "clientes esperando" por sala
const waitingClients = {}; // { roomId: [{ res, sendStateFn }, ...] }

// Función para notificar a todos los clientes esperando de una sala
function notifyWaitingClients(roomId) {
  if (!waitingClients[roomId] || waitingClients[roomId].length === 0) {
    return;
  }

  console.log(`📢 [NOTIFY] Marcando ${waitingClients[roomId].length} clientes para actualización inmediata en ${roomId}`);

  // Marcar todos los clientes para que respondan en la próxima iteración
  waitingClients[roomId].forEach(client => {
    client.shouldRespond = true;
  });
}

// 📡 GET /api/rooms/:roomId/state  (Long Polling)
app.get('/api/rooms/:roomId/state', checkAuth, async (req, res) => {
  const { roomId } = req.params;
  const playerId = req.cookies.sid; // ID del jugador
  const clientRound = Number(req.query.round || 0);
  const clientNextRound = Number(req.query.nextRoundAt || 0);
  const clientStatus = req.query.status || 'IN_GAME';
  const clientTotalPlayers = Number(req.query.totalPlayers || 0);

  if (!rooms[roomId]) {
    console.log(`❌ [STATE] Sala no encontrada: ${roomId}`);
    return res.status(404).json({ error: 'Sala no encontrada' });
  }

  const room = rooms[roomId];
  room.lastActivity = Date.now();

  // Verificar si el jugador fue eliminado de la sala
  if (playerId && !room.players[playerId]) {
    console.log(`🚫 [STATE] Jugador ${playerId} no está en sala ${roomId} - fue eliminado`);
    return res.json({ kicked: true });
  }

  // Actualizar lastSeen del jugador
  if (playerId && room.players[playerId]) {
    room.players[playerId].lastSeen = Date.now();
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
  const sendState = async (unchanged = false) => {
    const word = playerId === room.impostorId ? "???" : room.word;
    const starterName = room.starterPlayerId ? room.players[room.starterPlayerId]?.name : null;

    // Preparar datos de jugadores con estado de vida (solo jugadores activos)
    const playersData = {};
    for (const pId of activePlayers) {
      // Verificar que el jugador todavía existe (puede haber sido eliminado por inactividad)
      if (!room.players[pId]) continue;

      playersData[pId] = {
        name: room.players[pId].name,
        isAlive: room.players[pId].isAlive !== false, // Default true si no existe
        hasVoted: room.players[pId].hasVoted || false,
        profilePicture: room.players[pId].profilePicture || null
      };
    }

    // Contar votos para cada jugador
    const votesTally = {};
    for (const targetId in room.votes) {
      votesTally[targetId] = room.votes[targetId].length;
    }

    // Obtener nombre del modo si no existe pero hay modeId (para salas antiguas)
    let modeName = room.modeName;
    console.log(`🔍 [DEBUG modeName] Room ${roomId} - modeName inicial:`, modeName, '| modeId:', room.modeId);
    if (!modeName && room.modeId) {
      try {
        const mode = await getModeById(room.modeId);
        if (mode) {
          modeName = mode.name;
          room.modeName = mode.name; // Actualizar el room para futuras peticiones
          console.log(`✅ [DEBUG modeName] Mode name obtenido de DB:`, modeName);
        }
      } catch (err) {
        console.error('Error al obtener nombre del modo:', err);
      }
    }
    console.log(`📤 [DEBUG modeName] Enviando modeName en payload:`, modeName);

    const payload = {
      round: room.round,
      word,
      itemImageUrl: room.itemImageUrl || null, // URL de imagen para modos especiales
      modeType: room.modeType || null, // Tipo de modo: 'word', 'image', 'hybrid'
      modeName: modeName || null, // Nombre del modo especial
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
      myId: playerId, // ID del cliente actual
      // Datos de victoria
      winner: room.winner || null,
      winReason: room.winReason || null,
      impostorId: room.status === 'GAME_OVER' ? room.impostorId : null, // Solo revelar al impostor cuando termina el juego
      // Control de anuncios
      // Si el usuario está autenticado y es premium, se desactivan los anuncios para él
      isPremium: req.user && req.user.isPremium ? true : IS_PREMIUM_MODE_ACTIVE,
      // Premium Pass del Anfitrión: se verifica si el admin es premium consultando la DB
      isRoomPremium: false // Se actualiza a continuación si el admin es premium
    };

    // Verificar si el admin de la sala es premium (Premium Pass)
    if (room.adminUserId) {
      try {
        const adminUser = await prisma.user.findUnique({
          where: { id: room.adminUserId },
          select: { isPremium: true }
        });
        if (adminUser && adminUser.isPremium) {
          payload.isRoomPremium = true;
          console.log(`👑 [PREMIUM PASS] Admin de sala ${roomId} es premium - Anuncios desactivados para todos`);
        }
      } catch (error) {
        console.error('Error al verificar premium del admin:', error);
      }
    }

    // Log para debugging de estado premium
    if (req.user) {
      console.log(`🎮 [ROOM STATE] Usuario: ${req.user.email} | Premium: ${req.user.isPremium} | Sala: ${roomId} | RoomPremium: ${payload.isRoomPremium}`);
    }

    res.json(payload);
  };

  // --- Normalizar valores para comparación ---
  const serverRound = Number(room.round || 0);
  const serverNextRound = Number(room.nextRoundAt || 0);
  const serverStatus = room.status || 'IN_GAME';
  const serverTotalPlayers = Number(activePlayers.length || 0);

  // Si el cliente no tiene datos (round = 0, nextRoundAt = 0), envía estado completo inmediatamente
  console.log("Client Round: ", clientRound)
  console.log("client Next Round: ", clientNextRound)
  console.log("Client Status: ", clientStatus)
  console.log("Client Total Players: ", clientTotalPlayers)
  if (clientRound === 0 && clientNextRound === 0) {
    console.log(`🚀 [INIT] Enviando estado inicial de la sala ${roomId}`);
    return await sendState(false);
  }


  // --- Si algo cambió desde lo que el cliente tiene, responder de inmediato ---
  if (serverRound !== clientRound || serverNextRound !== clientNextRound || serverStatus !== clientStatus || serverTotalPlayers !== clientTotalPlayers) {
    console.log(`⚡ [UPDATE] Cambio detectado en ${roomId} → round=${serverRound}, nextRoundAt=${serverNextRound}, status=${serverStatus}, totalPlayers=${serverTotalPlayers}`);
    return await sendState(false);
  }

  // --- Si todo sigue igual, "colgar" la conexión hasta que haya cambio o timeout ---
  console.log(`🕓 [WAIT] Cliente esperando cambios en room ${roomId} (round=${serverRound})`);

  // Inicializar array de clientes esperando si no existe
  if (!waitingClients[roomId]) {
    waitingClients[roomId] = [];
  }

  const startTime = Date.now();
  const timeout = 30000; // 30 segundos
  let hasResponded = false;

  // Crear objeto de cliente para la lista de espera
  const clientData = { shouldRespond: false };

  // Función para enviar respuesta y limpiar
  const respondAndCleanup = async (unchanged = false) => {
    if (hasResponded) return;
    hasResponded = true;

    // Remover este cliente de la lista de espera
    waitingClients[roomId] = waitingClients[roomId].filter(client => client !== clientData);

    clearInterval(interval);
    await sendState(unchanged);
  };

  // Agregar este cliente a la lista de espera
  waitingClients[roomId].push(clientData);

  // Espera activa: revisa cada 100 ms si algo cambió
  const interval = setInterval(() => {
    const now = Date.now();
    const currentActivePlayers = cleanInactivePlayers(room);
    const roundChanged = Number(room.round || 0) !== serverRound;
    const nextChanged = Number(room.nextRoundAt || 0) !== serverNextRound;
    const statusChanged = (room.status || 'IN_GAME') !== serverStatus;
    const playersChanged = Number(currentActivePlayers.length || 0) !== serverTotalPlayers;

    // Responder si fue marcado explícitamente para responder
    if (clientData.shouldRespond) {
      console.log(`📢 [NOTIFIED] Cliente notificado, respondiendo en ${roomId}`);
      respondAndCleanup(false);
    }
    // O si detectó un cambio
    else if (roundChanged || nextChanged || statusChanged || playersChanged) {
      console.log(`✅ [CHANGE] Cambio detectado mientras esperaba en ${roomId}`);
      respondAndCleanup(false);
    }
    // O si se acabó el tiempo
    else if (now - startTime >= timeout) {
      console.log(`⌛ [TIMEOUT] Sin cambios en ${roomId}, respondiendo unchanged`);
      respondAndCleanup(true);
    }
  }, 100); // Reducido a 100ms para respuesta más rápida

  // Manejar desconexión del cliente
  req.on('close', () => {
    if (!hasResponded) {
      console.log(`🔌 [DISCONNECT] Cliente desconectado de ${roomId}`);
      waitingClients[roomId] = waitingClients[roomId].filter(client => client !== clientData);
      clearInterval(interval);
    }
  });
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

// ============================================
// 👥 ENDPOINTS DE ADMINISTRACIÓN DE USUARIOS
// ============================================

// 📋 GET /api/admin/users - Obtener todos los usuarios
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        googleId: true,
        isPremium: true,
        premiumExpiresAt: true,
        isAdmin: true,
        dailyRouletteTokens: true,
        premiumRouletteTokens: true,
        lastDailyTokenReset: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Calcular stats
    const totalUsers = users.length;
    const premiumUsers = users.filter(u => u.isPremium).length;
    const googleUsers = users.filter(u => u.googleId).length;
    const emailUsers = users.filter(u => !u.googleId).length;

    res.json({
      users,
      stats: {
        totalUsers,
        premiumUsers,
        googleUsers,
        emailUsers
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// ⚡ PUT /api/admin/users/:id/premium - Actualizar estado premium
app.put('/api/admin/users/:id/premium', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPremium, daysToAdd } = req.body;

    let updateData = {};

    if (typeof isPremium === 'boolean') {
      updateData.isPremium = isPremium;

      // Si se activa premium y se especifican días
      if (isPremium && daysToAdd) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        updateData.premiumExpiresAt = expiresAt;
      }

      // Si se desactiva premium, limpiar fecha de expiración
      if (!isPremium) {
        updateData.premiumExpiresAt = null;
      }
    }

    // Si solo se especifican días (extender suscripción existente)
    if (daysToAdd && typeof isPremium === 'undefined') {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { premiumExpiresAt: true }
      });

      const baseDate = user.premiumExpiresAt && user.premiumExpiresAt > new Date()
        ? user.premiumExpiresAt
        : new Date();

      const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      updateData.premiumExpiresAt = newExpiresAt;
      updateData.isPremium = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        premiumExpiresAt: true
      }
    });

    console.log(`✅ Usuario premium actualizado: ${updatedUser.email} (Premium: ${updatedUser.isPremium})`);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error al actualizar premium:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al actualizar premium' });
    }
  }
});

// 🛡️ PUT /api/admin/users/:id/admin - Actualizar permisos de admin
app.put('/api/admin/users/:id/admin', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin debe ser un booleano' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        premiumExpiresAt: true,
        isAdmin: true
      }
    });

    console.log(`✅ Permisos de admin actualizados: ${updatedUser.email} (Admin: ${updatedUser.isAdmin})`);

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error al actualizar permisos de admin:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al actualizar permisos de admin' });
    }
  }
});

// ✏️ PUT /api/admin/users/:id - Actualizar información del usuario
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        premiumExpiresAt: true
      }
    });

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ error: 'El email ya está en uso' });
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }
});

// 🗑️ DELETE /api/admin/users/:id - Eliminar usuario
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
});

// 🎰 GET /api/admin/users/:id/tokens - Obtener tokens de ruleta de un usuario
app.get('/api/admin/users/:id/tokens', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        dailyRouletteTokens: true,
        premiumRouletteTokens: true,
        lastDailyTokenReset: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      tokens: {
        daily: user.dailyRouletteTokens,
        premium: user.premiumRouletteTokens,
        lastDailyReset: user.lastDailyTokenReset
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener tokens del usuario:', error);
    res.status(500).json({ error: 'Error al obtener tokens del usuario' });
  }
});

// 🎰 PUT /api/admin/users/:id/tokens - Actualizar tokens de ruleta de un usuario
app.put('/api/admin/users/:id/tokens', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount } = req.body; // type: 'daily' | 'premium', amount: número a sumar (puede ser negativo)

    if (!type || !['daily', 'premium'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de token inválido. Use "daily" o "premium"' });
    }

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'La cantidad debe ser un número' });
    }

    // Obtener usuario actual
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calcular nuevos valores
    const field = type === 'daily' ? 'dailyRouletteTokens' : 'premiumRouletteTokens';
    const currentValue = user[field];
    const newValue = Math.max(0, currentValue + amount); // No permitir valores negativos

    // Actualizar tokens
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        [field]: newValue
      },
      select: {
        id: true,
        email: true,
        name: true,
        dailyRouletteTokens: true,
        premiumRouletteTokens: true
      }
    });

    res.json({
      success: true,
      message: `Tokens ${type} actualizados correctamente`,
      tokens: {
        daily: updatedUser.dailyRouletteTokens,
        premium: updatedUser.premiumRouletteTokens
      },
      change: {
        type,
        previous: currentValue,
        amount,
        new: newValue
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar tokens del usuario:', error);
    res.status(500).json({ error: 'Error al actualizar tokens del usuario' });
  }
});

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

// 🎮 GET /api/modes/daily - Obtener el modo del día
app.get('/api/modes/daily', async (req, res) => {
  try {
    // Buscar el modo marcado como diario
    let dailyMode = await prisma.gameMode.findFirst({
      where: {
        isDailyMode: true,
        isActive: true
      }
    });

    // Si no hay modo diario, devolver un modo por defecto
    if (!dailyMode) {
      const defaultWords = [
        'Perro', 'Gato', 'Elefante', 'León', 'Pizza', 'Hamburguesa',
        'Teléfono', 'Computadora', 'Playa', 'Montaña', 'Doctor', 'Maestro',
        'Fútbol', 'Basketball', 'Internet', 'Robot', 'Sol', 'Luna',
        'Auto', 'Avión', 'Camisa', 'Zapatos'
      ];
      dailyMode = {
        id: 0,
        name: 'Modo Clásico',
        description: 'Juega con las palabras clásicas de Impostor Word',
        wordList: JSON.stringify(defaultWords),
        isActive: true
      };
    }

    res.json({
      id: dailyMode.id,
      name: dailyMode.name,
      description: dailyMode.description,
      words: JSON.parse(dailyMode.wordList || '[]')
    });
  } catch (error) {
    console.error('❌ Error al obtener modo diario:', error);
    res.status(500).json({ error: 'Error al obtener modo diario' });
  }
});

// ============================================================================
// LEGACY ENDPOINTS - COMENTADOS (reemplazados por modes.js)
// ============================================================================
// Estos endpoints usan el sistema antiguo con wordList en lugar de items
// Los nuevos endpoints están en modes.js y se cargan mediante setupModesRoutes()
// ============================================================================

/*
// 📋 GET /api/admin/modes - Obtener todos los modos (Admin)
app.get('/api/admin/modes', async (req, res) => {
  try {
    const modes = await prisma.gameMode.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const formatted = modes.map(mode => ({
      ...mode,
      words: JSON.parse(mode.wordList || '[]')
    }));

    res.json({ modes: formatted });
  } catch (error) {
    console.error('❌ Error al obtener modos:', error);
    res.status(500).json({ error: 'Error al obtener modos' });
  }
});

// ➕ POST /api/admin/modes - Crear modo de juego (Admin)
app.post('/api/admin/modes', async (req, res) => {
  try {
    const { name, description, words } = req.body;

    if (!name || !words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'Se requiere nombre y lista de palabras' });
    }

    const mode = await prisma.gameMode.create({
      data: {
        name,
        description: description || null,
        wordList: JSON.stringify(words),
        isActive: true,
        isDailyMode: false
      }
    });

    res.json({
      success: true,
      mode: {
        ...mode,
        words: JSON.parse(mode.wordList)
      }
    });
  } catch (error) {
    console.error('❌ Error al crear modo:', error);
    res.status(500).json({ error: 'Error al crear modo' });
  }
});

// ✏️ PUT /api/admin/modes/:id - Actualizar modo de juego (Admin)
app.put('/api/admin/modes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, words, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (words !== undefined) updateData.wordList = JSON.stringify(words);
    if (isActive !== undefined) updateData.isActive = isActive;

    const mode = await prisma.gameMode.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      mode: {
        ...mode,
        words: JSON.parse(mode.wordList)
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar modo:', error);
    res.status(500).json({ error: 'Error al actualizar modo' });
  }
});

// 🌟 PUT /api/admin/modes/:id/set-daily - Establecer modo como diario (Admin)
app.put('/api/admin/modes/:id/set-daily', async (req, res) => {
  try {
    const { id } = req.params;

    // Primero, quitar el flag de todos los modos
    await prisma.gameMode.updateMany({
      where: { isDailyMode: true },
      data: { isDailyMode: false }
    });

    // Luego, establecer el modo seleccionado como diario
    const mode = await prisma.gameMode.update({
      where: { id: parseInt(id) },
      data: { isDailyMode: true }
    });

    res.json({
      success: true,
      message: `${mode.name} establecido como modo del día`,
      mode: {
        ...mode,
        words: JSON.parse(mode.wordList)
      }
    });
  } catch (error) {
    console.error('❌ Error al establecer modo diario:', error);
    res.status(500).json({ error: 'Error al establecer modo diario' });
  }
});

// 🗑️ DELETE /api/admin/modes/:id - Eliminar modo de juego (Admin)
app.delete('/api/admin/modes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.gameMode.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Modo eliminado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar modo:', error);
    res.status(500).json({ error: 'Error al eliminar modo' });
  }
});
*/

// ============================================================================
// FIN DE LEGACY ENDPOINTS
// ============================================================================

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

// 🎮 GET /api/settings/special-modes - Endpoint público para consultar si los modos especiales están habilitados
app.get('/api/settings/special-modes', (_req, res) => {
  res.json({ enabled: SPECIAL_MODES_ENABLED });
});

// 🔒 GET /api/admin/settings/special-modes - Obtener estado de modos especiales (admin)
app.get('/api/admin/settings/special-modes', async (_req, res) => {
  try {
    res.json({ enabled: SPECIAL_MODES_ENABLED });
  } catch (error) {
    console.error('❌ Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// 🔒 PUT /api/admin/settings/special-modes - Cambiar estado de modos especiales (admin)
app.put('/api/admin/settings/special-modes', async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'El campo "enabled" debe ser un booleano' });
    }

    SPECIAL_MODES_ENABLED = enabled;
    console.log(`⚙️ [ADMIN] Modos especiales ${enabled ? 'activados' : 'desactivados'}`);

    res.json({ success: true, enabled: SPECIAL_MODES_ENABLED });
  } catch (error) {
    console.error('❌ Error al cambiar configuración:', error);
    res.status(500).json({ error: 'Error al cambiar configuración' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Impostor Word escuchando en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Accesible desde la red local`);
  console.log(`📝 Sistema de palabras: Base de datos con Prisma`);
});
