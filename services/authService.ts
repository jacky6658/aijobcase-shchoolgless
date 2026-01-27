
import { User, UserRole } from '../types';
import { MOCK_USER } from '../constants';

// 模擬雜湊函數 (生產環境應使用 bcryptjs)
const mockHash = (pw: string) => `hash_${pw}_secret`;

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // 從儲存中恢復 session (模擬)
    const saved = localStorage.getItem('edumind_session');
    if (saved) this.currentUser = JSON.parse(saved);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async login(email: string, password: string): Promise<User> {
    // 模擬後端 DB 查詢與密碼比對
    const hash = mockHash(password);
    
    // 根據 Email 模擬不同角色
    let role = UserRole.STUDENT;
    if (email.includes('alex') || email.includes('teacher')) role = UserRole.TEACHER;
    if (email.includes('admin')) role = UserRole.TENANT_ADMIN;

    // 範例：若密碼是 "123456" 則通過
    if (password === "123456" || email === "alex@ntu.edu.tw") {
      const user: User = {
        ...MOCK_USER,
        id: `u_${role.toLowerCase()}`,
        email,
        role,
        status: 'ACTIVE',
        lastLoginAt: new Date().toISOString()
      };
      this.setSession(user);
      return user;
    }
    throw new Error("帳號或密碼錯誤");
  }

  // 專門供開發者快速切換角色使用
  async mockLoginAs(role: UserRole): Promise<User> {
    const user: User = {
      ...MOCK_USER,
      id: `mock_${role.toLowerCase()}`,
      name: role === UserRole.STUDENT ? '王小明 (學生)' : role === UserRole.TEACHER ? '陳大文 (老師)' : '管理員 (Admin)',
      email: `${role.toLowerCase()}@test.com`,
      role,
      status: 'ACTIVE',
      lastLoginAt: new Date().toISOString()
    };
    this.setSession(user);
    return user;
  }

  async googleCallback(code: string): Promise<{ user: User; needsPasswordSetup: boolean }> {
    // 模擬 Google OAuth 回調
    const user: User = {
      ...MOCK_USER,
      googleSub: "google_12345",
      status: 'PENDING_PASSWORD',
      lastLoginAt: new Date().toISOString()
    };
    
    const needsPasswordSetup = !user.passwordHash;
    this.setSession(user);
    return { user, needsPasswordSetup };
  }

  async setInitialPassword(password: string): Promise<void> {
    if (!this.currentUser) throw new Error("未登入");
    this.currentUser.passwordHash = mockHash(password);
    this.currentUser.status = 'ACTIVE';
    this.setSession(this.currentUser);
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('edumind_session');
  }

  private setSession(user: User) {
    this.currentUser = user;
    localStorage.setItem('edumind_session', JSON.stringify(user));
  }

  // 管理員 API (需校驗 X-Admin-Token)
  async adminResetPassword(userId: string, adminToken: string): Promise<string> {
    if (adminToken !== "secret_token_123") throw new Error("Unauthorized");
    const tempPassword = Math.random().toString(36).slice(-8);
    console.log(`[Admin] 已將用戶 ${userId} 密碼重設為: ${tempPassword}`);
    return tempPassword;
  }
}

export const authService = new AuthService();
