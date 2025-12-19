/**
 * Módulo de Autenticación con Google OAuth y JWT
 *
 * Este módulo maneja:
 * - Estrategia de Google OAuth usando Passport.js
 * - Generación y verificación de JWT
 * - Find-or-create de usuarios en la base de datos
 * - Endpoints de autenticación
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// Configuración de Variables de Entorno
// ==========================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Validar que las variables de entorno estén configuradas
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.error('❌ ERROR: Faltan variables de entorno de Google OAuth');
  console.error('Asegúrate de configurar: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL');
}

if (!JWT_SECRET) {
  console.error('❌ ERROR: Falta JWT_SECRET en las variables de entorno');
  console.error('Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

// ==========================================
// Configuración de Passport.js - Google Strategy
// ==========================================

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extraer información del perfil de Google
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const name = profile.displayName;
        const profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

        if (!email) {
          return done(new Error('No se pudo obtener el email del perfil de Google'), null);
        }

        // Find-or-Create: Buscar usuario existente o crear uno nuevo
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (!user) {
          // Usuario no existe, crear uno nuevo
          user = await prisma.user.create({
            data: {
              googleId,
              email,
              name,
              profilePicture,
              isPremium: false, // Por defecto, usuarios no son premium
              dailyRouletteTokens: 1,
              lastDailyTokenReset: new Date()
            },
          });
          console.log(`✅ Nuevo usuario creado: ${email} (ID: ${user.id})`);
        } else {
          // Usuario existe, actualizar información si es necesario (incluyendo foto de perfil)
          if (user.email !== email || user.name !== name || user.profilePicture !== profilePicture) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { email, name, profilePicture },
            });
            console.log(`🔄 Usuario actualizado: ${email} (ID: ${user.id})`);
          } else {
            console.log(`✅ Usuario existente: ${email} (ID: ${user.id})`);
          }
        }

        // Devolver usuario a Passport
        return done(null, user);
      } catch (error) {
        console.error('❌ Error en Google Strategy:', error);
        return done(error, null);
      }
    }
  )
);

// Serializar usuario para la sesión (no usamos sesiones pero Passport lo requiere)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ==========================================
// Funciones de JWT
// ==========================================

/**
 * Genera un JWT para un usuario
 * @param {Object} user - Objeto de usuario desde Prisma
 * @returns {String} - Token JWT
 */
function generateJWT(user) {
  const payload = {
    userId: user.id,
    isPremium: user.isPremium,
    isAdmin: user.isAdmin || false,
    email: user.email,
    profilePicture: user.profilePicture || null,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d', // Token válido por 30 días
  });

  return token;
}

/**
 * Verifica y decodifica un JWT
 * @param {String} token - Token JWT
 * @returns {Object|null} - Payload decodificado o null si es inválido
 */
function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('❌ Error verificando JWT:', error.message);
    return null;
  }
}

// ==========================================
// Middleware de Autenticación
// ==========================================

/**
 * Middleware para verificar el token JWT desde cookies
 * Si el token es válido, adjunta req.user con { userId, isPremium, email }
 * Si el token es inválido o no existe, req.user será undefined
 */
function checkAuth(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    // No hay token, usuario no autenticado
    req.user = undefined;
    return next();
  }

  const decoded = verifyJWT(token);

  if (!decoded) {
    // Token inválido
    req.user = undefined;
    return next();
  }

  // Token válido, adjuntar información del usuario
  req.user = {
    userId: decoded.userId,
    isPremium: decoded.isPremium,
    email: decoded.email,
    profilePicture: decoded.profilePicture || null,
  };

  next();
}

/**
 * Middleware para requerir autenticación
 * Si el usuario no está autenticado, devuelve 401
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

// ==========================================
// Funciones de Autenticación con Email/Password
// ==========================================

/**
 * Hash de contraseña
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verificar contraseña
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ==========================================
// Endpoints de Autenticación
// ==========================================

/**
 * Configura los endpoints de autenticación en el servidor Express
 * @param {Express.Application} app - Aplicación Express
 */
function setupAuthRoutes(app) {
  // ==========================================
  // Registro con Email
  // ==========================================
  app.post('/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;

      // Validaciones
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      // Crear usuario con contraseña hasheada
      const hashedPassword = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          isPremium: false,
          dailyRouletteTokens: 1,
          lastDailyTokenReset: new Date()
        }
      });

      // Generar JWT
      const token = generateJWT(user);

      // Enviar JWT en cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      console.log(`✅ Usuario registrado con email: ${email} (ID: ${user.id})`);

      res.json({
        userId: user.id,
        email: user.email,
        isPremium: user.isPremium
      });
    } catch (error) {
      console.error('❌ Error en registro:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  });

  // ==========================================
  // Login con Email
  // ==========================================
  app.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validaciones
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
      }

      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      // Verificar contraseña
      const isValidPassword = await verifyPassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }

      // Generar JWT
      const token = generateJWT(user);

      // Enviar JWT en cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      console.log(`✅ Usuario autenticado con email: ${email} (Premium: ${user.isPremium})`);

      res.json({
        userId: user.id,
        email: user.email,
        isPremium: user.isPremium
      });
    } catch (error) {
      console.error('❌ Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  });

  // ==========================================
  // Google OAuth
  // ==========================================
  // Iniciar sesión con Google
  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // No usamos sesiones, usaremos JWT
  }));

  // Callback de Google OAuth
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${FRONTEND_URL}/?auth=error`,
    }),
    (req, res) => {
      try {
        const user = req.user;

        if (!user) {
          console.error('❌ No se pudo obtener el usuario después de la autenticación');
          return res.redirect(`${FRONTEND_URL}/?auth=error`);
        }

        // Generar JWT
        const token = generateJWT(user);

        // Enviar JWT en una cookie httpOnly
        res.cookie('auth_token', token, {
          httpOnly: true, // No accesible desde JavaScript
          secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
          sameSite: 'lax', // Protección contra CSRF
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en milisegundos
        });

        console.log(`✅ Usuario autenticado: ${user.email} (Premium: ${user.isPremium})`);

        // Redirigir al frontend con éxito
        res.redirect(`${FRONTEND_URL}/?auth=success`);
      } catch (error) {
        console.error('❌ Error en callback de Google:', error);
        res.redirect(`${FRONTEND_URL}/?auth=error`);
      }
    }
  );

  // Cerrar sesión (borrar cookie)
  app.post('/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
  });

  // Obtener información del usuario actual
  app.get('/auth/me', checkAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      // Consultar la base de datos para obtener el estado más reciente
      const userFromDB = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!userFromDB) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si el estado premium o admin cambió
      if (userFromDB.isPremium !== req.user.isPremium || userFromDB.isAdmin !== req.user.isAdmin) {
        // El estado cambió, regenerar JWT con datos actualizados
        const newToken = generateJWT(userFromDB);

        res.cookie('auth_token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
        });

        console.log(`✅ JWT regenerado automáticamente para ${userFromDB.email} - Premium: ${userFromDB.isPremium}, Admin: ${userFromDB.isAdmin}`);
      }

      // Devolver datos frescos de la base de datos
      res.json({
        userId: userFromDB.id,
        email: userFromDB.email,
        isPremium: userFromDB.isPremium,
        premiumExpiresAt: userFromDB.premiumExpiresAt,
        isAdmin: userFromDB.isAdmin,
        profilePicture: userFromDB.profilePicture || null,
      });
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener información del usuario' });
    }
  });

  // Refrescar JWT con datos actualizados de la base de datos
  app.post('/auth/refresh', checkAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    try {
      // Buscar usuario en la base de datos para obtener datos frescos
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Generar nuevo JWT con datos actualizados
      const token = generateJWT(user);

      // Enviar nuevo JWT en cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
      });

      console.log(`✅ Token refrescado para usuario: ${user.email} (Premium: ${user.isPremium})`);

      res.json({
        userId: user.id,
        email: user.email,
        isPremium: user.isPremium,
        profilePicture: user.profilePicture || null
      });
    } catch (error) {
      console.error('❌ Error al refrescar token:', error);
      res.status(500).json({ error: 'Error al refrescar sesión' });
    }
  });

  console.log('✅ Rutas de autenticación configuradas');
}

// ==========================================
// Exportar Módulo
// ==========================================

export {
  passport,
  generateJWT,
  verifyJWT,
  checkAuth,
  requireAuth,
  setupAuthRoutes,
};
