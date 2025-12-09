import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, RefreshCw, TrendingUp, Filter, X } from "lucide-react";
import { api } from "../services/api";

export default function Admin() {
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

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  async function loadData() {
    setLoading(true);
    try {
      const [wordsRes, categoriesRes, statsRes] = await Promise.all([
        api.get(`/admin/words${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`),
        api.get("/admin/categories"),
        api.get("/admin/stats")
      ]);

      setWords(wordsRes.data.words);
      setCategories(categoriesRes.data.categories);
      setStats(statsRes.data);
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

  const filteredWords = words;

  // Agrupar palabras por categoría
  const wordsByCategory = filteredWords.reduce((acc, word) => {
    if (!acc[word.category]) {
      acc[word.category] = [];
    }
    acc[word.category].push(word);
    return acc;
  }, {});

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-gray-400 mt-2">Gestiona las palabras del juego</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
          >
            <Plus size={20} />
            Agregar Palabras
          </button>
        </div>

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
      </div>

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
    </div>
  );
}
