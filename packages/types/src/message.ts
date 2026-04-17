export interface Thread {
  id: string;
  createdAt: string;
  members: ThreadMemberInfo[];
  lastMessage?: Message;
}

export interface ThreadMemberInfo {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    role?: string;
    modelProfile?: { displayName: string; profileImage?: string; coverImage?: string } | null;
    brandProfile?: { brandName: string; logoUrl?: string; profileImage?: string } | null;
    photographerProfile?: { displayName: string; profileImage?: string } | null;
  };
}

/** Shape returned by GET /api/threads (Prisma-based, includes nested user) */
export interface ApiThread {
  id: string;
  createdAt: string;
  members: ApiThreadMember[];
  messages: Array<{ id: string; body: string; createdAt: string; senderId: string }>;
  unreadCount: number;
}

export interface ApiThreadMember {
  threadId: string;
  userId: string;
  user: {
    id: string;
    email: string;
    role: string;
    modelProfile: { displayName: string; profileImage?: string; coverImage?: string } | null;
    brandProfile: { brandName: string; logoUrl?: string; profileImage?: string } | null;
    photographerProfile: { displayName: string; profileImage?: string } | null;
  };
}
