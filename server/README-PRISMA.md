# Sistema de Palabras con Prisma ORM 🎯

## Descripción

Sistema de popularidad de palabras implementado con Prisma ORM que permite:
- Selección ponderada de palabras (palabras populares tienen más probabilidad)
- Actualización automática de popularidad basada en feedback de partidas
- Seguimiento de sugerencias de usuarios
- Estadísticas y análisis de palabras

---

## 📦 Archivos Implementados

```
server/
├── prisma/
│   ├── schema.prisma           # Schema de base de datos
│   ├── seed.js                 # Script para poblar DB con palabras iniciales
│   └── migrations/             # Migraciones automáticas de Prisma
├── services/
│   └── word.service.js         # Servicio con lógica de palabras
└── examples/
    └── word-service-usage.js   # Ejemplos de uso del servicio
```

---

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install prisma @prisma/client
```

### 2. Configurar base de datos

Asegúrate de tener el `DATABASE_URL` en tu archivo `.env`:

```env
DATABASE_URL="mysql://root:rootroot@localhost:3306/spyword"
```

### 3. Ejecutar migración

```bash
npx prisma migrate dev --name init
```

Esto creará las tablas `words` y `word_suggestions` en tu base de datos.

### 4. Poblar base de datos (seed)

```bash
npx prisma db seed
```

Esto insertará 100 palabras iniciales en 10 categorías diferentes.

---

## 📊 Modelos de Base de Datos

### Word (Palabra)

| Campo     | Tipo    | Descripción                                  |
|-----------|---------|----------------------------------------------|
| id        | Int     | ID autoincremental                           |
| word      | String  | Palabra única (máx 100 caracteres)           |
| category  | String  | Categoría de la palabra                      |
| weight    | Int     | Peso/popularidad (default: 100)              |
| is_active | Boolean | Si la palabra está activa (default: true)    |
| createdAt | DateTime| Fecha de creación                            |
| updatedAt | DateTime| Fecha de última actualización                |

**Índices:**
- `(is_active, weight)` - Para selección ponderada eficiente
- `(category)` - Para filtrar por categoría

### WordSuggestion (Sugerencia)

| Campo       | Tipo     | Descripción                              |
|-------------|----------|------------------------------------------|
| id          | Int      | ID autoincremental                       |
| word        | String   | Palabra sugerida                         |
| category    | String?  | Categoría (opcional)                     |
| status      | Enum     | PENDING, APPROVED, REJECTED              |
| submittedAt | DateTime | Fecha de envío                           |

---

## 🔧 Funciones del Servicio

### `getRandomWordWeighted(category?)`

Obtiene una palabra aleatoria usando selección ponderada.

**Parámetros:**
- `category` (opcional): Filtrar por categoría específica

**Retorna:**
```javascript
{
  id: 42,
  word: "Pizza",
  category: "Comida",
  weight: 150
}
```

**Ejemplo:**
```javascript
import { getRandomWordWeighted } from './services/word.service.js';

// Cualquier categoría
const palabra = await getRandomWordWeighted();

// Categoría específica
const palabraComida = await getRandomWordWeighted('Comida');
```

---

### `logWordFeedback(wordId, resultType)`

Registra feedback de una partida y actualiza el peso de la palabra.

**Parámetros:**
- `wordId`: ID de la palabra usada
- `resultType`: Tipo de resultado
  - `'players_won'`: Jugadores ganaron → +5 peso
  - `'impostor_won'`: Impostor ganó → +3 peso
  - `'abandoned'`: Partida abandonada → -10 peso

**Retorna:**
```javascript
{
  id: 42,
  word: "Pizza",
  category: "Comida",
  weight: 155  // Peso actualizado
}
```

**Límites de peso:**
- Mínimo: 10
- Máximo: 500

**Ejemplo:**
```javascript
import { logWordFeedback } from './services/word.service.js';

// Partida completada exitosamente
await logWordFeedback(42, 'players_won');

// Impostor ganó
await logWordFeedback(42, 'impostor_won');

// Partida abandonada
await logWordFeedback(42, 'abandoned');
```

---

### `getTopWords(limit?)`

Obtiene las palabras más populares ordenadas por peso.

**Parámetros:**
- `limit` (opcional): Número de palabras a retornar (default: 20)

**Retorna:**
```javascript
[
  { id: 1, word: "Pizza", category: "Comida", weight: 250 },
  { id: 5, word: "Gato", category: "Animales", weight: 230 },
  // ...
]
```

**Ejemplo:**
```javascript
import { getTopWords } from './services/word.service.js';

const top10 = await getTopWords(10);
```

---

### `getWordStats()`

Obtiene estadísticas generales de palabras.

**Retorna:**
```javascript
{
  totalWords: 100,
  avgWeight: 125,
  maxWeight: 500,
  minWeight: 10
}
```

**Ejemplo:**
```javascript
import { getWordStats } from './services/word.service.js';

const stats = await getWordStats();
console.log(`Hay ${stats.totalWords} palabras activas`);
```

---

## 🎮 Integración en Endpoints

### Endpoint: Iniciar Ronda

```javascript
import { getRandomWordWeighted } from './services/word.service.js';

app.post('/rooms/:roomId/start', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    // Obtener palabra aleatoria ponderada
    const wordData = await getRandomWordWeighted();

    // Asignar impostor
    const players = Array.from(room.players.values());
    const impostorIndex = Math.floor(Math.random() * players.length);

    room.currentWord = wordData.word;
    room.currentWordId = wordData.id; // 🚨 IMPORTANTE: Guardar para feedback
    room.impostorId = players[impostorIndex].id;

    res.json({
      success: true,
      word: wordData.word,
      category: wordData.category
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener palabra' });
  }
});
```

### Endpoint: Finalizar Partida

```javascript
import { logWordFeedback } from './services/word.service.js';

app.post('/rooms/:roomId/finish', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { result } = req.body; // 'players_won' | 'impostor_won' | 'abandoned'

    const room = rooms.get(roomId);

    if (!room?.currentWordId) {
      return res.status(404).json({ error: 'Sala no encontrada' });
    }

    // Registrar feedback
    await logWordFeedback(room.currentWordId, result);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar resultado' });
  }
});
```

### Endpoint: Estadísticas (Opcional)

```javascript
import { getTopWords, getWordStats } from './services/word.service.js';

app.get('/api/stats/words', async (req, res) => {
  try {
    const topWords = await getTopWords(20);
    const stats = await getWordStats();

    res.json({ topWords, stats });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
```

---

## 🧪 Testing

Para probar el servicio:

```bash
node examples/word-service-usage.js
```

Esto ejecutará ejemplos de todas las funciones y mostrará resultados.

---

## 📝 Comandos Útiles de Prisma

```bash
# Ver base de datos en navegador
npx prisma studio

# Regenerar cliente de Prisma
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Ver esquema actual
npx prisma db pull

# Resetear base de datos (⚠️ BORRA TODO)
npx prisma migrate reset
```

---

## 🎲 Algoritmo de Selección Ponderada

El algoritmo usa el método de "ruleta" para seleccionar palabras:

1. Suma total de pesos: `totalWeight = Σ(weight)`
2. Número aleatorio: `random = Math.random() * totalWeight`
3. Itera palabras restando peso hasta que `random <= 0`
4. La palabra que hace `random <= 0` es seleccionada

**Ejemplo:**
- Pizza (peso: 200) → 33% probabilidad
- Gato (peso: 150) → 25% probabilidad
- Sol (peso: 100) → 17% probabilidad
- Árbol (peso: 150) → 25% probabilidad

Total = 600, palabra con mayor peso tiene mayor probabilidad.

---

## 🔄 Flujo Completo de Partida

```mermaid
graph LR
    A[Crear Sala] --> B[getRandomWordWeighted]
    B --> C[Asignar Palabra + Impostor]
    C --> D[Jugar Partida]
    D --> E{Resultado}
    E -->|Jugadores ganan| F[logWordFeedback: players_won]
    E -->|Impostor gana| G[logWordFeedback: impostor_won]
    E -->|Abandonan| H[logWordFeedback: abandoned]
    F --> I[Peso +5]
    G --> J[Peso +3]
    H --> K[Peso -10]
```

---

## 📈 Escalabilidad

- ✅ Índices optimizados para consultas rápidas
- ✅ Pesos limitados (10-500) previenen valores extremos
- ✅ Sin transacciones complejas (updates simples)
- ✅ Caché opcional con `prisma.$queryRaw` si es necesario

---

## 🐛 Troubleshooting

### Error: "Target not found"

**Solución:**
```bash
npx prisma generate
```

### Error: "Connection refused"

**Solución:**
- Verifica que MySQL esté corriendo
- Verifica credenciales en `DATABASE_URL`

### Error: "Migration failed"

**Solución:**
```bash
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

---

## 📚 Recursos

- [Documentación Prisma](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## ✅ Checklist de Implementación

- [x] Instalar Prisma y @prisma/client
- [x] Crear schema.prisma
- [x] Ejecutar migración inicial
- [x] Crear word.service.js
- [x] Crear seed.js con palabras iniciales
- [x] Poblar base de datos
- [x] Crear ejemplos de uso
- [x] Documentar funciones
- [ ] Integrar en endpoints de server.js
- [ ] Probar en producción

---

**Autor:** Sistema de palabras para SpyWord/ImpostorWord
**Fecha:** Diciembre 2024
**Versión:** 1.0.0
