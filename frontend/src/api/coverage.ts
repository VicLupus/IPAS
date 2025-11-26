import api from './client';

export interface CoverageDetail {
  id: number;
  company_id: number;
  title: string;
  content: string;
  keywords: string;
  category: string | null;
  pdf_path: string;
  pdf_filename: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_type: string;
  premium_amount?: number | null;
  coverage_period?: string | null;
  coverageAmounts?: Array<{ category: string; amount: number; condition_text?: string }>;
  specialConditions?: Array<{ condition_name: string; condition_detail: string }>;
  structuredData?: any;
}

export interface SearchParams {
  q?: string;
  companyType?: '생명보험' | '손해보험';
  companyId?: number;
  companyIds?: number[];
  category?: string;
  categories?: string[];
  keywords?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: CoverageDetail[];
  count: number;
  limit?: number;
  offset?: number;
}

export interface CategoriesResponse {
  categories: string[];
}

export interface KeywordsResponse {
  keywords: string[];
}

export const coverageApi = {
  search: async (params: SearchParams): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>('/coverage/search', { params });
    return response.data;
  },
  getAll: async (limit?: number, offset?: number): Promise<SearchResponse> => {
    const response = await api.get<SearchResponse>('/coverage', {
      params: { limit, offset }
    });
    return response.data;
  },
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get<CategoriesResponse>('/coverage/categories');
    return response.data;
  },
  getKeywords: async (): Promise<KeywordsResponse> => {
    const response = await api.get<KeywordsResponse>('/coverage/keywords');
    return response.data;
  },
  getById: async (id: number): Promise<CoverageDetail> => {
    const response = await api.get<CoverageDetail>(`/coverage/${id}`);
    return response.data;
  }
};

