
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../firebase';
// Ensure modular imports for Auth functions
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AlertCircle, Copy, Check, Database, ShieldAlert, Server, GraduationCap } from 'lucide-react';
import { EMAIL_DOMAIN } from '../constants';
import { User } from '../types';

interface Props {
  onDemo?: () => void;
}

const Login: React.FC<Props> = ({ onDemo }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const currentHostname = window.location.hostname;
  const isFirebaseHosting = currentHostname.includes('web.app') || currentHostname.includes('firebaseapp.com');

  const handleCopy = () => {
    if (inputRef.current) {
      inputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      // Modular usage of signInWithPopup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (user.email && !user.email.toLowerCase().endsWith(EMAIL_DOMAIN)) {
        setError(`Accesso consentito solo con email @unikorestudent.it`);
        await signOut(auth);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser: User = {
          id: user.uid,
          name: user.displayName || 'Studente UniKore',
          email: user.email || '',
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          role: 'student',
          friends: [],
          pendingRequests: [],
          notifications: [],
          course: 'In attesa di configurazione',
          year: '1° Anno'
        };
        await setDoc(userDocRef, newUser);
      }
      navigate('/');
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('unauthorized-domain');
      } else {
        setError('Errore durante il login. Verifica la tua email universitaria.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md relative z-10 border border-slate-100 dark:border-slate-800 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl rotate-3">
          <GraduationCap size={40} />
        </div>

        <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter italic mb-2">UniLife</h1>
        <div className="flex flex-col items-center gap-2 mb-10">
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            Accesso Studenti <span className="text-blue-600">UniKore</span>
          </p>
          {isFirebaseHosting && (
            <span className="bg-blue-900 text-white dark:bg-slate-800 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <Server size={10} /> Firebase Live
            </span>
          )}
        </div>

        {error === 'unauthorized-domain' ? (
          <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-[2.5rem] text-left border border-amber-200 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="text-amber-600" size={24} />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-700">Configurazione Hosting</h4>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-4 font-bold leading-relaxed">
              Il dominio non è autorizzato in Firebase Auth. Copia questo link e aggiungilo ai domini autorizzati nella console Firebase:
            </p>
            <div className="relative mb-4 group">
              <textarea 
                ref={inputRef}
                readOnly
                value={currentHostname}
                className="w-full bg-white dark:bg-slate-950 p-4 rounded-2xl border-2 border-amber-300 dark:border-slate-800 text-[12px] font-mono font-black text-center h-14 resize-none transition-all"
              />
              <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={() => setError('')} className="w-full py-4 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Riprova</button>
          </div>
        ) : error && (
          <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-start gap-3 text-left border border-red-100">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-blue-200 dark:shadow-none"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-0 invert" alt="G" />
            <span>Entra con Google Student</span>
          </button>

          <button 
            onClick={onDemo}
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-slate-100 dark:border-slate-700 hover:bg-white transition-all active:scale-95"
          >
            Esplora come Ospite (Demo)
          </button>
        </div>
        
        <p className="mt-8 text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
          Solo per studenti @unikorestudent.it<br/>
          Piattaforma Universitaria Indipendente
        </p>
      </div>
    </div>
  );
};

export default Login;
