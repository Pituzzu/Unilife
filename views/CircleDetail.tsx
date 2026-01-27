
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Circle, Note, User, Announcement, ChatMessage, NoteVisibility } from '../types';
import { summarizeNote } from '../geminiService';
import { 
  FileText, Sparkles, Send, Clock, Loader2, 
  ChevronLeft, Megaphone, Users, MessageSquare, X, 
  UserMinus, ShieldCheck as ShieldIcon, PlusCircle, 
  Search, BellRing, Shield, Lock, Globe, FileUp, Download, Eye, Plus, GraduationCap, ExternalLink, Smile, MoreHorizontal, Filter
} from 'lucide-react';

interface Props {
  currentUser: User;
  circles: Circle[];
  notes: Note[];
  announcements: Announcement[];
  allUsers: User[];
  onAddNote: (note: Note) => void;
  onAddAnnouncement: (ann: Announcement) => void;
  onAcceptMember: (circleId: string, userId: string) => void;
  onRemoveMember: (circleId: string, userId: string) => void;
  onSendMessage: (circleId: string, text: string) => void;
  onToggleReaction: (circleId: string, messageId: string, emoji: string) => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎓', '😮', '👏'];

const LinkPreview: React.FC<{ url: string }> = ({ url }) => {
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch (e) {
    domain = "Link Condiviso";
  }

  return (
    <div className="mt-3 group/preview relative">
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-3 flex items-center gap-3 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all shadow-sm">
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 border border-slate-100 dark:border-slate-700 shadow-sm shrink-0">
          <Globe size={18} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest truncate leading-tight">
            {domain}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 max-w-[200px]">
            {url}
          </p>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
          title="Apri link"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex items-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <img src={user.avatar} className="w-8 h-8 rounded-xl shadow-sm object-cover" alt="avatar" />
    <div className="flex flex-col items-start">
      <span className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter ml-1">{user.name} sta scrivendo...</span>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-3 px-4 rounded-[1.5rem] rounded-bl-none flex gap-1 items-center shadow-sm">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
      </div>
    </div>
  </div>
);

const CircleDetail: React.FC<Props> = ({ 
  currentUser, circles, notes: allNotes, announcements: allAnnouncements, 
  allUsers, onAddNote, onAddAnnouncement, onAcceptMember, onRemoveMember, onSendMessage, onToggleReaction
}) => {
  const { id } = useParams<{ id: string }>();
  const circle = circles.find(c => c.id === id);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'announcements'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const circleNotes = allNotes.filter(n => n.circleId === id);
  const filteredCircleNotes = circleNotes.filter(n => 
    n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || 
    n.tags.some(t => t.toLowerCase().includes(noteSearchQuery.toLowerCase()))
  );
  
  const circleAnnouncements = allAnnouncements.filter(a => a.circleId === id);
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', description: '', visibility: 'group' as NoteVisibility, file: null as File | null });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'normal' as 'normal' | 'high' });
  
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, circle?.chat, typingUsers]);

  // Simulazione "Qualcuno sta scrivendo" quando l'utente digita
  useEffect(() => {
    if (chatInput.length > 0 && typingUsers.length === 0) {
      const otherMembers = circle?.members.filter(m => m !== currentUser.id) || [];
      if (otherMembers.length > 0) {
        const randomMember = otherMembers[Math.floor(Math.random() * otherMembers.length)];
        const timer = setTimeout(() => {
          setTypingUsers([randomMember]);
        }, 800);
        return () => clearTimeout(timer);
      }
    } else if (chatInput.length === 0) {
      setTypingUsers([]);
    }
  }, [chatInput, circle?.members, currentUser.id]);

  if (!circle) return <div className="p-20 text-center font-bold">Cerchia non trovata</div>;

  const isMember = circle.members.includes(currentUser.id);
  const isCreator = circle.creatorId === currentUser.id;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(circle.id, chatInput);
    setChatInput('');
    setTypingUsers([]); // Resetta il typing quando inviamo
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.file) return;
    const note: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNote.title,
      content: newNote.description,
      authorId: currentUser.id,
      circleId: circle.id,
      tags: [],
      createdAt: new Date().toISOString(),
      visibility: newNote.visibility,
      fileName: newNote.file.name,
      fileSize: `${(newNote.file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileUrl: '#'
    };
    onAddNote(note);
    setNewNote({ title: '', description: '', visibility: 'group', file: null });
    setShowNoteForm(false);
  };

  const handleAddAnnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title.trim()) return;
    const ann: Announcement = {
      id: Math.random().toString(36).substr(2, 9),
      title: newAnn.title,
      content: newAnn.content,
      authorId: currentUser.id,
      circleId: circle.id,
      timestamp: new Date().toISOString(),
      priority: newAnn.priority
    };
    onAddAnnouncement(ann);
    setNewAnn({ title: '', content: '', priority: 'normal' });
    setShowAnnForm(false);
  };

  const selectedMember = selectedMemberId ? allUsers.find(u => u.id === selectedMemberId) : null;

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-[calc(100dvh-2rem)] overflow-hidden -mt-4 -mx-4 md:-mt-8 md:-mx-8 bg-slate-50 dark:bg-slate-950 relative">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between z-40 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 text-slate-500 hover:text-blue-600 transition-colors"><ChevronLeft size={24} /></Link>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">{circle.name}</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{circle.subject}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowMembersModal(true)} 
          className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 flex items-center gap-2 transition-all"
        >
          <Users size={20} /> <span className="text-xs font-black">{circle.members.length} Membri</span>
        </button>
      </div>

      {/* Tabs di navigazione */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 gap-1 overflow-x-auto shrink-0">
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18}/>} label="Chat" />
        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileText size={18}/>} label="Appunti PDF" />
        <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Megaphone size={18}/>} label="Bacheca" />
      </div>

      {!isMember ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-xl">
            <ShieldIcon size={64} className="mx-auto text-blue-600 mb-6" />
            <h3 className="text-2xl font-black mb-2 text-slate-800 dark:text-slate-100">Cerchia Riservata</h3>
            <p className="text-slate-500 mb-8 text-sm">Richiedi l'accesso per visualizzare chat e appunti.</p>
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">Richiedi Accesso</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SEZIONE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-10" onClick={() => setActiveReactionPicker(null)}>
                <div className="max-w-4xl mx-auto space-y-8">
                  {circle.chat.length === 0 && <div className="text-center py-20 text-slate-300 font-medium italic">Nessun messaggio. Inizia la discussione!</div>}
                  {circle.chat.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const urls = msg.text.match(URL_REGEX);
                    return (
                      <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''} group/msg`}>
                        {!isMe && (
                          <button 
                            onClick={() => setSelectedMemberId(msg.senderId)}
                            className="shrink-0 transition-transform hover:scale-110 active:scale-95 mb-4"
                          >
                            <img src={msg.senderAvatar} className="w-9 h-9 rounded-2xl shadow-sm object-cover border-2 border-transparent hover:border-blue-500" alt="avatar" />
                          </button>
                        )}
                        <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'} relative`}>
                          {!isMe && <span className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-tighter ml-1">{msg.senderName}</span>}
                          
                          <div className="relative group/bubble">
                            {/* Bolla Messaggio */}
                            <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-800'}`}>
                              <span className="whitespace-pre-wrap">{msg.text}</span>
                              {urls && urls.map((url, idx) => <LinkPreview key={idx} url={url} />)}
                            </div>

                            {/* Selettore Reazioni Rapido */}
                            <div className={`absolute -top-3 ${isMe ? '-left-12' : '-right-12'} flex items-center opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 z-10`}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id); }}
                                className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:scale-110 transition-all`}
                                title="Reagisci"
                              >
                                <Smile size={18} />
                              </button>
                            </div>

                            {/* Menu Reazioni Pop-up */}
                            {activeReactionPicker === msg.id && (
                              <div className={`absolute -top-14 ${isMe ? 'right-0' : 'left-0'} flex gap-1 p-1.5 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in slide-in-from-bottom-2 duration-200`}>
                                {QUICK_EMOJIS.map(emoji => (
                                  <button 
                                    key={emoji} 
                                    onClick={() => { onToggleReaction(circle.id, msg.id, emoji); setActiveReactionPicker(null); }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-lg hover:scale-125 active:scale-90"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Visualizzazione Reazioni */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-2 ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                              {Object.entries(msg.reactions).map(([emoji, users]) => {
                                const userList = users as string[];
                                const hasReacted = userList.includes(currentUser.id);
                                return (
                                  <button 
                                    key={emoji}
                                    onClick={() => onToggleReaction(circle.id, msg.id, emoji)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border transition-all hover:scale-105 active:scale-90 ${hasReacted ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                  >
                                    <span>{emoji}</span>
                                    <span className="opacity-80">{userList.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold uppercase tracking-widest px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Indicatori "Sta scrivendo" */}
                  {typingUsers.map(uid => {
                    const typingUser = allUsers.find(u => u.id === uid);
                    if (!typingUser) return null;
                    return <TypingIndicator key={uid} user={typingUser} />;
                  })}

                  <div ref={chatEndRef} />
                </div>
              </div>
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 pb-8 md:pb-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Condividi un'idea o un link..." 
                      className="w-full bg-slate-100 dark:bg-slate-800 border-none px-6 py-4 rounded-[2rem] text-sm outline-none dark:text-slate-100 focus:ring-2 focus:ring-blue-500/50 shadow-inner transition-all" 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SEZIONE APPUNTI */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-6xl mx-auto space-y-8 pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Archivio PDF</h3>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Filtra per titolo o tag..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                      />
                    </div>
                    <button onClick={() => setShowNoteForm(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all shrink-0">
                      <Plus size={18}/> Carica PDF
                    </button>
                  </div>
                </div>
                
                {showNoteForm && (
                  <form onSubmit={handleAddNoteSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top-4 mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Nuovo Caricamento</h4>
                      <button type="button" onClick={() => setShowNoteForm(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                      <input type="text" placeholder="Titolo dell'appunto" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-bold" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required />
                      <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30">
                        <input type="file" id="pdf-upload" accept=".pdf" className="hidden" onChange={e => e.target.files && setNewNote({...newNote, file: e.target.files[0]})} required />
                        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                          <FileUp size={32} className="text-blue-500" />
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            {newNote.file ? newNote.file.name : 'Seleziona un file PDF'}
                          </span>
                        </label>
                      </div>
                      <textarea placeholder="Aggiungi una descrizione..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm min-h-[80px]" value={newNote.description} onChange={e => setNewNote({...newNote, description: e.target.value})} />
                      <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-100 dark:shadow-none transition-all hover:bg-blue-700">Pubblica PDF nella Cerchia</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {circleNotes.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-slate-400 font-medium italic">Nessun appunto caricato in questo gruppo.</div>
                  ) : filteredCircleNotes.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                      <Search size={40} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-medium text-sm italic">Nessun appunto trovato per "{noteSearchQuery}"</p>
                    </div>
                  ) : (
                    filteredCircleNotes.map(note => (
                      <div key={note.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all group overflow-hidden relative">
                        <div className="flex items-center gap-3 mb-6">
                          <button onClick={() => setSelectedMemberId(note.authorId)}>
                            <img src={allUsers.find(u => u.id === note.authorId)?.avatar} className="w-8 h-8 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all" alt="avatar" />
                          </button>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{allUsers.find(u => u.id === note.authorId)?.name}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(note.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-2 leading-tight">{note.title}</h4>
                        
                        {/* Anteprima contenuto */}
                        <div className="relative mb-6">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
                            <Sparkles size={12} /> Anteprima Rapida
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 italic">
                            {note.content || "Nessuna descrizione disponibile per questo file."}
                          </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600">
                              <FileText size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate uppercase tracking-widest">{note.fileName}</p>
                              <p className="text-[8px] text-slate-400 font-bold">{note.fileSize}</p>
                            </div>
                          </div>
                          <button className="text-slate-300 hover:text-blue-600 transition-colors p-2" title="Scarica PDF"><Download size={20} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SEZIONE BACHECA */}
          {activeTab === 'announcements' && (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-3xl mx-auto space-y-6 pb-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight italic">Bacheca Avvisi</h3>
                  {isCreator && <button onClick={() => setShowAnnForm(true)} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Plus size={18}/> Nuovo Avviso</button>}
                </div>

                {showAnnForm && (
                  <form onSubmit={handleAddAnnSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl mb-10 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">Componi Avviso</h4>
                      <button type="button" onClick={() => setShowAnnForm(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                      <input type="text" placeholder="Oggetto dell'avviso" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-bold" value={newAnn.title} onChange={e => setNewAnn({...newAnn, title: e.target.value})} required />
                      <textarea placeholder="Scrivi il corpo dell'annuncio..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm min-h-[120px]" value={newAnn.content} onChange={e => setNewAnn({...newAnn, content: e.target.value})} required />
                      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <input type="checkbox" id="priority" checked={newAnn.priority === 'high'} onChange={e => setNewAnn({...newAnn, priority: e.target.checked ? 'high' : 'normal'})} className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="priority" className="text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer">Segnala come Urgente</label>
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all">Pubblica Annuncio</button>
                    </div>
                  </form>
                )}

                {circleAnnouncements.length === 0 && <div className="text-center py-20 text-slate-300 font-medium italic">Ancora nessun annuncio in bacheca.</div>}
                {circleAnnouncements.map(ann => (
                  <div key={ann.id} className={`p-8 rounded-[3rem] border shadow-sm relative overflow-hidden transition-all group ${ann.priority === 'high' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    {ann.priority === 'high' && <div className="absolute top-0 right-0 bg-red-500 text-white px-6 py-2 text-[8px] font-black uppercase tracking-widest rounded-bl-[1.5rem] shadow-sm">Urgente</div>}
                    <h4 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-3 tracking-tight">{ann.title}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-8">{ann.content}</p>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedMemberId(ann.authorId)}>
                          <img src={allUsers.find(u => u.id === ann.authorId)?.avatar} className="w-8 h-8 rounded-xl object-cover" alt="author" />
                        </button>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{allUsers.find(u => u.id === ann.authorId)?.name}</span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Creatore Cerchia</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={12}/> {new Date(ann.timestamp).toLocaleString([], {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modale Membri */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowMembersModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-md rounded-[3rem] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Colleghi nella Cerchia</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{circle.members.length} studenti attivi</p>
              </div>
              <button onClick={() => setShowMembersModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {circle.members.map(mid => {
                const u = allUsers.find(user => user.id === mid);
                if (!u) return null;
                return (
                  <button 
                    key={u.id}
                    onClick={() => { setSelectedMemberId(u.id); setShowMembersModal(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-blue-50 dark:hover:bg-slate-800 group transition-all"
                  >
                    <img src={u.avatar} className="w-12 h-12 rounded-[1.2rem] object-cover shadow-sm group-hover:scale-105 transition-transform" alt={u.name} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-black text-slate-800 dark:text-slate-100 truncate text-sm leading-none">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 truncate">{u.course}</p>
                    </div>
                    {u.id === circle.creatorId && (
                      <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 p-2 rounded-xl" title="Creatore">
                        <Shield size={16} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popup Profilo Membro */}
      {selectedMember && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setSelectedMemberId(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 relative z-10 shadow-2xl text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-600 to-indigo-700" />
            <button 
              onClick={() => setSelectedMemberId(null)} 
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="relative mt-4">
              <img src={selectedMember.avatar} className="w-28 h-28 rounded-[2rem] mx-auto border-4 border-white dark:border-slate-900 shadow-xl object-cover mb-4" alt={selectedMember.name} />
              <div className="absolute bottom-4 right-1/2 translate-x-12 translate-y-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-2">{selectedMember.name}</h3>
            <div className="flex flex-col gap-2 items-center mb-8">
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <GraduationCap size={14} /> {selectedMember.course}
              </div>
              <p className="text-xs text-slate-400 font-bold tracking-tighter italic">{selectedMember.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{selectedMember.friends.length}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Amici</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">8</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cerchie</p>
              </div>
            </div>

            <Link 
              to={`/profile/${selectedMember.id}`} 
              onClick={() => setSelectedMemberId(null)}
              className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              Vedi Profilo Completo <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-fit ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default CircleDetail;
