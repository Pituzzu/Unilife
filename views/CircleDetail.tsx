
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Circle, Note, User, Announcement, NoteVisibility, NoteRequest } from '../types';
import { summarizeNote, suggestStudyPlan } from '../geminiService';
import { 
  FileText, Sparkles, Send, ChevronLeft, Megaphone, Users, MessageSquare, X, 
  Download, Plus, Trophy, HelpCircle, HandHelping, Globe, ExternalLink
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
  onSendMessage: (circleId: string, text: string) => void;
}

const CircleDetail: React.FC<Props> = ({ 
  currentUser, circles, notes: allNotes, announcements: allAnnouncements, noteRequests: allRequests,
  allUsers, onAddNote, onAddRequest, onFulfillRequest, onSendMessage
}) => {
  const { id } = useParams();
  const circle = circles.find(c => c.id === id);
  
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'requests' | 'announcements'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [summaries, setSummaries] = useState<{ [noteId: string]: { text: string; loading: boolean } }>({});
  const [studyTips, setStudyTips] = useState<{ [reqId: string]: { text: string; loading: boolean } }>({});
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', description: '', file: null as File | null });
  const [newReq, setNewReq] = useState({ topic: '', description: '' });

  const chatEndRef = useRef<HTMLDivElement>(null);

  const circleNotes = allNotes.filter(n => n.circleId === id);
  const circleRequests = allRequests.filter(r => r.circleId === id);
  const circleAnnouncements = allAnnouncements.filter(a => a.circleId === id);

  useEffect(() => {
    if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTab, circle?.chat]);

  if (!circle) return <div className="p-20 text-center font-black">Cerchia non trovata.</div>;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(circle.id, chatInput);
    setChatInput('');
  };

  const handleSummarize = async (note: Note) => {
    setSummaries(prev => ({ ...prev, [note.id]: { text: '', loading: true } }));
    const summary = await summarizeNote(note.content || note.title);
    setSummaries(prev => ({ ...prev, [note.id]: { text: summary, loading: false } }));
  };

  const handleStudyPlan = async (reqId: string, topic: string) => {
    setStudyTips(prev => ({ ...prev, [reqId]: { text: '', loading: true } }));
    const plan = await suggestStudyPlan(topic);
    setStudyTips(prev => ({ ...prev, [reqId]: { text: plan, loading: false } }));
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.file) return;
    onAddNote({
      id: Math.random().toString(36).substr(2, 9),
      title: newNote.title,
      content: newNote.description,
      authorId: currentUser.id,
      circleId: circle.id,
      tags: [],
      createdAt: new Date().toISOString(),
      visibility: 'group',
      fileName: newNote.file.name,
      fileSize: `${(newNote.file.size / 1024).toFixed(0)} KB`,
      fileUrl: '#'
    });
    setShowNoteForm(false);
    setNewNote({ title: '', description: '', file: null });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="bg-white dark:bg-slate-900 px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-black">{circle.name}</h2>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{circle.subject}</p>
        </div>
        <div className="flex gap-2">
          {['chat', 'notes', 'requests'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {t === 'chat' && 'Chat'}
              {t === 'notes' && 'Appunti'}
              {t === 'requests' && 'Richieste'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {circle.chat?.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.8rem] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                      {!isMe && <p className="text-[9px] font-black uppercase opacity-50 mb-1">{msg.senderName}</p>}
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-4 flex gap-3">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Scrivi un messaggio..." className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500/50" />
              <button type="submit" className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={20}/></button>
            </form>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black italic">Archivio Materiali</h3>
              <button onClick={() => setShowNoteForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"><Plus size={16}/> Carica PDF</button>
            </div>
            {showNoteForm && (
              <form onSubmit={handleAddNoteSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
                <input placeholder="Titolo Appunto" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4 font-bold" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} />
                <input type="file" accept=".pdf" className="w-full mb-6 text-xs font-bold uppercase" onChange={e => setNewNote({...newNote, file: e.target.files?.[0] || null})} />
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs">Pubblica Ora</button>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {circleNotes.map(note => (
                <div key={note.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all group">
                  <h4 className="font-black text-lg mb-4">{note.title}</h4>
                  {summaries[note.id] ? (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800 mb-4 animate-in fade-in">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">{summaries[note.id].loading ? 'Elaborazione IA...' : summaries[note.id].text}</p>
                    </div>
                  ) : (
                    <button onClick={() => handleSummarize(note)} className="flex items-center gap-2 text-[10px] font-black text-blue-600 mb-4 hover:translate-x-1 transition-all"><Sparkles size={14}/> Riassumi con Gemini</button>
                  )}
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3"><FileText className="text-red-500" size={20}/><span className="text-[10px] font-black uppercase text-slate-400">{note.fileName}</span></div>
                    <Download size={20} className="text-slate-300 hover:text-blue-600 cursor-pointer"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black italic">Help Center</h3>
              <button onClick={() => setShowReqForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg"><HelpCircle size={16}/> Chiedi Aiuto</button>
            </div>
            {circleRequests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden">
                <div className="flex justify-between mb-4">
                  <h4 className="font-black text-xl">{req.topic}</h4>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${req.status === 'open' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>{req.status}</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">{req.description}</p>
                {studyTips[req.id] ? (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 mb-6 animate-in slide-in-from-top-2">
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-300 italic font-bold">{studyTips[req.id].loading ? 'Pianificazione in corso...' : studyTips[req.id].text}</p>
                  </div>
                ) : (
                  <button onClick={() => handleStudyPlan(req.id, req.topic)} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 mb-6"><Sparkles size={14}/> Piano di Studio Gemini</button>
                )}
                {req.status === 'open' && req.authorId !== currentUser.id && (
                  <button onClick={() => onFulfillRequest(req.id, currentUser.id)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Trophy size={16}/> Aiuta il collega (+50 Karma)</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default CircleDetail;
