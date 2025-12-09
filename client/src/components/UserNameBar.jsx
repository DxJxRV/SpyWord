import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Pencil, Check, X } from "lucide-react";
import { getUserName, setUserName } from "../utils/nameGenerator";
import { api } from "../services/api";
import { toast } from "sonner";

export default function UserNameBar() {
  const location = useLocation();
  const [name, setName] = useState(getUserName());
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);

  const handleEdit = () => {
    setTempName(name);
    setIsEditing(true);
  };

  const handleSave = async () => {
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

  const handleCancel = () => {
    setTempName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="fixed top-14 left-0 right-0 bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-md border-b border-purple-500/20 z-40">
      <div data-tutorial="user-name-bar" className="flex items-center justify-center px-4 py-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-gray-800/80 text-white px-3 py-1 rounded-lg border border-purple-500/50 focus:border-purple-500 focus:outline-none text-sm max-w-[200px]"
              maxLength={25}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="bg-emerald-500/80 hover:bg-emerald-600 p-1.5 rounded-lg transition-all"
              title="Guardar"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-500/80 hover:bg-red-600 p-1.5 rounded-lg transition-all"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="group flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
          >
            <span className="text-sm font-medium text-white border-b border-dashed border-gray-400 group-hover:border-white transition-colors">
              {name}
            </span>
            <Pencil size={14} className="text-gray-400 group-hover:text-white transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
