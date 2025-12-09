import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialWords = [
  // Animales
  { word: 'Perro', category: 'Animales' },
  { word: 'Gato', category: 'Animales' },
  { word: 'Elefante', category: 'Animales' },
  { word: 'León', category: 'Animales' },
  { word: 'Tigre', category: 'Animales' },
  { word: 'Jirafa', category: 'Animales' },
  { word: 'Pingüino', category: 'Animales' },
  { word: 'Delfín', category: 'Animales' },
  { word: 'Águila', category: 'Animales' },
  { word: 'Serpiente', category: 'Animales' },

  // Comida
  { word: 'Pizza', category: 'Comida' },
  { word: 'Hamburguesa', category: 'Comida' },
  { word: 'Tacos', category: 'Comida' },
  { word: 'Sushi', category: 'Comida' },
  { word: 'Chocolate', category: 'Comida' },
  { word: 'Helado', category: 'Comida' },
  { word: 'Pasta', category: 'Comida' },
  { word: 'Ensalada', category: 'Comida' },
  { word: 'Arroz', category: 'Comida' },
  { word: 'Pan', category: 'Comida' },

  // Objetos
  { word: 'Teléfono', category: 'Objetos' },
  { word: 'Computadora', category: 'Objetos' },
  { word: 'Reloj', category: 'Objetos' },
  { word: 'Libro', category: 'Objetos' },
  { word: 'Lápiz', category: 'Objetos' },
  { word: 'Cámara', category: 'Objetos' },
  { word: 'Bicicleta', category: 'Objetos' },
  { word: 'Guitarra', category: 'Objetos' },
  { word: 'Pelota', category: 'Objetos' },
  { word: 'Paraguas', category: 'Objetos' },

  // Lugares
  { word: 'Playa', category: 'Lugares' },
  { word: 'Montaña', category: 'Lugares' },
  { word: 'Bosque', category: 'Lugares' },
  { word: 'Ciudad', category: 'Lugares' },
  { word: 'Hospital', category: 'Lugares' },
  { word: 'Escuela', category: 'Lugares' },
  { word: 'Parque', category: 'Lugares' },
  { word: 'Museo', category: 'Lugares' },
  { word: 'Cine', category: 'Lugares' },
  { word: 'Restaurante', category: 'Lugares' },

  // Profesiones
  { word: 'Doctor', category: 'Profesiones' },
  { word: 'Maestro', category: 'Profesiones' },
  { word: 'Bombero', category: 'Profesiones' },
  { word: 'Policía', category: 'Profesiones' },
  { word: 'Chef', category: 'Profesiones' },
  { word: 'Piloto', category: 'Profesiones' },
  { word: 'Cantante', category: 'Profesiones' },
  { word: 'Pintor', category: 'Profesiones' },
  { word: 'Científico', category: 'Profesiones' },
  { word: 'Arquitecto', category: 'Profesiones' },

  // Deportes
  { word: 'Fútbol', category: 'Deportes' },
  { word: 'Basketball', category: 'Deportes' },
  { word: 'Natación', category: 'Deportes' },
  { word: 'Tenis', category: 'Deportes' },
  { word: 'Béisbol', category: 'Deportes' },
  { word: 'Voleibol', category: 'Deportes' },
  { word: 'Boxeo', category: 'Deportes' },
  { word: 'Atletismo', category: 'Deportes' },
  { word: 'Ciclismo', category: 'Deportes' },
  { word: 'Gimnasia', category: 'Deportes' },

  // Tecnología
  { word: 'Internet', category: 'Tecnología' },
  { word: 'Robot', category: 'Tecnología' },
  { word: 'Wifi', category: 'Tecnología' },
  { word: 'Videojuego', category: 'Tecnología' },
  { word: 'Aplicación', category: 'Tecnología' },
  { word: 'Inteligencia Artificial', category: 'Tecnología' },
  { word: 'Realidad Virtual', category: 'Tecnología' },
  { word: 'Streaming', category: 'Tecnología' },
  { word: 'Podcast', category: 'Tecnología' },
  { word: 'Blockchain', category: 'Tecnología' },

  // Naturaleza
  { word: 'Sol', category: 'Naturaleza' },
  { word: 'Luna', category: 'Naturaleza' },
  { word: 'Estrella', category: 'Naturaleza' },
  { word: 'Arcoíris', category: 'Naturaleza' },
  { word: 'Volcán', category: 'Naturaleza' },
  { word: 'Océano', category: 'Naturaleza' },
  { word: 'Río', category: 'Naturaleza' },
  { word: 'Árbol', category: 'Naturaleza' },
  { word: 'Flor', category: 'Naturaleza' },
  { word: 'Nube', category: 'Naturaleza' },

  // Entretenimiento
  { word: 'Película', category: 'Entretenimiento' },
  { word: 'Serie', category: 'Entretenimiento' },
  { word: 'Canción', category: 'Entretenimiento' },
  { word: 'Concierto', category: 'Entretenimiento' },
  { word: 'Teatro', category: 'Entretenimiento' },
  { word: 'Circo', category: 'Entretenimiento' },
  { word: 'Fiesta', category: 'Entretenimiento' },
  { word: 'Karaoke', category: 'Entretenimiento' },
  { word: 'Magia', category: 'Entretenimiento' },
  { word: 'Baile', category: 'Entretenimiento' },

  // Emociones
  { word: 'Felicidad', category: 'Emociones' },
  { word: 'Tristeza', category: 'Emociones' },
  { word: 'Miedo', category: 'Emociones' },
  { word: 'Enojo', category: 'Emociones' },
  { word: 'Sorpresa', category: 'Emociones' },
  { word: 'Amor', category: 'Emociones' },
  { word: 'Nostalgia', category: 'Emociones' },
  { word: 'Esperanza', category: 'Emociones' },
  { word: 'Aburrimiento', category: 'Emociones' },
  { word: 'Entusiasmo', category: 'Emociones' },
];

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - comentar si no quieres borrar)
  // await prisma.word.deleteMany();
  // await prisma.wordSuggestion.deleteMany();

  // Insertar palabras iniciales
  for (const wordData of initialWords) {
    await prisma.word.upsert({
      where: { word: wordData.word },
      update: {},
      create: {
        word: wordData.word,
        category: wordData.category,
        weight: 100, // Peso inicial neutral
        is_active: true,
      },
    });
  }

  console.log(`✅ ${initialWords.length} palabras insertadas correctamente`);

  // Mostrar estadísticas
  const totalWords = await prisma.word.count();
  const categories = await prisma.word.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log(`\n📊 Estadísticas:`);
  console.log(`   Total de palabras: ${totalWords}`);
  console.log(`   Categorías:`);
  categories.forEach(cat => {
    console.log(`     - ${cat.category}: ${cat._count} palabras`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error durante el seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
