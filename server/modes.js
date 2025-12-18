import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import {
  getRandomItemWeighted,
  logItemFeedback,
  getActiveModes,
  getModeById,
  getModeStats
} from './services/mode.service.js';

const prisma = new PrismaClient();

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer para upload de imágenes
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Usar ruta absoluta en lugar de relativa
    const uploadPath = path.join(__dirname, 'uploads');
    try {
      console.log(`📁 Intentando crear directorio: ${uploadPath}`);
      await fs.mkdir(uploadPath, { recursive: true });
      console.log(`✅ Directorio verificado/creado: ${uploadPath}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error(`❌ Error al crear directorio ${uploadPath}:`, error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
});

/**
 * Configurar rutas de modos especiales
 * @param {express.Application} app - Aplicación Express
 */
export function setupModesRoutes(app) {

  // 📸 POST /api/admin/upload-image - Subir imagen al servidor
  app.post('/api/admin/upload-image', (req, res) => {
    upload.single('image')(req, res, async (err) => {
      try {
        // Manejar errores de Multer
        if (err instanceof multer.MulterError) {
          console.error('❌ Error de Multer:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
          }
          return res.status(400).json({ error: `Error al subir archivo: ${err.message}` });
        } else if (err) {
          console.error('❌ Error general al subir:', err);
          return res.status(500).json({ error: err.message || 'Error al subir la imagen' });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
        }

        // Guardar solo la ruta relativa, no la URL completa
        const relativePath = `uploads/${req.file.filename}`;

        console.log(`📦 Archivo recibido: ${req.file.filename}`);
        console.log(`📂 Guardado en: ${req.file.path}`);

        // Guardar en BD
        const savedImage = await prisma.modeImage.create({
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: relativePath // Ahora guardamos ruta relativa en lugar de URL completa
          }
        });

        console.log(`✅ Imagen subida exitosamente: ${req.file.filename} -> ${relativePath}`);
        res.json({
          message: 'Imagen subida exitosamente',
          image: savedImage
        });

      } catch (error) {
        console.error('❌ Error al procesar imagen:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
          error: 'Error al subir la imagen',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  });

  // 🎮 GET /api/modes/active - Obtener modos activos (público)
  app.get('/api/modes/active', async (req, res) => {
    try {
      const modes = await getActiveModes();
      res.json(modes);
    } catch (error) {
      console.error('❌ Error al obtener modos activos:', error);
      res.status(500).json({ error: 'Error al obtener modos' });
    }
  });

  // ⭐ GET /api/modes/featured - Obtener modos destacados para el home (público)
  app.get('/api/modes/featured', async (req, res) => {
    try {
      const featuredModes = await prisma.gameMode.findMany({
        where: {
          isActive: true,
          isFeaturedOnHome: true
        },
        orderBy: {
          featuredOrder: 'asc'
        },
        take: 3
      });
      res.json(featuredModes);
    } catch (error) {
      console.error('❌ Error al obtener modos destacados:', error);
      res.status(500).json({ error: 'Error al obtener modos destacados' });
    }
  });

  // 📋 GET /api/admin/modes - Listar todos los modos (admin)
  app.get('/api/admin/modes', async (req, res) => {
    try {
      const modes = await prisma.gameMode.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(modes);
    } catch (error) {
      console.error('❌ Error al obtener modos:', error);
      res.status(500).json({ error: 'Error al obtener modos' });
    }
  });

  // 🔍 GET /api/admin/modes/:id - Obtener modo específico (admin)
  app.get('/api/admin/modes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const mode = await getModeById(parseInt(id));

      if (!mode) {
        return res.status(404).json({ error: 'Modo no encontrado' });
      }

      res.json(mode);
    } catch (error) {
      console.error('❌ Error al obtener modo:', error);
      res.status(500).json({ error: 'Error al obtener modo' });
    }
  });

  // ➕ POST /api/admin/modes - Crear nuevo modo (admin)
  app.post('/api/admin/modes', async (req, res) => {
    try {
      const {
        name,
        description,
        type,
        items,
        buttonImage,
        buttonColor,
        buttonGradient,
        isActive
      } = req.body;

      console.log(`📝 Creando nuevo modo: ${name}`);
      console.log(`📊 Items recibidos:`, items?.length || 0);

      if (!name || !type) {
        console.warn('⚠️ Faltan campos requeridos: nombre o tipo');
        return res.status(400).json({ error: 'Se requiere nombre y tipo' });
      }

      if (!items || items.length === 0) {
        console.warn('⚠️ No se proporcionaron items');
        return res.status(400).json({ error: 'Se requiere al menos un item' });
      }

      // Validar items
      for (const item of items) {
        if (!item.label) {
          console.warn('⚠️ Item sin label encontrado');
          return res.status(400).json({ error: 'Cada item debe tener un label' });
        }
      }

      console.log(`💾 Guardando modo en base de datos...`);

      const newMode = await prisma.gameMode.create({
        data: {
          name,
          description,
          type,
          items: items, // Prisma Json field
          buttonImage,
          buttonColor,
          buttonGradient: buttonGradient ? buttonGradient : null,
          isActive: isActive !== undefined ? isActive : true
        }
      });

      console.log(`✅ Modo creado exitosamente: ${name} (ID: ${newMode.id})`);
      res.json({
        message: 'Modo creado exitosamente',
        mode: newMode
      });

    } catch (error) {
      console.error('❌ Error al crear modo:', error);
      console.error('Stack:', error.stack);

      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Ya existe un modo con ese nombre' });
      }

      res.status(500).json({
        error: 'Error al crear modo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ✏️ PUT /api/admin/modes/:id - Actualizar modo (admin)
  app.put('/api/admin/modes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        type,
        items,
        buttonImage,
        buttonColor,
        buttonGradient,
        isActive
      } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (type !== undefined) data.type = type;
      if (items !== undefined) data.items = items;
      if (buttonImage !== undefined) data.buttonImage = buttonImage;
      if (buttonColor !== undefined) data.buttonColor = buttonColor;
      if (buttonGradient !== undefined) data.buttonGradient = buttonGradient;
      if (isActive !== undefined) data.isActive = isActive;

      const updatedMode = await prisma.gameMode.update({
        where: { id: parseInt(id) },
        data
      });

      console.log(`✅ Modo actualizado: ${updatedMode.name} (ID: ${id})`);
      res.json({
        message: 'Modo actualizado exitosamente',
        mode: updatedMode
      });

    } catch (error) {
      console.error('❌ Error al actualizar modo:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Modo no encontrado' });
      }

      res.status(500).json({ error: 'Error al actualizar modo' });
    }
  });

  // 🔄 PUT /api/admin/modes/:id/toggle - Activar/Desactivar modo (admin)
  app.put('/api/admin/modes/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;

      const mode = await prisma.gameMode.findUnique({
        where: { id: parseInt(id) }
      });

      if (!mode) {
        return res.status(404).json({ error: 'Modo no encontrado' });
      }

      // Si se está desactivando un modo, también quitarlo de destacados
      const updateData = { isActive: !mode.isActive };
      if (mode.isActive) {
        // Si estaba activo y se va a desactivar, quitarlo de destacados
        updateData.isFeaturedOnHome = false;
        updateData.featuredOrder = null;
      }

      const updatedMode = await prisma.gameMode.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      console.log(`✅ Modo ${updatedMode.isActive ? 'activado' : 'desactivado'}: ${updatedMode.name}`);
      res.json({
        message: `Modo ${updatedMode.isActive ? 'activado' : 'desactivado'} exitosamente`,
        mode: updatedMode
      });

    } catch (error) {
      console.error('❌ Error al cambiar estado del modo:', error);
      res.status(500).json({ error: 'Error al cambiar estado del modo' });
    }
  });

  // ⭐ PUT /api/admin/modes/:id/featured - Gestionar modo destacado (admin)
  app.put('/api/admin/modes/:id/featured', async (req, res) => {
    try {
      const { id } = req.params;
      const { isFeaturedOnHome, featuredOrder } = req.body;

      // Validar que no haya más de 3 modos destacados
      if (isFeaturedOnHome) {
        const currentFeatured = await prisma.gameMode.count({
          where: {
            isFeaturedOnHome: true,
            NOT: { id: parseInt(id) }
          }
        });

        if (currentFeatured >= 3) {
          return res.status(400).json({
            error: 'No puedes tener más de 3 modos destacados. Quita uno primero.'
          });
        }

        // Validar order entre 1-3
        if (featuredOrder && (featuredOrder < 1 || featuredOrder > 3)) {
          return res.status(400).json({
            error: 'El orden debe estar entre 1 y 3'
          });
        }
      }

      const updatedMode = await prisma.gameMode.update({
        where: { id: parseInt(id) },
        data: {
          isFeaturedOnHome: isFeaturedOnHome !== undefined ? isFeaturedOnHome : undefined,
          featuredOrder: isFeaturedOnHome ? featuredOrder : null
        }
      });

      console.log(`✅ Modo ${updatedMode.isFeaturedOnHome ? 'marcado como destacado' : 'removido de destacados'}: ${updatedMode.name}`);
      res.json({
        message: `Modo ${updatedMode.isFeaturedOnHome ? 'destacado' : 'no destacado'} exitosamente`,
        mode: updatedMode
      });

    } catch (error) {
      console.error('❌ Error al cambiar estado destacado:', error);
      res.status(500).json({ error: 'Error al cambiar estado destacado' });
    }
  });

  // 🗑️ DELETE /api/admin/modes/:id - Eliminar modo (admin)
  app.delete('/api/admin/modes/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.gameMode.delete({
        where: { id: parseInt(id) }
      });

      console.log(`✅ Modo eliminado (ID: ${id})`);
      res.json({ message: 'Modo eliminado exitosamente' });

    } catch (error) {
      console.error('❌ Error al eliminar modo:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Modo no encontrado' });
      }

      res.status(500).json({ error: 'Error al eliminar modo' });
    }
  });

  // 📊 GET /api/admin/modes/:id/stats - Estadísticas de un modo (admin)
  app.get('/api/admin/modes/:id/stats', async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await getModeStats(parseInt(id));
      res.json(stats);
    } catch (error) {
      console.error('❌ Error al obtener estadísticas del modo:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  });

  // 📷 GET /api/admin/images - Listar todas las imágenes subidas (admin)
  app.get('/api/admin/images', async (req, res) => {
    try {
      const images = await prisma.modeImage.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(images);
    } catch (error) {
      console.error('❌ Error al obtener imágenes:', error);
      res.status(500).json({ error: 'Error al obtener imágenes' });
    }
  });

  // 🗑️ DELETE /api/admin/images/:id - Eliminar imagen (admin)
  app.delete('/api/admin/images/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const image = await prisma.modeImage.findUnique({
        where: { id: parseInt(id) }
      });

      if (!image) {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }

      // Eliminar archivo físico
      try {
        await fs.unlink(image.path);
      } catch (fileError) {
        console.warn(`⚠️ No se pudo eliminar archivo físico: ${image.path}`);
      }

      // Eliminar registro de BD
      await prisma.modeImage.delete({
        where: { id: parseInt(id) }
      });

      console.log(`✅ Imagen eliminada: ${image.filename}`);
      res.json({ message: 'Imagen eliminada exitosamente' });

    } catch (error) {
      console.error('❌ Error al eliminar imagen:', error);
      res.status(500).json({ error: 'Error al eliminar imagen' });
    }
  });

  console.log('✅ Rutas de modos especiales configuradas');
}

export default {
  setupModesRoutes
};
