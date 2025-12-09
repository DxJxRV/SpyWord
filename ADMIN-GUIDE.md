# Guía del Panel de Administración 🔧

## Acceso al Panel

El panel de administración está disponible en:
- **URL:** http://localhost:5173/admin
- **Botón:** En la pantalla principal (Home), hay un botón flotante con ícono de engranaje en la esquina inferior derecha

---

## Funcionalidades

### 📊 Estadísticas en Tiempo Real

El panel muestra:
- **Total de palabras** activas en la base de datos
- **Peso promedio** de todas las palabras
- **Peso máximo** de las palabras más populares
- **Número de categorías** disponibles

### 🔍 Filtros

- **Filtrar por categoría:** Ver solo palabras de una categoría específica
- **Todas las categorías:** Ver todas las palabras agrupadas por categoría
- **Botón recargar:** Actualizar datos en tiempo real

### ➕ Agregar Palabras

1. Click en el botón verde **"Agregar Palabras"**
2. Seleccionar **categoría existente** o crear **nueva categoría**
3. Ingresar palabras separadas por comas:
   ```
   gato, perro, elefante, jirafa, león
   ```
4. Las palabras se capitalizan automáticamente
5. Click en **"Agregar Palabras"**

**Características:**
- ✅ Detecta duplicados automáticamente
- ✅ Capitaliza la primera letra
- ✅ Limpia espacios en blanco
- ✅ Peso inicial: 100 (neutral)

### 🗑️ Eliminar Palabras

- Hover sobre cualquier palabra para ver el botón de eliminar
- Click en el ícono de basura
- Confirmar eliminación
- Las palabras se **desactivan** (soft delete), no se borran permanentemente

### 📈 Sistema de Pesos

Cada palabra tiene un **peso** que determina su probabilidad de aparecer:
- **Peso inicial:** 100 (todas las palabras empiezan igual)
- **Peso mínimo:** 10
- **Peso máximo:** 500

El peso se actualiza automáticamente según el resultado de las partidas:
- **Jugadores ganan:** +5 peso (buena palabra)
- **Impostor gana:** +3 peso (palabra funcionó)
- **Partida abandonada:** -10 peso (mala palabra)

---

## Categorías Iniciales

El sistema viene con 10 categorías pre-cargadas:
1. 🐾 **Animales** - Perro, Gato, Elefante, etc.
2. 🍕 **Comida** - Pizza, Hamburguesa, Sushi, etc.
3. 🎮 **Objetos** - Teléfono, Computadora, Bicicleta, etc.
4. 🏖️ **Lugares** - Playa, Montaña, Ciudad, etc.
5. 👨‍⚕️ **Profesiones** - Doctor, Maestro, Chef, etc.
6. ⚽ **Deportes** - Fútbol, Basketball, Tenis, etc.
7. 💻 **Tecnología** - Internet, Robot, Videojuego, etc.
8. 🌳 **Naturaleza** - Sol, Luna, Océano, etc.
9. 🎬 **Entretenimiento** - Película, Concierto, Teatro, etc.
10. ❤️ **Emociones** - Felicidad, Amor, Miedo, etc.

---

## Ejemplos de Uso

### Agregar múltiples palabras a la vez

```
Categoría: Deportes
Palabras: natación, atletismo, voleibol, boxeo, gimnasia, karate, judo
```

Resultado:
- ✅ 7 palabras creadas
- ⚠️ "Gimnasia" ya existe (se muestra advertencia)

### Crear nueva categoría

```
Categoría: [Nueva] Bebidas
Palabras: agua, jugo, refresco, té, café, limonada
```

Resultado:
- ✅ Nueva categoría "Bebidas" creada
- ✅ 6 palabras agregadas

### Filtrar y eliminar

1. Seleccionar categoría: "Tecnología"
2. Hover sobre "Blockchain"
3. Click en eliminar
4. Confirmar
5. La palabra ya no aparecerá en el juego

---

## API Endpoints (Referencia Técnica)

### GET /api/admin/stats
Obtener estadísticas generales

**Response:**
```json
{
  "stats": {
    "totalWords": 100,
    "avgWeight": 125,
    "maxWeight": 500,
    "minWeight": 10
  },
  "topWords": [...]
}
```

### GET /api/admin/words
Obtener todas las palabras

**Query params:**
- `category` (opcional): Filtrar por categoría

**Response:**
```json
{
  "words": [
    {
      "id": 1,
      "word": "Perro",
      "category": "Animales",
      "weight": 100,
      "is_active": true,
      "createdAt": "2024-12-09T..."
    }
  ]
}
```

### GET /api/admin/categories
Obtener todas las categorías con conteo

**Response:**
```json
{
  "categories": [
    { "name": "Animales", "count": 10 },
    { "name": "Comida", "count": 10 }
  ]
}
```

### POST /api/admin/words
Agregar nuevas palabras

**Body:**
```json
{
  "words": "gato, perro, león",
  "category": "Animales"
}
```

**Response:**
```json
{
  "success": true,
  "created": 3,
  "words": [...],
  "errors": []
}
```

### PUT /api/admin/words/:id
Actualizar una palabra

**Body:**
```json
{
  "word": "Gato Grande",
  "category": "Animales",
  "weight": 150,
  "is_active": true
}
```

### DELETE /api/admin/words/:id
Eliminar (desactivar) una palabra

**Response:**
```json
{
  "success": true,
  "word": {...}
}
```

---

## Tips y Mejores Prácticas

### ✅ DO

- Agregar palabras en lotes usando comas
- Usar categorías claras y descriptivas
- Revisar las palabras más populares (peso alto)
- Eliminar palabras problemáticas o inapropiadas
- Crear categorías temáticas coherentes

### ❌ DON'T

- No agregar palabras muy específicas o difíciles
- No usar palabras ambiguas
- No mezclar categorías
- No eliminar demasiadas palabras a la vez
- No usar mayúsculas o minúsculas incorrectas (se capitalizan automáticamente)

---

## Troubleshooting

### "Error al obtener palabras"
- Verificar que el servidor esté corriendo (`npm run dev` en `/server`)
- Verificar que MySQL esté activo
- Verificar conexión DATABASE_URL en `.env`

### "Palabra ya existe"
- La palabra es única en toda la base de datos
- Si necesitas la misma palabra en otra categoría, considera renombrarla ligeramente

### Panel no carga
- Verificar que estés en http://localhost:5173/admin
- Revisar consola del navegador para errores
- Verificar que Prisma esté generado: `npx prisma generate`

### Cambios no se reflejan en el juego
- Recargar la página del panel de admin
- El servidor actualiza automáticamente con nodemon
- Las palabras se seleccionan en tiempo real de la DB

---

## Estructura de Archivos

```
server/
├── services/
│   └── word.service.js     # Lógica de palabras con Prisma
├── prisma/
│   ├── schema.prisma       # Schema de DB
│   ├── seed.js             # Palabras iniciales
│   └── migrations/         # Migraciones
└── server.js               # Endpoints de admin (líneas 420-601)

client/
└── src/
    └── pages/
        └── Admin.jsx       # Panel de administración
```

---

## Seguridad

⚠️ **IMPORTANTE:** Este panel de administración NO tiene autenticación actualmente.

Para producción, considera:
- Agregar sistema de login
- Proteger endpoints con middleware de autenticación
- Usar variables de entorno para credenciales de admin
- Implementar roles y permisos
- Rate limiting en endpoints de admin

---

## Próximas Funcionalidades (Roadmap)

- [ ] Edición inline de palabras
- [ ] Importar/Exportar palabras en CSV
- [ ] Ver historial de feedback por palabra
- [ ] Gráficas de popularidad
- [ ] Búsqueda de palabras
- [ ] Ordenar por peso, nombre, categoría
- [ ] Paginación para grandes cantidades
- [ ] Modo oscuro/claro
- [ ] Backup automático de palabras

---

## 🎮 Gestión de Modos de Juego

### Descripción

Los modos de juego permiten crear experiencias especiales con listas de palabras personalizadas para el modo "Pasa y Juega" y el "Modo del Día".

### Mecánica del Juego

**IMPORTANTE:** El juego funciona de la siguiente manera:
- **Jugadores normales** reciben la palabra secreta (ej: "Perro")
- **El impostor** recibe "???" en lugar de la palabra
- El objetivo del impostor es descubrir la palabra escuchando las descripciones
- El objetivo de los demás es identificar al impostor

### Formato de Palabras

Las listas de palabras deben ser **arrays de strings** en formato JSON:

```json
["Perro", "Gato", "Pizza", "Teléfono", "Playa", "Doctor"]
```

❌ **NO usar pares de palabras:**
```json
[{"normal": "Perro", "impostor": "Lobo"}]  // ❌ INCORRECTO
```

### Crear Modo de Juego

**Endpoint:** `POST /api/admin/modes`

```json
{
  "name": "Animales Salvajes",
  "description": "Juega con animales de la selva y el bosque",
  "words": ["León", "Tigre", "Elefante", "Jirafa", "Mono", "Oso", "Lobo", "Águila"]
}
```

### Listar Modos

**Endpoint:** `GET /api/admin/modes`

### Actualizar Modo

**Endpoint:** `PUT /api/admin/modes/:id`

```json
{
  "name": "Animales Salvajes Actualizado",
  "description": "Nueva descripción",
  "words": ["León", "Tigre", "Elefante"],
  "isActive": true
}
```

### Establecer Modo del Día

**Endpoint:** `PUT /api/admin/modes/:id/set-daily`

Solo un modo puede ser el "Modo del Día" a la vez. Al establecer uno nuevo, el anterior se desmarca automáticamente.

### Eliminar Modo

**Endpoint:** `DELETE /api/admin/modes/:id`

### Modo por Defecto

Si no existe ningún modo del día, el sistema retorna un modo por defecto con 22 palabras básicas.

---

**Última actualización:** Diciembre 2024
**Versión:** 2.0.0
