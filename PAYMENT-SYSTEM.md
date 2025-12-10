# Sistema de Pagos con Stripe - ImpostorWord

## Arquitectura del Sistema

El sistema de pagos está implementado usando **Stripe Checkout** para pagos one-time y suscripciones, con webhooks para actualizar el estado premium del usuario en la base de datos.

## Flujo de Pago

```
┌─────────────────┐
│  Usuario Click  │
│ "Obtener Plan"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/create-checkout   │
│ - Verifica autenticación    │
│ - Crea sesión de Stripe     │
│ - Vincula userId            │
└────────┬────────────────────┘
         │
         │ {url: "https://checkout.stripe.com/..."}
         ▼
┌─────────────────────────────┐
│  Redirige a Stripe Checkout │
│  - Usuario ingresa tarjeta  │
│  - Stripe procesa pago      │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
Éxito       Cancelado
    │         │
    │         └──────────────────┐
    ▼                            ▼
┌─────────────────────────┐  ┌──────────────────┐
│ Stripe envía webhook    │  │ Redirige a       │
│ POST /webhook           │  │ /premium?cancel  │
│ - Evento: checkout.     │  └──────────────────┘
│   session.completed     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Actualiza Base de Datos     │
│ - isPremium = true          │
│ - premiumExpiresAt = fecha  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Redirige a /premium/success │
│ - Muestra beneficios        │
│ - Countdown auto-redirect   │
└─────────────────────────────┘
```

## Estructura de Archivos

### Backend

```
server/
├── payment.js              # Módulo de pagos con Stripe
│   ├── setupPaymentRoutes()
│   ├── POST /api/create-checkout-session
│   └── POST /webhook
├── server.js               # Servidor principal
├── auth.js                 # Autenticación (JWT + Google OAuth)
└── .env                    # Variables de entorno (Stripe keys)
```

### Frontend

```
client/src/
├── pages/
│   ├── Premium.jsx         # Página de planes de pago
│   └── PremiumSuccess.jsx  # Página de confirmación
├── components/
│   └── AppHeader.jsx       # Botón "Hazte Premium"
└── App.jsx                 # Router (rutas /premium y /premium/success)
```

## Endpoints del Backend

### 1. POST `/api/create-checkout-session`

**Requiere**: Autenticación (JWT)

**Body**:
```json
{
  "planType": "weekly" | "lifetime"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Lógica**:
1. Verifica que el usuario esté autenticado (`req.user.userId`)
2. Obtiene el producto de Stripe según el `planType`
3. Busca el precio activo asociado al producto
4. Crea una sesión de Stripe Checkout con:
   - `client_reference_id`: userId (para vincular el pago al usuario)
   - `metadata.planType`: tipo de plan
   - `success_url`: `/premium/success?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url`: `/premium?canceled=true`
5. Devuelve la URL de checkout

### 2. POST `/webhook`

**NO requiere autenticación** (usa firma de Stripe)

**Headers**:
- `stripe-signature`: Firma del webhook

**Body**: Raw JSON del evento de Stripe

**Eventos manejados**:
- `checkout.session.completed`: Se ejecuta cuando un pago es exitoso

**Lógica**:
1. Verifica la firma del webhook con `STRIPE_WEBHOOK_SECRET`
2. Si el evento es `checkout.session.completed`:
   - Extrae `client_reference_id` (userId)
   - Extrae `metadata.planType` (weekly o lifetime)
   - Calcula fecha de expiración:
     - `weekly`: +7 días
     - `lifetime`: +100 años
   - Actualiza usuario en Prisma:
     - `isPremium = true`
     - `premiumExpiresAt = fecha calculada`
3. Responde `200 OK` a Stripe

## Componentes del Frontend

### 1. Premium.jsx

**Ubicación**: `/premium`

**Estado**:
```javascript
const [loading, setLoading] = useState(null); // 'weekly' | 'lifetime'
```

**Funcionalidad**:
- Muestra dos tarjetas de planes:
  - Plan Semanal: $1 USD
  - Plan Lifetime: $9.99 USD (badge "MEJOR VALOR")
- Lista de beneficios premium
- Al hacer clic en "Obtener Plan":
  1. Llama a `POST /api/create-checkout-session`
  2. Redirige a `response.data.url` (Stripe Checkout)
- Muestra mensaje de cancelación si `?canceled=true`

### 2. PremiumSuccess.jsx

**Ubicación**: `/premium/success?session_id=cs_test_...`

**Funcionalidad**:
- Animación de éxito con checkmark
- Muestra beneficios activados
- Countdown de 5 segundos para auto-redirect a `/`
- Botón manual para "Comenzar a Jugar"

### 3. AppHeader.jsx (Actualizado)

**Cambio realizado**:
```javascript
// Antes:
onClick={() => {
  alert("Próximamente: Página de suscripción Premium");
  setShowProfileMenu(false);
}}

// Ahora:
onClick={() => {
  navigate("/premium");
  setShowProfileMenu(false);
}}
```

## Base de Datos (Prisma Schema)

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  isPremium       Boolean   @default(false)
  premiumExpiresAt DateTime? // Nueva: fecha de expiración
  // ... otros campos
}
```

## Variables de Entorno

```env
# Stripe Keys
STRIPE_PUBLIC_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."  # Se obtiene con Stripe CLI

# Product IDs
PRODUCT_ID_WEEKLY="prod_TZicCsNNTdoiDo"
PRODUCT_ID_LIFETIME="prod_TZidRZMiyTx0Bk"

# Frontend URL (para redirects)
FRONTEND_URL="http://localhost:5173"
```

## Seguridad

### ✅ Implementado

1. **Autenticación en checkout**: El endpoint `create-checkout-session` requiere JWT válido
2. **Vinculación de usuario**: Se usa `client_reference_id` para vincular el pago al usuario
3. **Verificación de webhook**: Se verifica la firma de Stripe con `STRIPE_WEBHOOK_SECRET`
4. **Body raw para webhook**: Express usa `raw()` parser para verificar la firma correctamente
5. **CORS configurado**: Solo dominios permitidos pueden llamar a la API

### 🔒 Mejoras Adicionales (Opcional)

1. **Rate limiting**: Limitar requests a endpoints de pago
2. **Logging de pagos**: Guardar historial de pagos en tabla `Payment`
3. **Webhooks duplicados**: Idempotency con `event.id` de Stripe
4. **Premium expiration check**: Cron job para desactivar premium expirado

## Testing

### Setup de Testing Local

1. **Instalar Stripe CLI**:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Iniciar webhook forwarding**:
   ```bash
   stripe listen --forward-to localhost:3003/webhook
   ```

3. **Copiar webhook secret** al `.env`

4. **Usar tarjeta de prueba**:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier futura
   - CVC: Cualquier 3 dígitos

### Verificación de Testing

1. ✅ Sesión de checkout se crea correctamente
2. ✅ Redirige a Stripe Checkout
3. ✅ Webhook recibe evento `checkout.session.completed`
4. ✅ Usuario se actualiza a `isPremium: true` en DB
5. ✅ Redirige a `/premium/success` después del pago
6. ✅ Anuncios se ocultan para usuario premium

## Plan Types

### Plan Semanal (`weekly`)
- **Precio**: $1.00 USD
- **Duración**: 7 días
- **Expiración**: `Date.now() + 7 días`
- **Tipo Stripe**: One-time payment (puede cambiar a recurring)

### Plan Lifetime (`lifetime`)
- **Precio**: $9.99 USD
- **Duración**: Permanente
- **Expiración**: `Date.now() + 100 años`
- **Tipo Stripe**: One-time payment

## Integración con Sistema de Anuncios

El estado `isPremium` se usa en:

1. **Long Polling** (`/api/rooms/:roomId/state`):
   ```javascript
   isPremium: req.user && req.user.isPremium ? true : IS_PREMIUM_MODE_ACTIVE
   ```

2. **Frontend** (Room.jsx, etc):
   ```javascript
   if (!gameState.isPremium) {
     // Mostrar anuncios
   }
   ```

3. **Premium Pass**: Si el creador de la sala es premium, todos los jugadores juegan sin anuncios (feature pendiente de implementar completamente)

## Próximas Mejoras

1. **Tabla de pagos**: Guardar historial de transacciones
2. **Admin panel**: Ver lista de usuarios premium
3. **Renovación automática**: Suscripciones recurrentes con Stripe
4. **Premium Pass completo**: Implementar lógica en `isRoomPremium`
5. **Cupones de descuento**: Integración con Stripe Coupons
6. **Refunds**: Endpoint para procesar reembolsos
7. **Invoices**: Envío de facturas por email

---

**Implementado por**: Claude Sonnet 4.5
**Fecha**: 2025-12-09
**Status**: ✅ Funcional y listo para testing
