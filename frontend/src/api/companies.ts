import api from './client';

export interface InsuranceCompany {
  id: number;
  name: string;
  type: '생명보험' | '손해보험';
  created_at: string;
  updated_at: string;
}

export const companiesApi = {
  getAll: async (type?: '생명보험' | '손해보험'): Promise<{ companies: InsuranceCompany[] }> => {
    const response = await api.get('/companies', {
      params: { type }
    });
    return response.data;
  }
};

