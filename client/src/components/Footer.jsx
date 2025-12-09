import { Link } from "react-router-dom";
import { Shield, Scale, Heart, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-t border-purple-500/20 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
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
