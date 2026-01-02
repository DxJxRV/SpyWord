import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Type } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

export default function NamesManager() {
  const [nouns, setNouns] = useState([]);
  const [verbs, setVerbs] = useState([]);
  const [fallbackNouns, setFallbackNouns] = useState([]);
  const [fallbackVerbs, setFallbackVerbs] = useState([]);
  const [usingFallback, setUsingFallback] = useState({ nouns: true, verbs: true });
  const [loading, setLoading] = useState(true);

  // Form states
  const [newNoun, setNewNoun] = useState('');
  const [newVerb, setNewVerb] = useState('');
  const [generatedName, setGeneratedName] = useState('');
  const [bulkMode, setBulkMode] = useState({ nouns: false, verbs: false });

  useEffect(() => {
    fetchNames();
  }, []);

  const fetchNames = async () => {
    try {
      const response = await api.get('/admin/names');
      setNouns(response.data.nouns);
      setVerbs(response.data.verbs);
      setFallbackNouns(response.data.fallbackNouns);
      setFallbackVerbs(response.data.fallbackVerbs);
      setUsingFallback(response.data.usingFallback);
    } catch (error) {
      console.error('Error fetching names:', error);
      toast.error('Error al cargar nombres');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNoun = async () => {
    if (!newNoun.trim()) return;

    try {
      // Si contiene comas, es modo bulk
      const words = newNoun.split(',').map(w => w.trim()).filter(w => w.length > 0);

      if (words.length > 1) {
        // Bulk: agregar todas
        let added = 0;
        for (const word of words) {
          try {
            await api.post('/admin/names', { type: 'noun', word });
            added++;
          } catch (err) {
            console.error(`Error al agregar "${word}":`, err);
          }
        }
        toast.success(`${added} sustantivos agregados`);
      } else {
        // Single: agregar uno
        await api.post('/admin/names', { type: 'noun', word: newNoun.trim() });
        toast.success('Sustantivo agregado');
      }

      setNewNoun('');
      fetchNames();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar sustantivo');
    }
  };

  const handleAddVerb = async () => {
    if (!newVerb.trim()) return;

    try {
      // Si contiene comas, es modo bulk
      const words = newVerb.split(',').map(w => w.trim()).filter(w => w.length > 0);

      if (words.length > 1) {
        // Bulk: agregar todas
        let added = 0;
        for (const word of words) {
          try {
            await api.post('/admin/names', { type: 'verb', word });
            added++;
          } catch (err) {
            console.error(`Error al agregar "${word}":`, err);
          }
        }
        toast.success(`${added} verbos agregados`);
      } else {
        // Single: agregar uno
        await api.post('/admin/names', { type: 'verb', word: newVerb.trim() });
        toast.success('Verbo agregado');
      }

      setNewVerb('');
      fetchNames();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar verbo');
    }
  };

  const handleDelete = async (type, word) => {
    try {
      await api.delete('/admin/names', { data: { type, word } });
      toast.success(`${type === 'noun' ? 'Sustantivo' : 'Verbo'} eliminado`);
      fetchNames();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleGeneratePreview = async () => {
    try {
      const response = await api.get('/names/generate');
      setGeneratedName(response.data.name);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar nombre');
    }
  };

  if (loading) {
    return <div className="text-white p-6">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">📛 Gestión de Nombres</h2>
        <button
          onClick={fetchNames}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Recargar
        </button>
      </div>

      {/* Preview de nombre generado */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">👤 Preview de Nombre Generado</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-900 rounded-lg p-4 flex items-center justify-center">
            <p className="text-2xl font-bold text-white">
              {generatedName || 'Click en "Generar" →'}
            </p>
          </div>
          <button
            onClick={handleGeneratePreview}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            Generar
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Formato: Sustantivo + Verbo + 3 dígitos (Ej: GatoSalta456)
        </p>
      </div>

      {/* Grid: Sustantivos y Verbos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sustantivos */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Type size={20} className="text-blue-400" />
            Sustantivos ({nouns.length})
          </h3>

          {usingFallback.nouns && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-300">
                ⚠️ Usando lista hardcodeada ({fallbackNouns.length} palabras). Agrega sustantivos para personalizar.
              </p>
            </div>
          )}

          {/* Input para agregar */}
          <div className="space-y-2 mb-4">
            {bulkMode.nouns ? (
              <textarea
                value={newNoun}
                onChange={(e) => setNewNoun(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="Varios separados por comas: Gato, Dragón, Ninja, León..."
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={newNoun}
                onChange={(e) => setNewNoun(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNoun()}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="Ej: Gato"
                maxLength={20}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setBulkMode(prev => ({ ...prev, nouns: !prev.nouns }))}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-all"
              >
                {bulkMode.nouns ? 'Modo simple' : 'Modo bulk'}
              </button>
              <button
                onClick={handleAddNoun}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {bulkMode.nouns ? 'Agregar múltiples' : 'Agregar'}
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {nouns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Sin sustantivos personalizados. Usando lista hardcodeada.
              </p>
            ) : (
              nouns.map(noun => (
                <div
                  key={noun}
                  className="bg-gray-900/50 rounded-lg px-4 py-2 flex items-center justify-between"
                >
                  <span className="text-white font-semibold">{noun}</span>
                  <button
                    onClick={() => handleDelete('noun', noun)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Verbos */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Type size={20} className="text-green-400" />
            Verbos ({verbs.length})
          </h3>

          {usingFallback.verbs && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-300">
                ⚠️ Usando lista hardcodeada ({fallbackVerbs.length} palabras). Agrega verbos para personalizar.
              </p>
            </div>
          )}

          {/* Input para agregar */}
          <div className="space-y-2 mb-4">
            {bulkMode.verbs ? (
              <textarea
                value={newVerb}
                onChange={(e) => setNewVerb(e.target.value)}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                placeholder="Varios separados por comas: Salta, Vuela, Corre, Nada..."
                rows={3}
              />
            ) : (
              <input
                type="text"
                value={newVerb}
                onChange={(e) => setNewVerb(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddVerb()}
                className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                placeholder="Ej: Salta"
                maxLength={20}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setBulkMode(prev => ({ ...prev, verbs: !prev.verbs }))}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-all"
              >
                {bulkMode.verbs ? 'Modo simple' : 'Modo bulk'}
              </button>
              <button
                onClick={handleAddVerb}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                {bulkMode.verbs ? 'Agregar múltiples' : 'Agregar'}
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {verbs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Sin verbos personalizados. Usando lista hardcodeada.
              </p>
            ) : (
              verbs.map(verb => (
                <div
                  key={verb}
                  className="bg-gray-900/50 rounded-lg px-4 py-2 flex items-center justify-between"
                >
                  <span className="text-white font-semibold">{verb}</span>
                  <button
                    onClick={() => handleDelete('verb', verb)}
                    className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-all"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">ℹ️ Cómo funciona</h4>
        <ul className="text-xs text-blue-200 space-y-1">
          <li>• Los nombres se generan con formato: <strong>Sustantivo + Verbo + 3 dígitos</strong></li>
          <li>• Ejemplos: GatoSalta456, LeónCorre123, DragonVuela789</li>
          <li>• Si las listas están vacías, usa las listas hardcodeadas automáticamente</li>
          <li>• Los nombres son más cortos y memorables que antes</li>
        </ul>
      </div>
    </div>
  );
}
