import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuración de premios y probabilidades RULETA DIARIA
const DAILY_PRIZES = [
  { id: 'nothing', label: '❌ Casi 😅', probability: 0.60, minutes: 0 },
  { id: '10min', label: '⏱️ 10 min sin ads', probability: 0.25, minutes: 10 },
  { id: '30min', label: '⭐ 30 min premium', probability: 0.10, minutes: 30 },
  { id: '1day', label: '🕓 1 día premium', probability: 0.05, minutes: 1440 }
];

// Configuración de premios y probabilidades RULETA PREMIUM
const PREMIUM_PRIZES = [
  { id: '1week', label: '⏱️ 1 semana sin ads', probability: 0.35, minutes: 10080 }, // 7 días
  { id: '3days', label: '⭐ +3 días premium', probability: 0.30, minutes: 4320 }, // 3 días
  { id: '7days', label: '⭐ +7 días premium', probability: 0.24, minutes: 10080 }, // 7 días
  { id: '1month', label: '💎 1 mes premium', probability: 0.10, minutes: 43200 }, // 30 días
  { id: 'lifetime', label: '👑 Premium de por vida', probability: 0.01, minutes: null } // Lifetime
];

// Función para seleccionar premio basado en probabilidades
function selectPrize(prizes) {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }

  // Fallback
  return prizes[0];
}

// Función para resetear tokens diarios si es necesario
async function checkAndResetDailyTokens(userId) {
  // Validar que userId existe
  if (!userId) {
    console.error('checkAndResetDailyTokens: userId is undefined or null');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Si nunca se han reseteado o la última vez fue antes de hoy
  if (!user.lastDailyTokenReset || new Date(user.lastDailyTokenReset) < today) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyRouletteTokens: 1,
        lastDailyTokenReset: now
      }
    });
  }
}

// Función para aplicar premio al usuario
async function applyPrize(userId, prize, rouletteType) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Si es premio "lifetime"
  if (prize.id === 'lifetime') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumExpiresAt: null // null = lifetime
      }
    });
    return;
  }

  // Si no hay minutos, no hacer nada
  if (!prize.minutes || prize.minutes === 0) {
    return;
  }

  // Calcular nueva fecha de expiración
  let newExpiresAt;
  const now = new Date();

  if (user.premiumExpiresAt && user.premiumExpiresAt > now) {
    // Si tiene premium activo, sumar tiempo
    newExpiresAt = new Date(user.premiumExpiresAt);
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + prize.minutes);
  } else {
    // Si no tiene premium o expiró, empezar desde ahora
    newExpiresAt = new Date(now);
    newExpiresAt.setMinutes(newExpiresAt.getMinutes() + prize.minutes);
  }

  // Actualizar usuario
  await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: true,
      premiumExpiresAt: newExpiresAt
    }
  });
}

export function setupRouletteRoutes(app, checkAuth, requireAuth) {
  // Endpoint para obtener estado de ambas ruletas
  app.get('/api/roulette/status', checkAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.json({
          dailyTokens: 0,
          premiumTokens: 0,
          dailyHistory: [],
          premiumHistory: []
        });
      }

      // Resetear tokens diarios si es necesario
      await checkAndResetDailyTokens(req.user.userId);

      // Obtener usuario actualizado
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      // Obtener historial
      const dailyHistory = await prisma.rouletteSpins.findMany({
        where: {
          userId: req.user.userId,
          rouletteType: 'daily'
        },
        orderBy: { spunAt: 'desc' },
        take: 5
      });

      const premiumHistory = await prisma.rouletteSpins.findMany({
        where: {
          userId: req.user.userId,
          rouletteType: 'premium'
        },
        orderBy: { spunAt: 'desc' },
        take: 5
      });

      res.json({
        dailyTokens: user.dailyRouletteTokens,
        premiumTokens: user.premiumRouletteTokens,
        lastDailyTokenReset: user.lastDailyTokenReset,
        dailyHistory: dailyHistory.map(spin => ({
          prize: spin.prize,
          spunAt: spin.spunAt
        })),
        premiumHistory: premiumHistory.map(spin => ({
          prize: spin.prize,
          spunAt: spin.spunAt
        }))
      });
    } catch (error) {
      console.error('❌ Error al verificar estado de ruleta:', error);
      res.status(500).json({ error: 'Error al verificar estado de ruleta' });
    }
  });

  // Endpoint para girar la ruleta (daily o premium)
  app.post('/api/roulette/spin', checkAuth, requireAuth, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { type } = req.body; // 'daily' o 'premium'

      if (!type || !['daily', 'premium'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de ruleta inválido' });
      }

      // Resetear tokens diarios si es necesario
      await checkAndResetDailyTokens(userId);

      // Obtener usuario actualizado
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verificar si tiene fichas disponibles
      const tokenField = type === 'daily' ? 'dailyRouletteTokens' : 'premiumRouletteTokens';
      const hasTokens = user[tokenField] > 0;

      if (!hasTokens) {
        return res.status(400).json({
          error: type === 'daily'
            ? 'Ya usaste tu ficha diaria. Vuelve mañana 🎰'
            : 'No tienes fichas de ruleta premium'
        });
      }

      // Seleccionar premio según el tipo de ruleta
      const prizes = type === 'daily' ? DAILY_PRIZES : PREMIUM_PRIZES;
      const prize = selectPrize(prizes);

      // Guardar el spin en la base de datos
      await prisma.rouletteSpins.create({
        data: {
          userId: userId,
          rouletteType: type,
          prize: prize.id,
          prizeMinutes: prize.minutes
        }
      });

      // Descontar ficha
      await prisma.user.update({
        where: { id: userId },
        data: {
          [tokenField]: {
            decrement: 1
          }
        }
      });

      // Aplicar el premio
      if (prize.id !== 'nothing') {
        await applyPrize(userId, prize, type);
      }

      res.json({
        success: true,
        prize: {
          id: prize.id,
          label: prize.label,
          minutes: prize.minutes
        }
      });
    } catch (error) {
      console.error('Error al girar ruleta:', error);
      res.status(500).json({ error: 'Error al girar ruleta' });
    }
  });
}
