# Sistema de Modos Especiales con Imágenes - SpyWord

**Fecha de inicio:** 2025-12-18
**Estado:** En desarrollo
**Versión:** 1.0

---

## 📋 OBJETIVO

Implementar un tercer modo de juego llamado **"Modos Especiales"** que funcione igual que el modo Online pero en lugar de usar solo palabras, utilice imágenes con etiquetas (labels).

### Ejemplos de modos:
- **Clash Royale:** Cartas del juego
- **Disney:** Personajes de Disney
- **Pokémon:** Pokémon populares
- Cualquier otro tema que el admin configure

---

## 🎯 CARACTERÍSTICAS PRINCIPALES

### 1. Sistema Genérico de Modos
- NO hardcodear modos específicos (Disney, Clash Royale, etc.)
- Todo se gestiona dinámicamente desde la base de datos
- Cada modo tiene su propia lista de items con imágenes

### 2. Gestión desde Panel Admin (`/admin`)
El administrador puede:
- ✅ Crear nuevos modos de juego
- ✅ Definir nombre y descripción del modo
- ✅ Subir imágenes al servidor O pegar URLs externas
- ✅ Agregar items (imagen + label) al modo
- ✅ Configurar apariencia del botón del modo:
  - Imagen representativa
  - Color sólido
  - Gradiente de colores
- ✅ Activar/Desactivar modos para mostrar en la app
- ✅ Editar y eliminar modos existentes

### 3. Almacenamiento de Imágenes
- **Opción A:** URLs externas (Imgur, Cloudinary, etc.)
- **Opción B:** Upload al servidor en carpeta `/uploads/`
- La carpeta `/uploads/` NO se sube a GitHub (`.gitignore`)

### 4. Sistema de Juego
- Misma mecánica que modo Online
- Todos los jugadores ven la misma imagen excepto el impostor
- El impostor ve "???" (puede incluir imagen placeholder)
- Sistema de votación idéntico
- Sistema de pesos para selección aleatoria ponderada

---

## 🏗️ ARQUITECTURA

### **Backend (Node.js + Express + Prisma)**

#### Modelo de Base de Datos

```prisma
model GameMode {
  id             Int      @id @default(autoincrement())
  name           String   @unique        // "Clash Royale", "Disney", etc
  description    String?                 // Descripción del modo
  type           String   @default("word") // 'word' | 'image' | 'hybrid'
  isActive       Boolean  @default(true)  // Si se muestra en la app

  // Configuración visual del botón
  buttonImage    String?                 // URL de imagen del botón
  buttonColor    String?                 // Color sólido (hex)
  buttonGradient Json?                   // {from: "#xxx", to: "#yyy"}

  // Items del modo
  items          Json                    // Array de items: [{label, imageUrl, weight}]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([isActive])
  @@index([type])
}

model ModeImage {
  id        Int      @id @default(autoincrement())
  filename  String   @unique           // Nombre del archivo en /uploads
  originalName String                  // Nombre original del archivo
  mimeType  String                     // image/jpeg, image/png, etc
  size      Int                        // Tamaño en bytes
  path      String                     // Ruta relativa: uploads/xxxx.jpg
  url       String                     // URL completa para acceder
  createdAt DateTime @default(now())

  @@index([filename])
}
```

#### Estructura de Items en JSON

```javascript
{
  "items": [
    {
      "label": "Mago Eléctrico",
      "imageUrl": "/uploads/mago-electrico.png",  // O URL externa
      "weight": 100
    },
    {
      "label": "P.E.K.K.A",
      "imageUrl": "https://example.com/pekka.png",
      "weight": 120
    }
  ]
}
```

#### Nuevos Endpoints

```
POST   /api/admin/modes              - Crear modo
GET    /api/admin/modes              - Listar todos los modos
GET    /api/admin/modes/:id          - Obtener modo específico
PUT    /api/admin/modes/:id          - Actualizar modo
DELETE /api/admin/modes/:id          - Eliminar modo
PUT    /api/admin/modes/:id/toggle   - Activar/Desactivar

POST   /api/admin/upload-image       - Subir imagen al servidor
GET    /api/modes/active             - Obtener modos activos (público)
GET    /uploads/:filename            - Servir imágenes estáticas
```

#### Servicio: `mode.service.js`

```javascript
// Selección aleatoria ponderada de un item
async function getRandomItemWeighted(modeId) {
  const mode = await prisma.gameMode.findUnique({ where: { id: modeId } });
  // Selección ponderada similar a word.service.js
  return randomItem; // { label, imageUrl, weight }
}

// Actualizar peso según resultado
async function logItemFeedback(modeId, itemLabel, resultType) {
  // Ajustar peso del item según resultado de partida
}
```

#### Sistema de Upload con Multer

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Solo se permiten imágenes'));
  }
});
```

---

### **Frontend (React + Vite)**

#### Nuevas Páginas/Componentes

1. **`/special-modes`** - Página de selección de modos especiales
   - Grid de cards con modos disponibles
   - Cada card muestra imagen/color del modo
   - Al hacer clic crea una sala con ese modo

2. **`Admin.jsx` - Nueva pestaña "Modos Especiales"**
   - CRUD completo de modos
   - Upload de imágenes
   - Gestión de items por modo
   - Preview en tiempo real

3. **Componente `<ImageCard>`**
   - Muestra la imagen del item actual
   - Label debajo de la imagen
   - Indicador si es impostor
   - Responsive

4. **Componente `<ModeSelector>`**
   - Grid de modos activos
   - Animaciones al hover
   - Compatible con mobile

#### Modificaciones a Componentes Existentes

**`Room.jsx`** - Soporte para modos con imágenes
```jsx
// Detectar tipo de modo
const isImageMode = mode?.type === 'image';

// Renderizado condicional
{isImageMode ? (
  <ImageCard
    imageUrl={currentItem.imageUrl}
    label={currentItem.label}
    isImpostor={isImpostor}
  />
) : (
  <WordCard word={word} isImpostor={isImpostor} />
)}
```

**`Online.jsx`** - Agregar opción de modos especiales
```jsx
<button onClick={() => navigate('/special-modes')}>
  🎮 Modos Especiales
</button>
```

---

## 🔄 FLUJO DE JUEGO

### Creación de Sala con Modo Especial

1. Usuario va a `/special-modes`
2. Selecciona un modo (ej: Clash Royale)
3. Frontend llama a `POST /api/rooms/create` con `modeId`
4. Backend:
   - Crea sala normal
   - Llama a `getRandomItemWeighted(modeId)`
   - Asigna item aleatorio a la sala
   - Guarda `modeId`, `itemLabel`, `itemImageUrl`
5. Los jugadores ven la imagen del item
6. Un jugador es el impostor y ve "???"

### Durante el Juego

- Funcionalidad idéntica al modo Online
- La única diferencia es mostrar imagen en vez de palabra
- Sistema de votación no cambia
- Al finalizar, se registra feedback del item

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
SpyWord/
├── server/
│   ├── uploads/                    # Carpeta de imágenes (gitignored)
│   │   ├── clash-royale/
│   │   ├── disney/
│   │   └── ...
│   ├── services/
│   │   ├── word.service.js         # Existente
│   │   └── mode.service.js         # NUEVO - Gestión de modos
│   ├── prisma/
│   │   ├── schema.prisma           # Extendido con GameMode y ModeImage
│   │   └── migrations/
│   ├── server.js                   # Extendido con endpoints de modos
│   └── .gitignore                  # uploads/ agregado
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SpecialModes.jsx    # NUEVO - Selección de modos
│   │   │   ├── Room.jsx            # MODIFICADO - Soporte imágenes
│   │   │   ├── Online.jsx          # MODIFICADO - Link a modos
│   │   │   └── Admin.jsx           # MODIFICADO - Gestión de modos
│   │   ├── components/
│   │   │   ├── ImageCard.jsx       # NUEVO - Card para mostrar imagen
│   │   │   ├── ModeCard.jsx        # NUEVO - Card de modo en selector
│   │   │   └── ModeManager.jsx     # NUEVO - CRUD de modos en admin
│   │   └── services/
│   │       └── api.js              # Extendido con llamadas de modos
│
└── MODOS-ESPECIALES.md             # Este archivo
```

---

## ⚙️ CONFIGURACIÓN

### Variables de Entorno (`.env`)

```env
# Existentes
DATABASE_URL="mysql://..."
PORT=3001

# Nuevas (opcional para futuro)
UPLOAD_MAX_SIZE=5242880           # 5MB en bytes
ALLOWED_IMAGE_TYPES=jpeg,jpg,png,gif,webp
```

### .gitignore

```gitignore
# Imágenes subidas
uploads/
!uploads/.gitkeep

# Logs
*.log

# Dependencies
node_modules/
```

---

## 🧪 TESTING

### Casos de Prueba

#### Backend
- [ ] Crear modo con URL externa
- [ ] Crear modo con imagen subida
- [ ] Subir imagen (validar tipo y tamaño)
- [ ] Selección ponderada de items
- [ ] Actualización de pesos según feedback
- [ ] Activar/desactivar modos
- [ ] Eliminar modo (soft delete)

#### Frontend
- [ ] Mostrar solo modos activos
- [ ] Crear sala con modo especial
- [ ] Ver imagen en sala (jugador normal)
- [ ] Ver "???" en sala (impostor)
- [ ] Votar y completar partida
- [ ] Admin: CRUD completo de modos
- [ ] Admin: Upload de imágenes
- [ ] Responsive en mobile

#### Compatibilidad
- [ ] Modo Online normal sigue funcionando
- [ ] Pass and Play no se rompe
- [ ] Daily Mode compatible
- [ ] Sistema de votación funciona igual
- [ ] Premium Pass funciona en modos especiales

---

## 🚀 ROADMAP

### Fase 1: MVP (Semana 1) ✅ EN PROGRESO
- [x] Documento de arquitectura
- [ ] Modelo de BD extendido
- [ ] Upload de imágenes al servidor
- [ ] Endpoints básicos de modos
- [ ] Servicio de selección de items
- [ ] UI admin básica
- [ ] Selector de modos en frontend
- [ ] Room.jsx con soporte de imágenes

### Fase 2: Pulido (Semana 2)
- [ ] Múltiples modos pre-cargados
- [ ] Optimización de imágenes
- [ ] Lazy loading de imágenes
- [ ] Estadísticas por modo
- [ ] Búsqueda y filtros en admin

### Fase 3: Avanzado (Futuro)
- [ ] Modo híbrido (imagen + palabra)
- [ ] Sugerencias de items por usuarios
- [ ] Importar modos desde JSON
- [ ] Exportar modos
- [ ] Migración a S3/Cloudinary

---

## 📝 NOTAS IMPORTANTES

### Compatibilidad
- **NO romper modos existentes** - Crítico
- Todos los endpoints de salas deben soportar `modeId` opcional
- Si `modeId` es null/undefined, funciona como antes (palabras)

### Seguridad
- Validar tipos de archivo en upload
- Límite de tamaño (5MB recomendado)
- Sanitizar nombres de archivo
- No exponer rutas absolutas del servidor

### Performance
- Comprimir imágenes antes de subir (opcional)
- Usar WebP cuando sea posible
- Lazy loading en galería de imágenes
- Caché de modos activos (5 minutos)

### UX
- Previews de imágenes en admin
- Drag & drop para upload
- Crop/resize básico (futuro)
- Mensajes de error claros

---

## 🐛 TROUBLESHOOTING

### Imágenes no se ven
- Verificar que `/uploads` está servido como estático
- Revisar permisos de carpeta en servidor
- Comprobar CORS si hay error

### Upload falla
- Verificar tamaño de archivo (<5MB)
- Comprobar tipo de archivo permitido
- Revisar límites de Multer

### Modo no aparece en app
- Verificar que `isActive: true`
- Comprobar que tiene al menos 1 item
- Verificar que el frontend actualiza la lista

---

## 👥 COLABORADORES

- **Desarrollador Principal:** Claude Sonnet 4.5
- **Product Owner:** dxjx
- **Iniciado:** 2025-12-18

---

## 📚 RECURSOS

- [Multer Documentation](https://www.npmjs.com/package/multer)
- [Prisma JSON Fields](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
- [React Image Upload](https://react-dropzone.js.org/)

---

**Última actualización:** 2025-12-18
**Versión del documento:** 1.0
