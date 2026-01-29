
import React, { useState } from 'react';
import { Circle, User } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { BookOpen, Zap, Users2, ShieldCheck, Search, X, ArrowRight, PlusCircle, GraduationCap } from 'lucide-react';

const { Link } = ReactRouterDOM as any;

interface Props {
  circles: Circle[];
  currentUser: User;
  allUsers: User[];
  onJoin: (id: string) => void;
  onCreateCircle: (circle: Partial<Circle>) => void;
}

const Dashboard: React.FC<Props> = ({ circles, currentUser, allUsers, onJoin, onCreateCircle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircle, setNewCircle] = useState({ name: '', subject: '', category: 'Generale', description: '' });

  const filteredCircles = circles.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const myCircles = filteredCircles.filter(c => c.members.includes(currentUser.id));
  const otherCircles = filteredCircles.filter(c => !c.members.includes(currentUser.id));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCircle(newCircle);
    setShowCreateModal(false);
    setNewCircle({ name: '', subject: '', category: 'Generale', description: '' });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Hero Section - Optimized height for mobile */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><ShieldCheck size={200} /></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-200 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-3 md:mb-4">
            <Zap size={14} /> <span>UniKore Student Circle</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter italic">Studiare insieme è meglio.</h2>
          <p className="text-blue-100/70 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed max-w-md">Condividi appunti, discuti in chat e preparati agli esami con i tuoi colleghi.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto bg-white text-blue-800 px-6 py-4 md:px-8 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <PlusCircle size={18} />
            Crea Nuova Cerchia
          </button>
        </div>
      </div>

      {/* Modal Creazione */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <form onSubmit={handleCreateSubmit} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 relative z-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Nuova Cerchia</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nome Cerchia</label>
                <input 
                  type="text" 
                  placeholder="es. Gruppo Studio Algoritmi" 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  value={newCircle.name}
                  onChange={e => setNewCircle({...newCircle, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Materia</label>
                <input 
                  type="text" 
                  placeholder="es. Informatica" 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  value={newCircle.subject}
                  onChange={e => setNewCircle({...newCircle, subject: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Area</label>
                <select 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 appearance-none"
                  value={newCircle.category}
                  onChange={e => setNewCircle({...newCircle, category: e.target.value})}
                >
                  <option>Generale</option>
                  <option>Ingegneria</option>
                  <option>Economia</option>
                  <option>Psicologia</option>
                  <option>Giurisprudenza</option>
                  <option>Medicina</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-2 tracking-widest">Descrizione</label>
                <textarea 
                  placeholder="Scrivi due righe sull'obiettivo della cerchia..." 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm min-h-[80px]"
                  value={newCircle.description}
                  onChange={e => setNewCircle({...newCircle, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-200 dark:shadow-none hover:scale-105 transition-all">Crea Ora</button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar Mobile Floating View */}
      <div className="sticky top-[4.5rem] md:top-24 z-20 md:max-w-4xl md:mx-auto">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl md:rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cerca una materia o un gruppo..." 
              className="w-full pl-11 pr-4 py-3 md:py-4 bg-transparent border-none focus:ring-0 text-sm md:text-base text-slate-700 dark:text-slate-200 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-10 md:space-y-12">
          {/* MY CIRCLES */}
          <section className="space-y-5 md:space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none italic">Le tue Cerchie</h3>
              <Link to="/circles" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:translate-x-1 transition-all">Tutte</Link>
            </div>
            {myCircles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {myCircles.map(c => <CircleCard key={c.id} circle={c} />)}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 p-10 md:p-16 rounded-[2rem] md:rounded-[2.5rem] text-center">
                <Users2 size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium text-xs italic">Nessuna cerchia trovata. Inizia creandone una!</p>
              </div>
            )}
          </section>

          {/* EXPLORE CIRCLES */}
          <section className="space-y-5 md:space-y-6">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight italic px-2">Esplora</h3>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {otherCircles.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:shadow-lg transition-all active:scale-95">
                  <div className="flex items-center gap-3 md:gap-5 min-w-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><BookOpen size={24} /></div>
                    <div className="truncate">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-lg truncate">{c.name}</h4>
                      <p className="text-[9px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{c.subject} • {c.members.length} membri</p>
                    </div>
                  </div>
                  <button onClick={() => onJoin(c.id)} className="bg-blue-600 text-white px-5 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shrink-0">Join</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Info Sidebar - Hidden on mobile or pushed to bottom */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-black text-slate-800 dark:text-slate-100 text-[10px] uppercase tracking-[0.2em] mb-6">Regolamento</h4>
            <div className="space-y-5">
              <RuleRow icon={<ShieldCheck size={18} className="text-blue-500" />} text="Solo email istituzionali verificate" />
              <RuleRow icon={<Users2 size={18} className="text-amber-500" />} text="Rispetto e collaborazione reciproca" />
              <RuleRow icon={<GraduationCap size={18} className="text-purple-500" />} text="Esclusiva per studenti UniKore" />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800">
               <p className="text-[10px] text-slate-400 leading-relaxed italic">Lo spazio è monitorato per garantire un ambiente di studio sano e proficuo per tutti i partecipanti.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RuleRow: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-3">
    <div className="shrink-0">{icon}</div>
    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{text}</p>
  </div>
);

const CircleCard: React.FC<{circle: Circle}> = ({circle}) => (
  <Link to={`/circle/${circle.id}`} className="bg-white dark:bg-slate-900 p-5 md:p-7 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500 hover:shadow-2xl transition-all group relative flex flex-col h-full overflow-hidden active:scale-95">
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-transform duration-700" />
    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white mb-4 md:mb-6 transition-all shadow-sm shrink-0">
      <Users2 size={24} />
    </div>
    <h4 className="font-black text-base md:text-xl text-slate-800 dark:text-slate-100 mb-1 leading-tight truncate">{circle.name}</h4>
    <p className="text-[9px] md:text-xs text-slate-400 font-black uppercase tracking-widest mb-4 md:mb-6">{circle.subject}</p>
    <div className="mt-auto flex items-center justify-between pt-4 md:pt-6 border-t border-slate-50 dark:border-slate-800">
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 md:px-3 md:py-1 rounded-full">{circle.category}</span>
      <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
    </div>
  </Link>
);

export default Dashboard;
