import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Power, Info, AlertTriangle, CheckCircle, XCircle, X } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form states
  const [formMessage, setFormMessage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('info');
  const [formPriority, setFormPriority] = useState(1);

  // Colores automáticos según tipo
  const getIconStyles = (iconType) => {
    switch (iconType) {
      case 'info':
        return { bg: '#3B82F6', text: '#FFFFFF', Icon: Info, label: 'Info' };
      case 'warning':
        return { bg: '#F59E0B', text: '#000000', Icon: AlertTriangle, label: 'Advertencia' };
      case 'success':
        return { bg: '#10B981', text: '#FFFFFF', Icon: CheckCircle, label: 'Éxito' };
      case 'error':
        return { bg: '#EF4444', text: '#FFFFFF', Icon: XCircle, label: 'Error' };
      default:
        return { bg: '#6B7280', text: '#FFFFFF', Icon: null, label: 'Sin icono' };
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await api.get('/admin/banners');
      setBanners(response.data.banners);
      setCurrentBanner(response.data.currentBanner);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Error al cargar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormMessage('');
    setFormDescription('');
    setFormIcon('info');
    setFormPriority(1);
    setShowModal(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormMessage(banner.message);
    setFormDescription(banner.description || '');
    setFormIcon(banner.icon);
    setFormPriority(banner.priority);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Obtener colores automáticos según tipo
    const styles = getIconStyles(formIcon);

    const bannerData = {
      message: formMessage,
      description: formDescription,
      backgroundColor: styles.bg,
      textColor: styles.text,
      icon: formIcon,
      priority: formPriority
    };

    try {
      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, bannerData);
        toast.success('Banner actualizado');
      } else {
        await api.post('/admin/banners', bannerData);
        toast.success('Banner creado');
      }

      setShowModal(false);
      fetchBanners();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar banner');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.put(`/admin/banners/${id}/toggle`);
      toast.success('Estado actualizado');
      fetchBanners();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este banner?')) return;

    try {
      await api.delete(`/admin/banners/${id}`);
      toast.success('Banner eliminado');
      fetchBanners();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar banner');
    }
  };


  if (loading) {
    return <div className="text-white p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🎨 Gestión de Banners</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Crear Banner
        </button>
      </div>

      {/* Preview del banner activo */}
      {currentBanner && (() => {
        const styles = getIconStyles(currentBanner.icon);
        return (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">📢 Banner Activo Ahora</h3>
            <div
              style={{
                backgroundColor: styles.bg,
                color: styles.text
              }}
              className="px-6 py-1.5 rounded-lg flex items-center justify-center gap-2"
            >
              {styles.Icon && <styles.Icon size={16} />}
              <p className="text-xs font-semibold">{currentBanner.message}</p>
            </div>
          </div>
        );
      })()}

      {/* Lista de banners */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Lista de Banners ({banners.length})</h3>

        {banners.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-6 text-center text-gray-400">
            No hay banners. Crea uno para empezar.
          </div>
        ) : (
          <div className="grid gap-3">
            {banners.map(banner => (
              <div
                key={banner.id}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex items-center justify-between gap-4"
              >
                {/* Info del banner */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const styles = getIconStyles(banner.icon);
                      return styles.Icon ? <styles.Icon size={16} style={{ color: styles.bg }} /> : null;
                    })()}
                    <span className="font-semibold text-white">{banner.message}</span>
                    {banner.active ? (
                      <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-bold">
                        Activo
                      </span>
                    ) : (
                      <span className="bg-gray-600/20 text-gray-400 text-xs px-2 py-0.5 rounded-full font-bold">
                        Inactivo
                      </span>
                    )}
                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                      Prioridad: {banner.priority}
                    </span>
                  </div>
                  {banner.description && (
                    <p className="text-xs text-gray-400">{banner.description}</p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(banner.id)}
                    className={`p-2 rounded-lg transition-all ${
                      banner.active
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                    }`}
                    title={banner.active ? 'Desactivar' : 'Activar'}
                  >
                    <Power size={16} />
                  </button>

                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full border-2 border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingBanner ? 'Editar Banner' : 'Crear Banner'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mensaje */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Mensaje *
                </label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Prueba el nuevo chat de voz"
                  rows={2}
                  required
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{formMessage.length}/200</p>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Nota interna sobre este banner"
                  maxLength={100}
                />
              </div>

              {/* Row: Tipo (Icono) y Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Icono
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="info">Info (Azul)</option>
                    <option value="warning">Advertencia (Amarillo)</option>
                    <option value="success">Éxito (Verde)</option>
                    <option value="error">Error (Rojo)</option>
                    <option value="none">Sin icono (Gris)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Los colores se configuran automáticamente</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Prioridad (1-100)
                  </label>
                  <input
                    type="number"
                    value={formPriority}
                    onChange={(e) => setFormPriority(parseInt(e.target.value) || 1)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    min={1}
                    max={100}
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Preview (como se verá en la app)
                </label>
                {(() => {
                  const styles = getIconStyles(formIcon);
                  return (
                    <div
                      style={{
                        backgroundColor: styles.bg,
                        color: styles.text
                      }}
                      className="px-6 py-1.5 rounded-lg flex items-center justify-center gap-2"
                    >
                      {styles.Icon && <styles.Icon size={16} />}
                      <p className="text-xs font-semibold">{formMessage || 'Tu mensaje aquí...'}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  {editingBanner ? 'Guardar Cambios' : 'Crear Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
