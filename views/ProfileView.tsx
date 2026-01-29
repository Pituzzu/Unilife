
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, Notification, UserRole } from '../types';
import { UserPlus, Check, Mail, GraduationCap, Edit3, Award, Calendar, Hash, Bookmark, Share2, MapPin, Users2, ExternalLink, Github } from 'lucide-react';

const { useParams, Link } = ReactRouterDOM as any;

interface Props {
  currentUser: User;
  allUsers: User[];
  onUpdate: (user: User) => void;
}

const ProfileView: React.FC<Props> = ({ currentUser, allUsers, onUpdate }) => {
  const { id } = useParams<{ id: string }>();
  const user = allUsers.find(u => u.id === id);
  const isOwnProfile = currentUser.id === id;

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    bio: user?.bio || '',
    year: user?.year || '1° Anno',
    role: user?.role || 'student',
    interests: user?.interests?.join(', ') || '',
    githubUsername: user?.githubUsername || ''
  });

  if (!user) return <div className="text-center p-20 dark:text-slate-300">Utente non trovato</div>;

  const isFriend = currentUser.friends.includes(user.id);
  const hasSentRequest = user.pendingRequests.includes(currentUser.id);

  const handleFriendRequest = () => {
    if (hasSentRequest || isFriend) return;
    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'friend_request',
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updatedUser = { 
      ...user, 
      pendingRequests: [...user.pendingRequests, currentUser.id],
      notifications: [newNotif, ...user.notifications]
    };
    onUpdate(updatedUser);
  };

  const handleSave = () => {
    onUpdate({ 
      ...user, 
      bio: editedData.bio,
      year: editedData.year,
      role: editedData.role as UserRole,
      interests: editedData.interests.split(',').map(i => i.trim()).filter(i => i !== ''),
      githubUsername: editedData.githubUsername
    });
    setIsEditing(false);
  };

  const roleColors = {
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    tutor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    representative: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const roleLabels = {
    student: 'Studente',
    tutor: 'Tutor Verificato',
    representative: 'Rappresentante'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <div className="h-32 md:h-48 bg-gradient-to-br from-blue-600 to-indigo-800"></div>
        <div className="px-5 md:px-10 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between -mt-12 md:-mt-16 gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="relative">
                <img src={user.avatar} className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] border-4 border-white dark:border-slate-900 object-cover shadow-2xl" alt={user.name} />
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div className="text-center md:text-left space-y-1">
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{user.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${roleColors[user.role || 'student']}`}>
                    {roleLabels[user.role || 'student']}
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <MapPin size={12} /> <span>UniKore Enna</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {isOwnProfile ? (
                <button onClick={() => setIsEditing(!isEditing)} className="flex-1 md:flex-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
                  <Edit3 size={16} />
                  <span>{isEditing ? 'Annulla' : 'Modifica'}</span>
                </button>
              ) : (
                <button onClick={handleFriendRequest} disabled={hasSentRequest || isFriend} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isFriend ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white shadow-xl'}`}>
                  {isFriend ? <Check size={18} /> : <UserPlus size={18} />}
                  <span>{isFriend ? 'Amici' : 'Aggiungi'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 space-y-6">
          <SectionCard title="Biografia">
            {isEditing ? (
              <textarea value={editedData.bio} onChange={(e) => setEditedData({...editedData, bio: e.target.value})} className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm min-h-[120px]" placeholder="Racconta qualcosa di te..." />
            ) : (
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm italic">{user.bio || "Ancora nessuna biografia."}</p>
            )}
          </SectionCard>

          <SectionCard title="GitHub & Networking">
            <div className="flex flex-col gap-4">
              {isEditing ? (
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Username GitHub</label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={editedData.githubUsername} onChange={(e) => setEditedData({...editedData, githubUsername: e.target.value})} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm" placeholder="es. octocat" />
                  </div>
                </div>
              ) : (
                user.githubUsername ? (
                  <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-slate-900 text-white rounded-[2rem] group hover:scale-[1.02] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Github size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">GitHub Profile</p>
                        <p className="font-bold text-sm">github.com/{user.githubUsername}</p>
                      </div>
                    </div>
                    <ExternalLink size={18} className="opacity-40 group-hover:opacity-100" />
                  </a>
                ) : <p className="text-slate-400 text-xs font-medium italic">Profilo GitHub non collegato.</p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="md:col-span-5 space-y-6">
          <SectionCard title="Dati Accademici">
            <div className="space-y-4">
              <DetailRow icon={<GraduationCap size={16} />} label="Corso" value={user.course || 'N/A'} />
              <DetailRow icon={<Calendar size={16} />} label="Anno" value={user.year || 'N/A'} />
              <DetailRow icon={<Mail size={16} />} label="Email" value={user.email} />
              
              {isEditing && (
                <div className="pt-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={handleSave} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all">Salva Modifiche</button>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
    <div>{children}</div>
  </div>
);

const DetailRow: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className="text-blue-500">{icon}</div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{value}</span>
  </div>
);

export default ProfileView;
