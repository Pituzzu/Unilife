
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, Circle, AuthState, Notification, ChatMessage, Note, Announcement } from './types';
// Consolidate imports from our local firebase service
import { auth, db, onAuthStateChanged, signOut } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';

import Dashboard from './views/Dashboard';
import ProfileView from './views/ProfileView';
import CircleDetail from './views/CircleDetail';
import CirclesList from './views/CirclesList';
import Login from './views/Login';
import { LogOut, LayoutDashboard, Bell, Users2, Moon, Sun, Home, UserCircle, Shield, Wifi, WifiOff, Cloud, Database, AlertTriangle, Github, Globe, Server } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('unikore_theme') === 'dark');
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const currentUserReactive = users.find(u => u.id === authState.user?.id) || authState.user;

  const enterDemoMode = () => {
    const demoUser: User = {
      id: 'demo-user-123',
      name: 'Studente Demo',
      email: 'demo@unikorestudent.it',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      role: 'student',
      friends: [],
      pendingRequests: [],
      notifications: [],
      course: 'Ingegneria Informatica',
      year: '2° Anno'
    };
    setAuthState({ user: demoUser, isAuthenticated: true });
    setLoading(false);
  };

  useEffect(() => {
    // Modular usage of onAuthStateChanged imported from local firebase.ts
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setAuthState({ user: userDoc.data() as User, isAuthenticated: true });
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Studente',
              email: firebaseUser.email || '',
              avatar: firebaseUser.photoURL || '',
              friends: [],
              pendingRequests: [],
              notifications: [],
              course: 'In attesa di configurazione',
              year: '1° Anno'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setAuthState({ user: newUser, isAuthenticated: true });
          }
        } catch (e) {
          console.error("Firestore error:", e);
          setDbConnected(false);
        }
      } else {
        if (authState.user?.id !== 'demo-user-123') {
          setAuthState({ user: null, isAuthenticated: false });
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), 
      (snapshot) => {
        setUsers(snapshot.docs.map(doc => doc.data() as User));
        setDbConnected(true);
      },
      (err) => setDbConnected(false)
    );

    const unsubCircles = onSnapshot(collection(db, 'circles'), 
      (snapshot) => setCircles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Circle))),
      (err) => console.error("Circles Sync Error:", err)
    );

    const unsubNotes = onSnapshot(query(collection(db, 'notes'), orderBy('createdAt', 'desc')), 
      (snapshot) => setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note))),
      (err) => console.error("Notes Sync Error:", err)
    );

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc')), 
      (snapshot) => setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement))),
      (err) => console.error("Announcements Sync Error:", err)
    );

    return () => {
      unsubUsers(); unsubCircles(); unsubNotes(); unsubAnnouncements();
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('unikore_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const logout = () => {
    // Modular usage of signOut imported from local firebase.ts
    signOut(auth);
    setAuthState({ user: null, isAuthenticated: false });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Connessione sicura...</p>
      </div>
    </div>
  );

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {authState.isAuthenticated && <Sidebar user={currentUserReactive!} onLogout={logout} />}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-0">
          {authState.isAuthenticated && (
            <Navbar 
              user={currentUserReactive!} 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              dbStatus={dbConnected}
            />
          )}
          <div className="px-3 py-4 md:p-8">
            {dbConnected === false && authState.user?.id !== 'demo-user-123' && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200">
                <WifiOff size={20} />
                <p className="text-xs font-black uppercase tracking-widest">Firestore Offline: Verifica connessione o regole Firebase.</p>
              </div>
            )}
            <Routes>
              <Route path="/login" element={!authState.isAuthenticated ? <Login onDemo={enterDemoMode} /> : <Navigate to="/" />} />
              <Route 
                path="/" 
                element={authState.isAuthenticated ? (
                  <Dashboard 
                    circles={circles} 
                    currentUser={currentUserReactive!} 
                    allUsers={users}
                    onJoin={(id) => updateDoc(doc(db, 'circles', id), { members: arrayUnion(authState.user!.id) })}
                    onCreateCircle={(data) => addDoc(collection(db, 'circles'), { ...data, creatorId: authState.user!.id, members: [authState.user!.id], createdAt: new Date().toISOString(), chat: [] })}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route path="/circles" element={authState.isAuthenticated ? <CirclesList circles={circles} currentUser={currentUserReactive!} onJoin={(id) => updateDoc(doc(db, 'circles', id), { members: arrayUnion(authState.user!.id) })} /> : <Navigate to="/login" />} />
              <Route path="/profile/:id" element={authState.isAuthenticated ? <ProfileView currentUser={currentUserReactive!} allUsers={users} onUpdate={(u) => updateDoc(doc(db, 'users', u.id), u as any)} /> : <Navigate to="/login" />} />
              <Route 
                path="/circle/:id" 
                element={authState.isAuthenticated ? (
                  <CircleDetail 
                    currentUser={currentUserReactive!} 
                    circles={circles} 
                    notes={notes}
                    announcements={announcements}
                    onAddNote={(n) => addDoc(collection(db, 'notes'), n)}
                    onAddAnnouncement={(a) => addDoc(collection(db, 'announcements'), a)}
                    onAcceptMember={() => {}}
                    onRemoveMember={() => {}}
                    onSendMessage={(cid, txt) => updateDoc(doc(db, 'circles', cid), { chat: arrayUnion({ id: Date.now().toString(), senderId: authState.user!.id, senderName: authState.user!.name, senderAvatar: authState.user!.avatar, text: txt, timestamp: new Date().toISOString(), reactions: {} }) })}
                    onToggleReaction={(cid, mid, emoji) => {
                      const circ = circles.find(c => c.id === cid);
                      if (!circ) return;
                      const newChat = circ.chat.map(m => {
                        if (m.id === mid) {
                          const reactions = { ...(m.reactions || {}) };
                          const users = reactions[emoji] ? [...reactions[emoji]] : [];
                          if (users.includes(authState.user!.id)) {
                             reactions[emoji] = users.filter(u => u !== authState.user!.id);
                             if (reactions[emoji].length === 0) delete reactions[emoji];
                          } else {
                             reactions[emoji] = [...users, authState.user!.id];
                          }
                          return { ...m, reactions };
                        }
                        return m;
                      });
                      updateDoc(doc(db, 'circles', cid), { chat: newChat });
                    }}
                    allUsers={users}
                  />
                ) : <Navigate to="/login" />} 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
        {authState.isAuthenticated && <BottomNav user={currentUserReactive!} />}
      </div>
    </HashRouter>
  );
};

const Sidebar: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();
  const isDemo = user.id === 'demo-user-123';
  const isFirebase = window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com');

  return (
    <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col sticky top-0 h-screen transition-colors">
      <div className="p-8">
        <h1 className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter italic">UniLife</h1>
        <div className="flex flex-col gap-1 mt-2">
          {isDemo && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-1 rounded-md self-start">Modo Demo</span>}
          {isFirebase && <span className="text-[8px] font-black uppercase tracking-widest bg-blue-900 text-white px-2 py-1 rounded-md self-start flex items-center gap-1"><Server size={8}/> Firebase Hosting</span>}
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarLink to="/" icon={<LayoutDashboard size={20}/>} label="Dashboard" active={location.pathname === '/'} />
        <SidebarLink to="/circles" icon={<Users2 size={20}/>} label="Esplora Cerchie" active={location.pathname === '/circles'} />
        <SidebarLink to={`/profile/${user.id}`} icon={<UserCircle size={20}/>} label="Profilo" active={location.pathname.startsWith('/profile')} />
      </nav>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {user.githubUsername && (
          <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-slate-800 transition-colors">
            <Github size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">GitHub Sync</span>
          </a>
        )}
        <button onClick={onLogout} className="w-full flex items-center space-x-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-black text-xs uppercase tracking-widest">
          <LogOut size={20} />
          <span>Esci</span>
        </button>
      </div>
    </aside>
  );
};

const SidebarLink: React.FC<{to: string, icon: React.ReactNode, label: string, active: boolean}> = ({to, icon, label, active}) => (
  <Link to={to} className={`flex items-center space-x-3 p-4 rounded-2xl transition-all font-bold text-sm group ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
    <span>{icon}</span>
    <span>{label}</span>
  </Link>
);

const Navbar: React.FC<{ user: User, darkMode: boolean, setDarkMode: (d: boolean) => void, dbStatus: boolean | null }> = ({ user, darkMode, setDarkMode, dbStatus }) => {
  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;

  return (
    <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Ciao, {user?.name?.split(' ')[0]}</h2>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${dbStatus ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100 animate-pulse'}`}>
          {dbStatus ? <Database size={12}/> : <AlertTriangle size={12}/>}
          <span className="text-[9px] font-black uppercase">{dbStatus ? 'Cloud Live' : 'Setup DB'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-3 text-slate-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative group">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button onClick={() => setDarkMode(!darkMode)} className="p-3 text-slate-500 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
          {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

const BottomNav: React.FC<{ user: User }> = ({ user }) => {
  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;
  
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 flex items-center justify-around z-50 rounded-[2rem] shadow-2xl">
      <Link to="/" className="p-4 text-slate-400"><Home size={24} /></Link>
      <Link to="/circles" className="p-4 text-slate-400"><Users2 size={24} /></Link>
      <Link to={`/profile/${user.id}`} className="p-1">
        <div className="relative">
          <img src={user.avatar} className="w-8 h-8 rounded-full" alt="me" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-white dark:border-slate-900 rounded-full" />
          )}
        </div>
      </Link>
    </div>
  );
};

export default App;
