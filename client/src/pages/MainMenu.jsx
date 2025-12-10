import { useNavigate, useLocation } from "react-router-dom";
import { Users, Star, Smartphone } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { getUserName } from "../utils/nameGenerator";
import { toast } from "sonner";
import AppHeader from "../components/AppHeader";
import AdPlaceholder from "../components/AdPlaceholder";
import { useAuth } from "../contexts/AuthContext";

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dailyMode, setDailyMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const isJoining = useRef(false); // Flag to prevent concurrent joins
  const { isPremium } = useAuth();

  // Auto-join feature: detect ?join=CODIGO parameter
  useEffect(() => {
    let cancelled = false;

    // Con hash routing, los parámetros están en location.hash, no en location.search
    const hash = location.hash; // Ej: "#/?join=8EBIRH"
    const queryStart = hash.indexOf('?');

    if (queryStart !== -1) {
      const queryString = hash.substring(queryStart + 1); // "join=8EBIRH"
      const searchParams = new URLSearchParams(queryString);
      const joinCode = searchParams.get('join');

      if (joinCode) {
        const roomId = joinCode.trim().toUpperCase();
        const sessionKey = `joined_${roomId}`;

        // Check if already joined in this session
        const alreadyJoined = sessionStorage.getItem(sessionKey);
        if (alreadyJoined) {
          console.log(`⚠️ Ya se unió a ${roomId} en esta sesión, navegando directamente`);
          navigate(`/room/${roomId}`, { replace: true });
          return;
        }

        // Prevent concurrent join attempts
        if (isJoining.current) {
          console.log(`⚠️ Ya hay un intento de unirse en progreso, ignorando`);
          return;
        }

        isJoining.current = true;

        // Intentar unirse automáticamente
        const autoJoin = async () => {
          setLoading(true);
          try {
            const playerName = getUserName();
            await api.post(`/rooms/${roomId}/join`, { playerName });

            // Check if effect was cancelled (component unmounted or effect re-ran)
            if (cancelled) {
              console.log(`⚠️ Operación de unirse cancelada para ${roomId}`);
              return;
            }

            // Mark as joined in session
            sessionStorage.setItem(sessionKey, 'true');

            toast.success("¡Te uniste a la sala!");
            navigate(`/room/${roomId}`, { replace: true });
            if (navigator.vibrate) navigator.vibrate(40);
          } catch (error) {
            if (cancelled) return;

            console.error("Error al unirse:", error);
            toast.error("No se pudo unir a la sala. Verifica el código.");
            // Don't mark as joined on error
            // Limpiar el parámetro join del URL y volver al home
            navigate('/', { replace: true });
          } finally {
            if (!cancelled) {
              setLoading(false);
              isJoining.current = false;
            }
          }
        };

        autoJoin();
      }
    }

    // Cleanup function
    return () => {
      cancelled = true;
    };
  }, [location.hash, navigate]);

  useEffect(() => {
    // Fetch el modo del día
    const fetchDailyMode = async () => {
      try {
        const res = await api.get('/modes/daily');
        setDailyMode(res.data);
      } catch (error) {
        console.error("Error al cargar modo del día:", error);
      }
    };
    fetchDailyMode();
  }, []);

  return (
    <>
      <AppHeader />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
        <div className="max-w-md w-full space-y-6">
          {/* Botones de modo de juego */}
          <div className="space-y-3">
            {/* Juego Online */}
            <button
              onClick={() => navigate('/online')}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-6 py-4 rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users size={32} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">Juego Online</p>
                  <p className="text-sm text-emerald-100 opacity-90">Juega con amigos en tiempo real</p>
                </div>
              </div>
              <span className="text-3xl group-hover:translate-x-1 transition-transform">→</span>
            </button>

            {/* Modo Especial del Día - TEMPORALMENTE OCULTO */}
            {/* <button
              onClick={() => navigate('/daily-mode')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-6 py-4 rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-xl animate-pulse">
                  <Star size={32} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">Modo del Día</p>
                  <p className="text-sm text-amber-100 opacity-90">
                    {dailyMode ? dailyMode.name : 'Cargando...'}
                  </p>
                </div>
              </div>
              <span className="text-3xl group-hover:translate-x-1 transition-transform relative z-10">→</span>
            </button> */}

            {/* Pasa y Juega */}
            <button
              onClick={() => navigate('/pass-and-play')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-6 py-4 rounded-2xl text-xl font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Smartphone size={32} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold">Pasa y Juega</p>
                  <p className="text-sm text-purple-100 opacity-90">Modo local, 1 dispositivo</p>
                </div>
              </div>
              <span className="text-3xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* Banner Publicitario */}
          <div className="flex justify-center w-full mt-8">
            <AdPlaceholder isPremium={isPremium} format="horizontal" />
          </div>

          {/* Info adicional */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-xs">
              Versión 2.0 • Hecho con ❤️ para jugar con amigos
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
