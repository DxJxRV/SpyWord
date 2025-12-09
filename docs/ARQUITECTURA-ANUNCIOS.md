# 🎯 Arquitectura del Sistema de Anuncios

Documentación técnica del sistema de monetización con Google AdSense y Premium Pass.

---

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE CONTROL                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐      ┌──────────────────────┐      │
│  │ IS_PREMIUM_MODE_    │      │    JWT Verification   │      │
│  │ ACTIVE (Global)     │      │    (Per User)         │      │
│  │                     │      │                       │      │
│  │ • Testing/Debug     │      │ • room.adminId       │      │
│  │ • Maintenance       │      │ • Subscription check │      │
│  └──────────┬──────────┘      └──────────┬───────────┘      │
│             │                            │                   │
│             └────────────┬───────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│             ┌────────────────────────┐                       │
│             │   Long Polling         │                       │
│             │   Response Payload     │                       │
│             ├────────────────────────┤                       │
│             │ • isPremium            │─────► Banners         │
│             │ • isRoomPremium        │─────► Interstitials   │
│             └────────────────────────┘                       │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────┐  ┌──────────────────────┐   │
│  │   AdPlaceholder            │  │   InterstitialAd     │   │
│  │   (Banners)                │  │   (Fullscreen)       │   │
│  ├────────────────────────────┤  ├──────────────────────┤   │
│  │ Props:                     │  │ Props:               │   │
│  │ • isPremium ──────────────►│  │ • isRoomPremium ────►│   │
│  │ • format (rect/horiz/vert) │  │ • onClose            │   │
│  │ • slot (AdSense Slot ID)   │  │ • autoClose          │   │
│  │                            │  │ • autoCloseDelay     │   │
│  ├────────────────────────────┤  ├──────────────────────┤   │
│  │ Ubicaciones:               │  │ Ubicaciones:         │   │
│  │ • MainMenu                 │  │ • Crear Sala         │   │
│  │ • Online                   │  │ • Reiniciar Partida  │   │
│  │ • Room (in-game)           │  │ • Nueva Ronda        │   │
│  │ • GameOverPanel            │  │                      │   │
│  │ • PassAndPlay              │  │                      │   │
│  └────────────────────────────┘  └──────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Control de Anuncios: Dos Niveles

### Nivel 1: Control Global (`isPremium`)

**Propósito**: Desactivar TODOS los anuncios globalmente

**Uso**:
- Testing y debugging
- Modo mantenimiento
- Eventos especiales

**Afecta**:
- ✅ Banners (AdPlaceholder)
- ✅ Interstitials (InterstitialAd)

**Configuración**:
```javascript
// server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = true; // true = sin anuncios
```

**Backend**:
```javascript
payload = {
  isPremium: IS_PREMIUM_MODE_ACTIVE
};
```

**Frontend**:
```javascript
// AdPlaceholder.jsx
if (isPremium) return null;

// InterstitialAd.jsx (NO LO USA)
```

---

### Nivel 2: Premium Pass del Anfitrión (`isRoomPremium`)

**Propósito**: Beneficio premium para el anfitrión y sus invitados

**Uso**:
- Monetización principal
- Incentivo para comprar premium
- Mejor experiencia de juego

**Afecta**:
- ❌ Banners (NO afecta - siguen mostrándose)
- ✅ Interstitials (desactivados para TODOS en la sala)

**Configuración**:
```javascript
// server/server.js, línea 728
isRoomPremium: IS_PREMIUM_MODE_ACTIVE || await verifyUserPremium(room.adminId)
```

**Backend**:
```javascript
payload = {
  isRoomPremium: await verifyUserPremium(room.adminId)
};
```

**Frontend**:
```javascript
// InterstitialAd.jsx
if (isRoomPremium) {
  onClose?.();
  return null;
}

// AdPlaceholder.jsx (NO LO USA)
```

---

## 🔄 Flujo de Datos

### 1. Servidor → Cliente (Long Polling)

```javascript
// GET /api/rooms/:roomId/state

// Respuesta
{
  round: 1,
  word: "casa",
  totalPlayers: 4,
  isAdmin: true,
  // ... otros campos ...

  // Control de anuncios
  isPremium: false,        // Control global
  isRoomPremium: true      // Premium Pass del anfitrión
}
```

### 2. Cliente → Componentes

```jsx
// Room.jsx
const [isPremium, setIsPremium] = useState(false);
const [isRoomPremium, setIsRoomPremium] = useState(false);

// Desde Long Polling
setIsPremium(res.data.isPremium || false);
setIsRoomPremium(res.data.isRoomPremium || false);

// Pasar a componentes
<AdPlaceholder isPremium={isPremium} format="horizontal" />
<InterstitialAd isRoomPremium={isRoomPremium} onClose={handleClose} />
```

---

## 🎨 Tipos de Anuncios

### Banners (AdPlaceholder)

**Formatos**:
- `rectangle`: 300x250px (MainMenu, Online)
- `horizontal`: 728x90px (Room, PassAndPlay, GameOverPanel)
- `vertical`: 160x600px (no usado actualmente)

**Características**:
- Siempre visibles durante el juego
- Solo se ocultan con `isPremium = true`
- No se ven afectados por `isRoomPremium`

**Props**:
```jsx
<AdPlaceholder
  isPremium={false}
  format="horizontal"
  slot="ca-pub-8947474348361670/XXXXXXXX"
/>
```

### Interstitials (InterstitialAd)

**Formato**:
- Pantalla completa
- Overlay con blur
- Auto-close configurable

**Características**:
- Aparecen en transiciones (crear sala, reiniciar, nueva ronda)
- Usuario puede cerrar inmediatamente (cumple con políticas de AdSense)
- NO hay temporizador ni cierre automático
- Se desactivan con `isRoomPremium = true`

**Props**:
```jsx
<InterstitialAd
  isRoomPremium={false}
  onClose={handleClose}
/>
```

---

## 📍 Ubicaciones de Anuncios

### MainMenu.jsx
```
┌──────────────────────────┐
│  Impostor Word 🕵️‍♂️      │
│                          │
│ [Juego Online]           │  ← Cards más delgadas
│ [Modo Diario]            │     (py-4)
│ [Pasa y Juega]           │
│                          │
│ ┌──────────────────────┐ │
│ │   Banner 728x90      │ │  ← AdPlaceholder (horizontal)
│ └──────────────────────┘ │    isPremium
└──────────────────────────┘
```

### Online.jsx
```
┌────────────────────┐
│  Juego Online 🌐   │
│                    │
│ [Crear partida]    │  ← Click → InterstitialAd
│ [Unirse a partida] │           (isRoomPremium)
│                    │
│ ┌────────────────┐ │
│ │   Banner       │ │  ← AdPlaceholder (rectangle)
│ │   300x250      │ │    isPremium
│ └────────────────┘ │
└────────────────────┘
```

### Room.jsx (In-Game)
```
┌────────────────────────┐
│  Impostor Word         │
│                        │
│ Ronda 1 • 4 jugadores  │
│                        │
│ ┌──────────────────────┐  ← AdPlaceholder (horizontal)
│ │   Banner 728x90      │    isPremium - NUEVA POSICIÓN
│ └──────────────────────┘
│                        │
│ Jugador que Inicia     │
│ ┌────────────────────┐ │
│ │  Tu palabra:       │ │
│ │     CASA           │ │
│ └────────────────────┘ │
│                        │
│ [Volver a jugar]       │  ← Click → InterstitialAd
│ [Compartir] [QR]       │           (isRoomPremium)
└────────────────────────┘
```

### GameOverPanel (Victory/Defeat)
```
┌────────────────────┐
│  🏆 ¡Victoria!     │
│                    │
│  El impostor era:  │
│     Jugador 3      │
│                    │
│ ┌──────────────────────┐  ← AdPlaceholder (horizontal)
│ │   Banner 728x90      │    isPremium
│ └──────────────────────┘
│                    │
│ [Jugar de Nuevo]   │  ← Click → InterstitialAd
│                    │           (isRoomPremium)
└────────────────────┘
```

### PassAndPlay.jsx
```
┌────────────────────┐
│  🎮 Pasa y Juega   │
│                    │
│  Número de         │
│  jugadores: [4]    │
│                    │
│ [Iniciar Partida]  │  ← Click → InterstitialAd
│                    │           (isRoomPremium = false)
│ ┌──────────────────────┐
│ │   Banner 728x90      │  ← AdPlaceholder (horizontal)
│ └──────────────────────┘    isPremium
└────────────────────┘
```

---

## 🎯 Estrategia de Monetización

### Free Users (Sin Premium)

**Experiencia**:
- ✅ Banners visibles en todas las páginas
- ✅ Interstitials en transiciones (cada acción mayor)
- ❌ No pueden remover anuncios

**Frecuencia de Ads**:
- Banners: Siempre visibles
- Interstitials: Cada 1-3 minutos (depende de acciones)

### Premium Host (Anfitrión Premium)

**Beneficios**:
- ❌ Sin interstitials (para él y todos sus invitados)
- ⚠️ Banners siguen mostrándose a invitados
- ✅ Mejor experiencia para su grupo

**Incentivo**:
- Mejora la experiencia de TODOS en su sala
- Ideal para streamers, comunidades, clanes
- Valor agregado claro

### Premium Guest (Invitado Premium)

**Beneficios** (Futuro):
- ❌ Sin banners (solo para él)
- ❌ Sin interstitials (si el host es free, aún ve interstitials)

**Nota**: No implementado aún. Requiere verificación JWT individual.

---

## 🔧 Configuración Técnica

### Backend (server/server.js)

```javascript
// Línea 13: Control Global
const IS_PREMIUM_MODE_ACTIVE = false;

// Línea 728: Payload Long Polling
const payload = {
  // ... otros campos ...
  isPremium: IS_PREMIUM_MODE_ACTIVE,
  isRoomPremium: IS_PREMIUM_MODE_ACTIVE || await verifyUserPremium(room.adminId)
};
```

### Frontend (client/src/components/)

**AdPlaceholder.jsx**:
```javascript
export default function AdPlaceholder({
  isPremium = false,  // ← SOLO usa isPremium
  format = 'rectangle',
  slot = ''
}) {
  if (isPremium) return null;
  // Renderizar banner
}
```

**InterstitialAd.jsx**:
```javascript
export default function InterstitialAd({
  isRoomPremium = false,  // ← SOLO usa isRoomPremium
  onClose,
  autoClose = false,
  autoCloseDelay = 3000
}) {
  if (isRoomPremium) {
    onClose?.();
    return null;
  }
  // Renderizar interstitial
}
```

---

## ✅ Testing Checklist

### Modo Free (IS_PREMIUM_MODE_ACTIVE = false)

- [ ] Banners visibles en MainMenu
- [ ] Banners visibles en Online
- [ ] Banners visibles en Room (in-game)
- [ ] Banners visibles en GameOverPanel
- [ ] Banners visibles en PassAndPlay
- [ ] Interstitial al crear sala (Online)
- [ ] Interstitial al reiniciar partida (Room)
- [ ] Interstitial al iniciar ronda (PassAndPlay)

### Modo Global Premium (IS_PREMIUM_MODE_ACTIVE = true)

- [ ] NINGÚN banner visible
- [ ] NINGÚN interstitial se muestra
- [ ] Interstitials se cierran inmediatamente

### Modo Room Premium (isRoomPremium = true, isPremium = false)

- [ ] Banners SIGUEN mostrándose
- [ ] Interstitials NO se muestran
- [ ] Solo los interstitials de la sala se desactivan

---

## 📚 Archivos Relevantes

### Backend
- `server/server.js` (líneas 13, 728)
- `server/.env` (JWT_SECRET - futuro)

### Frontend - Componentes
- `client/src/components/AdPlaceholder.jsx`
- `client/src/components/InterstitialAd.jsx`
- `client/src/components/GameOverPanel.jsx`

### Frontend - Páginas
- `client/src/pages/MainMenu.jsx`
- `client/src/pages/Online.jsx`
- `client/src/pages/Room.jsx`
- `client/src/pages/PassAndPlay.jsx`

### Configuración
- `client/public/ads.txt`
- `client/public/manifest.webmanifest`

### Documentación
- `docs/INTEGRACION-JWT-ADSENSE.md`
- `docs/ARQUITECTURA-ANUNCIOS.md` (este archivo)

---

## 🚀 Próximos Pasos

1. **Implementar JWT** (Ver `INTEGRACION-JWT-ADSENSE.md`)
2. **Activar Google AdSense** (Ver `INTEGRACION-JWT-ADSENSE.md`)
3. **Testing en producción**
4. **Sistema de pagos/suscripciones**
5. **Dashboard de administración premium**

---

**Última actualización:** 2025-12-09
**Versión:** 1.0.0
