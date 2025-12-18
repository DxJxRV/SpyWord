import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Shield } from "lucide-react";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "../data/legalData";

export default function LegalPages({ type }) {
  const navigate = useNavigate();
  const data = type === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const Icon = type === 'privacy' ? Shield : Scale;

  // Cambiar título de la página
  useEffect(() => {
    document.title = type === 'privacy'
      ? "SpyWord - Política de Privacidad"
      : "SpyWord - Términos de Servicio";
    return () => {
      document.title = "SpyWord";
    };
  }, [type]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-purple-500/20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span>Volver al inicio</span>
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-xl">
              <Icon size={32} />
            </div>
            <h1 className="text-4xl font-bold">{data.title}</h1>
          </div>
          <p className="text-gray-400">
            Última actualización: {data.lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {data.content.map((section, index) => (
            <section key={index} className="space-y-4">
              <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                {section.heading}
              </h2>
              <div className="prose prose-invert max-w-none">
                {section.text.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-gray-300 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-16 p-6 bg-purple-900/20 border border-purple-500/30 rounded-xl">
          <p className="text-sm text-gray-400 text-center">
            Si tienes preguntas sobre {data.title.toLowerCase()}, contáctanos en{' '}
            <a href="mailto:legal@impostorword.com" className="text-purple-400 hover:text-purple-300">
              legal@impostorword.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
