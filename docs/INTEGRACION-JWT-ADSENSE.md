# 🔐 Integración JWT y Google AdSense

Este documento explica cómo conectar la autenticación JWT y activar los anuncios de Google AdSense en producción.

---

## 📋 Tabla de Contenidos

1. [Implementación del Sistema JWT](#1-implementación-del-sistema-jwt)
2. [Activación de Google AdSense](#2-activación-de-google-adsense)
3. [Configuración del Premium Pass](#3-configuración-del-premium-pass)
4. [Testing](#4-testing)

---

## 1. Implementación del Sistema JWT

### 1.1 Instalar dependencias

```bash
cd server
npm install jsonwebtoken bcrypt
```

### 1.2 Configurar variables de entorno

Crear/actualizar el archivo `server/.env`:

```env
# JWT Configuration
JWT_SECRET=tu_secret_key_super_seguro_y_aleatorio_aqui
JWT_EXPIRATION=7d

# Premium Configuration
PREMIUM_SUBSCRIPTION_API=https://tu-api-de-pagos.com
```

### 1.3 Crear middleware de autenticación

Crear archivo `server/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
```

### 1.4 Actualizar el endpoint Long Polling

En `server/server.js`, modificar la función que calcula `isRoomPremium`:

**ANTES:**
```javascript
// TODO: Cuando JWT esté listo, verificar: await verifyUserPremium(room.adminId)
isRoomPremium: IS_PREMIUM_MODE_ACTIVE // Por ahora usa flag global, luego será JWT del adminId
```

**DESPUÉS:**
```javascript
// Verificar si el anfitrión (admin) tiene Premium Pass
isRoomPremium: IS_PREMIUM_MODE_ACTIVE || await verifyUserPremium(room.adminId)
```

### 1.5 Crear función de verificación Premium

Agregar en `server/server.js` (después de las importaciones):

```javascript
// Base de datos de usuarios premium (reemplazar con DB real)
const premiumUsers = new Map();

// Función para verificar si un usuario es premium
async function verifyUserPremium(userId) {
  if (!userId) return false;

  // TODO: Reemplazar con consulta a base de datos real
  const user = premiumUsers.get(userId);

  if (!user || !user.isPremium) return false;

  // Verificar que la suscripción no haya expirado
  if (user.premiumExpiration && new Date(user.premiumExpiration) < new Date()) {
    return false;
  }

  return true;
}

// Endpoint para actualizar estado premium de un usuario
app.post('/api/users/:userId/premium', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { isPremium, expirationDate } = req.body;

  // Verificar que el usuario solo pueda modificar su propio estado
  // O que sea un admin del sistema
  if (req.user.id !== userId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  premiumUsers.set(userId, {
    isPremium,
    premiumExpiration: expirationDate
  });

  res.json({ success: true });
});
```

### 1.6 Integrar verificación en Long Polling

Modificar la función `sendState` en el endpoint `GET /api/rooms/:roomId/state`:

```javascript
// Dentro de la función sendState
const payload = {
  // ... otros campos ...
  isPremium: IS_PREMIUM_MODE_ACTIVE,
  // Premium Pass del Anfitrión
  isRoomPremium: IS_PREMIUM_MODE_ACTIVE || await verifyUserPremium(room.adminId)
};
```

---

## 2. Activación de Google AdSense

### 2.1 Configurar cuenta de AdSense

1. Crear cuenta en [Google AdSense](https://www.google.com/adsense/)
2. Verificar el Publisher ID: `pub-8947474348361670` (ya configurado en `client/public/ads.txt`)
3. Agregar el dominio de producción
4. Esperar aprobación de Google (puede tomar 1-3 días)

### 2.2 Obtener código de AdSense

Una vez aprobado, obtener los códigos desde el panel de AdSense:

- **Script Principal** (agregar en `client/index.html`):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8947474348361670"
     crossorigin="anonymous"></script>
```

- **Slot IDs** para cada tipo de anuncio (ejemplo):
  - Banner Rectangle: `ca-pub-8947474348361670/1234567890`
  - Banner Horizontal: `ca-pub-8947474348361670/0987654321`
  - Interstitial: `ca-pub-8947474348361670/1122334455`

### 2.3 Actualizar AdPlaceholder.jsx

En `client/src/components/AdPlaceholder.jsx`, reemplazar el placeholder con código real:

**ANTES (placeholder):**
```jsx
<div className="ad-container my-4 flex items-center justify-center">
  <div
    ref={adRef}
    style={dimensions[format]}
    className="border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-800/50"
  >
    <div className="text-center">
      <p className="text-gray-400 text-sm font-medium">Espacio Publicitario</p>
      <p className="text-gray-500 text-xs mt-1">{format}</p>
    </div>
  </div>
</div>
```

**DESPUÉS (código real de AdSense):**
```jsx
useEffect(() => {
  if (isPremium) return;

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (err) {
    console.error('AdSense error:', err);
  }
}, [isPremium]);

if (isPremium) return null;

return (
  <div className="ad-container my-4 flex items-center justify-center">
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...dimensions[format] }}
      data-ad-client="ca-pub-8947474348361670"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  </div>
);
```

### 2.4 Actualizar InterstitialAd.jsx

En `client/src/components/InterstitialAd.jsx`, reemplazar el placeholder:

```jsx
// Dentro del return, reemplazar el div placeholder con:
<ins
  className="adsbygoogle"
  style={{ display: 'block' }}
  data-ad-client="ca-pub-8947474348361670"
  data-ad-slot="TU_SLOT_ID_INTERSTITIAL"
  data-ad-format="interstitial"
  data-full-width-responsive="true"
/>
```

### 2.5 Configurar Slot IDs

Actualizar los componentes que usan `<AdPlaceholder />` para pasar el slot correcto:

**MainMenu.jsx:**
```jsx
<AdPlaceholder
  isPremium={false}
  format="rectangle"
  slot="SLOT_ID_RECTANGLE"
/>
```

**Online.jsx:**
```jsx
<AdPlaceholder
  isPremium={isPremium}
  format="rectangle"
  slot="SLOT_ID_RECTANGLE"
/>
```

**Room.jsx:**
```jsx
<AdPlaceholder
  isPremium={isPremium}
  format="horizontal"
  slot="SLOT_ID_HORIZONTAL"
/>
```

**PassAndPlay.jsx:**
```jsx
<AdPlaceholder
  isPremium={isPremium}
  format="horizontal"
  slot="SLOT_ID_HORIZONTAL"
/>
```

**GameOverPanel.jsx:**
```jsx
<AdPlaceholder
  isPremium={isPremium}
  format="horizontal"
  slot="SLOT_ID_HORIZONTAL"
/>
```

---

## 3. Configuración del Premium Pass

### 3.1 Arquitectura del Premium Pass

El sistema tiene dos niveles de control de anuncios:

1. **`isPremium`** (Control Global)
   - Controla TODOS los anuncios (banners + interstitials)
   - Usado para testing o mantenimiento
   - Variable: `IS_PREMIUM_MODE_ACTIVE` en `server/server.js`

2. **`isRoomPremium`** (Premium Pass del Anfitrión)
   - Controla solo los **interstitials** de la sala
   - Si el admin/anfitrión es premium, TODOS los jugadores en su sala ven 0 interstitials
   - Los **banners** siguen mostrándose a los invitados (a menos que el invitado sea premium)
   - Se verifica con JWT del `room.adminId`

### 3.2 Flujo del Premium Pass

```
1. Usuario se autentica → recibe JWT con campo `isPremium`
2. Usuario crea sala → se guarda `room.adminId`
3. Servidor verifica: ¿El adminId es premium?
4. Envía `isRoomPremium: true/false` a TODOS los clientes
5. Frontend: InterstitialAd verifica `isRoomPremium`
   - Si true → no muestra interstitial (cierra inmediatamente)
   - Si false → muestra interstitial normal
6. Frontend: AdPlaceholder verifica `isPremium` (individual)
   - No usa `isRoomPremium`
   - Cada invitado ve banners a menos que sea premium por su cuenta
```

### 3.3 Testing del Premium Pass

**Activar Premium Pass globalmente (para testing):**

```javascript
// En server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = true; // Cambia a true para testing
```

Esto activará tanto `isPremium` como `isRoomPremium`, desactivando TODOS los anuncios.

**Testing selectivo (solo Premium Pass del anfitrión):**

```javascript
// En server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = false;

// Y modificar línea 728 temporalmente:
isRoomPremium: true // Forzar premium pass sin JWT
```

Esto desactivará solo los interstitials, los banners seguirán mostrándose.

---

## 4. Testing

### 4.1 Checklist de Testing Local

- [ ] `IS_PREMIUM_MODE_ACTIVE = false` → todos los anuncios se muestran
- [ ] `IS_PREMIUM_MODE_ACTIVE = true` → ningún anuncio se muestra
- [ ] Interstitials se muestran en:
  - [ ] Crear sala (Online.jsx)
  - [ ] Reiniciar partida (Room.jsx)
  - [ ] Nueva ronda (PassAndPlay.jsx)
- [ ] Banners se muestran en:
  - [ ] MainMenu
  - [ ] Online
  - [ ] Room (in-game)
  - [ ] GameOverPanel
  - [ ] PassAndPlay

### 4.2 Checklist de Testing JWT

- [ ] Crear usuario con JWT
- [ ] Verificar token en endpoints protegidos
- [ ] Actualizar estado premium de usuario
- [ ] Verificar que `isRoomPremium` funciona con JWT real
- [ ] Verificar expiración de suscripción premium

### 4.3 Checklist de Testing AdSense

- [ ] Código de AdSense carga correctamente
- [ ] Banners se renderizan en producción
- [ ] Interstitials se muestran correctamente
- [ ] No hay errores en consola de AdSense
- [ ] Verificar impresiones en panel de AdSense (puede tomar 24-48h)

---

## 📚 Referencias

- [Google AdSense - Guía de Implementación](https://support.google.com/adsense/answer/7584247)
- [JWT - Introduction](https://jwt.io/introduction)
- [Express JWT Middleware](https://github.com/auth0/express-jwt)

---

## ⚠️ Notas Importantes

1. **Testing en Desarrollo**: AdSense no muestra anuncios reales en localhost. Usar placeholders hasta deploy en producción.

2. **Políticas de AdSense**: Asegurarse de cumplir con las [políticas de Google AdSense](https://support.google.com/adsense/answer/48182) para evitar suspensión de cuenta.

3. **Frecuencia de Interstitials**: Google recomienda no mostrar interstitials más de 1 vez cada 60-90 segundos. El usuario puede cerrar el anuncio inmediatamente (cumple con políticas de AdSense).

4. **Premium Pass**: El Premium Pass del Anfitrión es un beneficio clave de monetización. Permite a los anfitriones premium ofrecer una mejor experiencia a sus invitados (sin interstitials), incentivando la compra de premium.

5. **Seguridad JWT**: Nunca exponer `JWT_SECRET` en el código. Usar variables de entorno y `.gitignore` para `.env`.

---

## 🔄 Roadmap de Integración

### Fase 1: Setup (Actual)
- ✅ Estructura de anuncios implementada
- ✅ Flags `isPremium` e `isRoomPremium` funcionando
- ✅ TODOs marcados en código

### Fase 2: JWT (Por hacer)
- [ ] Implementar autenticación JWT
- [ ] Crear endpoints de usuario/premium
- [ ] Integrar verificación en Long Polling

### Fase 3: AdSense (Por hacer)
- [ ] Activar cuenta de AdSense
- [ ] Obtener aprobación de Google
- [ ] Reemplazar placeholders con código real
- [ ] Configurar Slot IDs

### Fase 4: Monetización (Por hacer)
- [ ] Integrar pasarela de pagos
- [ ] Sistema de suscripciones premium
- [ ] Dashboard de administración premium

---

**Última actualización:** 2025-12-09
**Versión:** 1.0.0
