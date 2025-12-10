/**
 * Módulo de Pagos con Stripe
 *
 * Este módulo maneja:
 * - Creación de sesiones de Stripe Checkout
 * - Webhook para procesar pagos exitosos
 * - Actualización del estado premium del usuario en la base de datos
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// Configuración de Stripe
// ==========================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Product IDs
const PRODUCT_ID_WEEKLY = process.env.PRODUCT_ID_WEEKLY;
const PRODUCT_ID_LIFETIME = process.env.PRODUCT_ID_LIFETIME;

// Validar variables de entorno
if (!STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY no está configurado');
}

if (!PRODUCT_ID_WEEKLY || !PRODUCT_ID_LIFETIME) {
  console.error('❌ ERROR: Faltan PRODUCT_ID_WEEKLY o PRODUCT_ID_LIFETIME');
}

// Inicializar Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

// ==========================================
// Configuración de Endpoints
// ==========================================

/**
 * Configura los endpoints de pago en el servidor Express
 * @param {Express.Application} app - Aplicación Express
 * @param {Function} checkAuth - Middleware para verificar JWT
 * @param {Function} requireAuth - Middleware para requerir autenticación
 */
function setupPaymentRoutes(app, checkAuth, requireAuth) {

  // ==========================================
  // POST /api/create-checkout-session
  // Crea una sesión de Stripe Checkout
  // ==========================================
  app.post('/api/create-checkout-session', checkAuth, requireAuth, async (req, res) => {
    try {
      const { planType } = req.body; // 'weekly' o 'lifetime'
      const userId = req.user.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!planType || (planType !== 'weekly' && planType !== 'lifetime')) {
        return res.status(400).json({ error: 'Tipo de plan inválido. Usa "weekly" o "lifetime"' });
      }

      // Determinar el precio según el plan
      let priceId;
      let productId;

      if (planType === 'weekly') {
        productId = PRODUCT_ID_WEEKLY;
        // Nota: Necesitas crear Price IDs en Stripe Dashboard
        // Por ahora usaremos el modo de payment para one-time purchases
      } else if (planType === 'lifetime') {
        productId = PRODUCT_ID_LIFETIME;
      }

      // Obtener información del producto desde Stripe
      const product = await stripe.products.retrieve(productId);

      // Obtener el precio asociado al producto
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 1
      });

      if (prices.data.length === 0) {
        return res.status(500).json({ error: 'No se encontró precio para este producto' });
      }

      priceId = prices.data[0].id;

      // Crear sesión de Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: prices.data[0].type === 'recurring' ? 'subscription' : 'payment',
        success_url: `${FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/premium?canceled=true`,
        client_reference_id: userId, // CRUCIAL: vincula la sesión con el usuario
        metadata: {
          userId: userId,
          planType: planType
        }
      });

      console.log(`✅ Sesión de checkout creada para usuario ${userId} - Plan: ${planType}`);

      res.json({
        sessionId: session.id,
        url: session.url
      });
    } catch (error) {
      console.error('❌ Error al crear sesión de checkout:', error);
      res.status(500).json({ error: 'Error al crear sesión de pago' });
    }
  });

  // ==========================================
  // POST /webhook
  // Webhook de Stripe para procesar eventos
  // ==========================================
  app.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      // Verificar la firma del webhook
      if (STRIPE_WEBHOOK_SECRET) {
        // req.body es un Buffer cuando usamos express.raw()
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
      } else {
        // En desarrollo sin webhook secret, solo parseamos el evento
        console.warn('⚠️  ADVERTENCIA: STRIPE_WEBHOOK_SECRET no configurado. No se verificará la firma del webhook.');
        // Si el body es un Buffer, convertirlo a string y parsearlo
        const bodyString = req.body.toString('utf8');
        event = JSON.parse(bodyString);
      }
    } catch (err) {
      console.error('❌ Error al verificar webhook de Stripe:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('🎉 Pago exitoso recibido:', {
        sessionId: session.id,
        userId: session.client_reference_id,
        amount: session.amount_total,
        currency: session.currency
      });

      // Extraer el userId del client_reference_id
      const userId = session.client_reference_id;
      const planType = session.metadata?.planType;

      if (!userId) {
        console.error('❌ No se encontró userId en la sesión de checkout');
        return res.status(400).json({ error: 'userId no encontrado' });
      }

      try {
        // Calcular fecha de expiración según el plan
        let premiumExpiresAt = null;

        if (planType === 'weekly') {
          // Suscripción semanal: expira en 7 días
          premiumExpiresAt = new Date();
          premiumExpiresAt.setDate(premiumExpiresAt.getDate() + 7);
        } else if (planType === 'lifetime') {
          // Lifetime: expira en 100 años (prácticamente nunca)
          premiumExpiresAt = new Date();
          premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 100);
        }

        // Actualizar el usuario en la base de datos
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumExpiresAt: premiumExpiresAt
          }
        });

        console.log(`✅ Usuario ${userId} actualizado a Premium - Plan: ${planType}`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   Expira: ${premiumExpiresAt?.toISOString() || 'Nunca'}`);

      } catch (error) {
        console.error('❌ Error al actualizar usuario a Premium:', error);
        return res.status(500).json({ error: 'Error al actualizar usuario' });
      }
    }

    // Responder a Stripe
    res.json({ received: true });
  });

  console.log('✅ Rutas de pago configuradas');
}

// ==========================================
// Exportar Módulo
// ==========================================

export {
  setupPaymentRoutes,
  stripe
};
