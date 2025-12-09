# Impostor Word Server

Backend para el juego Impostor Word.

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

## Endpoints

- `POST /api/rooms/create` - Crear nueva sala
- `POST /api/rooms/:roomId/join` - Unirse a sala
- `POST /api/rooms/:roomId/restart` - Reiniciar partida (solo admin)
- `GET /api/rooms/:roomId/state` - Obtener estado de la sala
- `GET /api/health` - Estado del servidor
