import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Crown, Trash2, Calendar, RefreshCw, Users, Mail, Search, Filter, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../services/api";

const USERS_PER_PAGE = 10;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(30);

  // Nuevos estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("all"); // "all" | "admin" | "non-admin"
  const [filterPremium, setFilterPremium] = useState("all"); // "all" | "premium" | "free"
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function togglePremium(userId, currentStatus) {
    try {
      await api.put(`/admin/users/${userId}/premium`, {
        isPremium: !currentStatus
      });
      toast.success(currentStatus ? "Premium desactivado" : "Premium activado");
      loadUsers();
    } catch (error) {
      console.error("Error al cambiar premium:", error);
      toast.error("Error al cambiar estado premium");
    }
  }

  async function addPremiumDays(userId) {
    try {
      await api.put(`/admin/users/${userId}/premium`, {
        daysToAdd: parseInt(daysToAdd)
      });
      toast.success(`${daysToAdd} días agregados a la suscripción`);
      setShowPremiumModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error al agregar días:", error);
      toast.error("Error al agregar días premium");
    }
  }

  async function deleteUser(userId) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("Usuario eliminado");
      loadUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error("Error al eliminar usuario");
    }
  }

  async function toggleAdmin(userId, currentStatus) {
    try {
      await api.put(`/admin/users/${userId}/admin`, {
        isAdmin: !currentStatus
      });
      toast.success(currentStatus ? "Permisos de admin removidos" : "Permisos de admin otorgados");
      loadUsers();
    } catch (error) {
      console.error("Error al cambiar permisos de admin:", error);
      toast.error("Error al cambiar permisos de admin");
    }
  }

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    // Filtro de búsqueda
    const matchesSearch = searchTerm === "" ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro de admin
    const matchesAdmin =
      filterAdmin === "all" ||
      (filterAdmin === "admin" && user.isAdmin) ||
      (filterAdmin === "non-admin" && !user.isAdmin);

    // Filtro de premium
    const matchesPremium =
      filterPremium === "all" ||
      (filterPremium === "premium" && user.isPremium) ||
      (filterPremium === "free" && !user.isPremium);

    return matchesSearch && matchesAdmin && matchesPremium;
  });

  // Paginación
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const endIndex = startIndex + USERS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAdmin, filterPremium]);

  function formatDate(dateString) {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function isExpired(dateString) {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Users size={20} />
              <p className="text-sm font-semibold">Total Usuarios</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Crown size={20} />
              <p className="text-sm font-semibold">Premium</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.premiumUsers}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              <p className="text-sm font-semibold">Google</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.googleUsers}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Mail size={20} />
              <p className="text-sm font-semibold">Email</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.emailUsers}</p>
          </div>
        </div>
      )}

      {/* Botón de refrescar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gestión de Usuarios</h2>
        <button
          onClick={loadUsers}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-400 font-medium">Filtros:</span>
          </div>

          {/* Filtro Admin */}
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-purple-400" />
            <div className="flex gap-1">
              <button
                onClick={() => setFilterAdmin("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAdmin === "all"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterAdmin("admin")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAdmin === "admin"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setFilterAdmin("non-admin")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAdmin === "non-admin"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                No admins
              </button>
            </div>
          </div>

          {/* Filtro Premium */}
          <div className="flex items-center gap-2">
            <Crown size={16} className="text-amber-400" />
            <div className="flex gap-1">
              <button
                onClick={() => setFilterPremium("all")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterPremium === "all"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterPremium("premium")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterPremium === "premium"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Premium
              </button>
              <button
                onClick={() => setFilterPremium("free")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterPremium === "free"
                    ? "bg-amber-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Free
              </button>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="text-sm text-gray-400">
          Mostrando {paginatedUsers.length} de {filteredUsers.length} usuarios
          {filteredUsers.length !== users.length && ` (${users.length} totales)`}
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Expira</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{user.email}</p>
                    <p className="text-xs text-gray-400">ID: {user.id.substring(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300">{user.name || "Sin nombre"}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.googleId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                        </svg>
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                        <Mail size={12} />
                        Email
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isPremium ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.premiumExpiresAt && isExpired(user.premiumExpiresAt)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Crown size={12} />
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-700 text-gray-400 text-xs font-medium">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                        <Shield size={12} />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-700 text-gray-400 text-xs font-medium">
                        Usuario
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.premiumExpiresAt ? (
                      <div>
                        <p className={`text-sm ${isExpired(user.premiumExpiresAt) ? 'text-red-400' : 'text-gray-300'}`}>
                          {formatDate(user.premiumExpiresAt)}
                        </p>
                        {isExpired(user.premiumExpiresAt) && (
                          <p className="text-xs text-red-400">Expirado</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">—</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(user.id, user.isAdmin)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          user.isAdmin
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                        }`}
                        title={user.isAdmin ? "Quitar Admin" : "Dar Admin"}
                      >
                        <Shield size={14} className="inline mr-1" />
                        {user.isAdmin ? "Quitar" : "Dar"} Admin
                      </button>

                      <button
                        onClick={() => togglePremium(user.id, user.isPremium)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          user.isPremium
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                        title={user.isPremium ? "Desactivar Premium" : "Activar Premium"}
                      >
                        {user.isPremium ? "Quitar" : "Dar"} Premium
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPremiumModal(true);
                        }}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Agregar días"
                      >
                        <Calendar size={16} />
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedUsers.length === 0 && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            {searchTerm || filterAdmin !== "all" || filterPremium !== "all"
              ? "No se encontraron usuarios con los filtros aplicados"
              : "No hay usuarios registrados"}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800 rounded-lg border border-gray-700 px-4 py-3">
          <div className="text-sm text-gray-400">
            Página {currentPage} de {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Mostrar solo páginas cercanas a la actual
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="text-gray-500 px-2">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal para agregar días de premium */}
      {showPremiumModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Agregar Días Premium
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Usuario:</p>
              <p className="text-white font-medium">{selectedUser.email}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Días a agregar:
              </label>
              <input
                type="number"
                value={daysToAdd}
                onChange={(e) => setDaysToAdd(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-amber-500 focus:outline-none"
                min="1"
                placeholder="30"
              />

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setDaysToAdd(7)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  7 días
                </button>
                <button
                  onClick={() => setDaysToAdd(30)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  30 días
                </button>
                <button
                  onClick={() => setDaysToAdd(365)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm"
                >
                  1 año
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addPremiumDays(selectedUser.id)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowPremiumModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
