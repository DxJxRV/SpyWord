import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User, LogOut, Settings, Crown, Pencil, Check, X } from "lucide-react";
import { getUserName, setUserName } from "../utils/nameGenerator";
import { api } from "../services/api";
import { toast } from "sonner";

export default function AppHeader() {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [name, setName] = useState(getUserName());
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const menuRef = useRef(null);

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

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold flex items-center gap-1">
            <span className="text-amber-400">Impostor</span>
            <span className="text-white">Word.com</span>
            <span className="text-base">🕵️‍♂️</span>
          </h1>
        </div>

        {/* Botón de perfil */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
            aria-label="Menú de perfil"
          >
            <User size={20} className="text-white" />
          </button>

          {/* Tooltip/Dropdown del menú de perfil */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
              {/* Sección de nombre de usuario */}
              <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Mi nombre</p>
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
                    <span className="text-sm font-semibold text-white flex-1 text-left">
                      {name}
                    </span>
                    <Pencil size={14} className="text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">Usuario Free</p>
              </div>

              <div className="py-2">
                {/* Opción: Hazte Premium */}
                <button
                  className="w-full px-4 py-3 text-left hover:bg-gray-700/50 transition-colors flex items-center gap-3 group"
                  onClick={() => {
                    // TODO: Implementar navegación a página de premium
                    alert("Próximamente: Página de suscripción Premium");
                    setShowProfileMenu(false);
                  }}
                >
                  <Crown size={18} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-white font-medium">Hazte Premium</p>
                    <p className="text-xs text-gray-400">Sin anuncios y beneficios</p>
                  </div>
                </button>

                {/* Opción: Configuración */}
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

                {/* Separador */}
                <div className="my-2 border-t border-gray-700"></div>

                {/* Opción: Cerrar sesión */}
                <button
                  className="w-full px-4 py-3 text-left hover:bg-red-500/10 transition-colors flex items-center gap-3 group"
                  onClick={() => {
                    // TODO: Implementar logout
                    alert("Próximamente: Sistema de autenticación");
                    setShowProfileMenu(false);
                  }}
                >
                  <LogOut size={18} className="text-red-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-red-400 font-medium">Cerrar sesión</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
