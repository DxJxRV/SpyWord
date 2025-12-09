# 📚 Documentación del Proyecto - Impostor Word

Documentación técnica completa del juego Impostor Word (SpyWord).

---

## 📑 Índice de Documentación

### 🎯 Sistema de Monetización y Anuncios

1. **[ARQUITECTURA-ANUNCIOS.md](./ARQUITECTURA-ANUNCIOS.md)**
   - Diagrama completo de la arquitectura
   - Explicación de `isPremium` vs `isRoomPremium`
   - Tipos de anuncios (Banners vs Interstitials)
   - Ubicaciones y estrategia de monetización
   - Testing checklist completo

2. **[INTEGRACION-JWT-ADSENSE.md](./INTEGRACION-JWT-ADSENSE.md)**
   - Guía paso a paso para implementar JWT
   - Activación de Google AdSense
   - Configuración del Premium Pass
   - Código de ejemplo y referencias

---

## 🚀 Quick Start

### Para desarrolladores nuevos

1. **Entender el sistema de anuncios**: Lee primero [ARQUITECTURA-ANUNCIOS.md](./ARQUITECTURA-ANUNCIOS.md)
2. **Implementar JWT y AdSense**: Sigue [INTEGRACION-JWT-ADSENSE.md](./INTEGRACION-JWT-ADSENSE.md)
3. **Testing**: Usa los checklists en ambos documentos

### Para QA/Testing

1. **Testing de anuncios**: Ve a [ARQUITECTURA-ANUNCIOS.md](./ARQUITECTURA-ANUNCIOS.md) → Testing Checklist
2. **Testing de JWT**: Ve a [INTEGRACION-JWT-ADSENSE.md](./INTEGRACION-JWT-ADSENSE.md) → Testing

---

## 📊 Resumen del Sistema

### Sistema de Anuncios

**Estado Actual**: ✅ Implementado con placeholders

- Arquitectura completa de banners e interstitials
- Control de anuncios en dos niveles (global y por sala)
- Premium Pass del Anfitrión implementado
- Listo para conectar Google AdSense

**Pendiente**:
- Reemplazar placeholders con código real de AdSense
- Obtener aprobación de Google
- Configurar Slot IDs

### Sistema de Autenticación

**Estado Actual**: ⏳ Por implementar

- Estructura preparada con TODOs en código
- Endpoints diseñados
- Flujo documentado

**Pendiente**:
- Implementar JWT
- Crear endpoints de usuario/premium
- Integrar verificación en Long Polling

---

## 🎯 Conceptos Clave

### isPremium vs isRoomPremium

| Característica | `isPremium` | `isRoomPremium` |
|----------------|-------------|-----------------|
| **Alcance** | Global | Por Sala |
| **Afecta Banners** | ✅ Sí | ❌ No |
| **Afecta Interstitials** | ❌ No* | ✅ Sí |
| **Uso** | Testing/Mantenimiento | Premium Pass |
| **Fuente** | `IS_PREMIUM_MODE_ACTIVE` | JWT del `adminId` |

*Nota: isPremium SÍ puede desactivar interstitials si está en true, pero InterstitialAd.jsx usa isRoomPremium como prop.

### Premium Pass del Anfitrión

**Concepto**: Si el anfitrión (admin) de una sala es Premium, TODOS los jugadores en esa sala disfrutan de una experiencia sin interstitials.

**Beneficios**:
- Mejora la experiencia de todo el grupo
- Incentivo fuerte para comprar premium
- Ideal para streamers y comunidades

**Limitación**:
- Los banners siguen mostrándose a los invitados
- Solo afecta a los interstitials de la sala

---

## 🔧 Configuración Rápida

### Testing Modo Free (Con todos los anuncios)

```javascript
// server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = false;
```

### Testing Modo Premium Global (Sin anuncios)

```javascript
// server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = true;
```

### Testing Premium Pass (Solo sin interstitials)

```javascript
// server/server.js, línea 13
const IS_PREMIUM_MODE_ACTIVE = false;

// Y línea 728
isRoomPremium: true // Forzar premium pass temporalmente
```

---

## 📁 Estructura del Proyecto

```
SpyWord/
├── client/                          # Frontend (React)
│   ├── public/
│   │   ├── ads.txt                 # ✅ Google AdSense verification
│   │   └── manifest.webmanifest    # ✅ PWA config
│   └── src/
│       ├── components/
│       │   ├── AdPlaceholder.jsx   # ✅ Banner component
│       │   ├── InterstitialAd.jsx  # ✅ Interstitial component
│       │   └── GameOverPanel.jsx   # ✅ Victory/defeat screen
│       └── pages/
│           ├── MainMenu.jsx        # ✅ Ads integrated
│           ├── Online.jsx          # ✅ Ads integrated
│           ├── Room.jsx            # ✅ Ads integrated
│           └── PassAndPlay.jsx     # ✅ Ads integrated
│
├── server/                          # Backend (Node.js + Express)
│   └── server.js                   # ✅ Long Polling with isPremium/isRoomPremium
│
└── docs/                            # 📚 Documentación
    ├── README.md                    # Este archivo
    ├── ARQUITECTURA-ANUNCIOS.md    # Diagrama y arquitectura completa
    └── INTEGRACION-JWT-ADSENSE.md  # Guía de implementación
```

---

## ✅ Estado de Implementación

### ✅ Completado

- [x] Sistema de banners (AdPlaceholder)
- [x] Sistema de interstitials (InterstitialAd)
- [x] Control global con `isPremium`
- [x] Premium Pass con `isRoomPremium`
- [x] Integración en todas las páginas
- [x] Long Polling con flags de anuncios
- [x] Documentación completa
- [x] ads.txt configurado con Publisher ID

### ⏳ Pendiente

- [ ] Implementación de JWT
- [ ] Endpoints de usuario/premium
- [ ] Activación de Google AdSense
- [ ] Reemplazo de placeholders con código real
- [ ] Sistema de pagos/suscripciones
- [ ] Dashboard de administración

---

## 🐛 Troubleshooting

### Los anuncios no se muestran

1. Verificar `IS_PREMIUM_MODE_ACTIVE = false`
2. Verificar que los componentes reciben props correctas
3. En producción: verificar aprobación de Google AdSense
4. Revisar consola de browser para errores de AdSense

### Interstitials no se cierran

1. Verificar que `isRoomPremium` se está seteando correctamente
2. Verificar que `onClose` callback funciona
3. Revisar `autoClose` y `autoCloseDelay` props

### JWT no funciona

1. Verificar `JWT_SECRET` en variables de entorno
2. Revisar formato del token (Bearer TOKEN)
3. Verificar expiración del token
4. Ver logs del servidor para errores de autenticación

---

## 📞 Contacto

Para preguntas o issues relacionados con la implementación:

1. **Sistema de Anuncios**: Ver [ARQUITECTURA-ANUNCIOS.md](./ARQUITECTURA-ANUNCIOS.md)
2. **Integración JWT/AdSense**: Ver [INTEGRACION-JWT-ADSENSE.md](./INTEGRACION-JWT-ADSENSE.md)
3. **Bugs**: Revisar código con los TODOs marcados

---

## 📝 Changelog

### v1.0.0 (2025-12-09)
- ✅ Sistema de anuncios implementado
- ✅ Premium Pass del Anfitrión implementado
- ✅ Documentación completa creada
- ✅ TODOs marcados para JWT y AdSense

---

## 🔗 Referencias Útiles

- [Google AdSense](https://www.google.com/adsense/)
- [JWT.io](https://jwt.io/)
- [React Documentation](https://react.dev/)
- [Express.js](https://expressjs.com/)

---

**Última actualización:** 2025-12-09
**Autor:** Equipo de Desarrollo Impostor Word
