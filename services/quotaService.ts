
import { MOCK_TENANTS } from '../constants';

export class QuotaService {
  /**
   * 檢查租戶是否有足夠額度
   */
  async checkQuota(tenantId: string): Promise<{ allowed: boolean; remaining: number }> {
    // 模擬從 DB 讀取最新用量
    const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
    if (!tenant) return { allowed: false, remaining: 0 };

    const remaining = tenant.quotaLimit - tenant.quotaUsed;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining)
    };
  }

  /**
   * 扣除配額 (通常根據 Token 數或 Request 數)
   */
  async consumeQuota(tenantId: string, amount: number = 1) {
    const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
    if (tenant) {
      tenant.quotaUsed += amount;
      console.log(`[Quota] 租戶 ${tenantId} 消耗了 ${amount} 額度，目前已用: ${tenant.quotaUsed}`);
    }
  }
}

export const quotaService = new QuotaService();
