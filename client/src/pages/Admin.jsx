import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, TrendingUp, Filter, X, Users, BookOpen, Gamepad2, Image as ImageIcon, Upload, Edit, Eye, EyeOff, Palette, Star, Lock } from "lucide-react";
import { api, buildImageUrl } from "../services/api";
import UserManagement from "../components/UserManagement";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_PIN = "5523";

export default function Admin() {
  const { isAdmin, isAuthLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [activeTab, setActiveTab] = useState("words"); // "words", "users", "modes"
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Estado para agregar palabras
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWords, setNewWords] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Estado para modos especiales
  const [modes, setModes] = useState([]);
  const [modesFilter, setModesFilter] = useState("active"); // "active" | "inactive"
  const [images, setImages] = useState([]);
  const [showModeModal, setShowModeModal] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [modeForm, setModeForm] = useState({
    name: "",
    description: "",
    type: "image",
    items: [],
    buttonImage: "",
    buttonColor: "#8B5CF6",
    buttonGradient: null,
    isActive: true
  });
  const [newItem, setNewItem] = useState({ label: "", imageUrl: "", weight: 100 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null); // Item seleccionado para paste rápido
  const [pendingImageFile, setPendingImageFile] = useState(null); // Archivo pendiente para nuevo item
  const [pendingEditImageFiles, setPendingEditImageFiles] = useState({}); // {index: File} para items en edición
  const [pendingButtonImageFile, setPendingButtonImageFile] = useState(null); // Archivo pendiente para botón
  const [bulkAddMode, setBulkAddMode] = useState(false); // Modo agregar en lote
  const [bulkLabels, setBulkLabels] = useState(""); // Labels separados por comas

  // Estado para configuración global
  const [specialModesEnabled, setSpecialModesEnabled] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Cambiar título de la página
  useEffect(() => {
    document.title = "SpyWord - Panel de Admin";
    return () => {
      document.title = "SpyWord";
    };
  }, []);

  // Verificar acceso al panel de admin
  useEffect(() => {
    if (isAuthLoading) return; // Esperar a que termine de cargar la auth

    if (isAdmin) {
      // Si el usuario está loggeado con permisos de admin, dar acceso directo
      setHasAccess(true);
      setCheckingAccess(false);
    } else {
      // Si no es admin, pedir PIN
      const pin = prompt("🔒 Panel de Administración\n\nIngresa el PIN para acceder:");
      if (pin === ADMIN_PIN) {
        setHasAccess(true);
        toast.success("Acceso concedido");
      } else {
        setHasAccess(false);
        toast.error("PIN incorrecto");
        window.location.href = "/"; // Redirigir al home
      }
      setCheckingAccess(false);
    }
  }, [isAdmin, isAuthLoading]);

  // Cargar datos iniciales
  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [selectedCategory, activeTab, hasAccess]);

  // Global paste listener para quick paste en item cards
  useEffect(() => {
    const handleGlobalPaste = async (e) => {
      // Solo actuar si hay un item seleccionado y no estamos en modo edición
      if (selectedItemIndex === null || editingItemIndex !== null) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();

            // Upload inmediato de la imagen
            const newImageUrl = await handleUploadImage(file);
            if (newImageUrl) {
              const item = modeForm.items[selectedItemIndex];

              // Si había una imagen anterior, eliminarla
              if (item.imageUrl) {
                await handleDeleteImage(item.imageUrl);
              }

              // Actualizar el item con la nueva imagen
              handleUpdateItem(selectedItemIndex, 'imageUrl', newImageUrl);
              toast.success(`Imagen actualizada para "${item.label}"`);
            }

            // Deseleccionar el item después de pegar
            setSelectedItemIndex(null);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedItemIndex, editingItemIndex, modeForm.items]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === "modes") {
        const [modesRes, imagesRes, settingsRes] = await Promise.all([
          api.get("/admin/modes"),
          api.get("/admin/images"),
          api.get("/admin/settings/special-modes")
        ]);
        setModes(modesRes.data);
        setImages(imagesRes.data);
        setSpecialModesEnabled(settingsRes.data.enabled);
      } else if (activeTab === "words") {
        const [wordsRes, categoriesRes, statsRes] = await Promise.all([
          api.get(`/admin/words${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`),
          api.get("/admin/categories"),
          api.get("/admin/stats")
        ]);
        setWords(wordsRes.data.words);
        setCategories(categoriesRes.data.categories);
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddWords() {
    if (!newWords.trim()) {
      toast.error("Ingresa al menos una palabra");
      return;
    }

    const category = isNewCategory ? newCategory.trim() : selectedCategory === "all" ? newCategory.trim() : selectedCategory;

    if (!category) {
      toast.error("Selecciona o ingresa una categoría");
      return;
    }

    try {
      const response = await api.post("/admin/words", {
        words: newWords,
        category
      });

      toast.success(`${response.data.created} palabra(s) agregada(s)`);

      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(err => toast.warning(err));
      }

      setNewWords("");
      setNewCategory("");
      setIsNewCategory(false);
      setShowAddModal(false);
      loadData();
    } catch (error) {
      console.error("Error al agregar palabras:", error);
      toast.error("Error al agregar palabras");
    }
  }

  async function handleDeleteWord(id) {
    if (!confirm("¿Estás seguro de eliminar esta palabra?")) return;

    try {
      await api.delete(`/admin/words/${id}`);
      toast.success("Palabra eliminada");
      loadData();
    } catch (error) {
      console.error("Error al eliminar palabra:", error);
      toast.error("Error al eliminar palabra");
    }
  }

  // Funciones para modos especiales
  async function handleUploadImage(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    try {
      const response = await api.post("/admin/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data.image.url;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast.error("Error al subir imagen");
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteImage(imageUrl) {
    if (!imageUrl) return;

    // Extraer el filename de la URL
    const filename = imageUrl.split('/uploads/')[1];
    if (!filename) return;

    try {
      // Buscar la imagen en la lista de imágenes
      const image = images.find(img => img.filename === filename);
      if (image) {
        await api.delete(`/admin/images/${image.id}`);
      }
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
    }
  }

  function handlePasteImage(e, target) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          if (target === 'newItem') {
            setPendingImageFile(file);
            toast.success("Imagen del portapapeles lista para subir");
          } else if (target === 'button') {
            setPendingButtonImageFile(file);
            toast.success("Imagen del portapapeles lista para subir");
          } else if (typeof target === 'number') {
            setPendingEditImageFiles({ ...pendingEditImageFiles, [target]: file });
            toast.success("Imagen del portapapeles lista para subir");
          }
        }
        break;
      }
    }
  }

  function handleDropImage(e, target) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.indexOf('image') !== -1) {
      if (target === 'newItem') {
        setPendingImageFile(file);
        toast.success("Imagen lista para subir");
      } else if (target === 'button') {
        setPendingButtonImageFile(file);
        toast.success("Imagen lista para subir");
      } else if (typeof target === 'number') {
        setPendingEditImageFiles({ ...pendingEditImageFiles, [target]: file });
        toast.success("Imagen lista para subir");
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleOpenModeModal(mode = null) {
    if (mode) {
      setEditingMode(mode);
      setModeForm({
        name: mode.name,
        description: mode.description || "",
        type: mode.type,
        items: mode.items || [],
        buttonImage: mode.buttonImage || "",
        buttonColor: mode.buttonColor || "#8B5CF6",
        buttonGradient: mode.buttonGradient || null,
        isActive: mode.isActive
      });
    } else {
      setEditingMode(null);
      setModeForm({
        name: "",
        description: "",
        type: "image",
        items: [],
        buttonImage: "",
        buttonColor: "#8B5CF6",
        buttonGradient: null,
        isActive: true
      });
    }
    setSelectedItemIndex(null);
    setShowModeModal(true);
  }

  async function handleSaveMode() {
    if (!modeForm.name.trim()) {
      toast.error("El nombre del modo es requerido");
      return;
    }

    if (modeForm.items.length === 0) {
      toast.error("Agrega al menos un item al modo");
      return;
    }

    let updatedButtonImage = modeForm.buttonImage;

    // Si hay una imagen pendiente para el botón, subirla
    if (pendingButtonImageFile) {
      const newButtonImage = await handleUploadImage(pendingButtonImageFile);
      if (newButtonImage) {
        // Si había una imagen anterior, eliminarla
        if (editingMode && editingMode.buttonImage) {
          await handleDeleteImage(editingMode.buttonImage);
        }
        updatedButtonImage = newButtonImage;
      }
    }

    try {
      const dataToSave = {
        ...modeForm,
        buttonImage: updatedButtonImage
      };

      if (editingMode) {
        await api.put(`/admin/modes/${editingMode.id}`, dataToSave);
        toast.success("Modo actualizado correctamente");
      } else {
        await api.post("/admin/modes", dataToSave);
        toast.success("Modo creado correctamente");
      }
      setShowModeModal(false);
      setPendingButtonImageFile(null);
      loadData();
    } catch (error) {
      console.error("Error al guardar modo:", error);
      toast.error(error.response?.data?.error || "Error al guardar modo");
    }
  }

  async function handleDeleteMode(id) {
    if (!confirm("⚠️ ADVERTENCIA: Esta acción es permanente e irreversible.\n\n¿Estás seguro de eliminar este modo completamente?\n\nTodos sus datos (items, imágenes, configuración) se perderán para siempre.")) return;

    try {
      await api.delete(`/admin/modes/${id}`);
      toast.success("Modo eliminado permanentemente");
      loadData();
    } catch (error) {
      console.error("Error al eliminar modo:", error);
      toast.error("Error al eliminar modo");
    }
  }

  async function handleToggleMode(id) {
    try {
      const mode = modes.find(m => m.id === id);
      await api.put(`/admin/modes/${id}/toggle`);
      toast.success(mode?.isActive ? "Modo desactivado (no eliminado)" : "Modo reactivado");
      loadData();
    } catch (error) {
      console.error("Error al cambiar estado del modo:", error);
      toast.error("Error al cambiar estado del modo");
    }
  }

  async function handleToggleFeatured(mode) {
    try {
      const newFeaturedStatus = !mode.isFeaturedOnHome;

      // No permitir destacar modos inactivos
      if (newFeaturedStatus && !mode.isActive) {
        toast.error("No puedes destacar un modo desactivado. Actívalo primero.");
        return;
      }

      // Si se está marcando como destacado, calcular el siguiente orden disponible
      let featuredOrder = null;
      if (newFeaturedStatus) {
        const featuredModes = modes.filter(m => m.isFeaturedOnHome && m.id !== mode.id);
        featuredOrder = featuredModes.length + 1;

        if (featuredOrder > 3) {
          toast.error("Ya hay 3 modos destacados. Quita uno primero.");
          return;
        }
      }

      await api.put(`/admin/modes/${mode.id}/featured`, {
        isFeaturedOnHome: newFeaturedStatus,
        featuredOrder: featuredOrder
      });

      toast.success(newFeaturedStatus ? "Modo marcado como destacado" : "Modo removido de destacados");
      loadData();
    } catch (error) {
      console.error("Error al cambiar estado destacado:", error);
      toast.error(error.response?.data?.error || "Error al cambiar estado destacado");
    }
  }

  async function handleToggleSpecialModes() {
    setLoadingSettings(true);
    try {
      const newEnabled = !specialModesEnabled;
      await api.put("/admin/settings/special-modes", {
        enabled: newEnabled
      });
      setSpecialModesEnabled(newEnabled);
      toast.success(newEnabled ? "Botón de modos especiales activado" : "Botón de modos especiales desactivado");
    } catch (error) {
      console.error("Error al cambiar configuración:", error);
      toast.error("Error al cambiar configuración");
    } finally {
      setLoadingSettings(false);
    }
  }

  async function handleAddItem() {
    if (!newItem.label.trim()) {
      toast.error("El label del item es requerido");
      return;
    }

    let imageUrl = newItem.imageUrl;

    // Si hay una imagen pendiente, subirla primero
    if (pendingImageFile) {
      imageUrl = await handleUploadImage(pendingImageFile);
      if (!imageUrl) {
        return; // Error al subir
      }
    }

    setModeForm({
      ...modeForm,
      items: [...modeForm.items, { ...newItem, imageUrl }]
    });
    setNewItem({ label: "", imageUrl: "", weight: 100 });
    setPendingImageFile(null);
    toast.success("Item agregado");
  }

  function handleBulkAddItems() {
    if (!bulkLabels.trim()) {
      toast.error("Ingresa al menos un label");
      return;
    }

    const labels = bulkLabels.split(',').map(l => l.trim()).filter(l => l);

    if (labels.length === 0) {
      toast.error("No se encontraron labels válidos");
      return;
    }

    const newItems = labels.map(label => ({
      label,
      imageUrl: "",
      weight: 100
    }));

    setModeForm({
      ...modeForm,
      items: [...modeForm.items, ...newItems]
    });

    setBulkLabels("");
    setBulkAddMode(false);
    toast.success(`${newItems.length} items agregados`);
  }

  function handleRemoveItem(index) {
    setModeForm({
      ...modeForm,
      items: modeForm.items.filter((_, i) => i !== index)
    });
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    }
    if (selectedItemIndex === index) {
      setSelectedItemIndex(null);
    }
  }

  function handleUpdateItem(index, field, value) {
    const updatedItems = [...modeForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setModeForm({
      ...modeForm,
      items: updatedItems
    });
  }

  async function handleSaveItemEdit(index) {
    const item = modeForm.items[index];

    // Si hay una imagen pendiente para este item
    if (pendingEditImageFiles[index]) {
      // Subir la nueva imagen
      const newImageUrl = await handleUploadImage(pendingEditImageFiles[index]);
      if (newImageUrl) {
        // Si había una imagen anterior, eliminarla
        if (item.imageUrl) {
          await handleDeleteImage(item.imageUrl);
        }

        // Actualizar el item con la nueva URL
        handleUpdateItem(index, 'imageUrl', newImageUrl);
      }

      // Limpiar el archivo pendiente
      const newPending = { ...pendingEditImageFiles };
      delete newPending[index];
      setPendingEditImageFiles(newPending);
    }

    setEditingItemIndex(null);
    toast.success("Item actualizado");
  }

  const filteredWords = words;

  // Agrupar palabras por categoría
  const wordsByCategory = filteredWords.reduce((acc, word) => {
    if (!acc[word.category]) {
      acc[word.category] = [];
    }
    acc[word.category].push(word);
    return acc;
  }, {});

  // Mostrar loader mientras se verifica el acceso
  if (checkingAccess || isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Lock size={48} className="mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-gray-400">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, no renderizar nada (ya fue redirigido)
  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-gray-400 mt-2">
              {activeTab === "words" && "Gestiona las palabras del juego"}
              {activeTab === "users" && "Gestiona usuarios y suscripciones"}
              {activeTab === "modes" && "Gestiona modos especiales con imágenes"}
            </p>
          </div>
          {activeTab === "words" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Agregar Palabras
            </button>
          )}
          {activeTab === "modes" && (
            <button
              onClick={() => handleOpenModeModal()}
              className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Crear Modo
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("words")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === "words"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <BookOpen size={20} />
            Palabras
          </button>
          <button
            onClick={() => setActiveTab("modes")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === "modes"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Gamepad2 size={20} />
            Modos Especiales
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all ${
              activeTab === "users"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Users size={20} />
            Usuarios
          </button>
        </div>

        {/* Contenido de la tab de Palabras */}
        {activeTab === "words" && (
          <>
            {/* Estadísticas */}
            {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-6 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Palabras</p>
                  <p className="text-3xl font-bold">{stats.stats.totalWords}</p>
                </div>
                <TrendingUp className="text-purple-400" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-6 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Peso Promedio</p>
                  <p className="text-3xl font-bold">{stats.stats.avgWeight}</p>
                </div>
                <TrendingUp className="text-blue-400" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 p-6 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Peso Máximo</p>
                  <p className="text-3xl font-bold">{stats.stats.maxWeight}</p>
                </div>
                <TrendingUp className="text-emerald-400" size={32} />
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 p-6 rounded-xl border border-amber-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Categorías</p>
                  <p className="text-3xl font-bold">{categories.length}</p>
                </div>
                <Filter className="text-amber-400" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 mb-6 flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none flex-1"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg border border-blue-500/50 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>

        {/* Lista de palabras agrupadas por categoría */}
        <div className="space-y-6">
          {Object.entries(wordsByCategory).map(([category, categoryWords]) => (
            <div key={category} className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-purple-400">{category}</h2>
                <span className="bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                  {categoryWords.length} palabras
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryWords.map(word => (
                  <div
                    key={word.id}
                    className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{word.word}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            Peso: <span className="text-emerald-400 font-medium">{word.weight}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWord(word.id)}
                        className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/30 p-2 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No hay palabras en esta categoría</p>
          </div>
        )}

        {/* Modal para agregar palabras */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/50 max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Agregar Nuevas Palabras
            </h2>

            <div className="space-y-6">
              {/* Selector de categoría */}
              <div>
                <label className="block text-sm font-medium mb-2">Categoría</label>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!isNewCategory}
                      onChange={() => setIsNewCategory(false)}
                      className="w-4 h-4"
                    />
                    <span>Categoría existente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={isNewCategory}
                      onChange={() => setIsNewCategory(true)}
                      className="w-4 h-4"
                    />
                    <span>Nueva categoría</span>
                  </label>
                </div>

                {isNewCategory ? (
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  />
                ) : (
                  <select
                    value={newCategory || selectedCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Input de palabras */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Palabras (separadas por comas)
                </label>
                <textarea
                  value={newWords}
                  onChange={(e) => setNewWords(e.target.value)}
                  placeholder="gato, perro, elefante, jirafa..."
                  rows={6}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Ingresa varias palabras separadas por comas. Se capitalizarán automáticamente.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddWords}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold transition-all"
                >
                  Agregar Palabras
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl font-semibold bg-gray-700 hover:bg-gray-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
          </>
        )}

        {/* Contenido de la tab de Modos Especiales */}
        {activeTab === "modes" && (
          <>
            {/* Configuración global de modos especiales */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-500/20 p-3 rounded-xl">
                    <Gamepad2 size={28} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Botón de Modos Especiales</h3>
                    <p className="text-sm text-gray-400">
                      {specialModesEnabled
                        ? "El botón de modos especiales está visible en el menú principal"
                        : "El botón de modos especiales está oculto en el menú principal"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleSpecialModes}
                  disabled={loadingSettings}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    specialModesEnabled
                      ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30 hover:bg-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border-2 border-red-500/30 hover:bg-red-500/30"
                  } ${loadingSettings ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {specialModesEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
                  {loadingSettings ? "Cambiando..." : specialModesEnabled ? "Visible" : "Oculto"}
                </button>
              </div>
            </div>

            {/* Filtros de modos */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setModesFilter("active")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  modesFilter === "active"
                    ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30"
                    : "bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                Activos ({modes.filter(m => m.isActive).length})
              </button>
              <button
                onClick={() => setModesFilter("inactive")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  modesFilter === "inactive"
                    ? "bg-gray-500/20 text-gray-400 border-2 border-gray-500/30"
                    : "bg-gray-800/50 text-gray-400 border-2 border-gray-700 hover:border-gray-600"
                }`}
              >
                Desactivados ({modes.filter(m => !m.isActive).length})
              </button>
            </div>

            {/* Lista de modos */}
            <div className="space-y-4">
              {modes.filter(m => modesFilter === "active" ? m.isActive : !m.isActive).length === 0 ? (
                <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-700">
                  <Gamepad2 size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No hay modos especiales creados</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {modesFilter === "active" ? "No hay modos activos" : "No hay modos desactivados"}
                  </p>
                </div>
              ) : (
                modes.filter(m => modesFilter === "active" ? m.isActive : !m.isActive).map(mode => (
                  <div
                    key={mode.id}
                    className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Información del modo */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{mode.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mode.isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}>
                            {mode.isActive ? "Activo" : "Inactivo"}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {mode.type === "image" ? "Imágenes" : mode.type === "word" ? "Palabras" : "Híbrido"}
                          </span>
                          {mode.isFeaturedOnHome && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                              <Star size={12} fill="currentColor" />
                              Destacado #{mode.featuredOrder}
                            </span>
                          )}
                        </div>
                        {mode.description && (
                          <p className="text-gray-400 mb-3">{mode.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{mode.items?.length || 0} items</span>
                          <span>•</span>
                          <span>Creado: {new Date(mode.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Preview del botón */}
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-gray-500">Vista previa</p>
                        <div
                          className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                          style={{
                            background: mode.buttonGradient
                              ? `linear-gradient(135deg, ${mode.buttonGradient.from}, ${mode.buttonGradient.to})`
                              : mode.buttonImage
                              ? `url(${buildImageUrl(mode.buttonImage)}) center/cover`
                              : mode.buttonColor || "#8B5CF6"
                          }}
                        >
                          {!mode.buttonImage && mode.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleOpenModeModal(mode)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit size={18} className="text-blue-400" />
                        </button>
                        {mode.isActive && (
                          <button
                            onClick={() => handleToggleFeatured(mode)}
                            className={`p-2 rounded-lg transition-all ${
                              mode.isFeaturedOnHome
                                ? "bg-yellow-500/30 hover:bg-yellow-500/40"
                                : "bg-yellow-500/10 hover:bg-yellow-500/20"
                            }`}
                            title={mode.isFeaturedOnHome ? "Quitar de destacados" : "Destacar en home"}
                          >
                            <Star
                              size={18}
                              className="text-yellow-400"
                              fill={mode.isFeaturedOnHome ? "currentColor" : "none"}
                            />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleMode(mode.id)}
                          className="bg-amber-500/20 hover:bg-amber-500/30 p-2 rounded-lg transition-all"
                          title={mode.isActive ? "Desactivar" : "Activar"}
                        >
                          {mode.isActive ? <EyeOff size={18} className="text-amber-400" /> : <Eye size={18} className="text-amber-400" />}
                        </button>
                        {!mode.isActive && (
                          <button
                            onClick={() => handleDeleteMode(mode.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 p-2 rounded-lg transition-all"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal para crear/editar modo */}
            {showModeModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                <div className="bg-gray-900 rounded-2xl border-2 border-purple-500/50 max-w-4xl w-full p-4 sm:p-6 lg:p-8 relative my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
                  <button
                    onClick={() => setShowModeModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>

                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent pr-8">
                    {editingMode ? "Editar Modo" : "Crear Nuevo Modo"}
                  </h2>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nombre del modo</label>
                        <input
                          type="text"
                          value={modeForm.name}
                          onChange={(e) => setModeForm({ ...modeForm, name: e.target.value })}
                          placeholder="Ej: Clash Royale, Disney, etc."
                          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tipo</label>
                        <select
                          value={modeForm.type}
                          onChange={(e) => setModeForm({ ...modeForm, type: e.target.value })}
                          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                        >
                          <option value="image">Solo Imágenes</option>
                          <option value="word">Solo Palabras</option>
                          <option value="hybrid">Híbrido</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                      <textarea
                        value={modeForm.description}
                        onChange={(e) => setModeForm({ ...modeForm, description: e.target.value })}
                        placeholder="Describe este modo de juego..."
                        rows={2}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                      />
                    </div>

                    {/* Apariencia del botón */}
                    <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <Palette size={18} className="text-purple-400" />
                        <span className="text-sm sm:text-base">Apariencia del Botón</span>
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">URL de Imagen (opcional)</label>
                            <input
                              type="text"
                              value={modeForm.buttonImage}
                              onChange={(e) => setModeForm({ ...modeForm, buttonImage: e.target.value })}
                              placeholder="https://..."
                              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Color</label>
                            <input
                              type="color"
                              value={modeForm.buttonColor}
                              onChange={(e) => setModeForm({ ...modeForm, buttonColor: e.target.value })}
                              className="w-full h-10 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Estado</label>
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                              <input
                                type="checkbox"
                                checked={modeForm.isActive}
                                onChange={(e) => setModeForm({ ...modeForm, isActive: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Activo</span>
                            </label>
                          </div>
                        </div>

                        {/* Área de drag & drop para imagen del botón */}
                        <div
                          className="border-2 border-dashed border-blue-500/50 rounded-lg p-4 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer"
                          onDrop={(e) => handleDropImage(e, 'button')}
                          onDragOver={handleDragOver}
                          onPaste={(e) => handlePasteImage(e, 'button')}
                          tabIndex={0}
                        >
                          <div className="text-center">
                            <Upload size={24} className="mx-auto mb-2 text-blue-400" />
                            <p className="text-sm text-blue-400 font-medium">
                              Arrastra, pega (Ctrl+V) o haz clic para subir imagen del botón
                            </p>
                            <p className="text-xs text-gray-500 mt-1">La imagen se subirá al guardar el modo</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPendingButtonImageFile(file);
                                  toast.success("Imagen lista para subir");
                                }
                                e.target.value = '';
                              }}
                              className="hidden"
                              id="button-image-upload"
                            />
                            <label
                              htmlFor="button-image-upload"
                              className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline"
                            >
                              o selecciona archivo
                            </label>
                          </div>
                        </div>

                        {/* Preview de imagen pendiente del botón */}
                        {pendingButtonImageFile && (
                          <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <ImageIcon size={20} className="text-emerald-400" />
                              <div className="flex-1">
                                <p className="text-sm text-emerald-400 font-medium">Imagen lista para subir</p>
                                <p className="text-xs text-gray-400">{pendingButtonImageFile.name}</p>
                              </div>
                              <button
                                onClick={() => setPendingButtonImageFile(null)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gestión de items */}
                    <div className="border border-gray-700 rounded-lg p-3 sm:p-4">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                        <ImageIcon size={18} className="text-purple-400" />
                        <span className="text-sm sm:text-base">Items del Modo ({modeForm.items.length})</span>
                      </h3>

                      {/* Agregar nuevo item */}
                      <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium">Agregar items</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setBulkAddMode(false)}
                              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                                !bulkAddMode
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              Individual
                            </button>
                            <button
                              onClick={() => setBulkAddMode(true)}
                              className={`px-3 py-1 text-xs rounded-lg transition-all ${
                                bulkAddMode
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              En lote
                            </button>
                          </div>
                        </div>

                        {bulkAddMode ? (
                          // Modo agregar en lote
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-2">
                                Ingresa los labels separados por comas (sin imágenes)
                              </label>
                              <textarea
                                value={bulkLabels}
                                onChange={(e) => setBulkLabels(e.target.value)}
                                placeholder="Mago, Dragón, Gigante, Caballero, ..."
                                rows={3}
                                className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm resize-none"
                              />
                            </div>
                            <button
                              onClick={handleBulkAddItems}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                            >
                              <Plus size={16} />
                              Agregar todos
                            </button>
                            <p className="text-xs text-gray-500 text-center">
                              Después puedes agregar imágenes editando cada item
                            </p>
                          </div>
                        ) : (
                          // Modo individual
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                              <input
                                type="text"
                                value={newItem.label}
                                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                                placeholder="Label (ej: Mago)"
                                className="lg:col-span-4 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                              />
                              <input
                                type="text"
                                value={newItem.imageUrl}
                                onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                placeholder="URL imagen (opcional)"
                                className="lg:col-span-5 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                              />
                              <input
                                type="number"
                                value={newItem.weight}
                                onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 100 })}
                                placeholder="Peso"
                                min="10"
                                max="500"
                                className="lg:col-span-2 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none text-sm"
                              />
                              <button
                                onClick={handleAddItem}
                                disabled={uploadingImage}
                                className="lg:col-span-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 px-3 py-2 rounded-lg transition-all flex items-center justify-center"
                              >
                                <Plus size={18} />
                              </button>
                            </div>

                            {/* Área de drag & drop para imagen del item */}
                            <div
                              className="border-2 border-dashed border-blue-500/50 rounded-lg p-3 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer"
                              onDrop={(e) => handleDropImage(e, 'newItem')}
                              onDragOver={handleDragOver}
                              onPaste={(e) => handlePasteImage(e, 'newItem')}
                              tabIndex={0}
                            >
                              <div className="text-center">
                                <Upload size={20} className="mx-auto mb-1 text-blue-400" />
                                <p className="text-xs text-blue-400 font-medium">
                                  Arrastra, pega (Ctrl+V) o haz clic para añadir imagen
                                </p>
                                <p className="text-xs text-gray-500 mt-1">La imagen se subirá al agregar el item</p>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setPendingImageFile(file);
                                      toast.success("Imagen lista para subir");
                                    }
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                  id="newitem-image-upload"
                                  disabled={uploadingImage}
                                />
                                <label
                                  htmlFor="newitem-image-upload"
                                  className="inline-block mt-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline"
                                >
                                  o selecciona archivo
                                </label>
                              </div>
                            </div>

                            {/* Preview de imagen pendiente */}
                            {pendingImageFile && (
                              <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  <ImageIcon size={16} className="text-emerald-400" />
                                  <div className="flex-1">
                                    <p className="text-xs text-emerald-400 font-medium">Imagen lista para subir</p>
                                    <p className="text-xs text-gray-400">{pendingImageFile.name}</p>
                                  </div>
                                  <button
                                    onClick={() => setPendingImageFile(null)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Lista de items */}
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {modeForm.items.length === 0 ? (
                          <p className="text-gray-500 text-center py-4 text-sm">No hay items agregados</p>
                        ) : (
                          modeForm.items.map((item, index) => (
                            <div
                              key={index}
                              className="bg-gray-800 p-3 rounded-lg"
                            >
                              {editingItemIndex === index ? (
                                // Modo edición
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-gray-400 mb-1">Label</label>
                                      <input
                                        type="text"
                                        value={item.label}
                                        onChange={(e) => handleUpdateItem(index, 'label', e.target.value)}
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-400 mb-1">Peso</label>
                                      <input
                                        type="number"
                                        value={item.weight}
                                        onChange={(e) => handleUpdateItem(index, 'weight', parseInt(e.target.value) || 100)}
                                        min="10"
                                        max="500"
                                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-400 mb-1">URL de Imagen</label>
                                    <input
                                      type="text"
                                      value={item.imageUrl || ''}
                                      onChange={(e) => handleUpdateItem(index, 'imageUrl', e.target.value)}
                                      placeholder="URL de la imagen"
                                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
                                    />
                                  </div>

                                  {/* Área de drag & drop para editar imagen */}
                                  <div
                                    className="border-2 border-dashed border-blue-500/50 rounded-lg p-2 bg-blue-500/5 hover:bg-blue-500/10 transition-all cursor-pointer"
                                    onDrop={(e) => handleDropImage(e, index)}
                                    onDragOver={handleDragOver}
                                    onPaste={(e) => handlePasteImage(e, index)}
                                    tabIndex={0}
                                  >
                                    <div className="text-center">
                                      <Upload size={16} className="mx-auto mb-1 text-blue-400" />
                                      <p className="text-xs text-blue-400 font-medium">
                                        Arrastra, pega (Ctrl+V) o haz clic para cambiar imagen
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">La imagen se subirá al guardar</p>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setPendingEditImageFiles({ ...pendingEditImageFiles, [index]: file });
                                            toast.success("Imagen lista para subir");
                                          }
                                          e.target.value = '';
                                        }}
                                        className="hidden"
                                        id={`edititem-image-upload-${index}`}
                                        disabled={uploadingImage}
                                      />
                                      <label
                                        htmlFor={`edititem-image-upload-${index}`}
                                        className="inline-block mt-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer underline"
                                      >
                                        o selecciona archivo
                                      </label>
                                    </div>
                                  </div>

                                  {/* Preview de imagen pendiente para edición */}
                                  {pendingEditImageFiles[index] && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg p-2">
                                      <div className="flex items-center gap-2">
                                        <ImageIcon size={16} className="text-emerald-400" />
                                        <div className="flex-1">
                                          <p className="text-xs text-emerald-400 font-medium">Nueva imagen lista</p>
                                          <p className="text-xs text-gray-400">{pendingEditImageFiles[index].name}</p>
                                        </div>
                                        <button
                                          onClick={() => {
                                            const newPending = { ...pendingEditImageFiles };
                                            delete newPending[index];
                                            setPendingEditImageFiles(newPending);
                                          }}
                                          className="text-red-400 hover:text-red-300"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveItemEdit(index)}
                                      disabled={uploadingImage}
                                      className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 px-3 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                                    >
                                      {uploadingImage ? "Guardando..." : "Guardar"}
                                    </button>
                                    <button
                                      onClick={() => handleRemoveItem(index)}
                                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm transition-all"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Modo vista
                                <div className="flex items-center gap-3">
                                  {/* Área clickable para seleccionar y pegar */}
                                  <div
                                    onClick={() => {
                                      setSelectedItemIndex(selectedItemIndex === index ? null : index);
                                      if (selectedItemIndex !== index) {
                                        toast.info("Presiona Ctrl+V para pegar una imagen", { duration: 2000 });
                                      }
                                    }}
                                    className={`flex items-center gap-3 flex-1 cursor-pointer p-2 -m-2 rounded transition-all ${
                                      selectedItemIndex === index
                                        ? 'bg-purple-500/20 border-2 border-purple-500'
                                        : 'hover:bg-gray-700/50 border-2 border-transparent'
                                    }`}
                                    title="Click para seleccionar y pegar imagen"
                                  >
                                    {item.imageUrl && (
                                      <img
                                        src={buildImageUrl(item.imageUrl)}
                                        alt={item.label}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{item.label}</p>
                                      <p className="text-xs text-gray-500">Peso: {item.weight}</p>
                                      {selectedItemIndex === index && (
                                        <p className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                                          <ImageIcon size={12} />
                                          Listo para pegar imagen
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Botones de acción */}
                                  <button
                                    onClick={() => {
                                      setEditingItemIndex(index);
                                      setSelectedItemIndex(null);
                                    }}
                                    className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded transition-all"
                                    title="Editar"
                                  >
                                    <Edit size={14} className="text-blue-400" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="bg-red-500/20 hover:bg-red-500/30 p-2 rounded transition-all"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} className="text-red-400" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sticky bottom-0 bg-gray-900 pb-2">
                      <button
                        onClick={handleSaveMode}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base"
                      >
                        {editingMode ? "Actualizar Modo" : "Crear Modo"}
                      </button>
                      <button
                        onClick={() => setShowModeModal(false)}
                        className="px-4 sm:px-6 py-3 rounded-xl font-semibold bg-gray-700 hover:bg-gray-600 transition-all text-sm sm:text-base"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Contenido de la tab de Usuarios */}
        {activeTab === "users" && (
          <UserManagement />
        )}
      </div>
    </div>
  );
}
