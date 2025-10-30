import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
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
  "https://localhost:5173", // opcional, por si pruebas local
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origen (como Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("No autorizado por CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());

// Almacenamiento en memoria
const rooms = {};

// Lista de palabras
const WORDS = [
  "gato", "perro", "avión", "mesa", "fútbol", "plátano",
  "silla", "ordenador", "ventana", "puerta", "cielo", "mar",
  "montaña", "río", "bosque", "ciudad", "pueblo", "auto", "camión", "bicicleta",
  "tren", "barco", "submarino", "estrella", "luna", "sol", "planeta", "galaxia", "universo", "nube",
  "lluvia", "trueno", "relámpago", "nieve", "hielo", "fuego", "arena", "tierra", "piedra", "flor",
  "árbol", "fruta", "naranja", "manzana", "pera", "uva", "sandía", "melón", "cereza", "fresa",
  "carne", "pollo", "pescado", "queso", "pan", "leche", "agua", "vino", "cerveza", "café",
  "té", "azúcar", "sal", "aceite", "arroz", "pasta", "pizza", "hamburguesa", "taco", "sushi",
  "guitarra", "piano", "batería", "violín", "trompeta", "micrófono", "altavoz", "auriculares", "radio", "televisión",
  "cámara", "móvil", "tablet", "reloj", "teclado", "ratón", "pantalla", "robot", "dron", "cohete",
  "programa", "código", "juego", "nivel", "enemigo", "jugador", "arma", "escudo", "misión", "aventura",
  "amor", "odio", "felicidad", "tristeza", "miedo", "ira", "paz", "guerra", "amistad", "familia",
  "padre", "madre", "hermano", "hermana", "hijo", "hija", "abuelo", "abuela", "tío", "tía",
  "primo", "prima", "novio", "novia", "marido", "esposa", "bebé", "niño", "niña", "adulto",
  "anciano", "doctor", "ingeniero", "profesor", "alumno", "piloto", "mecánico", "panadero", "bombero", "policía",
  "actor", "cantante", "bailarín", "escritor", "pintor", "fotógrafo", "periodista", "chef", "programador", "diseñador",
  "Lionel Messi", "Cristiano Ronaldo", "Kylian Mbappé", "Neymar", "Luis Suárez", "Karim Benzema", "Erling Haaland", "Vinícius Jr", "Pedri", "Gavi",
  "Real Madrid", "Barcelona", "Manchester United", "Liverpool", "Chelsea", "Arsenal", "Bayern Múnich", "Borussia Dortmund", "PSG", "Inter de Milán",
  "Milan", "Juventus", "Atlético de Madrid", "Sevilla", "Benfica", "Porto", "Ajax", "Flamengo", "River Plate", "Boca Juniors",
  "Taylor Swift", "Bad Bunny", "Shakira", "Dua Lipa", "Rosalía", "Eminem", "Drake", "Billie Eilish", "The Weeknd", "Adele",
  "Iron Man", "Spider-Man", "Batman", "Superman", "Wonder Woman", "Flash", "Hulk", "Thor", "Loki", "Capitán América",
  "Harry Potter", "Hermione", "Ron Weasley", "Voldemort", "Dumbledore", "Frodo", "Gandalf", "Legolas", "Aragorn", "Gollum"
];


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

  // Calcular y asignar palabra, impostor y starter YA
  room.word = getRandomWord(room.lastWord);
  room.lastWord = room.word;
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

    const payload = {
      round: room.round,
      word,
      totalPlayers: activePlayers.length,
      nextRoundAt: room.nextRoundAt || null,
      isAdmin: playerId === room.adminId,
      starterName: starterName || null,
      unchanged
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor SpyWord escuchando en http://localhost:${PORT}`);
  console.log(`📝 Palabras disponibles: ${WORDS.join(', ')}`);
});
