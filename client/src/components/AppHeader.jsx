import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { User, LogOut, Settings, Crown, Pencil, Check, X, MessageCircle } from "lucide-react";
import { getUserName, setUserName } from "../utils/nameGenerator";
import { api, authApi } from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [name, setName] = useState(getUserName());
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const menuRef = useRef(null);

  // Usar contexto de autenticación
  const { user, setUser, isAuthLoading, refreshUser, isPremium, showLoginModal, setShowLoginModal } = useAuth();

  // Estado del modal de login
  const [loginMode, setLoginMode] = useState("options"); // "options", "login", "register"
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [redirectToPremium, setRedirectToPremium] = useState(false); // Flag para redirigir a premium después del login

  // Verificar parámetros de autenticación en la URL (OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authStatus = params.get('auth');

    if (authStatus === 'success') {
      refreshUser();
      toast.success("¡Sesión iniciada correctamente!");
      window.history.replaceState({}, '', location.pathname);

      // Si el usuario quería ir a premium, redirigir
      if (redirectToPremium) {
        setRedirectToPremium(false);
        navigate('/premium');
      }
    } else if (authStatus === 'error') {
      toast.error("Error al iniciar sesión");
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname, redirectToPremium, navigate]);

  // Redirigir a premium si el usuario se loguea y tenía intención de ser premium
  useEffect(() => {
    if (user && redirectToPremium) {
      setRedirectToPremium(false);
      navigate('/premium');
    }
  }, [user, redirectToPremium, navigate]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const handleEditName = () => {
    setTempName(name);
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    if (tempName.trim()) {
      const newName = tempName.trim();
      setName(newName);
      setUserName(newName);
      setIsEditing(false);

      // Si estamos en una sala, notificar al servidor
      const roomMatch = location.pathname.match(/\/room\/([A-Z0-9]+)/);
      if (roomMatch) {
        const roomId = roomMatch[1];
        try {
          await api.post(`/rooms/${roomId}/update_name`, { newName });
          toast.success("Nombre actualizado");
        } catch (error) {
          console.error("Error al actualizar nombre:", error);
          toast.error("Error al actualizar el nombre");
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
    setShowProfileMenu(false);
  };

  const handlePremiumClick = () => {
    setRedirectToPremium(true);
    setShowLoginModal(true);
    setShowProfileMenu(false);
  };

  const handleGoogleLogin = () => {
    // Redirigir a Google OAuth (usa URL relativa para proxy de Vite en desarrollo)
    window.location.href = '/auth/google';
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await authApi.post('/auth/login', {
        email: loginEmail,
        password: loginPassword
      });

      setUser(response.data);
      toast.success("¡Sesión iniciada correctamente!");
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
      setLoginMode("options");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      toast.error(error.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await authApi.post('/auth/register', {
        email: loginEmail,
        password: loginPassword,
        name: registerName || null
      });

      setUser(response.data);
      toast.success("¡Cuenta creada correctamente!");
      setShowLoginModal(false);
      setLoginEmail("");
      setLoginPassword("");
      setRegisterName("");
      setLoginMode("options");
    } catch (error) {
      console.error("Error al registrarse:", error);
      toast.error(error.response?.data?.error || "Error al crear cuenta");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.post('/auth/logout');
      setUser(null);
      toast.success("Sesión cerrada");
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <>
      <div className="fixed top-6 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo - clickeable para ir al home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <h1 className="text-xl font-bold flex items-center gap-1">
              <span className="text-amber-400">Impostor</span>
              <span className="text-white">Word.com</span>
              <span className="text-base">🕵️‍♂️</span>
            </h1>
          </button>

          {/* Botón de perfil */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
              aria-label="Menú de perfil"
            >
              {user && user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-white text-lg font-bold">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}

              {/* Coronita Premium sobrepuesta */}
              {isPremium && (
                <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 border-2 border-gray-900 shadow-lg">
                  <Crown size={12} className="text-white" fill="currentColor" />
                </div>
              )}
            </button>

            {/* Tooltip/Dropdown del menú de perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
                {/* Sección de nombre de usuario */}
                <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700">
                  {isAuthLoading ? (
                    <p className="text-sm text-gray-400">Cargando...</p>
                  ) : user ? (
                    // Usuario autenticado
                    <>
                      {/* Campo de nombre editable para usuarios autenticados - PRIMERO */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Mi nombre en el juego</p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="bg-gray-700 text-white px-2 py-1 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm flex-1"
                              maxLength={25}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="bg-emerald-500/80 hover:bg-emerald-600 p-1.5 rounded-lg transition-all"
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-red-500/80 hover:bg-red-600 p-1.5 rounded-lg transition-all"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleEditName}
                            className="group flex items-center gap-2 hover:bg-gray-700/50 px-2 py-1 rounded-lg transition-all w-full"
                          >
                            <span className="text-base font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex-1 text-left animate-pulse bg-[length:200%_auto]">
                              {name}
                            </span>
                            <Pencil size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                          </button>
                        )}
                      </div>

                      {/* Cuenta de Google - SEGUNDO */}
                      <div className="mb-3 pb-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">Cuenta de Google</p>
                        <p className="text-sm text-white truncate">{user.email}</p>
                      </div>

                      {/* Status Premium - TERCERO */}
                      <div>
                        {user.isPremium ? (
                          <>
                            <p className="text-xs text-amber-400 font-semibold">✨ Usuario Premium</p>
                            {user.premiumExpiresAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                {(() => {
                                  const now = new Date();
                                  const expiresAt = new Date(user.premiumExpiresAt);
                                  const diff = expiresAt - now;

                                  if (diff <= 0) {
                                    return 'Expirado';
                                  }

                                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                  if (days > 365) {
                                    return 'Premium de por vida';
                                  } else if (days > 0) {
                                    return `Vence en ${days} día${days !== 1 ? 's' : ''}`;
                                  } else if (hours > 0) {
                                    return `Vence en ${hours} hora${hours !== 1 ? 's' : ''}`;
                                  } else {
                                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                    return `Vence en ${minutes} min${minutes !== 1 ? 's' : ''}`;
                                  }
                                })()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">Usuario Free</p>
                        )}
                      </div>
                    </>
                  ) : (
                    // Usuario no autenticado - Mostrar nombre local editable
                    <>
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">Mi nombre en el juego</p>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="bg-gray-700 text-white px-2 py-1 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm flex-1"
                              maxLength={25}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="bg-emerald-500/80 hover:bg-emerald-600 p-1.5 rounded-lg transition-all"
                              title="Guardar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-red-500/80 hover:bg-red-600 p-1.5 rounded-lg transition-all"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleEditName}
                            className="group flex items-center gap-2 hover:bg-gray-700/50 px-2 py-1 rounded-lg transition-all w-full"
                          >
                            <span className="text-base font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex-1 text-left animate-pulse bg-[length:200%_auto]">
                              {name}
                            </span>
                            <Pencil size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">No autenticado</p>
                    </>
                  )}
                </div>

                <div className="py-2">
                  {!isAuthLoading && !user && (
                    // Usuario no autenticado - Mostrar botón de login y premium
                    <>
                      <button
                        className="w-full px-4 py-3 text-left hover:bg-blue-500/10 transition-colors flex items-center gap-3 group"
                        onClick={handleLogin}
                      >
                        <User size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-white font-medium">Iniciar sesión</p>
                          <p className="text-xs text-gray-400">Accede con Google</p>
                        </div>
                      </button>

                      <button
                        className="w-full px-4 py-3 text-left hover:bg-amber-500/10 transition-colors flex items-center gap-3 group"
                        onClick={handlePremiumClick}
                      >
                        <Crown size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-white font-medium">Hazte Premium</p>
                          <p className="text-xs text-gray-400">Inicia sesión para ser Premium</p>
                        </div>
                      </button>
                    </>
                  )}

                  {!isAuthLoading && user && !user.isPremium && (
                    // Usuario autenticado no premium - Mostrar opción de Premium
                    <button
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 group"
                      onClick={() => {
                        navigate("/premium");
                        setShowProfileMenu(false);
                      }}
                    >
                      <Crown size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-white font-medium">Hazte Premium</p>
                        <p className="text-xs text-gray-400">Sin anuncios y beneficios</p>
                      </div>
                    </button>
                  )}

                  {!isAuthLoading && user && (
                    // Usuario autenticado - Mostrar configuración
                    <button
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 group"
                      onClick={() => {
                        // TODO: Implementar navegación a configuración
                        alert("Próximamente: Página de configuración");
                        setShowProfileMenu(false);
                      }}
                    >
                      <Settings size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                      <div>
                        <p className="text-white font-medium">Configuración</p>
                        <p className="text-xs text-gray-400">Ajustes de la cuenta</p>
                      </div>
                    </button>
                  )}

                  {/* Sección de Feedback - Para todos los usuarios */}
                  <div className="my-2 border-t border-gray-700"></div>
                  <div className="px-4 py-3 bg-blue-500/10">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageCircle size={16} className="text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-300">Quejas y sugerencias</p>
                        <p className="text-[10px] text-gray-400 mt-1">Escríbenos:</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <a
                        href="https://www.instagram.com/impostorword"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all active:scale-95 text-center"
                      >
                        Instagram
                      </a>
                      <a
                        href="https://www.tiktok.com/@impostorword.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-all active:scale-95 text-center border border-gray-700"
                      >
                        TikTok
                      </a>
                    </div>
                  </div>

                  {!isAuthLoading && user && (
                    // Usuario autenticado - Mostrar logout
                    <>
                      <div className="my-2 border-t border-gray-700"></div>
                      <button
                        className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-red-400 font-medium">Cerrar sesión</p>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Login/Registro - Renderizado con Portal fuera del AppHeader */}
      {showLoginModal && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={() => {
                setShowLoginModal(false);
                setLoginMode("options");
                setLoginEmail("");
                setLoginPassword("");
                setRegisterName("");
                setRedirectToPremium(false);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Opciones de autenticación */}
            {loginMode === "options" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">Iniciar Sesión</h2>

                {/* Mensaje si viene de Premium */}
                {redirectToPremium && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Crown size={16} />
                      <p>Después de iniciar sesión serás redirigido a Premium</p>
                    </div>
                  </div>
                )}

                {/* Google OAuth */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  Continuar con Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">o</span>
                  </div>
                </div>

                {/* Email/Password */}
                <button
                  onClick={() => setLoginMode("login")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all"
                >
                  <User size={20} />
                  Continuar con Email
                </button>

                <p className="text-center text-sm text-gray-400 mt-4">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => setLoginMode("register")}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            )}

            {/* Formulario de Login */}
            {loginMode === "login" && (
              <div className="space-y-4">
                <button
                  onClick={() => setLoginMode("options")}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                >
                  ← Volver
                </button>

                <h2 className="text-2xl font-bold text-white mb-4">Iniciar Sesión</h2>

                {/* Mensaje si viene de Premium */}
                {redirectToPremium && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Crown size={16} />
                      <p>Después de iniciar sesión serás redirigido a Premium</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Contraseña</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {loginLoading ? "Iniciando..." : "Iniciar Sesión"}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                  ¿No tienes cuenta?{" "}
                  <button
                    onClick={() => {
                      setLoginMode("register");
                      setLoginEmail("");
                      setLoginPassword("");
                    }}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            )}

            {/* Formulario de Registro */}
            {loginMode === "register" && (
              <div className="space-y-4">
                <button
                  onClick={() => setLoginMode("options")}
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"
                >
                  ← Volver
                </button>

                <h2 className="text-2xl font-bold text-white mb-4">Crear Cuenta</h2>

                {/* Mensaje si viene de Premium */}
                {redirectToPremium && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <Crown size={16} />
                      <p>Después de registrarte serás redirigido a Premium</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleEmailRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nombre (opcional)</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      placeholder="Tu nombre"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Contraseña</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    {loginLoading ? "Creando..." : "Crear Cuenta"}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-400">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => {
                      setLoginMode("login");
                      setLoginEmail("");
                      setLoginPassword("");
                      setRegisterName("");
                    }}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
