import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Code, Users, Sparkles } from "lucide-react";
import { ABOUT_US } from "../data/legalData";

export default function About() {
  const navigate = useNavigate();

  const icons = [
    { component: Heart, color: "from-red-500 to-pink-500" },
    { component: Code, color: "from-blue-500 to-cyan-500" },
    { component: Users, color: "from-green-500 to-emerald-500" },
    { component: Sparkles, color: "from-yellow-500 to-orange-500" },
    { component: Heart, color: "from-purple-500 to-violet-500" }
  ];

  // Cambiar título de la página
  useEffect(() => {
    document.title = "SpyWord - Acerca de";
    return () => {
      document.title = "SpyWord";
    };
  }, []);

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
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
              <Heart size={32} />
            </div>
            <h1 className="text-4xl font-bold">{ABOUT_US.title}</h1>
          </div>
          <p className="text-gray-400">
            La historia, filosofía y futuro de Impostor Word
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {ABOUT_US.content.map((section, index) => {
            const IconData = icons[index % icons.length];
            const Icon = IconData.component;

            return (
              <section key={index} className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`bg-gradient-to-br ${IconData.color} p-2 rounded-lg mt-1 flex-shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      {section.heading}
                    </h2>
                    <div className="prose prose-invert max-w-none">
                      {section.text.split('\n\n').map((paragraph, pIndex) => {
                        // Check if it's a heading (starts with **)
                        if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                          return (
                            <h3 key={pIndex} className="text-xl font-semibold text-purple-400 mt-6 mb-3">
                              {paragraph.replace(/\*\*/g, '')}
                            </h3>
                          );
                        }

                        // Check if it's a list item (starts with -)
                        if (paragraph.includes('\n-') || paragraph.startsWith('-')) {
                          const items = paragraph.split('\n').filter(line => line.trim());
                          return (
                            <ul key={pIndex} className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
                              {items.map((item, iIndex) => (
                                <li key={iIndex} className="leading-relaxed">
                                  {item.replace(/^-\s*/, '')}
                                </li>
                              ))}
                            </ul>
                          );
                        }

                        // Regular paragraph
                        return (
                          <p key={pIndex} className="text-gray-300 leading-relaxed mb-4">
                            {paragraph}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 p-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl text-center">
          <Heart className="mx-auto mb-4 text-red-400" size={48} />
          <h3 className="text-2xl font-bold mb-4">¿Listo para Jugar?</h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Únete a miles de jugadores que ya están disfrutando de Impostor Word.
            Es gratis, rápido y divertido. ¿Podrás descubrir al impostor?
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
          >
            Jugar Ahora
          </button>
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            ¿Tienes preguntas o sugerencias?{' '}
            <a href="mailto:contact@impostorword.com" className="text-purple-400 hover:text-purple-300">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
