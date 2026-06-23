import { useState, useEffect } from 'react';
import Tankpedia from './Tankpedia';
import Accounts from './Accounts';
import Nav from './Nav';

// Sostituisci con il tuo vero Application ID ottenuto dal pannello Wargaming
const APPLICATION_ID = import.meta.env.VITE_WOT_APP_ID;
const REDIRECT_URI = window.location.origin; // Reindirizza alla stessa pagina (es. http://localhost:5173)
const REALM = 'eu'; // Puoi usare 'eu', 'na', 'asia', ecc.

type User = {
  accessToken: string;
  nickname?: string | null;
  accountId?: string | null;
  expiresAt?: string | null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Controlla se ci sono i parametri di Wargaming nell'URL (Query String)
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    const accessToken = searchParams.get('access_token');
    const nickname = searchParams.get('nickname');
    const accountId = searchParams.get('account_id');
    const expiresAt = searchParams.get('expires_at');

    if (status === 'ok' && accessToken) {
      // Login completato con successo
      const userData = {
        accessToken,
        nickname,
        accountId,
        expiresAt: new Date(Number(expiresAt) * 1000).toLocaleString(),
      };

      // Salva i dati nello stato e nel localStorage per mantenere la sessione
      setUser(userData);
      localStorage.setItem('wot_user', JSON.stringify(userData));
      // Apri la pagina Tankpedia in una nuova scheda dopo il login
      try {
        const tanksUrl = `${window.location.origin}/tanks`;
        window.open(tanksUrl, '_blank');
      } catch (err) {
        // ignore
      }

      // Pulisci l'URL dai parametri sensibili
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Controlla se l'utente era già loggato in precedenza
      const savedUser = localStorage.getItem('wot_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser) as User);
      }
    }
    setLoading(false);
  }, []);

  // Funzione che reindirizza l'utente a Wargaming per il Login
  const handleLogin = () => {
    const wargamingLoginUrl = `https://api.worldoftanks.${REALM}/wot/auth/login/?application_id=${APPLICATION_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    window.location.href = wargamingLoginUrl;
  };

  // Funzione di Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('wot_user');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <>
      <Nav />
      {/* Routing per le varie pagine */}
      {window.location.pathname === '/tanks' ? (
        <Tankpedia />
      ) : window.location.pathname === '/accounts' ? (
        <Accounts />
      ) : (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700 text-center">

          {/* Intestazione */}
          <h1 className="text-3xl font-black tracking-wider text-amber-500 mb-2 uppercase">
            WoT Stats App
          </h1>
          <p className="text-gray-400 text-sm mb-8">Accedi con il tuo account Wargaming</p>

          {/* Stato del Login */}
          {!user ? (
            <div>
              <p className="text-gray-300 mb-6">
                Per vedere le tue statistiche e connettere il profilo, effettua l'autenticazione ufficiale.
              </p>
              <button
                onClick={handleLogin}
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Accedi con Wargaming.net
              </button>
            </div>
          ) : (
            <div className="text-left">
              <div className="bg-gray-750 p-4 rounded-lg border border-gray-700 mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Benvenuto Comandante</p>
                <h2 className="text-2xl font-bold text-white mt-1 mb-4">{user.nickname}</h2>

                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Account ID:</span> <span className="font-mono text-amber-400">{user.accountId}</span></p>
                  <p><span className="text-gray-400">Scadenza Token:</span> <span className="text-gray-300">{user.expiresAt}</span></p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => alert(`Chiamata API Wot con Token: ${user.accessToken}`)}
                  className="w-full bg-gray-700 hover:bg-gray-650 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Usa API Protette (Esempio)
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Disconnetti
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}