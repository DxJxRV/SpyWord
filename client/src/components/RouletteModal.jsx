import { useState, useEffect, useRef } from "react";
import { CircleDashed, Crown, X, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createPortal } from "react-dom";

const DAILY_PRIZES = [
  { id: 'nothing', label: '❌ Casi 😅', color: 'from-gray-500 to-gray-600', textColor: 'text-gray-300' },
  { id: '10min', label: '⏱️ 10 min sin ads', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-300' },
  { id: '30min', label: '⭐ 30 min premium', color: 'from-purple-500 to-purple-600', textColor: 'text-purple-300' },
  { id: '1day', label: '🕓 1 día premium', color: 'from-amber-500 to-amber-600', textColor: 'text-amber-300' }
];

const PREMIUM_PRIZES = [
  { id: '1week', label: '⏱️ 1 semana sin ads', color: 'from-blue-600 to-blue-700', textColor: 'text-blue-300' },
  { id: '3days', label: '⭐ +3 días premium', color: 'from-purple-600 to-purple-700', textColor: 'text-purple-300' },
  { id: '7days', label: '⭐ +7 días premium', color: 'from-pink-600 to-pink-700', textColor: 'text-pink-300' },
  { id: '1month', label: '💎 1 mes premium', color: 'from-amber-600 to-amber-700', textColor: 'text-amber-300' },
  { id: 'lifetime', label: '👑 Premium de por vida', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-300' }
];

export default function RouletteModal() {
  const { user, setShowLoginModal, showRouletteModal, setShowRouletteModal } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedRouletteType, setSelectedRouletteType] = useState('daily'); // 'daily' or 'premium'
  const tooltipRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date()); // Para actualizar el countdown

  // Cargar estado de la ruleta cuando se abre el modal
  useEffect(() => {
    if (showRouletteModal) {
      loadStatus();
    }
  }, [showRouletteModal]);

  async function loadStatus() {
    setLoading(true);
    try {
      const response = await api.get('/roulette/status');
      setStatus(response.data);
    } catch (error) {
      console.error("Error al cargar estado de ruleta:", error);
      toast.error("Error al cargar estado de ruleta");
    } finally {
      setLoading(false);
    }
  }

  async function handleSpin() {
    // Verificar si está loggeado
    if (!user) {
      setShowRouletteModal(false);
      setShowLoginModal(true);
      toast.info("Inicia sesión para girar la ruleta");
      return;
    }

    // Verificar fichas disponibles según el tipo de ruleta
    const hasTokens = selectedRouletteType === 'daily'
      ? status?.dailyTokens > 0
      : status?.premiumTokens > 0;

    if (!hasTokens) {
      toast.error(
        selectedRouletteType === 'daily'
          ? "Ya usaste tu ficha diaria. Vuelve mañana 🎰"
          : "No tienes fichas de ruleta premium"
      );
      return;
    }

    setSpinning(true);
    setShowResult(false);

    try {
      // Simular animación de spin (3 segundos)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Hacer request al backend
      const response = await api.post('/roulette/spin', {
        type: selectedRouletteType
      });
      const { prize } = response.data;

      setSelectedPrize(prize);
      setShowResult(true);

      // Mostrar toast según el premio
      if (prize.id === 'nothing') {
        toast.info("¡Casi! 😅 Vuelve mañana con Premium", {
          duration: 5000
        });
      } else if (prize.id === 'lifetime') {
        toast.success("¡GANASTE PREMIUM DE POR VIDA! 👑🎉", {
          duration: 8000
        });
      } else {
        toast.success(`¡Ganaste ${prize.label}! 🎉`, {
          duration: 5000
        });
      }

      // Recargar estado
      await loadStatus();
    } catch (error) {
      console.error("Error al girar ruleta:", error);
      toast.error(error.response?.data?.error || "Error al girar ruleta");
    } finally {
      setSpinning(false);
    }
  }

  function handleClose() {
    setShowRouletteModal(false);
    setShowResult(false);
    setSelectedPrize(null);
    setShowTooltip(false);
  }

  function handleLoginClick() {
    setShowRouletteModal(false);
    setShowLoginModal(true);
  }

  // Función para calcular tiempo hasta la próxima ficha (medianoche)
  function getNextTokenTime() {
    const now = currentTime;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, nextDate: tomorrow };
  }

  // Cerrar tooltip al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    }

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // Auto-cerrar resultado después de 3 segundos
  useEffect(() => {
    if (showResult && selectedPrize) {
      const timer = setTimeout(() => {
        setShowResult(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showResult, selectedPrize]);

  // Actualizar el tiempo cada minuto para el countdown
  useEffect(() => {
    if (showRouletteModal) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 60000); // Actualizar cada minuto
      return () => clearInterval(interval);
    }
  }, [showRouletteModal]);

  if (!showRouletteModal) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con tabs y botón cerrar - FIXED en el top */}
        <div className="sticky top-0 bg-gray-900 rounded-t-2xl z-10 border-b border-gray-700">
          {loading ? (
            <div className="px-4 py-4">
              <div className="h-16 bg-gray-800/50 rounded-xl animate-pulse"></div>
            </div>
          ) : (
            <div className="flex items-stretch gap-2 p-4">
              {/* Tab Ruleta Diaria */}
              <button
                onClick={() => {
                  setSelectedRouletteType('daily');
                  setShowResult(false);
                  setSelectedPrize(null);
                }}
                className={`relative flex-1 py-3 px-3 rounded-xl font-semibold transition-all ${
                  selectedRouletteType === 'daily'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <CircleDashed size={20} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">Diaria</span>
                    <span className="text-xs opacity-75">
                      {!user ? '1 ficha/día' : 'Gratis'}
                    </span>
                  </div>
                </div>

                {/* Burbuja con número de fichas */}
                {user && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold border-2 border-gray-900 shadow-lg">
                    {status?.dailyTokens || 0}
                  </div>
                )}
              </button>

              {/* Tab Ruleta Premium */}
              <button
                onClick={() => {
                  setSelectedRouletteType('premium');
                  setShowResult(false);
                  setSelectedPrize(null);
                }}
                className={`relative flex-1 py-3 px-3 rounded-xl font-semibold transition-all ${
                  selectedRouletteType === 'premium'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30'
                    : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Crown size={20} fill="currentColor" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold">Premium</span>
                    <span className="text-xs opacity-75">
                      {!user ? 'Especial' : 'Exclusivo'}
                    </span>
                  </div>
                </div>

                {/* Burbuja con número de fichas */}
                {user && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold border-2 border-gray-900 shadow-lg">
                    {status?.premiumTokens || 0}
                  </div>
                )}
              </button>

              {/* Botón Cerrar */}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors px-3 hover:bg-gray-800 rounded-lg"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pt-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              {/* Ruleta visual */}
              <div className="relative">
                {/* Contenedor de la ruleta */}
                <div className="relative aspect-square max-w-sm mx-auto">
                  {/* Indicador/flecha superior */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                    <div className={`w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] ${
                      selectedRouletteType === 'daily' ? 'border-t-blue-500' : 'border-t-amber-500'
                    }`}></div>
                  </div>

                  {/* Círculo de la ruleta */}
                  <div
                    className={`relative w-full h-full rounded-full border-8 ${
                      selectedRouletteType === 'daily' ? 'border-blue-500 shadow-blue-500/30' : 'border-amber-500 shadow-amber-500/30'
                    } shadow-2xl transition-transform duration-3000 ease-out ${
                      spinning ? 'animate-spin' : ''
                    }`}
                    style={{
                      animation: spinning ? 'spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                    }}
                  >
                    {/* Segmentos de la ruleta */}
                    {(selectedRouletteType === 'daily' ? DAILY_PRIZES : PREMIUM_PRIZES).map((prize, index) => {
                      const prizes = selectedRouletteType === 'daily' ? DAILY_PRIZES : PREMIUM_PRIZES;
                      const rotation = (360 / prizes.length) * index;
                      return (
                        <div
                          key={prize.id}
                          className={`absolute inset-0 flex items-start justify-center pt-8`}
                          style={{
                            transform: `rotate(${rotation}deg)`
                          }}
                        >
                          <div
                            className={`bg-gradient-to-b ${prize.color} px-3 py-1.5 rounded-lg shadow-lg`}
                            style={{
                              transform: `rotate(0deg)`
                            }}
                          >
                            <p className="text-white text-xs font-bold text-center whitespace-nowrap">
                              {prize.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Centro de la ruleta */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`bg-gray-900 rounded-full w-20 h-20 flex items-center justify-center border-4 ${
                        selectedRouletteType === 'daily' ? 'border-blue-500' : 'border-amber-500'
                      } shadow-xl`}>
                        {selectedRouletteType === 'daily' ? (
                          <CircleDashed size={40} className="text-blue-400" />
                        ) : (
                          <Crown size={40} className="text-amber-400" fill="currentColor" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de girar o mensaje de login */}
              <div className="text-center space-y-4">
                {!user ? (
                  // Usuario no logueado
                  <>
                    <p className="text-gray-400 text-sm">
                      Inicia sesión para girar la ruleta
                    </p>
                    <button
                      onClick={handleLoginClick}
                      className="bg-white hover:bg-gray-100 text-gray-900 font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 mx-auto shadow-lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continuar con Google
                    </button>
                  </>
                ) : (
                  // Usuario logueado
                  <button
                    onClick={handleSpin}
                    disabled={spinning || (selectedRouletteType === 'daily' ? status?.dailyTokens <= 0 : status?.premiumTokens <= 0)}
                    className={`px-8 py-3 rounded-xl text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 mx-auto shadow-lg ${
                      (selectedRouletteType === 'daily' ? status?.dailyTokens > 0 : status?.premiumTokens > 0)
                        ? selectedRouletteType === 'daily'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {spinning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Girando...</span>
                      </>
                    ) : (selectedRouletteType === 'daily' ? status?.dailyTokens > 0 : status?.premiumTokens > 0) ? (
                      <>
                        <div className="flex items-center gap-2">
                          {selectedRouletteType === 'daily' ? <CircleDashed size={20} /> : <Crown size={20} fill="currentColor" />}
                          <span>¡Girar Ruleta!</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedRouletteType === 'daily' ? (
                          (() => {
                            const nextTokenTime = getNextTokenTime();
                            return (
                              <span className="flex items-center gap-2">
                                ⏰ Vuelve en {nextTokenTime.hours > 0 && `${nextTokenTime.hours}h `}
                                {nextTokenTime.minutes}m
                              </span>
                            );
                          })()
                        ) : (
                          '❌ Sin fichas'
                        )}
                      </>
                    )}
                  </button>
                )}
              </div>


              {/* Información sobre premios con tooltip */}
              <div className="text-center relative" ref={tooltipRef}>
                <p className="text-gray-400 text-sm">
                  <Sparkles size={14} className="inline text-amber-400 mb-0.5" />{" "}
                  <button
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="text-amber-400 hover:text-amber-300 underline decoration-dotted transition-colors cursor-pointer"
                  >
                    Más información sobre premios
                  </button>
                </p>

                {/* Tooltip */}
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-10 animate-fade-in">
                    {/* Flecha del tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-gray-700"></div>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[7px]">
                        <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-gray-800"></div>
                      </div>
                    </div>

                    {/* Contenido del tooltip */}
                    <div className="space-y-2">
                      {(selectedRouletteType === 'daily' ? DAILY_PRIZES : PREMIUM_PRIZES).map((prize) => (
                        <div key={prize.id} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{prize.label}</span>
                          {prize.id === 'nothing' ? (
                            <span className="text-gray-500 text-xs">La suerte para la próxima</span>
                          ) : prize.id === 'lifetime' ? (
                            <span className="text-yellow-400 text-xs font-medium">¡Premium para siempre!</span>
                          ) : (
                            <span className="text-amber-400 text-xs font-medium">
                              {prize.id === '10min' && '+10 min premium'}
                              {prize.id === '30min' && '+30 min premium'}
                              {prize.id === '1day' && '+1 día premium'}
                              {prize.id === '1week' && '+1 semana sin ads'}
                              {prize.id === '3days' && '+3 días premium'}
                              {prize.id === '7days' && '+7 días premium'}
                              {prize.id === '1month' && '+1 mes premium'}
                            </span>
                          )}
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                        {selectedRouletteType === 'daily'
                          ? '💡 Puedes girar la ruleta diaria una vez al día. El tiempo premium se acumula.'
                          : '💡 Usa tus fichas premium para premios especiales. ¡Puedes ganar premium de por vida!'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mini Modal de Resultado - Aparece encima de todo por 3 segundos */}
      {showResult && selectedPrize && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className={`bg-gradient-to-br ${
            selectedPrize.id === 'lifetime'
              ? 'from-yellow-500 to-amber-500'
              : selectedPrize.id === 'nothing'
              ? 'from-gray-700 to-gray-800'
              : selectedRouletteType === 'daily'
              ? 'from-blue-500 to-blue-600'
              : 'from-amber-500 to-yellow-500'
          } rounded-2xl p-6 shadow-2xl border-4 ${
            selectedPrize.id === 'lifetime'
              ? 'border-yellow-300'
              : selectedPrize.id === 'nothing'
              ? 'border-gray-600'
              : selectedRouletteType === 'daily'
              ? 'border-blue-400'
              : 'border-amber-400'
          } max-w-md mx-4 pointer-events-auto animate-fade-in`}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                {selectedPrize.id === 'nothing' ? '¡Casi lo logras!' : selectedPrize.id === 'lifetime' ? '¡INCREÍBLE!' : '¡Felicidades!'}
              </h3>
              <p className="text-4xl mb-3">{selectedPrize.label}</p>
              {selectedPrize.id === 'nothing' ? (
                <p className="text-gray-200 text-sm">
                  Vuelve mañana con <Crown size={14} className="inline text-yellow-300" /> Premium para más oportunidades
                </p>
              ) : selectedPrize.id === 'lifetime' ? (
                <p className="text-yellow-100 text-base font-medium">
                  ¡Ahora tienes acceso premium para siempre! 🎉
                </p>
              ) : (
                <p className="text-white text-base">
                  ¡Has ganado {selectedPrize.minutes} minutos de tiempo premium!
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
