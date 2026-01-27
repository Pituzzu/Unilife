
export type NotificationType = 'friend_request' | 'circle_invite' | 'join_request' | 'request_accepted' | 'note_provided';
export type UserRole = 'student' | 'tutor' | 'representative';

export interface Notification {
  id: string;
  type: NotificationType;
  senderId: string;
  senderName: string;
  circleId?: string;
  circleName?: string;
  timestamp: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  course?: string;
  year?: string;
  interests?: string[];
  role?: UserRole;
  friends: string[]; // IDs
  pendingRequests: string[]; // IDs
  notifications: Notification[];
  githubUsername?: string;
  karma: number; // Punti guadagnati aiutando i colleghi
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  reactions?: { [emoji: string]: string[] };
}

export interface Circle {
  id: string;
  name: string;
  subject: string;
  examDate?: string;
  description: string;
  members: string[]; // User IDs
  pendingMembers: string[]; // User IDs
  creatorId: string;
  category: string;
  createdAt: string;
  chat: ChatMessage[];
}

export interface NoteRequest {
  id: string;
  circleId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  topic: string;
  description: string;
  timestamp: string;
  status: 'open' | 'fulfilled';
  fulfilledBy?: string; // User ID che ha fornito l'appunto
}

export type NoteVisibility = 'private' | 'group' | 'public';

export interface Note {
  id: string;
  title: string;
  content: string; 
  authorId: string;
  circleId: string;
  tags: string[];
  createdAt: string;
  visibility: NoteVisibility;
  fileName: string;
  fileSize: string;
  fileUrl: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  circleId: string;
  timestamp: string;
  priority: 'normal' | 'high';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}