# Guía de Configuración de Stripe

Esta guía te ayudará a configurar los pagos de Stripe para tu aplicación ImpostorWord.

## 1. Credenciales de Stripe (✅ Ya configuradas)

Las credenciales de Stripe ya están en tu archivo `.env`:

```env
STRIPE_PUBLIC_KEY="pk_test_51ScZ8OJMiolN39MFA3JwRHSVK5J2MWRiqsp4ay82WkZlZ1H6oZrrCr4R95eI1mQDHv5soLRFXZbyoiBUZbWUFfCP00e8WyAvUs"
STRIPE_SECRET_KEY="sk_test_51ScZ8OJMiolN39MFCO9XrCaWobObFBNHguD5yzOhurgjQzgb48T8FW4i8veqm8AkQz6yky4HswlfOoaVCSerpka200phfLQBMF"
STRIPE_WEBHOOK_SECRET="" # Se configurará en el paso 3
PRODUCT_ID_WEEKLY="prod_TZicCsNNTdoiDo"
PRODUCT_ID_LIFETIME="prod_TZidRZMiyTx0Bk"
```

## 2. Verificar Productos y Precios en Stripe Dashboard

1. Ve a [Stripe Dashboard - Products](https://dashboard.stripe.com/test/products)
2. Verifica que existan dos productos:
   - **Plan Semanal** (ID: `prod_TZicCsNNTdoiDo`)
   - **Plan Lifetime** (ID: `prod_TZidRZMiyTx0Bk`)
3. Cada producto debe tener un **precio** asociado (Price ID)

### Si necesitas crear los productos:

#### Plan Semanal ($1 USD)
```
Nombre: ImpostorWord Premium - Semanal
Precio: $1.00 USD
Tipo: One-time payment (o Recurring - weekly si prefieres suscripción)
```

#### Plan Lifetime ($9.99 USD)
```
Nombre: ImpostorWord Premium - Lifetime
Precio: $9.99 USD
Tipo: One-time payment
```

## 3. Configurar Webhook de Stripe

El webhook es **crucial** para que los pagos se registren en tu base de datos.

### Opción A: Usando Stripe CLI (Desarrollo Local) ⭐ Recomendado

1. **Instalar Stripe CLI**:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (con Scoop)
   scoop install stripe

   # Linux
   # Ver: https://stripe.com/docs/stripe-cli#install
   ```

2. **Login en Stripe CLI**:
   ```bash
   stripe login
   ```
   Esto abrirá tu navegador para autenticarte.

3. **Reenviar eventos a tu servidor local**:
   ```bash
   stripe listen --forward-to localhost:3003/webhook
   ```

   Stripe CLI te dará un **webhook signing secret** que se ve así:
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. **Copiar el webhook secret** y pegarlo en tu archivo `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

5. **Reiniciar tu servidor** para que use el nuevo webhook secret.

6. **Dejar Stripe CLI corriendo** mientras desarrollas. Esto reenviará todos los eventos de Stripe a tu servidor local.

### Opción B: Webhook en Stripe Dashboard (Producción)

1. Ve a [Stripe Dashboard - Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click en "Add endpoint"
3. URL del endpoint: `https://tu-dominio.com/webhook`
4. Eventos a escuchar: Selecciona `checkout.session.completed`
5. Copia el **Signing secret** y actualiza tu `.env` en producción

## 4. Testing de Pagos

### Tarjetas de Prueba de Stripe

Usa estas tarjetas para probar:

```
✅ Pago exitoso:
4242 4242 4242 4242

❌ Pago rechazado:
4000 0000 0000 0002

⚠️  Requiere autenticación 3D Secure:
4000 0025 0000 3155

Fecha: Cualquier fecha futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)
ZIP: Cualquier 5 dígitos (ej: 12345)
```

### Flow de Testing

1. **Iniciar el servidor**:
   ```bash
   cd server
   npm start
   ```

2. **Iniciar Stripe CLI** (en otra terminal):
   ```bash
   stripe listen --forward-to localhost:3003/webhook
   ```

3. **Iniciar el cliente**:
   ```bash
   cd client
   npm run dev
   ```

4. **Probar el flujo de pago**:
   - Ir a http://localhost:5173
   - Iniciar sesión con tu cuenta
   - Ir a "Hazte Premium" o navegar a `/premium`
   - Seleccionar un plan
   - Usar la tarjeta de prueba `4242 4242 4242 4242`
   - Verificar que seas redirigido a `/premium/success`

5. **Verificar logs**:
   - En la terminal del servidor, deberías ver:
     ```
     ✅ Sesión de checkout creada para usuario xxx - Plan: weekly
     🎉 Pago exitoso recibido
     ✅ Usuario xxx actualizado a Premium - Plan: weekly
     ```
   - En Stripe CLI, verás:
     ```
     [200] POST http://localhost:3003/webhook [evt_xxxxx]
     ```

## 5. Verificar en la Base de Datos

Después de un pago exitoso, verifica en tu base de datos:

```sql
SELECT id, email, isPremium, premiumExpiresAt FROM users WHERE email = 'tu@email.com';
```

Deberías ver:
- `isPremium` = `1` (true)
- `premiumExpiresAt` = fecha de expiración (7 días o 100 años según el plan)

## 6. Troubleshooting

### ❌ "Error al crear sesión de pago"
- Verifica que `STRIPE_SECRET_KEY` esté en el `.env`
- Verifica que los productos tengan precios activos en Stripe Dashboard

### ❌ "Webhook Error"
- Si no tienes `STRIPE_WEBHOOK_SECRET`, el webhook funcionará sin verificación (solo para desarrollo)
- En producción, SIEMPRE configura el webhook secret

### ❌ "Usuario no actualizado a Premium"
- Verifica que Stripe CLI esté corriendo
- Verifica que el evento `checkout.session.completed` se esté enviando
- Revisa los logs del servidor para ver si hay errores

### ❌ "No se encontró precio para este producto"
- Ve a Stripe Dashboard y asegúrate de que cada producto tenga un precio activo

## 7. Pasar a Producción

1. **Cambiar a claves de producción**:
   - Reemplaza `pk_test_...` con `pk_live_...`
   - Reemplaza `sk_test_...` con `sk_live_...`

2. **Configurar webhook en producción**:
   - Crear webhook endpoint en Stripe Dashboard apuntando a tu dominio
   - Actualizar `STRIPE_WEBHOOK_SECRET` con el signing secret de producción

3. **Actualizar URLs**:
   - Asegúrate de que `FRONTEND_URL` apunte a tu dominio de producción

4. **Testing final**:
   - Hacer un pago de prueba con tarjeta real
   - Verificar que el usuario se actualice a Premium
   - Verificar que los anuncios se oculten correctamente

## 8. Recursos Adiciales

- [Stripe Documentation - Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Documentation - Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Cards](https://stripe.com/docs/testing)

---

¡Todo listo! 🎉 Ahora tu sistema de pagos con Stripe está configurado.
