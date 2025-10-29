import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true
}));
app.use(cookieParser());

// Almacenamiento en memoria
const rooms = {};

// Lista de palabras
const WORDS = ["gato", "perro", "avión", "mesa", "fútbol", "plátano"];

// Función para generar roomId de 6 caracteres
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return roomId;
}

// Función para seleccionar palabra aleatoria (sin repetir la palabra anterior)
function getRandomWord(excludeWord = null) {
  let availableWords = WORDS;
  
  // Si hay una palabra a excluir y hay más palabras disponibles, excluirla
  if (excludeWord && WORDS.length > 1) {
    availableWords = WORDS.filter(w => w !== excludeWord);
  }
  
  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

// Función para limpiar jugadores inactivos (más de 10 segundos sin actividad)
function cleanInactivePlayers(room) {
  const now = Date.now();
  const INACTIVE_THRESHOLD = 10 * 1000; // 10 segundos
  
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
app.post('/api/rooms/create', (req, res) => {
  const { adminName } = req.body;
  const roomId = generateRoomId();
  const adminId = uuidv4();
  const word = getRandomWord();
  
  rooms[roomId] = {
    adminId,
    adminName: adminName || "Admin", // Guardar nombre del admin
    word,
    round: 1,
    players: {
      // El admin también es un jugador
      [adminId]: { lastSeen: Date.now(), name: adminName || "Admin" }
    },
    impostorId: null, // ID del impostor actual
    starterPlayerId: null, // ID del jugador que inicia la partida
    lastStarterPlayerId: null, // ID del último jugador que inició (para no repetir)
    lastWord: word, // Última palabra usada (para no repetir)
    lastActivity: Date.now(),
    nextRoundAt: null // Timestamp para countdown sincronizado
  };
  
  console.log(`✅ Sala creada: ${roomId} - Admin: ${adminId} (${adminName || "Admin"}) - Palabra: ${word}`);
  
  // Establecer cookie de sesión
  res.cookie('sid', adminId, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  });
  
  res.json({
    roomId,
    word,
    round: 1
  });
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
    name: playerName.trim()
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
app.post('/api/rooms/:roomId/restart', (req, res) => {
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
  
  console.log(`⏳ Countdown iniciado en ${roomId} - Nueva ronda en 5 segundos`);
  
  // Programar la actualización automática después de 7 segundos
  setTimeout(() => {
    if (rooms[roomId]) {
      // Cambiar palabra (sin repetir la anterior) y aumentar ronda
      room.word = getRandomWord(room.lastWord);
      room.lastWord = room.word; // Guardar la palabra actual para la próxima vez
      room.round++;
      room.nextRoundAt = null; // Limpiar el countdown
      
      // Limpiar jugadores inactivos antes de asignar impostor
      const activePlayers = cleanInactivePlayers(room);
      
      // Seleccionar el jugador que va a iniciar la partida (al azar, sin repetir el anterior)
      if (activePlayers.length > 0) {
        let availablePlayers = activePlayers;
        
        // Si hay más de 1 jugador y el último iniciador sigue activo, excluirlo
        if (activePlayers.length > 1 && room.starterPlayerId && activePlayers.includes(room.starterPlayerId)) {
          availablePlayers = activePlayers.filter(id => id !== room.starterPlayerId);
        }
        
        const starterIndex = Math.floor(Math.random() * availablePlayers.length);
        room.starterPlayerId = availablePlayers[starterIndex]; // Asignar el nuevo
        console.log(`🎬 Jugador que inicia: ${room.starterPlayerId} (${room.players[room.starterPlayerId].name})`);
      } else {
        room.starterPlayerId = null;
      }
      
      // Seleccionar impostor aleatorio solo de jugadores activos
      if (activePlayers.length > 0) {
        const randomIndex = Math.floor(Math.random() * activePlayers.length);
        room.impostorId = activePlayers[randomIndex];
        console.log(`🕵️ Impostor asignado en ${roomId}: ${room.impostorId} (de ${activePlayers.length} activos)`);
      } else {
        room.impostorId = null;
        console.log(`⚠️ No hay jugadores activos en ${roomId} para asignar impostor`);
      }
      
      console.log(`🔄 Partida reiniciada en ${roomId} - Ronda: ${room.round} - Nueva palabra: ${room.word}`);
    }
  }, 5000);
  
  res.json({
    nextRoundAt,
    message: 'Countdown iniciado'
  });
});

// 📡 GET /api/rooms/:roomId/state
app.get('/api/rooms/:roomId/state', (req, res) => {
  const { roomId } = req.params;
  const playerId = req.cookies.sid; // Obtener de la cookie
  
  if (!rooms[roomId]) {
    return res.status(404).json({ error: 'Sala no encontrada' });
  }
  
  const room = rooms[roomId];
  room.lastActivity = Date.now();
  
  // Actualizar timestamp del jugador si existe
  if (playerId) {
    // Si es el admin, mantener su nombre correcto
    if (playerId === room.adminId) {
      if (!room.players[playerId]) {
        room.players[playerId] = { lastSeen: Date.now(), name: room.adminName };
        console.log(`📝 Admin reingresó: ${playerId} (${room.adminName})`);
      } else {
        room.players[playerId].lastSeen = Date.now();
        room.players[playerId].name = room.adminName; // Asegurar que siempre tenga el nombre correcto
      }
    } else {
      // Para jugadores normales
      if (!room.players[playerId]) {
        room.players[playerId] = { lastSeen: Date.now(), name: "Anónimo" };
        console.log(`📝 Jugador registrado en ${roomId}: ${playerId}`);
      } else {
        room.players[playerId].lastSeen = Date.now();
      }
    }
  }
  
  // Limpiar jugadores inactivos
  const activePlayers = cleanInactivePlayers(room);
  
  // Si es la primera ronda y hay suficientes jugadores activos, asignar impostor
  if (room.round === 1 && !room.impostorId && activePlayers.length >= 2) {
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    room.impostorId = activePlayers[randomIndex];
    console.log(`🕵️ Primer impostor asignado en ${roomId}: ${room.impostorId}`);
  }
  
  // Verificar si el impostor sigue activo, si no, reasignar
  if (room.impostorId && !activePlayers.includes(room.impostorId) && activePlayers.length >= 2) {
    const randomIndex = Math.floor(Math.random() * activePlayers.length);
    room.impostorId = activePlayers[randomIndex];
    console.log(`🔄 Impostor reasignado (anterior inactivo) en ${roomId}: ${room.impostorId}`);
  }
  
  // Si se proporciona playerId, devolver la palabra según si es impostor
  let word = room.word;
  if (playerId) {
    // Verificar si este jugador es el impostor actual
    if (playerId === room.impostorId) {
      word = "???";
    }
  }
  
  // Verificar si el usuario es admin
  const isAdmin = playerId === room.adminId;
  
  // Obtener el nombre del jugador que inicia
  const starterName = room.starterPlayerId ? room.players[room.starterPlayerId]?.name : null;
  
  res.json({
    round: room.round,
    word,
    totalPlayers: activePlayers.length, // Número de jugadores activos
    activePlayers: activePlayers.length, // Alias más claro
    nextRoundAt: room.nextRoundAt,
    isAdmin,
    starterName: starterName || null
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor SpyWord escuchando en http://localhost:${PORT}`);
  console.log(`📝 Palabras disponibles: ${WORDS.join(', ')}`);
});
