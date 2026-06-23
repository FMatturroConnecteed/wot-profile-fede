import React, { useEffect, useState } from 'react';
import Nav from './Nav';

type Section = {
  id: string;
  title: string;
  endpoint: string;
  description: string;
};

const SECTIONS: Section[] = [
  { id: 'tanks', title: 'Lista Veicoli', endpoint: '/wot/encyclopedia/tanks/', description: 'List of vehicles' },
  { id: 'vehicles', title: 'Veicoli Dettagli', endpoint: '/wot/encyclopedia/vehicles/', description: 'Vehicles' },
  { id: 'achievements', title: 'Achievements', endpoint: '/wot/encyclopedia/achievements/', description: 'Achievements' },
  { id: 'maps', title: 'Mappe', endpoint: '/wot/encyclopedia/arenas/', description: 'Maps' },
  { id: 'provisions', title: 'Equipaggiamento', endpoint: '/wot/encyclopedia/provisions/', description: 'Equipment and Consumables' },
  { id: 'modules', title: 'Moduli', endpoint: '/wot/encyclopedia/modules/', description: 'Modules' },
  { id: 'info', title: 'Info Tankopedia', endpoint: '/wot/encyclopedia/info/', description: 'Tankopedia information' },
];

export default function Tankpedia() {
  const [selected, setSelected] = useState<string>('tanks');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const APP_ID = import.meta.env.VITE_WOT_APP_ID;

  useEffect(() => {
    if (!selected) return;
    
    const section = SECTIONS.find(s => s.id === selected);
    if (!section) return;

    setLoading(true);
    setError(null);
    
    const url = `https://api.worldoftanks.eu${section.endpoint}?application_id=${APP_ID}`;
    console.log('Fetching from:', url);
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        console.log('API Response:', json);
        if (json.status !== 'ok') throw new Error(JSON.stringify(json.error || json));
        const dataObj = json.data || {};
        console.log('Data keys:', Object.keys(dataObj).length);
        setData(dataObj);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6 pt-20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-400 mb-8">Tankopedia</h1>
          
          {/* Menu a Tab */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelected(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selected === section.id
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* Contenuto */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {loading && <p className="text-gray-300">Caricamento dati...</p>}
            {error && <p className="text-red-400">Errore: {error}</p>}
            
            {!loading && !error && data && (
              <div>
                <p className="text-gray-400 mb-4">
                  {typeof data === 'object' && data !== null ? `Risultati: ${Object.keys(data).length}` : 'Dati caricati'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[700px] overflow-y-auto">
                  {Object.entries(data).slice(0, 200).map(([id, itemData]: any) => (
                    <div key={id} className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-amber-400 transition overflow-hidden">
                      {/* Mostra le immagini in priorità */}
                      {itemData?.contour_image && (
                        <img src={itemData.contour_image} alt="contour" className="w-full rounded mb-2 max-h-[150px] object-contain bg-gray-800" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      )}
                      {itemData?.image && !itemData.contour_image && (
                        <img src={itemData.image} alt="image" className="w-full rounded mb-2 max-h-[100px] object-contain bg-gray-800" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      )}
                      {itemData?.image_small && !itemData.contour_image && !itemData.image && (
                        <img src={itemData.image_small} alt="small" className="w-full rounded mb-2 max-h-[60px] object-contain bg-gray-800" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      )}
                      
                      {/* Nome o ID come titolo */}
                      <h3 className="text-sm font-bold text-amber-300 mb-2 truncate">
                        {itemData?.name || itemData?.title || id}
                      </h3>
                      
                      {/* Mostra i dettagli principali */}
                      <div className="space-y-1 text-xs">
                        {Object.entries(itemData || {}).slice(0, 5).map(([k, v]: any) => {
                          if (['image', 'image_small', 'contour_image', 'name', 'title'].includes(k)) return null;
                          if (typeof v === 'object') return null;
                          return (
                            <div key={k}>
                              <span className="text-gray-400">{k}:</span> <span className="text-amber-200">{String(v).substring(0, 25)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
