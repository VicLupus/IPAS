import api from './client';

export interface ProductScore {
  coverageScore: number;
  premiumScore: number;
  specialConditionScore: number;
  totalScore: number;
}

export interface RankingProduct {
  id: number;
  company_name: string;
  company_type: string;
  title: string;
  total_score: number;
  coverage_score: number;
  premium_score: number;
  special_condition_score: number;
}

export const scoresApi = {
  calculateScore: async (productId: number): Promise<ProductScore> => {
    const response = await api.post<ProductScore>(`/scores/calculate/${productId}`);
    return response.data;
  },
  getScore: async (productId: number): Promise<ProductScore> => {
    const response = await api.get<ProductScore>(`/scores/${productId}`);
    return response.data;
  },
  getRanking: async (companyType?: string, limit?: number, forceRecalculate?: boolean): Promise<{ products: RankingProduct[]; count: number; displayedCount?: number }> => {
    const response = await api.get('/scores/ranking/list', {
      params: { companyType, limit, forceRecalculate: forceRecalculate ? 'true' : undefined }
    });
    return response.data;
  },
  removeDuplicates: async (): Promise<{ success: boolean; deletedCount: number; deletedIds: number[]; duplicateGroups: number }> => {
    const response = await api.post('/scores/ranking/remove-duplicates');
    return response.data;
  }
};

