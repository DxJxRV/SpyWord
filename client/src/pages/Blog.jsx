import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

const blogArticles = {
  "01-poder-cognitivo-juegos-palabras": {
    title: "El Poder Cognitivo de los Juegos de Palabras: Cómo Fortalecen tu Mente",
    description: "Explora cómo los juegos de palabras activan múltiples áreas de tu cerebro, mejoran memoria, velocidad de procesamiento, y creación de estrategia.",
    date: "Diciembre 2025",
    readTime: "12 min",
    slug: "01-poder-cognitivo-juegos-palabras"
  },
  "02-vocabulario-activo-pasivo": {
    title: "Vocabulario Activo vs Pasivo: Por Qué Tu Cerebro Necesita Ambos",
    description: "Profundiza en la distinción entre palabras que reconoces y palabras que usas.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "02-vocabulario-activo-pasivo"
  },
  "03-competencia-juegos-palabras": {
    title: "La Competencia en Juegos de Palabras: Cómo la Rivalidad Mejora el Aprendizaje",
    description: "Analiza la psicología de jugar contra otras personas.",
    date: "Diciembre 2025",
    readTime: "10 min",
    slug: "03-competencia-juegos-palabras"
  },
  "04-creatividad-pensamiento-lateral": {
    title: "Desbloquear la Creatividad Lingüística: Pensamiento Lateral en Juegos de Palabras",
    description: "Examina cómo los juegos de palabras entrenan pensamiento lateral.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "04-creatividad-pensamiento-lateral"
  },
  "05-pausa-mental-productiva": {
    title: "La Pausa Mental Productiva: Por Qué los Juegos de Palabras Son Descanso Mejor que el Desplazamiento",
    description: "Contrasta descanso genuino con entumecimiento pasivo.",
    date: "Diciembre 2025",
    readTime: "10 min",
    slug: "05-pausa-mental-productiva"
  },
  "06-aprendizaje-idiomas": {
    title: "Aprendizaje de Idiomas a Través de Juegos: Una Ruta Alternativa a Fluencia",
    description: "Presenta los juegos de palabras como herramienta de aprendizaje de idiomas.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "06-aprendizaje-idiomas"
  },
  "07-longevidad-cognitiva": {
    title: "Longevidad Cognitiva: Cómo la Actividad Mental Desafiante Protege tu Cerebro del Envejecimiento",
    description: "Profundiza en la neurociencia del envejecimiento cerebral.",
    date: "Diciembre 2025",
    readTime: "12 min",
    slug: "07-longevidad-cognitiva"
  },
  "08-psicologia-competencia-amistosa": {
    title: "La Psicología de la Competencia Amistosa: Construyendo Relaciones Auténticas a Través del Juego",
    description: "Explora cómo la vulnerabilidad compartida en juegos competitivos construye relaciones genuinas.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "08-psicologia-competencia-amistosa"
  },
  "09-diccionario-vivo": {
    title: "El Diccionario Vivo: Cómo los Juegos de Palabras Transforman Tu Relación con el Lenguaje",
    description: "Examina cómo tener relación profunda con el lenguaje es diferente a simplemente conocer palabras.",
    date: "Diciembre 2025",
    readTime: "10 min",
    slug: "09-diccionario-vivo"
  },
  "10-agencia-mental": {
    title: "Desde la Pasividad a la Intención: Cómo los Juegos de Palabras Restauran la Agencia Mental",
    description: "Conluye la serie explorando cómo los juegos ofrecen espacio donde recuperas control total.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "10-agencia-mental"
  },
  "11-como-jugar": {
    title: "Cómo Jugar SpyWord: La Guía Completa del Impostor",
    description: "Aprende la mecánica básica del juego, estrategias para jugadores honestos e Impostores, y cómo dominar SpyWord.",
    date: "Diciembre 2025",
    readTime: "12 min",
    slug: "11-como-jugar"
  },
  "12-modos-de-juego": {
    title: "Seleccionar Modos de Juego en SpyWord: Tu Guía Completa",
    description: "Explora los tres modos principales, modos especiales, y cómo elegir el perfecto para cada situación.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "12-modos-de-juego"
  },
  "13-pasa-y-juega": {
    title: "Pasa y Juega: Cómo Jugar SpyWord Con Un Solo Teléfono",
    description: "Descubre el modo más creativo de SpyWord: pasando un teléfono con emojis, rasguños, y votación grupal.",
    date: "Diciembre 2025",
    readTime: "12 min",
    slug: "13-pasa-y-juega"
  },
  "14-conectar-amigos": {
    title: "Conectar Con Amigos: QR y Compartir",
    description: "Aprende a invitar amigos con códigos QR y enlaces compartibles. Simple, rápido, y efectivo.",
    date: "Diciembre 2025",
    readTime: "11 min",
    slug: "14-conectar-amigos"
  },
  "15-votacion-deduccion": {
    title: "Votación y Deducción: La Psicología de Identificar al Impostor",
    description: "Domina la estrategia oculta: señales para detectar mentirosos, dinámicas de grupo, y tácticas ganadores.",
    date: "Diciembre 2025",
    readTime: "12 min",
    slug: "15-votacion-deduccion"
  }
};

// Contenido embedido de los artículos (para SEO)
const articleContents = {
  "01-poder-cognitivo-juegos-palabras": `# El Poder Cognitivo de los Juegos de Palabras: Cómo Fortalecen tu Mente

Cuando pensamos en entretenimiento digital, a menudo imaginamos pantallas brillantes y actividades pasivas. Pero existe una categoría especial de juegos que hace exactamente lo opuesto: te engancha mientras entrena tu cerebro.

## La Neuroquímica del Juego de Palabras

Cuando juegas un juego de palabras, tu cerebro activa simultáneamente múltiples áreas. La corteza prefrontal es responsable de la toma de decisiones estratégicas. El área de Broca es centro del lenguaje. La corteza parietal está involucrada en el razonamiento espacial.

Lo fascinante es que esta activación no siente como "trabajo mental". El juego proporciona recompensas inmediatas que mantienen tu mente comprometida.

Un estudio publicado en JAMA Psychiatry demostró que actividades cognitivas estimulantes pueden retrasar el deterioro cognitivo hasta en 7.5 años. Pero el beneficio no es exclusivo de la edad avanzada: personas de todas las edades mejoran su velocidad de procesamiento mental.

## Mejora del Vocabulario

Los juegos de palabras no solo exponen a los jugadores a nuevas palabras. Crean una reconexión neuronal profunda. Cuando intentas recordar una palabra, tu cerebro accede a redes de memoria semántica y establece conexiones con palabras relacionadas.

Esto significa que no solo aprendes palabras, sino que comprendes sus relaciones. Entiendes por qué una palabra es sinónimo de otra y cómo se conecta con conceptos más amplios.

En aplicaciones bien diseñadas, este aprendizaje ocurre de forma orgánica. No necesitas estudiar vocabulario. El juego te enseña a través de la repetición con propósito y la recompensa inmediata.`,
  "02-vocabulario-activo-pasivo": `# Vocabulario Activo vs Pasivo: Por Qué Tu Cerebro Necesita Ambos

Conoces miles de palabras. Las reconoces cuando las lees o las escuchas. Pero hay una diferencia radical entre reconocer una palabra y poder usarla fluidamente en tu lenguaje cotidiano.

## Definiendo los Territorios

Tu vocabulario pasivo son las palabras que comprendes cuando las escuchas o las lees, pero no las usas espontáneamente en tu lenguaje. Tu vocabulario activo son las palabras que utilizas regularmente en tu escritura y conversación.

La mayoría de las personas tienen un vocabulario pasivo 3-5 veces más grande que su vocabulario activo. Un hablante nativo de español puede reconocer 20,000 palabras, pero usar activamente quizás 5,000 en su vida diaria.

Este no es un fracaso. Es simplemente cómo funciona el cerebro humano bajo la presión del tiempo real.`,
  "03-competencia-juegos-palabras": `# La Competencia en Juegos de Palabras: Cómo la Rivalidad Mejora el Aprendizaje

Existe una diferencia psicológica fundamental entre jugar contra la máquina y jugar contra otra persona. Ambos pueden ser entretenidos, pero solo uno activa ciertas partes de tu cerebro.

## La Psicología de la Competencia

Cuando juegas contra la máquina, la experiencia es predecible. Cuando juegas contra una persona, todo cambia. Esa persona tiene un nivel de habilidad que puede variar, preferencias estratégicas personales, y la capacidad de comunicarse.

Esta complejidad impredecible crea un estado mental diferente. La activación de la dopamina es más alta cuando el resultado es verdaderamente incierto.

## El Fenómeno de la Presencia del Otro

Los psicólogos sociales han documentado un efecto llamado "social facilitation". Cuando otros nos observan, mejoramos en tareas que ya sabemos hacer bien.`,
  "04-creatividad-pensamiento-lateral": `# Desbloquear la Creatividad Lingüística: Pensamiento Lateral en Juegos de Palabras

El verdadero juego de palabras es lateral, inesperado, creativo. Es el momento en que tu cerebro saca una palabra que ni siquiera sabías que tenía en su vocabulario.

## Qué Es el Pensamiento Lateral

El término "pensamiento lateral" fue acuñado por Edward de Bono. Se refiere a resolver problemas mediante razonamiento indirecto y no convencional.

Pensamiento lineal: 1 → 2 → 3 → 4 (solución). Cada paso lleva lógicamente al siguiente.

Pensamiento lateral: Consideras opciones inesperadas y encuentras una ruta a la solución que nadie había considerado.

## El Rol de los Patrones Neurales

Tu cerebro constantemente busca patrones. Pero está optimizado para patrones frecuentes.`,
  "05-pausa-mental-productiva": `# La Pausa Mental Productiva: Por Qué los Juegos de Palabras Son Descanso Mejor que el Desplazamiento

Cuando pensamos en entretenimiento digital durante una pausa, a menudo imaginamos desplazamiento sin rumbo. Pero existe una diferencia radical entre descanso genuino y entumecimiento pasivo.

## Cómo el Descanso Verdadero Difiere del Entumecimiento

Los neurocientíficos tienen una manera específica de pensar sobre descanso mental. No es simplemente "no hacer nada". El descanso óptimo ocurre cuando tu cerebro no está en modo de estrés pero sigue activo.

Desplazarse a través de redes sociales falla en varios criterios. Tu cerebro está motivado por dopamina sintética, y es adictivo, no restaurativo.

Los juegos de palabras funcionan de manera opuesta. Tu cerebro está activo, el tipo de pensamiento es cognitivamente demandante en forma diferente, y la motivación es intrínseca.`,
  "06-aprendizaje-idiomas": `# Aprendizaje de Idiomas a Través de Juegos: Una Ruta Alternativa a Fluencia

Si alguna vez has intentado aprender un idioma, sabes la frustración. Las aplicaciones de aprendizaje prometen fluidez en "minutos al día", pero cuando intentas hablar con un nativo, tu cerebro se congela.

## El Fracaso del Aprendizaje Tradicional

Las aplicaciones de aprendizaje típicas utilizan un modelo de "lecciones estructuradas": aprende vocabulario, aprende reglas gramaticales, traduce frases, repite.

El problema es que este modelo no crea necesidad cognitiva real. No hay razón para recordar una palabra más allá del requisito artificial.

## El Modelo de Aprendizaje Sumergido Simulado

Un juego de palabras en un idioma extranjero crea lo que podría llamarse "inmersión simulada". No es verdadera inmersión, pero es lo más cercano que puedes obtener sin viajar.`,
  "07-longevidad-cognitiva": `# Longevidad Cognitiva: Cómo la Actividad Mental Desafiante Protege tu Cerebro del Envejecimiento

A los 30 años, muchas personas comienzan un lento pero implacable declive cognitivo. Tu velocidad de procesamiento disminuye. Tu memoria de trabajo se contrae. Tu capacidad para aprender cosas nuevas requiere más esfuerzo.

No es inevitable.

## La Neurociencia del Envejecimiento Cerebral

Cuando envejeces, varias cosas ocurren en tu cerebro. Hay declive en velocidad de procesamiento. Tu cerebro literalmente se encoge, particularmente en hipocampo y corteza prefrontal. Hay disminución de plasticidad y reducción de dopamina.

Estos cambios son normales. Pero su ritmo puede ser modificado sustancialmente.

## La Teoría del "Use It or Lose It"

La teoría fundamental en neurociencia del envejecimiento es simple: las capacidades que practicas se mantienen y mejoran. Las capacidades que no practicas se desvanecen.`,
  "08-psicologia-competencia-amistosa": `# La Psicología de la Competencia Amistosa: Construyendo Relaciones Auténticas a Través del Juego

Vivimos en una era de conexión digital paradójica. Estamos conectados a más personas que nunca, pero muchas personas reportan mayor soledad.

Una razón es que muchas interacciones digitales están basadas en comparación o consumo pasivo.

## Qué Distingue la Competencia Amistosa

La competencia puede ser destructiva o constructiva. La diferencia está en el contexto y las reglas.

Una competencia destructiva tiene un ganador y perdedor definitivo, busca demostrar superioridad, y el resultado define tu valor.

Una competencia amistosa tiene un resultado temporal, el objetivo es mejorar ambos a través del desafío, el proceso es más importante que el resultado, y hay respeto mutuo después.`,
  "09-diccionario-vivo": `# El Diccionario Vivo: Cómo los Juegos de Palabras Transforman Tu Relación con el Lenguaje

Ves una palabra en el periódico. La reconoces, pero no estás completamente seguro de su significado preciso. Luego simplemente continúas.

Este es el estado de la mayoría de los hablantes con su propio idioma. Tenemos relación vaga y pasiva con muchas palabras.

## La Diferencia Entre Conocimiento de Palabra y Relación de Palabra

Aquí está un distinción fundamental: conocimiento de palabra es cuando sé qué significa. Relación con palabra es cuando conozco la palabra en profundidad.

La mayoría de la gente educada tiene conocimiento de miles de palabras. Pero relación genuina con cientos.

La diferencia es enorme cuando intenta comunicar.`,
  "10-agencia-mental": `# Desde la Pasividad a la Intención: Cómo los Juegos de Palabras Restauran la Agencia Mental

Muchos de nosotros pasamos el día como receptores pasivos. Recibimos emails. Consumimos contenido. Vemos notificaciones. Respondemos a demandas externas.

Al final del día, tu mente se siente pasiva. Cansada. Agotada. No porque hayas hecho trabajo difícil, sino porque has sido constantemente reactivo.

## Qué Es Agencia Mental

Agencia es sentido de control sobre tu propia mente y acciones. Es capacidad de elegir dónde enfocas atención, generar ideas propias, tomar decisiones basadas en tu propio criterio, y experimentar consecuencias de tus decisiones.

Cuando tienes agencia, te sientes en control. Cuando careces de agencia, eres conducido por fuerzas externas.`,
  "11-como-jugar": `# Cómo Jugar SpyWord: La Guía Completa del Impostor

SpyWord es un juego de deducción social donde la estrategia, la psicología y tu capacidad de engaño son tan importantes como el conocimiento. Si nunca has jugado, puede parecer complicado. Pero una vez que entiendes los conceptos básicos, descubrirás por qué es tan adictivo.

Este artículo te guiará a través de todo lo que necesitas saber para jugar tu primera partida y, más importante, para ganar.

## La Mecánica Básica del Juego

SpyWord se juega con múltiples jugadores donde cada uno recibe una palabra o imagen secreta. Pero aquí está el giro: **uno de los jugadores es el Impostor**.

El Impostor no recibe la palabra secreta. No sabe qué palabra están tratando de adivinar los otros jugadores.

Su misión es simple pero desafiante: **convencer a los otros jugadores de que sí sabe la palabra, sin que descubran que es el Impostor**.

## Cómo Se Juega Una Ronda

**El Setup Inicial**

Todos los jugadores excepto uno reciben la misma palabra o imagen. Esa palabra podría ser "perro", "Internet", "amor", o cualquier concepto.

El Impostor recibe una pantalla diferente: sabe que es el Impostor, pero no conoce la palabra secreta. Solo sabe el tema general (si es un animal, objeto, concepto abstracto, etc.).

**La Fase de Palabras**

El juego comienza. Cada jugador, por turnos, debe decir **una palabra que esté relacionada con la palabra secreta**. Esta palabra debe ser lo suficientemente vaga para que parezca que saben el concepto, pero también estratégica.

Por ejemplo, si la palabra secreta es "biblioteca":
- Un jugador honesto podría decir "libros"
- Otro podría decir "silencio"
- Otro podría decir "conocimiento"

El Impostor, sin saber que la palabra es "biblioteca", debe escuchar las palabras de los otros y deducir lo que podría ser. Luego debe decir su propia palabra que suene como si realmente supiera.

**El Factor Psicológico**

Aquí es donde el juego se vuelve fascinante: **todos están tratando de engañarse mutuamente**.`,
  "12-modos-de-juego": `# Seleccionar Modos de Juego en SpyWord: Tu Guía Completa

Uno de los aspectos más poderosos de SpyWord es su variedad. No hay una forma única de jugar. Dependiendo de dónde estés, con quién estés, y cuánto tiempo tengas, hay un modo de juego perfecto para ti.

Pero con tantas opciones, elegir puede ser abrumador. Este artículo te guiará a través de cómo seleccionar entre los diferentes modos de juego y cuándo jugar cada uno.

## La Pantalla Principal: Tu Centro de Modos de Juego

Cuando abres SpyWord, lo primero que ves es la pantalla principal (Home). Esta pantalla es tu centro de control para seleccionar cómo quieres jugar.

Verás **tres botones principales** que destacan:

1. **Online** - Juega contra otros en tiempo real
2. **Pasa y Juega** - Juega con amigos en el mismo teléfono
3. **Daily Mode** - Tu reto diario rápido

Estos tres son los modos más populares y accesibles. Pero SpyWord tiene más.

## El Botón "Más Modos"

Si scrolleas hacia abajo o buscas un botón que dice "Más Modos" o "Especial", encontrarás un botón adicional.

Al hacer clic en este botón, se abre un **listado completo de todos los modos de juego disponibles**. Aquí puedes ver:

- Modos temáticos
- Variaciones especiales
- Modos de desafío
- Modos experimentales`,
  "13-pasa-y-juega": `# Pasa y Juega: Cómo Jugar SpyWord Con Un Solo Teléfono

No siempre tienes múltiples dispositivos. A veces estás en una reunión, un viaje, o una fiesta con amigos, y solo hay un teléfono entre todos.

Aquí es donde "Pasa y Juega" brilla. Es uno de los modos más creativos de SpyWord, diseñado específicamente para grupos que comparten un dispositivo.

Es como un juego de mesa tradicional, pero con la inteligencia de un juego digital. Y es sorprendentemente estratégico.

## Qué Es Pasa y Juega

Pasa y Juega es un modo donde:

- **Un teléfono pasa entre jugadores**
- **Cada jugador recibe su información privadamente**
- **Nadie puede ver lo que otros ven**
- **La votación es abierta y grupal**

Es perfecto para 3-8 personas. Funciona bien en reuniones, viajes en coche, campamentos, o cualquier situación donde un dispositivo debe servir a múltiples personas.

## Cómo Configurar el Juego

**Paso 1: Selecciona Pasa y Juega**

En la pantalla principal, haz clic en "Pasa y Juega".

**Paso 2: Selecciona Número de Jugadores**

Se te pide que selecciones cuántos jugadores participarán. Las opciones típicas son 3, 4, 5, 6, 7, u 8 jugadores.`,
  "14-conectar-amigos": `# Conectar Con Amigos: QR y Compartir

Uno de los desafíos al jugar en línea es ser un lazo: invitar a tus amigos.

No quieres enviar URLs largas y feas. No quieres que tus amigos se pierdan navegando. Necesitas que sea tan simple como apuntar, escanear, o compartir.

SpyWord lo entiende. Por eso incluye dos formas inteligentes de conectar con amigos: **códigos QR** y **enlaces compartibles**.

Ambas transforman la invitación de múltiples pasos en un gesto.

## Método 1: Código QR

### Qué Es Un Código QR

Un código QR (Quick Response) es una matriz de píxeles que tu cámara puede leer. Fue inventado en los años 1990 pero se ha vuelto ubicuo en los últimos años.

Contiene información—en este caso, una URL a tu sala de juego.

### Dónde Encontrar El Código QR en SpyWord

Cuando estás en una sala de juego esperando a más jugadores, verás la pantalla de sala.

En la esquina de esta pantalla (típicamente inferior derecha o superior derecha, dependiendo de tu dispositivo) hay un **botón de QR** o **icono de QR**.`,
  "15-votacion-deduccion": `# Votación y Deducción: La Psicología de Identificar al Impostor

SpyWord tiene un secreto oscuro.

No es sobre la palabra. No es sobre el vocabulario. No es sobre qué tan rápido puedas pensar.

Es sobre tu capacidad para leer a otras personas.

La palabra es una MacGuffin. Un objeto para que todos hablen. El verdadero juego es la votación: ¿quién es el Impostor?

Aquí es donde SpyWord se vuelve psicológico. Y aquí es donde ganan los jugadores inteligentes.

## Por Qué La Votación Importa

En una partida típica de SpyWord:

- Los jugadores hablan durante 5-10 minutos
- Se hacen unas pocas rondas de proposiciones de palabras
- Luego llega el momento de la verdad: **votamos**

Podrías haber dicho palabras perfectas. Podrías haber engañado a casi todos. Pero si alguien te acusa en la votación, todo cambio.

La votación es donde se decide realmente el juego.`
};

function MarkdownToHtml(content) {
  if (!content || typeof content !== 'string') {
    return '<p class="text-gray-300">Contenido no disponible</p>';
  }

  const lines = content.split("\n");
  let html = "";
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1 class="text-3xl font-bold text-white mt-8 mb-4">${trimmed.slice(2)}</h1>`;
    } else if (trimmed.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2 class="text-2xl font-bold text-white mt-6 mb-3">${trimmed.slice(3)}</h2>`;
    } else if (trimmed.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3 class="text-xl font-bold text-white mt-4 mb-2">${trimmed.slice(4)}</h3>`;
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        html += "<ul class='list-disc list-inside space-y-2 my-4'>";
        inList = true;
      }
      html += `<li class="text-gray-300">${trimmed.slice(2)}</li>`;
    } else if (trimmed === "") {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<p class='mt-4 mb-2'></p>";
    } else if (trimmed) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p class="text-gray-300 leading-relaxed my-3">${trimmed}</p>`;
    }
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

export default function Blog() {
  const { slug } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (slug) {
      // Simular carga de contenido (en production se traería del servidor/CMS)
      setTimeout(() => {
        setContent(articleContents[slug] || `# ${blogArticles[slug]?.title || "Artículo no encontrado"}\n\nContenido del artículo...`);
        setLoading(false);
      }, 100);
    }
  }, [slug]);

  // Vista de artículo individual
  if (slug) {
    const article = blogArticles[slug];

    if (!article) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-purple-950 to-blue-950 p-6">
          <div className="max-w-4xl mx-auto">
            <Link
              to="/blog"
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8"
            >
              <ArrowLeft size={18} />
              Volver al Blog
            </Link>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-white">Artículo no encontrado</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 to-blue-950 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver al Blog
          </Link>

          {/* Article Header */}
          <article className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-8 mb-8">
            <div className="mb-4">
              <span className="text-purple-400 text-sm font-medium">{article.date}</span>
              <span className="text-gray-500 text-sm mx-2">•</span>
              <span className="text-gray-400 text-sm">{article.readTime} de lectura</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              {article.title}
            </h1>
            <p className="text-xl text-gray-300">
              {article.description}
            </p>
          </article>

          {/* Article Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
              <p className="text-gray-400 mt-4">Cargando artículo...</p>
            </div>
          ) : content ? (
            <article className="bg-purple-900/10 border border-purple-500/10 rounded-lg p-8">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: MarkdownToHtml(content)
                }}
              />
            </article>
          ) : (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-white">No se pudo cargar el contenido del artículo</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-purple-500/20">
            <div className="flex gap-4">
              <Link
                to="/blog"
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Ver todos los artículos
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de listado de artículos
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 to-blue-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            Volver al Inicio
          </Link>

          <h1 className="text-4xl font-bold text-white mb-4">
            Blog de SpyWord
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Explora artículos sobre crecimiento cognitivo, juegos de palabras, y cómo mejorar tu mente a través del juego.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="space-y-12">
          {/* Guides Section */}
          <div>
            <h2 className="text-2xl font-bold text-purple-300 mb-6">📚 Guías de Juego</h2>
            <div className="grid gap-6">
              {['11-como-jugar', '12-modos-de-juego', '13-pasa-y-juega', '14-conectar-amigos', '15-votacion-deduccion'].map((slug) => {
                const article = blogArticles[slug];
                return (
                  <Link
                    key={slug}
                    to={`/blog/${slug}`}
                    className="group bg-purple-900/20 border border-purple-500/20 hover:border-purple-500/50 rounded-lg p-6 transition-all hover:bg-purple-900/30"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-400 mb-4">
                          {article.description}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime} de lectura</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Interesting Articles Section */}
          <div>
            <h2 className="text-2xl font-bold text-blue-300 mb-6">✨ Artículos Interesantes</h2>
            <div className="grid gap-6">
              {['01-poder-cognitivo-juegos-palabras', '02-vocabulario-activo-pasivo', '03-competencia-juegos-palabras', '04-creatividad-pensamiento-lateral', '05-pausa-mental-productiva', '06-aprendizaje-idiomas', '07-longevidad-cognitiva', '08-psicologia-competencia-amistosa', '09-diccionario-vivo', '10-agencia-mental'].map((slug) => {
                const article = blogArticles[slug];
                return (
                  <Link
                    key={slug}
                    to={`/blog/${slug}`}
                    className="group bg-blue-900/20 border border-blue-500/20 hover:border-blue-500/50 rounded-lg p-6 transition-all hover:bg-blue-900/30"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-400 mb-4">
                          {article.description}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.readTime} de lectura</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-purple-500/20 text-center">
          <p className="text-gray-400">
            Nuevos artículos publicados regularmente. Vuelve pronto para más contenido.
          </p>
        </div>
      </div>
    </div>
  );
}
