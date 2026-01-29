
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Circle, Note, User, Announcement, ChatMessage, NoteVisibility, NoteRequest } from '../types';
import { summarizeNote, suggestStudyPlan } from '../geminiService';
import { 
  FileText, Sparkles, Send, Clock, Loader2, 
  ChevronLeft, Megaphone, Users, MessageSquare, X, 
  ShieldCheck as ShieldIcon, PlusCircle, 
  Search, Globe, FileUp, Download, Plus, GraduationCap, ExternalLink, Smile, MoreHorizontal, HelpCircle, HandHelping, Trophy
} from 'lucide-react';

const { useParams, Link } = ReactRouterDOM as any;

interface Props {
  currentUser: User;
  circles: Circle[];
  notes: Note[];
  announcements: Announcement[];
  noteRequests: NoteRequest[];
  allUsers: User[];
  onAddNote: (note: Note) => void;
  onAddAnnouncement: (ann: Announcement) => void;
  onAddRequest: (req: Partial<NoteRequest>) => void;
  onFulfillRequest: (reqId: string, providerId: string) => void;
  onAcceptMember: (circleId: string, userId: string) => void;
  onRemoveMember: (circleId: string, userId: string) => void;
  onSendMessage: (circleId: string, text: string) => void;
  onToggleReaction: (circleId: string, messageId: string, emoji: string) => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

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
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all">
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};

const CircleDetail: React.FC<Props> = ({ 
  currentUser, circles, notes: allNotes, announcements: allAnnouncements, noteRequests: allRequests,
  allUsers, onAddNote, onAddAnnouncement, onAddRequest, onFulfillRequest, onSendMessage
}) => {
  // Fix: Removed type argument from useParams because it is untyped from the 'any' import
  const { id } = useParams();
  const circle = circles.find(c => c.id === id);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'announcements' | 'requests'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [summaries, setSummaries] = useState<{ [noteId: string]: { text: string; loading: boolean } }>({});
  const [studyTips, setStudyTips] = useState<{ [reqId: string]: { text: string; loading: boolean } }>({});
  
  const circleNotes = allNotes.filter(n => n.circleId === id);
  const circleAnnouncements = allAnnouncements.filter(a => a.circleId === id);
  const circleRequests = allRequests.filter(r => r.circleId === id);
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);

  const [newNote, setNewNote] = useState({ title: '', description: '', visibility: 'group' as NoteVisibility, file: null as File | null });
  const [newAnn, setNewAnn] = useState({ title: '', content: '', priority: 'normal' as 'normal' | 'high' });
  const [newReq, setNewReq] = useState({ topic: '', description: '' });
  
  const [showMembersModal, setShowMembersModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, circle?.chat]);

  if (!circle) return <div className="p-20 text-center font-bold">Cerchia non trovata</div>;

  const isCreator = circle.creatorId === currentUser.id;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(circle.id, chatInput);
    setChatInput('');
  };

  const handleSummarize = async (noteId: string, content: string) => {
    setSummaries(prev => ({ ...prev, [noteId]: { text: '', loading: true } }));
    const summary = await summarizeNote(content);
    setSummaries(prev => ({ ...prev, [noteId]: { text: summary, loading: false } }));
  };

  const handleGetStudyPlan = async (reqId: string, topic: string) => {
    setStudyTips(prev => ({ ...prev, [reqId]: { text: '', loading: true } }));
    const plan = await suggestStudyPlan(topic);
    setStudyTips(prev => ({ ...prev, [reqId]: { text: plan, loading: false } }));
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

  const handleAddReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.topic.trim()) return;
    onAddRequest({
      circleId: circle.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      topic: newReq.topic,
      description: newReq.description
    });
    setNewReq({ topic: '', description: '' });
    setShowReqForm(false);
  };

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
        <button onClick={() => setShowMembersModal(true)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 flex items-center gap-2 transition-all">
          <Users size={18} /> <span className="text-[10px] font-black uppercase tracking-widest">{circle.members.length} Membri</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center p-2 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18}/>} label="Chat" />
        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} icon={<FileText size={18}/>} label="Appunti" />
        <TabButton active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} icon={<HandHelping size={18}/>} label="Richieste" />
        <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Megaphone size={18}/>} label="Avvisi" />
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {circle.chat.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const urls = msg.text.match(URL_REGEX);
                  return (
                    <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''} group/msg`}>
                      {!isMe && <img src={msg.senderAvatar} className="w-9 h-9 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700" alt="avatar" />}
                      <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'} relative`}>
                        {!isMe && <span className="text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-tighter ml-1">{msg.senderName}</span>}
                        <div className={`p-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm group-hover/msg:shadow-md transition-all ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-800'}`}>
                          <span className="whitespace-pre-wrap">{msg.text}</span>
                          {urls && urls.map((url, idx) => <LinkPreview key={idx} url={url} />)}
                        </div>
                        <span className="text-[8px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3">
                <input type="text" placeholder="Scrivi qualcosa..." className="flex-1 bg-slate-100 dark:bg-slate-800 border-none px-6 py-4 rounded-[2rem] text-sm focus:ring-2 focus:ring-blue-500/50 outline-none dark:text-white" value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={20} /></button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic">Appunti Condivisi</h3>
                <button onClick={() => setShowNoteForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                  <Plus size={16}/> Carica PDF
                </button>
              </div>
              {showNoteForm && (
                <form onSubmit={handleAddNoteSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top-4">
                  <div className="flex justify-between items-center mb-6"><h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs">Carica PDF</h4><button type="button" onClick={() => setShowNoteForm(false)} className="text-slate-400 hover:text-red-500"><X size={20}/></button></div>
                  <div className="space-y-4">
                    <input type="text" placeholder="Titolo" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-bold" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required />
                    <input type="file" accept=".pdf" className="w-full p-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs" onChange={e => e.target.files && setNewNote({...newNote, file: e.target.files[0]})} required />
                    <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Pubblica</button>
                  </div>
                </form>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {circleNotes.map(note => (
                  <div key={note.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex items-center gap-3 mb-6">
                      <img src={allUsers.find(u => u.id === note.authorId)?.avatar} className="w-8 h-8 rounded-xl object-cover" alt="author" />
                      <div><p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{allUsers.find(u => u.id === note.authorId)?.name}</p></div>
                    </div>
                    <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 mb-4">{note.title}</h4>
                    {summaries[note.id] ? (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-4">
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">{summaries[note.id].loading ? 'Elaborazione...' : summaries[note.id].text}</p>
                        </div>
                    ) : (
                      <button onClick={() => handleSummarize(note.id, note.content)} className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-xl mb-4 transition-all">
                        <Sparkles size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Riassumi con IA</span>
                      </button>
                    )}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 truncate">
                        <FileText size={20} className="text-red-500 shrink-0" />
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase truncate">{note.fileName}</span>
                      </div>
                      <Download size={20} className="text-slate-300 hover:text-blue-600 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic">Help Center</h3>
                <button onClick={() => setShowReqForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg">
                   <HelpCircle size={16}/> Chiedi Appunti
                </button>
              </div>
              {showReqForm && (
                <form onSubmit={handleAddReqSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-top-4">
                   <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs mb-6">Di cosa hai bisogno?</h4>
                   <div className="space-y-4">
                      <input type="text" placeholder="Argomento (es. Modulo 3 Microeconomia)" className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm font-bold" value={newReq.topic} onChange={e => setNewReq({...newReq, topic: e.target.value})} required />
                      <textarea placeholder="Dettagli..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 py-4 text-sm" value={newReq.description} onChange={e => setNewReq({...newReq, description: e.target.value})} />
                      <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Invia Richiesta</button>
                   </div>
                </form>
              )}
              <div className="space-y-6">
                {circleRequests.map(req => (
                  <div key={req.id} className={`p-6 md:p-8 rounded-[2.5rem] border shadow-sm transition-all group overflow-hidden relative ${req.status === 'fulfilled' ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 hover:shadow-xl'}`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <img src={req.authorAvatar} className="w-10 h-10 rounded-xl" alt="avatar" />
                        <div>
                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase">{req.authorName}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(req.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {req.status === 'fulfilled' ? 'Risolto' : 'In attesa'}
                      </span>
                    </div>
                    <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 mb-2">{req.topic}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{req.description}</p>
                    
                    {studyTips[req.id] ? (
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-6">
                         <div className="flex items-center gap-2 mb-2"><Sparkles size={14} className="text-indigo-600"/><span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Studia con IA</span></div>
                         <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">{studyTips[req.id].loading ? 'Pianificazione in corso...' : studyTips[req.id].text}</p>
                      </div>
                    ) : req.status === 'open' && (
                      <button onClick={() => handleGetStudyPlan(req.id, req.topic)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl mb-6 transition-all border border-indigo-100">
                        <Sparkles size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Chiedi consigli a Gemini</span>
                      </button>
                    )}

                    {req.status === 'open' && req.authorId !== currentUser.id && (
                      <button onClick={() => onFulfillRequest(req.id, currentUser.id)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                        <Trophy size={16} /> Aiuta il collega (+50 Karma)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="h-full overflow-y-auto p-4 md:p-8">
             <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-black text-slate-800 dark:text-slate-100 italic">Bacheca Avvisi</h3>{isCreator && <button onClick={() => setShowAnnForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg">Nuovo</button>}</div>
                {circleAnnouncements.map(ann => (
                  <div key={ann.id} className="p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"><h4 className="font-black text-2xl text-slate-800 dark:text-slate-100 mb-2">{ann.title}</h4><p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{ann.content}</p></div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowMembersModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-sm rounded-[3rem] p-8 relative z-10 shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6">Studenti Attivi</h3>
            <div className="space-y-4">
              {circle.members.map(mid => {
                const u = allUsers.find(user => user.id === mid);
                return u ? (<div key={u.id} className="flex items-center gap-4"><img src={u.avatar} className="w-10 h-10 rounded-xl" alt={u.name} /><div className="flex-1 min-w-0"><p className="font-black text-slate-800 dark:text-slate-100 text-sm truncate">{u.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{u.course}</p></div></div>) : null;
              })}
            </div>
            <button onClick={() => setShowMembersModal(false)} className="w-full mt-8 bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-2xl font-black text-[10px] uppercase">Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap min-w-max ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default CircleDetail;
