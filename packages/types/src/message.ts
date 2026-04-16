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
    modelProfile?: { displayName: string; coverImage?: string } | null;
    brandProfile?: { brandName: string; logoUrl?: string } | null;
  };
}
