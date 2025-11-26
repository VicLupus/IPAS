import api from './client';

export interface CompareProduct {
  id: number;
  company_name: string;
  company_type: string;
  title: string;
  category?: string | null;
   pdf_filename?: string;
  premium_amount: number | null;
  coverage_period: string | null;
  coverageAmounts: Array<{ category: string; amount: number; condition_text?: string }>;
  specialConditions: Array<{ condition_name: string; condition_detail: string }>;
  structuredData?: any;
  total_score?: number | null;
  coverage_score?: number | null;
  premium_score?: number | null;
  special_condition_score?: number | null;
}

export interface CompareResponse {
  products: CompareProduct[];
  count: number;
}

export const compareApi = {
  compareProducts: async (productIds: number[]): Promise<CompareResponse> => {
    const response = await api.post<CompareResponse>('/compare/products', { productIds });
    return response.data;
  },
  compareByCategory: async (category: string, companyType?: string): Promise<any> => {
    const response = await api.get(`/compare/category/${category}`, {
      params: { companyType }
    });
    return response.data;
  }
};

