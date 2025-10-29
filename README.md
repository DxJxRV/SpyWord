# 🕵️‍♂️ SpyWord - Juego Multijugador

Juego de palabras con salas tipo Google Meet donde los jugadores reciben una palabra y deben descubrir quién es el impostor.

## 📁 Estructura del Proyecto

```
impostor-game/
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx    # Crear/Unirse a salas
│   │   │   └── Room.jsx    # Sala de juego
│   │   └── services/
│   │       └── api.js      # Cliente Axios
│   └── package.json
└── server/          # Backend Express
    ├── server.js    # API REST
    └── package.json
```

## 🚀 Instalación y Ejecución

### Backend (Puerto 3001)

```bash
cd server
npm install
npm start
```

### Frontend (Puerto 5173)

```bash
cd client
npm install

# Configurar URL base para QR (obligatorio)
cp .env.example .env
# Edita .env y cambia VITE_BASE_URL a tu IP local o dominio

npm run dev
```

**Importante:** Configura `VITE_BASE_URL` en `.env` con:
- **Desarrollo local**: Tu IP local (ej: `https://192.168.1.5:5173`)
- **Producción**: Tu dominio (ej: `https://spyword.app`)

Esto asegura que los QR codes generen URLs accesibles desde otros dispositivos.

## 📡 Endpoints del Backend

### ➕ POST `/api/rooms/create`
Crea una nueva sala de juego.

**Response:**
```json
{
  "roomId": "A7DLK4",
  "adminId": "uuid...",
  "word": "mesa",
  "round": 1
}
```

### 👥 POST `/api/rooms/:roomId/join`
Únete a una sala existente.

**Response:**
```json
{
  "playerId": "uuid...",
  "word": "mesa",  // "???" si es impostor
  "isImpostor": false,
  "round": 1
}
```

### 🔁 POST `/api/rooms/:roomId/restart`
Reinicia la partida (solo admin).

**Body:**
```json
{
  "adminId": "uuid..."
}
```

**Response:**
```json
{
  "word": "gato",
  "round": 2
}
```

### 📡 GET `/api/rooms/:roomId/state?playerId=xxx`
Obtiene el estado actual de la sala.

**Response:**
```json
{
  "round": 1,
  "word": "mesa",  // Se ajusta según si es impostor
  "totalPlayers": 4
}
```

### 💚 GET `/api/health`
Estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "rooms": 3,
  "timestamp": "2025-10-27T..."
}
```

## 🎮 Flujo del Juego

### 1. Crear Partida
- El admin presiona "Crear partida"
- Se genera un código de 6 caracteres (ej: `A7DLK4`)
- Se muestra un **QR con la URL completa** de la sala (se puede escanear con la cámara nativa del teléfono)
- El admin entra a la sala

### 2. Unirse a Partida
- Los jugadores pueden:
  - **Escanear el QR** con la cámara nativa de su teléfono (abre directamente la sala)
  - Ingresar el código manualmente (6 caracteres)
- Se les asigna una palabra (uno será impostor con "???")

### 3. Jugar
- Todos ven su palabra asignada
- El impostor ve "???"
- Los jugadores conversan para descubrir al impostor

### 4. Reiniciar
- Solo el admin puede presionar "Volver a jugar"
- Se asigna una nueva palabra
- Todos los jugadores detectan el cambio mediante polling (cada 3s)

## 🔧 Características Técnicas

### Backend
- **Express** sin WebSockets
- **Almacenamiento en memoria** (rooms object)
- **Limpieza automática** de salas inactivas (15 min)
- **CORS habilitado** para desarrollo
- **Type module** (ES6 imports)

### Frontend
- **React + Vite**
- **React Router** para navegación
- **Axios** para llamadas HTTP
- **Proxy de Vite** para `/api` → `http://localhost:3001` (evita problemas de CORS)
- **Polling** cada 3 segundos para sincronización
- **QR Code** con URL completa de la sala (se escanea con cámara nativa)
- **Sin scanner integrado** - más simple y compatible
- **Responsive** y optimizado para móviles

## 📝 Palabras del Juego

```javascript
["gato", "perro", "avión", "mesa", "fútbol", "plátano"]
```

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, CORS, UUID
- **Frontend**: React, Vite, Axios, React Router, QRCode.react, react-zxing
- **Estilos**: Tailwind CSS

## 📱 Compatible con

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Dispositivos móviles (iOS, Android)
- ✅ PWA (Progressive Web App)

## 🔄 Estado de la Aplicación

El backend mantiene el estado en memoria con esta estructura:

```javascript
rooms[roomId] = {
  adminId: "uuid...",
  word: "mesa",
  round: 1,
  players: [
    { playerId: "uuid...", isImpostor: false, joinedAt: timestamp },
    { playerId: "uuid...", isImpostor: true, joinedAt: timestamp }
  ],
  lastActivity: timestamp
}
```

## 🎯 Próximas Mejoras

- [ ] Persistencia con base de datos
- [ ] WebSockets para sincronización en tiempo real
- [ ] Sistema de votación integrado
- [ ] Más palabras y categorías
- [ ] Chat en la sala
- [ ] Estadísticas de partidas

---

**Creado con ❤️ para jugar con amigos**
