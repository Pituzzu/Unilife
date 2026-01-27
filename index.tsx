import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import * as firebaseApp from "firebase/app";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import { 
  LogOut, LayoutDashboard, Bell, Users2, Moon, Sun, Home, UserCircle, Database, 
  AlertTriangle, Server, BookOpen, Award, FileText, Sparkles, Send, Clock, Loader2, 
  ChevronLeft, Megaphone, X, Search, Globe, FileUp, Download, Plus, GraduationCap, 
  ExternalLink, Trophy, HelpCircle, HandHelping, UserPlus, Check, Edit3, MapPin, Calendar, Mail, Github
} from 'lucide-react';

// --- TYPES ---
export type NotificationType = 'friend_request' | 'circle_invite' | 'join_request' | 'request_accepted' | 'note_provided';
export type UserRole = 'student' | 'tutor' | 'representative';

export interface Notification {
  id: string; type: NotificationType; senderId: string; senderName: string;
  circleId?: string; circleName?: string; timestamp: string; read: boolean;
}

export interface User {
  id: string; name: string; email: string; avatar: string; bio?: string;
  course?: string; year?: string; interests?: string[]; role?: UserRole;
  friends: string[]; pendingRequests: string[]; notifications: Notification[];
  githubUsername?: string; karma: number;
}

export interface ChatMessage {
  id: string; senderId: string; senderName: string; senderAvatar: string;
  text: string; timestamp: string;
}

export interface Circle {
  id: string; name: string; subject: string; description: string;
  members: string[]; creatorId: string; category: string; createdAt: string; chat: ChatMessage[];
}

export interface NoteRequest {
  id: string; circleId: string; authorId: string; authorName: string;
  authorAvatar: string; topic: string; description: string; timestamp: string;
  status: 'open' | 'fulfilled'; fulfilledBy?: string;
}

export interface Note {
  id: string; title: string; content: string; authorId: string; circleId: string;
  createdAt: string; fileName: string; fileSize: string;
}

export interface Announcement {
  id: string; title: string; content: string; authorId: string; circleId: string;
  timestamp: string; priority: 'normal' | 'high';
}

// --- CONSTANTS ---
const EMAIL_DOMAIN = '@unikorestudent.it';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDrVX3nI6SSp_rgVipWLZFumGt_bzQVUSA",
  authDomain: "unilife-c6c28.firebaseapp.com",
  projectId: "unilife-c6c28",
  storageBucket: "unilife-c6c28.firebasestorage.app",
  messagingSenderId: "1092900695218",
  appId: "1:1092900695218:web:62781733d83a1c2f1f2dab"
};

const app = (firebaseApp as any).initializeApp(firebaseConfig);
const auth = (firebaseAuth as any).getAuth(app);
const db = (firebaseFirestore as any).getFirestore(app);
const googleProvider = new (firebaseAuth as any).GoogleAuthProvider();

// --- GEMINI SERVICE ---
async function summarizeNote(content: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Riassumi brevemente questo appunto: ${content}`,
    });
    return response.text || "Riassunto non disponibile.";
  } catch (e) { return "Errore IA."; }
}

async function suggestStudyPlan(topic: string): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crea un piano di studio rapido per: ${topic}`,
    });
    return response.text || "Nessun suggerimento.";
  } catch (e) { return "Errore IA."; }
}

// --- VIEWS ---

const Login = ({ onDemo }: { onDemo?: () => void }) => {
  // Fix: Added missing useNavigate from react-router-dom
  const navigate = useNavigate();
  const handleAuth = async () => {
    try {
      const result = await (firebaseAuth as any).signInWithPopup(auth, googleProvider);
      if (result.user.email && !result.user.email.endsWith(EMAIL_DOMAIN)) {
        alert("Solo email @unikorestudent.it");
        await (firebaseAuth as any).signOut(auth);
        return;
      }
      navigate('/');
    } catch (e) { console.error(e); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl text-center max-w-md w-full border border-slate-100 dark:border-slate-800">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-xl rotate-3"><GraduationCap size={40}/></div>
        <h1 className="text-4xl font-black italic tracking-tighter mb-2">UniLife</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-10">UniKore Student Circle</p>
        <button onClick={handleAuth} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-0 invert" /> Entra con Google Student
        </button>
      </div>
    </div>
  );
};

const Dashboard = ({ circles, currentUser, onJoin, onCreateCircle }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [newC, setNewC] = useState({ name: '', subject: '', category: 'Generale', description: '' });
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">Studia insieme.</h2>
        <p className="text-blue-100/70 mb-8 max-w-md">Condividi appunti e collabora con i colleghi UniKore.</p>
        <button onClick={() => setShowModal(true)} className="bg-white text-blue-800 px-8 py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
          <Plus size={18} /> Crea Cerchia
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circles.map((c: any) => (
          <Link key={c.id} to={`/circle/${c.id}`} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-all group">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all"><Users2 size={24}/></div>
            <h4 className="font-black text-xl mb-1">{c.name}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.subject}</p>
          </Link>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowModal(false)}/>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] relative w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Nuova Cerchia</h3>
            <input placeholder="Nome" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-4 font-bold" onChange={e=>setNewC({...newC, name: e.target.value})}/>
            <button onClick={()=>{onCreateCircle(newC); setShowModal(false)}} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs">Crea Ora</button>
          </div>
        </div>
      )}
    </div>
  );
};

const CircleDetail = ({ currentUser, circles, notes: allNotes, noteRequests: allRequests, announcements: allAnn, onAddNote, onAddRequest, onFulfillRequest, onSendMessage }: any) => {
  const { id } = useParams();
  const circle = circles.find((c:any) => c.id === id);
  const [tab, setTab] = useState('chat');
  const [chatIn, setChatIn] = useState('');
  const [summaries, setSummaries] = useState<any>({});

  if (!circle) return <div className="p-20 text-center font-black">Cerchia non trovata.</div>;

  const notes = allNotes.filter((n:any) => n.circleId === id);
  const requests = allRequests.filter((r:any) => r.circleId === id);

  const handleSum = async (n: any) => {
    setSummaries({...summaries, [n.id]: "Generazione..."});
    const s = await summarizeNote(n.content);
    setSummaries({...summaries, [n.id]: s});
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -mt-4 -mx-4 md:-mt-8 md:-mx-8 bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center px-8">
        <div><h2 className="text-xl font-black">{circle.name}</h2><p className="text-[10px] uppercase font-black text-slate-400">{circle.subject}</p></div>
        <div className="flex gap-2">
          {['chat', 'notes', 'requests'].map(t => (
            <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${tab === t ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8">
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {circle.chat.map((m:any) => (
                <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-md ${m.senderId === currentUser.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800'}`}>
                    <p className="text-xs font-black mb-1 opacity-50">{m.senderName}</p>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2"><input value={chatIn} onChange={e=>setChatIn(e.target.value)} className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-800" placeholder="Scrivi..."/><button onClick={()=>{onSendMessage(circle.id, chatIn); setChatIn('')}} className="p-4 bg-blue-600 text-white rounded-xl"><Send size={20}/></button></div>
          </div>
        )}
        {tab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((n:any) => (
              <div key={n.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <h4 className="font-black text-lg mb-4">{n.title}</h4>
                <button onClick={()=>handleSum(n)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 mb-4"><Sparkles size={14}/> {summaries[n.id] || "Riassumi IA"}</button>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center"><FileText className="text-red-500"/><Download size={20} className="text-slate-300 cursor-pointer"/></div>
              </div>
            ))}
          </div>
        )}
        {tab === 'requests' && (
          <div className="space-y-4">
            {requests.map((r:any) => (
              <div key={r.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex justify-between mb-4"><h4 className="font-black text-xl">{r.topic}</h4><span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{r.status}</span></div>
                <p className="text-sm text-slate-500 mb-6">{r.description}</p>
                {r.status === 'open' && r.authorId !== currentUser.id && <button onClick={()=>onFulfillRequest(r.id, currentUser.id)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">+50 Karma</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- APP COMPONENT ---
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteRequests, setNoteRequests] = useState<NoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return (firebaseAuth as any).onAuthStateChanged(auth, async (u: any) => {
      if (u) {
        const docRef = (firebaseFirestore as any).doc(db, 'users', u.uid);
        const snap = await (firebaseFirestore as any).getDoc(docRef);
        if (snap.exists()) setUser(snap.data());
        else {
          const newUser = { id: u.uid, name: u.displayName, email: u.email, avatar: u.photoURL, karma: 0, friends: [], pendingRequests: [], notifications: [] };
          await (firebaseFirestore as any).setDoc(docRef, newUser);
          setUser(newUser);
        }
      } else setUser(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const qC = (firebaseFirestore as any).collection(db, 'circles');
    const unsubC = (firebaseFirestore as any).onSnapshot(qC, (s:any) => setCircles(s.docs.map((d:any)=>({id: d.id, ...d.data()}))));
    const qN = (firebaseFirestore as any).collection(db, 'notes');
    const unsubN = (firebaseFirestore as any).onSnapshot(qN, (s:any) => setNotes(s.docs.map((d:any)=>({id: d.id, ...d.data()}))));
    const qR = (firebaseFirestore as any).collection(db, 'noteRequests');
    const unsubR = (firebaseFirestore as any).onSnapshot(qR, (s:any) => setNoteRequests(s.docs.map((d:any)=>({id: d.id, ...d.data()}))));
    return () => { unsubC(); unsubN(); unsubR(); };
  }, [user]);

  const handleSendMessage = async (id: string, text: string) => {
    const msg = { id: Math.random().toString(36).substr(2,9), senderId: user!.id, senderName: user!.name, senderAvatar: user!.avatar, text, timestamp: new Date().toISOString() };
    await (firebaseFirestore as any).updateDoc((firebaseFirestore as any).doc(db, 'circles', id), { chat: (firebaseFirestore as any).arrayUnion(msg) });
  };

  const handleCreate = async (c: any) => {
    await (firebaseFirestore as any).addDoc((firebaseFirestore as any).collection(db, 'circles'), { ...c, creatorId: user!.id, members: [user!.id], chat: [], createdAt: new Date().toISOString() });
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400">Caricamento UniLife...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
        {user && (
          <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col h-screen sticky top-0 hidden md:flex">
            <div className="flex items-center gap-3 mb-12"><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><Database size={20}/></div><h1 className="text-2xl font-black italic tracking-tighter">UniLife</h1></div>
            <nav className="flex-1 space-y-2">
              <Link to="/" className="flex items-center gap-4 p-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-blue-600 text-white shadow-lg"><Home size={20}/> Home</Link>
            </nav>
            <button onClick={()=>(firebaseAuth as any).signOut(auth)} className="flex items-center gap-4 p-4 font-black uppercase text-[10px] text-red-500 hover:bg-red-50 rounded-xl transition-all"><LogOut size={20}/> Esci</button>
          </aside>
        )}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard circles={circles} currentUser={user} onCreateCircle={handleCreate} onJoin={(id:string)=>alert('Join non implementato in demo')}/> : <Navigate to="/login" />} />
            <Route path="/circle/:id" element={user ? <CircleDetail currentUser={user} circles={circles} notes={notes} noteRequests={noteRequests} announcements={[]} onAddNote={()=>{}} onAddRequest={()=>{}} onFulfillRequest={()=>{}} onSendMessage={handleSendMessage} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

// --- RENDER ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);