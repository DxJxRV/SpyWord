import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Crown, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { authApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Refrescar el JWT y el contexto con datos actualizados de la base de datos
    const refreshAuth = async () => {
      try {
        await authApi.post('/auth/refresh');
        await refreshUser();
        console.log('✅ Token y contexto refrescados con estado Premium actualizado');
      } catch (error) {
        console.error('Error al refrescar token:', error);
      }
    };

    refreshAuth();
  }, [refreshUser]);

  useEffect(() => {
    // Countdown para redirigir automáticamente
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Recargar la página completa para que AppHeader obtenga el nuevo estado
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Animación de éxito */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          <div className="relative flex items-center justify-center">
            <CheckCircle2
              className="text-emerald-400 animate-bounce"
              size={80}
            />
          </div>
        </div>

        {/* Mensaje principal */}
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
          ¡Bienvenido a Premium!
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          Tu pago se ha procesado exitosamente
        </p>

        {/* Beneficios activados */}
        <div className="bg-gray-900/50 border border-amber-500/30 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="text-amber-400" size={24} />
            <h2 className="text-2xl font-bold">Beneficios Activados</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold">Sin anuncios</p>
                <p className="text-sm text-gray-400">
                  Disfruta sin interrupciones
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold">Premium Pass</p>
                <p className="text-sm text-gray-400">
                  Tus salas sin anuncios para todos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold">Insignia Premium</p>
                <p className="text-sm text-gray-400">Badge dorado activado</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold">Acceso prioritario</p>
                <p className="text-sm text-gray-400">A nuevas funciones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de sesión */}
        {sessionId && (
          <p className="text-xs text-gray-500 mb-8">
            ID de sesión: {sessionId}
          </p>
        )}

        {/* Botones de acción */}
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = "/"}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
          >
            <Crown size={20} />
            Comenzar a Jugar
            <ArrowRight size={20} />
          </button>

          <p className="text-sm text-gray-400">
            Redirigiendo automáticamente en{" "}
            <span className="font-bold text-amber-400">{countdown}</span>{" "}
            segundos...
          </p>
        </div>

        {/* Mensaje de agradecimiento */}
        <div className="mt-12 p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-gray-300">
            <span className="text-purple-400 font-semibold">
              ¡Gracias por apoyar ImpostorWord!
            </span>
            <br />
            Tu contribución nos ayuda a seguir mejorando el juego y añadiendo
            nuevas funciones.
          </p>
        </div>
      </div>
    </div>
  );
}
