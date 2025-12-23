import { Link } from "react-router-dom";
import { Shield, Scale, Heart, Github, BookOpen } from "lucide-react";

// Artículos del blog - separados por categoría
const guideArticles = [
  { id: 11, title: "Cómo Jugar SpyWord", slug: "11-como-jugar" },
  { id: 12, title: "Seleccionar Modos de Juego", slug: "12-modos-de-juego" },
  { id: 13, title: "Pasa y Juega", slug: "13-pasa-y-juega" },
  { id: 14, title: "Conectar Con Amigos", slug: "14-conectar-amigos" },
  { id: 15, title: "Votación y Deducción", slug: "15-votacion-deduccion" },
];

const interestingArticles = [
  { id: 1, title: "El Poder Cognitivo de los Juegos", slug: "01-poder-cognitivo-juegos-palabras" },
  { id: 2, title: "Vocabulario Activo vs Pasivo", slug: "02-vocabulario-activo-pasivo" },
  { id: 3, title: "Competencia y Aprendizaje", slug: "03-competencia-juegos-palabras" },
  { id: 4, title: "Creatividad Lingüística", slug: "04-creatividad-pensamiento-lateral" },
  { id: 5, title: "Pausa Mental Productiva", slug: "05-pausa-mental-productiva" },
  { id: 6, title: "Aprendizaje de Idiomas", slug: "06-aprendizaje-idiomas" },
  { id: 7, title: "Longevidad Cognitiva", slug: "07-longevidad-cognitiva" },
  { id: 8, title: "Competencia Amistosa", slug: "08-psicologia-competencia-amistosa" },
  { id: 9, title: "El Diccionario Vivo", slug: "09-diccionario-vivo" },
  { id: 10, title: "Agencia Mental", slug: "10-agencia-mental" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-t border-purple-500/20 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Blog Section */}
        <div className="mb-8 pb-8 border-b border-purple-500/20">
          {/* Guides Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-purple-400" />
              <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
                Guías de Juego
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {guideArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="text-xs text-gray-400 hover:text-purple-400 transition-colors line-clamp-2"
                  title={article.title}
                >
                  {article.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Interesting Articles Section */}
          <div>
            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-4">
              Artículos Interesantes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {interestingArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="text-xs text-gray-400 hover:text-blue-400 transition-colors line-clamp-2"
                  title={article.title}
                >
                  {article.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Impostor Word 🕵️‍♂️
            </h3>
            <p className="text-sm text-gray-400">
              El juego de deducción social donde las palabras importan.
              Encuentra al impostor antes de que sea tarde.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
              Legal
            </h4>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/privacy"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Shield size={16} />
                Política de Privacidad
              </Link>
              <Link
                to="/terms"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Scale size={16} />
                Términos de Servicio
              </Link>
            </nav>
          </div>

          {/* About Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
              Acerca de
            </h4>
            <nav className="flex flex-col space-y-2">
              <Link
                to="/blog"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <BookOpen size={16} />
                Blog
              </Link>
              <Link
                to="/about"
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Heart size={16} />
                Acerca de Nosotros
              </Link>
              <a
                href="mailto:contact@impostorword.com"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Contacto
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-purple-500/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} Impostor Word. Todos los derechos reservados.
            </p>
            <p className="text-xs text-gray-500 text-center md:text-right">
              Hecho con ❤️ para jugar con amigos • Versión 2.0
            </p>
          </div>
        </div>

        {/* AdSense Compliance Note */}
        <div className="mt-4 pt-4 border-t border-purple-500/10">
          <p className="text-xs text-gray-500 text-center">
            Este sitio usa cookies para mejorar tu experiencia. Al usar este sitio, aceptas nuestra{' '}
            <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
              Política de Privacidad
            </Link>
            {' '}y{' '}
            <Link to="/terms" className="text-purple-400 hover:text-purple-300">
              Términos de Servicio
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
