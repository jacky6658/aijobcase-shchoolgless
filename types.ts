
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
  SCHOOL_MVP = 'SCHOOL_MVP'
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: SubscriptionPlan;
  quotaLimit: number;
  quotaUsed: number;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  passwordHash?: string; // 嚴禁存明文
  googleSub?: string;    // Google OAuth 唯一識別碼
  lastLoginAt?: string;
  status: 'ACTIVE' | 'PENDING_PASSWORD' | 'DISABLED';
}

export interface Course {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  teacherId: string;
}

export interface Material {
  id: string;
  courseId: string;
  tenantId: string;
  title: string;
  type: 'PDF' | 'DOCX' | 'PPTX';
  url: string;
  status: 'PROCESSING' | 'READY' | 'FAILED';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  messages: ChatMessage[];
  lastUpdated: string;
}
