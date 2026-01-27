import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, Circle, AuthState, Notification, ChatMessage, Note, Announcement, NoteRequest } from './types';
import { auth, db, onAuthStateChanged, signOut } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc, 
  query, 
  orderBy,
  getDoc,
  increment,
  arrayUnion
} from 'firebase/firestore';

import Dashboard from './views/Dashboard';
import ProfileView from './views/ProfileView';
import CircleDetail from './views/CircleDetail';
import CirclesList from './views/CirclesList';
import Login from './views/Login';
import { LogOut, LayoutDashboard, Bell, Users2, Moon, Sun, Home, UserCircle, Database, AlertTriangle, Server, BookOpen, Award } from 'lucide-react';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('unikore_theme') === 'dark');
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [noteRequests, setNoteRequests] = useState<NoteRequest[]>([]);

  const currentUserReactive = users.find(u => u.id === authState.user?.id) || authState.user;

  useEffect(() => {
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
              year: '1° Anno',
              karma: 0
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setAuthState({ user: newUser, isAuthenticated: true });
          }
        } catch (e) {
          console.error("Firestore error:", e);
          setDbConnected(false);
        }
      } else {
        setAuthState({ user: null, isAuthenticated: false });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
      setDbConnected(true);
    }, () => setDbConnected(false));

    const unsubCircles = onSnapshot(collection(db, 'circles'), (snapshot) => {
      setCircles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Circle)));
    });

    const unsubNotes = onSnapshot(query(collection(db, 'notes'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    });

    const unsubAnnouncements = onSnapshot(query(collection(db, 'announcements'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });

    const unsubRequests = onSnapshot(query(collection(db, 'noteRequests'), orderBy('timestamp', 'desc')), (snapshot) => {
      setNoteRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NoteRequest)));
    });

    return () => {
      unsubUsers(); unsubCircles(); unsubNotes(); unsubAnnouncements(); unsubRequests();
    };
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('unikore_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleSendMessage = async (circleId: string, text: string) => {
    if (!currentUserReactive) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUserReactive.id,
      senderName: currentUserReactive.name,
      senderAvatar: currentUserReactive.avatar,
      text,
      timestamp: new Date().toISOString()
    };
    await updateDoc(doc(db, 'circles', circleId), { chat: arrayUnion(msg) });
  };

  const handleAddNote = async (note: Note) => {
    await addDoc(collection(db, 'notes'), note);
    // Reward for sharing
    await updateDoc(doc(db, 'users', currentUserReactive!.id), { karma: increment(10) });
  };

  const handleAddAnnouncement = async (ann: Announcement) => {
    await addDoc(collection(db, 'announcements'), ann);
  };

  const handleAddRequest = async (req: Partial<NoteRequest>) => {
    const fullReq = {
      ...req,
      timestamp: new Date().toISOString(),
      status: 'open'
    };
    await addDoc(collection(db, 'noteRequests'), fullReq);
  };

  const handleFullfillRequest = async (requestId: string, providerId: string) => {
    await updateDoc(doc(db, 'noteRequests', requestId), { status: 'fulfilled', fulfilledBy: providerId });
    await updateDoc(doc(db, 'users', providerId), { karma: increment(50) });
  };

  const logout = () => {
    signOut(auth);
    setAuthState({ user: null, isAuthenticated: false });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">UniLife Enna Loading...</p>
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
            <Routes>
              <Route path="/login" element={!authState.isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={authState.isAuthenticated ? <Dashboard circles={circles} currentUser={currentUserReactive!} allUsers={users} onJoin={(id) => updateDoc(doc(db, 'circles', id), { members: arrayUnion(currentUserReactive!.id) })} onCreateCircle={(c) => addDoc(collection(db, 'circles'), { ...c, creatorId: currentUserReactive!.id, members: [currentUserReactive!.id], chat: [], createdAt: new Date().toISOString() })} /> : <Navigate to="/login" />} />
              <Route path="/profile/:id" element={authState.isAuthenticated ? <ProfileView currentUser={currentUserReactive!} allUsers={users} onUpdate={(u) => setDoc(doc(db, 'users', u.id), u)} /> : <Navigate to="/login" />} />
              <Route path="/circles" element={authState.isAuthenticated ? <CirclesList circles={circles} currentUser={currentUserReactive!} onJoin={(id) => updateDoc(doc(db, 'circles', id), { members: arrayUnion(currentUserReactive!.id) })} /> : <Navigate to="/login" />} />
              <Route path="/circle/:id" element={authState.isAuthenticated ? <CircleDetail currentUser={currentUserReactive!} circles={circles} notes={notes} announcements={announcements} noteRequests={noteRequests} allUsers={users} onAddNote={handleAddNote} onAddAnnouncement={handleAddAnnouncement} onAddRequest={handleAddRequest} onFulfillRequest={handleFullfillRequest} onSendMessage={handleSendMessage} onAcceptMember={() => {}} onRemoveMember={() => {}} onToggleReaction={() => {}} /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

const Sidebar: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();
  const menuItems = [
    { icon: <Home size={22} />, label: 'Home', path: '/' },
    { icon: <BookOpen size={22} />, label: 'Cerchie', path: '/circles' },
    { icon: <UserCircle size={22} />, label: 'Profilo', path: `/profile/${user.id}` },
  ];

  return (
    <>
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around p-4 z-50">
        {menuItems.map(item => (
          <Link key={item.path} to={item.path} className={`p-2 rounded-2xl ${location.pathname === item.path ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400'}`}>
            {item.icon}
          </Link>
        ))}
      </nav>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 h-screen sticky top-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3"><Database size={20} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter dark:text-white">UniLife</h1>
        </div>
        <div className="flex-1 space-y-2">
          {menuItems.map(item => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
           <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" alt="avatar" />
              <div className="truncate">
                <p className="font-black text-[10px] text-slate-800 dark:text-white uppercase truncate">{user.name}</p>
                <div className="flex items-center gap-1 text-amber-500">
                  <Award size={10} /> <span className="text-[9px] font-black">{user.karma} Karma</span>
                </div>
              </div>
           </div>
           <button onClick={onLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
             <LogOut size={22} /> Esci
           </button>
        </div>
      </aside>
    </>
  );
};

const Navbar: React.FC<{ user: User, darkMode: boolean, setDarkMode: (v: boolean) => void, dbStatus: boolean | null }> = ({ user, darkMode, setDarkMode, dbStatus }) => (
  <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
    <div className="flex items-center gap-4">
      {dbStatus === false && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={10}/> Offline</span>}
      {dbStatus === true && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><Server size={10}/> Cloud Sync</span>}
    </div>
    <div className="flex items-center gap-2 md:gap-4">
      <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:scale-105 transition-all">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:scale-105 transition-all relative">
        <Bell size={20} />
        {user.notifications.some(n => !n.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></span>}
      </button>
    </div>
  </header>
);

export default App;