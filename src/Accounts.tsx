import React, { useEffect, useState } from 'react';

type Section = {
  id: string;
  title: string;
  endpoint: string;
  description: string;
};

const SECTIONS: Section[] = [
  { id: 'list', title: 'Giocatori', endpoint: '/wot/account/list/', description: 'Players' },
  { id: 'info', title: 'Dati Personali', endpoint: '/wot/account/info/', description: 'Player personal data' },
  { id: 'tanks', title: 'Veicoli Giocatore', endpoint: '/wot/account/tanks/', description: "Player's vehicles" },
  { id: 'achievements', title: 'Achievements', endpoint: '/wot/account/achievements/', description: "Player's achievements" },
  { id: 'wtr', title: 'WTR', endpoint: '/wot/account/wtr/', description: "Player's WTR" },
];

export default function Accounts() {
  const [selected, setSelected] = useState<string>('list');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchNickname, setSearchNickname] = useState<string>('');
  const [userAccountId, setUserAccountId] = useState<string>('');

  // Stato aggiuntivo per memorizzare le immagini e i nomi dall'enciclopedia
  const [tankEncyclopedia, setTankEncyclopedia] = useState<Record<number, any>>({});
  const [loadingImages, setLoadingImages] = useState(false);

  const APP_ID = import.meta.env.VITE_WOT_APP_ID;

  // Carica l'account_id dal login
  useEffect(() => {
    const savedUser = localStorage.getItem('wot_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setUserAccountId(user.accountId || '');
    }
  }, []);

  // Effetto principale per il recupero dati dei tab
  useEffect(() => {
    if (!selected) return;
    
    const section = SECTIONS.find(s => s.id === selected);
    if (!section) return;

    if (selected === 'list' && !searchNickname) {
      setData(null);
      setError(null);
      return;
    }

    if (selected !== 'list' && !userAccountId) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    let url = `https://api.worldoftanks.eu${section.endpoint}?application_id=${APP_ID}`;
    
    if (selected === 'list' && searchNickname) {
      url += `&search=${encodeURIComponent(searchNickname)}`;
    } else if (selected !== 'list' && userAccountId) {
      url += `&account_id=${userAccountId}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.status !== 'ok') throw new Error(JSON.stringify(json.error || json));
        setData(json.data || {});
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [selected, searchNickname, userAccountId]);

  // NUOVO EFFETTO: Se siamo nel tab 'tanks' e abbiamo i dati estratti, interroghiamo l'enciclopedia
  useEffect(() => {
    if (selected !== 'tanks' || !data || !data[userAccountId]) return;

    const playerTanks = data[userAccountId];
    if (!Array.isArray(playerTanks) || playerTanks.length === 0) return;

    // Estraiamo tutti i tank_id del giocatore (max 100 per limite dell'API Wargaming per singola richiesta)
    const tankIds = playerTanks.slice(0, 100).map((t: any) => t.tank_id).join(',');

    setLoadingImages(true);
    fetch(`https://api.worldoftanks.eu/wot/encyclopedia/vehicles/?application_id=${APP_ID}&tank_id=${tankIds}&fields=name,images,tier,type,nation`)
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'ok') {
          setTankEncyclopedia(json.data || {});
        }
      })
      .catch((err) => console.error("Errore nel caricamento dettagli carri:", err))
      .finally(() => setLoadingImages(false));
  }, [data, selected, userAccountId]);


  // --- SUB-RENDERERS ---

  const renderList = () => {
    const players = Array.isArray(data) ? data : Object.values(data || {});
    if (players.length === 0) return <p className="text-gray-400 text-center py-4">Nessun giocatore trovato.</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {players.map((player: any) => (
          <div key={player.account_id} className="p-4 bg-gray-700 rounded-lg border border-gray-600 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-amber-300">{player.nickname}</p>
              <p className="text-xs text-gray-400">ID: {player.account_id}</p>
            </div>
            <button 
              onClick={() => { setUserAccountId(player.account_id); setSelected('info'); }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-gray-900 rounded text-xs font-bold transition"
            >
              Analizza
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderInfo = () => {
    const accountData = data?.[userAccountId];
    if (!accountData) return <p className="text-gray-400 text-center py-4">Dati non disponibili.</p>;

    const stats = accountData.statistics?.all || {};
    const winRate = stats.battles ? ((stats.wins / stats.battles) * 100).toFixed(2) : '0';

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center border-b border-gray-700 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{accountData.nickname}</h2>
            <p className="text-xs text-gray-400">Creato il: {new Date(accountData.created_at * 1000).toLocaleDateString()}</p>
          </div>
          <div className="bg-gray-700 px-4 py-2 rounded-lg text-right">
            <span className="text-xs text-gray-400 block uppercase">Ultima Battaglia</span>
            <span className="text-sm font-mono text-amber-300">{new Date(accountData.last_battle_time * 1000).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold">Battaglie</p>
            <p className="text-2xl font-black text-white mt-1">{stats.battles || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold">Vittorie (Winrate)</p>
            <p className="text-2xl font-black text-green-400 mt-1">{winRate}%</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold">Exp Massima</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.max_xp || 0}</p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg text-center">
            <p className="text-xs text-gray-400 uppercase font-semibold">Alberi Abbattuti</p>
            <p className="text-2xl font-black text-gray-300 mt-1">{accountData.trees_cut || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // RENDERING DETTAGLIATO CON IMMAGINI REALI DEI CARRI
  const renderTanks = () => {
    const tankList = data?.[userAccountId];
    if (!tankList || !Array.isArray(tankList)) return <p className="text-gray-400 text-center py-4">Nessun veicolo trovato.</p>;

    return (
      <div>
        {loadingImages && (
          <p className="text-xs text-amber-400 mb-4 animate-pulse">Sincronizzazione icone ed estetica dei veicoli in corso...</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {tankList.slice(0, 100).map((tank: any, index: number) => {
            const battles = tank.statistics?.battles || 0;
            const wins = tank.statistics?.wins || 0;
            const wr = battles ? ((wins / battles) * 100).toFixed(1) : '0';

            // Recuperiamo i dettagli estetici del carro dall'enciclopedia tramite ID
            const details = tankEncyclopedia[tank.tank_id];

            return (
              <div key={index} className="bg-gray-700 rounded-lg border border-gray-600 hover:border-amber-500/50 transition flex flex-col justify-between overflow-hidden shadow-lg">
                
                {/* Immagine del Carro Armato */}
                <div className="bg-gray-900 p-2 h-28 flex items-center justify-center relative">
                  {details?.images?.big_icon ? (
                    <img 
                      src={details.images.big_icon} 
                      alt={details?.name || "Carro"} 
                      className="max-h-full max-w-full object-contain transform hover:scale-105 transition duration-200"
                    />
                  ) : (
                    <div className="w-12 h-6 bg-gray-800 rounded animate-pulse flex items-center justify-center text-[10px] text-gray-500">
                      Loading...
                    </div>
                  )}
                  {details?.tier && (
                    <span className="absolute bottom-1 right-2 bg-gray-900/80 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                      Tier {details.tier}
                    </span>
                  )}
                </div>

                {/* Info Statistiche */}
                <div className="p-3 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate mb-1">
                      {details?.name || `Tank ID: ${tank.tank_id}`}
                    </h4>
                    <div className="flex gap-1.5 text-[10px] uppercase font-semibold text-gray-400">
                      <span>{details?.nation || '---'}</span>
                      <span>•</span>
                      <span className="text-amber-400/90">{details?.type || '---'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-gray-600/60 flex justify-between text-xs text-gray-300">
                    <div>Battaglie: <span className="font-bold text-white">{battles}</span></div>
                    <div className="text-right">Winrate: <span className={`font-bold ${Number(wr) >= 50 ? 'text-green-400' : 'text-red-400'}`}>{wr}%</span></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAchievements = () => {
    const achData = data?.[userAccountId];
    if (!achData || !achData.achievements) return <p className="text-gray-400 text-center py-4">Nessun achievement trovato.</p>;

    const medals = Object.entries(achData.achievements);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2">
        {medals.map(([medalName, count]: any) => (
          <div key={medalName} className="p-3 bg-gray-700 rounded-lg border border-gray-600 text-center flex flex-col justify-between">
            <p className="text-xs font-bold text-gray-200 uppercase tracking-tight break-words">{medalName.replace('_', ' ')}</p>
            <p className="text-xl font-black text-amber-400 mt-2">x{count}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderWTR = () => {
    const wtrData = data?.[userAccountId];
    if (!wtrData) return <p className="text-gray-400 text-center py-4">Nessun dato WTR trovato per questo account.</p>;

    return (
      <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600 text-center shadow-xl">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Wargaming Personal Rating</h3>
        <div className="text-5xl font-black text-amber-400 tracking-wider my-4 drop-shadow-md">
          {wtrData.wtr || wtrData.global_rating || "N/A"}
        </div>
        <p className="text-xs text-gray-400">
          Valore di efficienza globale calcolato ufficialmente dai sistemi algoritmi Wargaming.net.
        </p>
      </div>
    );
  };

  const renderContent = () => {
    if (!data) return null;
    switch (selected) {
      case 'list': return renderList();
      case 'info': return renderInfo();
      case 'tanks': return renderTanks();
      case 'achievements': return renderAchievements();
      case 'wtr': return renderWTR();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-8 tracking-wide">WoT Account Dashboard</h1>
        
        {/* Menu a Tab */}
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelected(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                selected === section.id
                  ? 'bg-amber-500 text-gray-900 font-bold shadow-md'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Ricerca */}
        {selected === 'list' && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Cerca giocatore per nickname esatto..."
              value={searchNickname}
              onChange={(e) => setSearchNickname(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        )}

        {/* Target account indicatore */}
        {selected !== 'list' && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 flex justify-between items-center text-sm">
            <p className="text-gray-300">
              Target Account ID: <span className="font-mono text-amber-400 font-bold">{userAccountId || 'Nessuno'}</span>
            </p>
            {userAccountId && (
              <button 
                onClick={() => { setSearchNickname(''); setSelected('list'); }}
                className="text-xs text-amber-500 hover:underline"
              >
                Cambia Giocatore
              </button>
            )}
          </div>
        )}

        {/* Contenitore di rendering principale */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-gray-300 font-medium">Contatto Server Wargaming...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-lg text-red-400 text-sm">
              <strong>Errore API:</strong> {error}
            </div>
          )}
          
          {!loading && !error && selected === 'list' && !searchNickname && (
            <p className="text-gray-400 text-center py-12">Digita un nickname per avviare la ricerca mirata nell'universo WoT.</p>
          )}

          {!loading && !error && selected !== 'list' && !userAccountId && (
            <p className="text-gray-400 text-center py-12">Seleziona o cerca prima un giocatore nella tab "Giocatori".</p>
          )}
          
          {!loading && !error && data && renderContent()}
        </div>
      </div>
    </div>
  );
}