import { useState, useEffect, useRef } from "react";
import { CircleDashed, Crown, X, Sparkles } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

const DAILY_PRIZES = [
  { id: 'nothing', label: 'Casi… 😅', color: '#6B7280', textColor: '#FFFFFF', probability: 60, colorName: 'Gris', winMessage: 'Hoy no tocó, pero puedes volver mañana' },
  { id: '10min', label: '10 min sin anuncios', color: '#3B82F6', textColor: '#FFFFFF', probability: 25, colorName: 'Azul', winMessage: '🎉 Disfruta 10 minutos sin anuncios\nEmpiezan ahora' },
  { id: '30min', label: '30 min Premium', color: '#A855F7', textColor: '#FFFFFF', probability: 10, colorName: 'Morado', winMessage: '✨ 30 minutos Premium activados\nSin anuncios, sin límites' },
  { id: '1day', label: '1 día Premium', color: 'url(#dailyGradient)', textColor: '#FFFFFF', probability: 5, colorName: 'Dorado', solidColor: '#F6C453', winMessage: '👑 ¡Premium por 24 horas!\nDisfrútalo al máximo' }
];

const PREMIUM_PRIZES = [
  { id: '1week', label: '1 semana sin anuncios', color: '#2563EB', textColor: '#FFFFFF', probability: 35, colorName: 'Azul', winMessage: '🎉 Una semana completa sin anuncios\n¡A disfrutar!' },
  { id: '3days', label: '+3 días Premium', color: '#9333EA', textColor: '#FFFFFF', probability: 30, colorName: 'Morado', winMessage: '✨ Sumamos 3 días a tu Premium\nSe acumulan automáticamente' },
  { id: '7days', label: '+7 días Premium', color: '#EC4899', textColor: '#FFFFFF', probability: 24, colorName: 'Rosa', winMessage: '🔥 Una semana extra de Premium\n¡Disfrútala!' },
  { id: '1month', label: '1 mes Premium', color: '#F59E0B', textColor: '#FFFFFF', probability: 10, colorName: 'Naranja', winMessage: '👑 Premium por todo un mes\nGracias por apoyar el proyecto 💛' },
  { id: 'lifetime', label: 'Premium de por vida', color: 'url(#lifetimeGradient)', textColor: '#FFD700', probability: 1, colorName: 'Legendario', solidColor: '#1C1C1C', winMessage: '👑 Increíble…\nPremium de por vida desbloqueado\nGracias por ser parte de esto 💛' }
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
  const [mustStartSpinning, setMustStartSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  // Convertir prizes a formato de Wheel
  const currentPrizes = selectedRouletteType === 'daily' ? DAILY_PRIZES : PREMIUM_PRIZES;

  // Función para lanzar confetti
  const launchConfetti = (prizeId) => {
    if (prizeId === 'nothing') return; // No confetti si no gana nada

    // Confetti especial para lifetime
    if (prizeId === 'lifetime') {
      const duration = 5000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      // Confetti normal para otros premios
      const colors = selectedRouletteType === 'daily'
        ? ['#3B82F6', '#A855F7', '#F59E0B']
        : ['#EAB308', '#EC4899', '#9333EA'];

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
      });
    }
  };

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

  // Calcular ángulos basados en probabilidades
  const calculateAngles = (prizes) => {
    let currentAngle = 0;
    return prizes.map(prize => {
      const angle = (prize.probability / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      const middleAngle = startAngle + (angle / 2);
      currentAngle = endAngle;
      return {
        ...prize,
        startAngle,
        endAngle,
        middleAngle,
        angle
      };
    });
  };

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
      // Hacer request al backend primero para obtener el premio
      const response = await api.post('/roulette/spin', {
        type: selectedRouletteType
      });
      const { prize } = response.data;

      // Calcular ángulos con probabilidades
      const prizesWithAngles = calculateAngles(currentPrizes);

      // Encontrar el premio ganado
      const wonPrize = prizesWithAngles.find(p => p.id === prize.id);

      if (!wonPrize) {
        console.error('Premio no encontrado en la ruleta actual:', prize.id);
        toast.error('Error: Premio inválido');
        setSpinning(false);
        return;
      }

      // Guardar el premio seleccionado
      setSelectedPrize(prize);

      // Calcular rotación: 5 vueltas completas + el ángulo del premio (ajustado para que la flecha apunte al centro del segmento)
      const targetAngle = wonPrize.middleAngle;
      const totalRotation = 360 * 5 + (360 - targetAngle);

      // Resetear la rotación primero
      setRotation(0);
      setMustStartSpinning(false);

      // Dar tiempo al navegador para renderizar el estado inicial
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Ahora aplicar la rotación con la transición
          setMustStartSpinning(true);
          setRotation(totalRotation);
        });
      });

      // Esperar a que termine la animación (4 segundos)
      setTimeout(() => {
        setMustStartSpinning(false);
        setSpinning(false);
        setShowResult(true);

        // Lanzar confetti
        launchConfetti(prize.id);

        // Mostrar toast según el premio usando winMessage
        if (prize.id === 'nothing') {
          toast.info(prize.winMessage || "Hoy no tocó, pero puedes volver mañana", {
            duration: 5000
          });
        } else if (prize.id === 'lifetime') {
          toast.success(prize.winMessage || "👑 Premium de por vida desbloqueado", {
            duration: 8000
          });
        } else {
          toast.success(prize.winMessage || `¡Ganaste ${prize.label}!`, {
            duration: 5000
          });
        }
      }, 4000);

      // Recargar estado en background
      loadStatus();
    } catch (error) {
      console.error("Error al girar ruleta:", error);
      toast.error(error.response?.data?.error || "Error al girar ruleta");
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
                  setMustStartSpinning(false);
                  setSpinning(false);
                  setRotation(0);
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
                  setMustStartSpinning(false);
                  setSpinning(false);
                  setRotation(0);
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
              {/* Ruleta visual con SVG */}
              <div className="relative">
                <div className="relative max-w-md mx-auto aspect-square">
                  {/* Indicador/flecha superior */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20">
                    <div className={`w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[36px] ${
                      selectedRouletteType === 'daily' ? 'border-t-blue-500' : 'border-t-amber-500'
                    } drop-shadow-lg`}></div>
                  </div>

                  {/* Contenedor SVG de la ruleta */}
                  <div
                    ref={wheelRef}
                    className="relative w-full h-full"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: mustStartSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                    }}
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                      {/* Definir gradientes */}
                      <defs>
                        {/* Gradiente para 1 día (daily) - Dorado elegante */}
                        <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#F6C453', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#E6A93A', stopOpacity: 1 }} />
                        </linearGradient>

                        {/* Gradiente para lifetime (premium) - Negro elegante con borde dorado */}
                        <linearGradient id="lifetimeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#1C1C1C', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#2A2A2A', stopOpacity: 1 }} />
                        </linearGradient>
                      </defs>

                      {/* Borde exterior */}
                      <circle
                        cx="100"
                        cy="100"
                        r="98"
                        fill="none"
                        stroke={selectedRouletteType === 'daily' ? '#3B82F6' : '#F59E0B'}
                        strokeWidth="4"
                      />

                      {/* Segmentos de la ruleta */}
                      {calculateAngles(currentPrizes).map((prize) => {
                        const startAngleRad = (prize.startAngle - 90) * (Math.PI / 180);
                        const endAngleRad = (prize.endAngle - 90) * (Math.PI / 180);
                        const middleAngleRad = (prize.middleAngle - 90) * (Math.PI / 180);

                        const x1 = 100 + 94 * Math.cos(startAngleRad);
                        const y1 = 100 + 94 * Math.sin(startAngleRad);
                        const x2 = 100 + 94 * Math.cos(endAngleRad);
                        const y2 = 100 + 94 * Math.sin(endAngleRad);

                        const largeArcFlag = prize.angle > 180 ? 1 : 0;

                        const textX = 100 + 55 * Math.cos(middleAngleRad);
                        const textY = 100 + 55 * Math.sin(middleAngleRad);
                        // Rotar 90 grados para que el texto sea perpendicular al radio
                        const textRotation = prize.middleAngle + 90;

                        return (
                          <g key={prize.id}>
                            {/* Segmento */}
                            <path
                              d={`M 100 100 L ${x1} ${y1} A 94 94 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={prize.color}
                              stroke={prize.id === 'lifetime' ? '#FFD700' : prize.id === '1day' ? '#F6C453' : '#1F2937'}
                              strokeWidth={prize.id === 'lifetime' || prize.id === '1day' ? '2' : '1'}
                            />

                            {/* Texto del premio */}
                            <text
                              x={textX}
                              y={textY}
                              fill={prize.textColor}
                              fontSize={prize.label.length > 12 ? '7' : '9'}
                              fontWeight="bold"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                            >
                              {prize.label}
                            </text>
                          </g>
                        );
                      })}

                      {/* Círculo central */}
                      <circle
                        cx="100"
                        cy="100"
                        r="25"
                        fill="#111827"
                        stroke={selectedRouletteType === 'daily' ? '#3B82F6' : '#F59E0B'}
                        strokeWidth="3"
                      />
                    </svg>

                    {/* Icono central */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {selectedRouletteType === 'daily' ? (
                        <CircleDashed size={32} className="text-blue-400" />
                      ) : (
                        <Crown size={32} className="text-amber-400" fill="currentColor" />
                      )}
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
              <div className="text-center relative space-y-3" ref={tooltipRef}>
                {/* Micro-copy para premium */}
                {selectedRouletteType === 'premium' && (
                  <p className="text-gray-500 text-xs">
                    🎟️ Las fichas premium se obtienen al apoyar el proyecto<br />
                    Algunos premios son extremadamente raros
                  </p>
                )}

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
                        <div key={prize.id} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0"
                              style={{
                                background: prize.solidColor || prize.color
                              }}
                            />
                            <span className="text-gray-300 text-sm">{prize.label}</span>
                          </div>
                          <span className="text-gray-400 text-xs font-medium">
                            {prize.colorName}
                          </span>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                        {selectedRouletteType === 'daily'
                          ? 'Puedes girar la ruleta diaria una vez al día. El tiempo premium se acumula.'
                          : 'Usa tus fichas premium para premios especiales. ¡Puedes ganar premium de por vida!'}
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
          <div className={`rounded-2xl p-6 shadow-2xl border-4 max-w-md mx-4 pointer-events-auto animate-fade-in ${
            selectedPrize.id === 'lifetime'
              ? 'bg-gradient-to-br from-gray-900 to-black border-yellow-500'
              : selectedPrize.id === 'nothing'
              ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600'
              : selectedRouletteType === 'daily'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400'
              : 'bg-gradient-to-br from-amber-500 to-yellow-500 border-amber-400'
          }`}>
            <div className="text-center">
              <h3 className={`text-2xl font-bold mb-3 ${
                selectedPrize.id === 'lifetime' ? 'text-yellow-400' : 'text-white'
              }`}>
                {selectedPrize.id === 'nothing' ? '¡Casi lo logras!' : selectedPrize.id === 'lifetime' ? '👑 Increíble…' : '¡Felicidades!'}
              </h3>
              <p className={`text-3xl mb-3 font-medium ${
                selectedPrize.id === 'lifetime' ? 'text-yellow-300' : 'text-white'
              }`}>{selectedPrize.label}</p>
              <p className={`text-sm whitespace-pre-line ${
                selectedPrize.id === 'lifetime' ? 'text-yellow-100' : selectedPrize.id === 'nothing' ? 'text-gray-200' : 'text-white'
              }`}>
                {selectedPrize.winMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
