
import React, { useState } from 'react';
import { Circle, User } from '../types';
import { Link } from 'react-router-dom';
import { Search, Users2, ArrowRight, Filter, BookOpen, GraduationCap, Plus } from 'lucide-react';

interface Props {
  circles: Circle[];
  currentUser: User;
  onJoin: (id: string) => void;
}

const CATEGORIES = ['Tutte', 'Ingegneria', 'Economia', 'Psicologia', 'Giurisprudenza', 'Medicina', 'Generale'];

const CirclesList: React.FC<Props> = ({ circles, currentUser, onJoin }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tutte');

  const filteredCircles = circles.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Tutte' || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter italic">Esplora le Cerchie</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Trova il gruppo di studio perfetto per i tuoi corsi.</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
          <GraduationCap size={18} />
          <span>{circles.length} Cerchie Attive</span>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cerca per nome materia o nome gruppo..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-100/50 dark:bg-slate-800 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none dark:text-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <Filter size={18} className="text-slate-400 mr-2 hidden sm:block" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista Risultati */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCircles.length > 0 ? (
          filteredCircles.map(circle => {
            const isMember = circle.members.includes(currentUser.id);
            return (
              <div key={circle.id} className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 flex flex-col hover:shadow-2xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 -mr-12 -mt-12 rounded-full group-hover:scale-110 transition-transform" />
                
                <div className="flex justify-between items-start mb-8 relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMember ? 'bg-green-100 text-green-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                    {isMember ? <Users2 size={28} /> : <BookOpen size={28} />}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-full">
                    {circle.category}
                  </span>
                </div>

                <div className="flex-1 space-y-2 mb-8 relative">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight group-hover:text-blue-600 transition-colors">
                    {circle.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                    {circle.subject}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-4 leading-relaxed">
                    {circle.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between relative">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <img key={i} src={`https://picsum.photos/seed/user${i}${circle.id}/30`} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900" alt="member" />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      +{circle.members.length} Colleghi
                    </span>
                  </div>
                  
                  {isMember ? (
                    <Link 
                      to={`/circle/${circle.id}`}
                      className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:translate-x-1 transition-transform"
                    >
                      Entra <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => onJoin(circle.id)}
                      className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} /> Unisciti
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Search size={64} className="mx-auto text-slate-100 dark:text-slate-800 mb-6" />
            <h4 className="text-xl font-bold text-slate-400">Nessuna cerchia trovata</h4>
            <p className="text-slate-400 text-sm mt-2">Prova a cambiare i filtri o la parola chiave di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CirclesList;
