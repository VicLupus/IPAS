import api from './client';

export interface FileInfo {
  filename: string;
  filePath: string;
  hash: string;
  mtime: string;
}

export interface CompanyFiles {
  companyName: string;
  companyType: '생명보험' | '손해보험';
  files: FileInfo[];
}

export interface ProductInfo {
  id: number;
  title: string;
  pdf_filename: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  company_type: string;
}

export interface CompanyProducts {
  companyName: string;
  companyType: '생명보험' | '손해보험';
  products: ProductInfo[];
}

export interface FilesResponse {
  totalFiles: number;
  companies: CompanyFiles[];
}

export const updateApi = {
  getFiles: async (): Promise<FilesResponse> => {
    const response = await api.get<FilesResponse>('/update/files');
    return response.data;
  },
  scan: async (): Promise<{ changedFiles: number; files: Array<{ filename: string; companyName: string; companyType: string }> }> => {
    const response = await api.post('/update/scan');
    return response.data;
  },
  update: async (): Promise<{ message: string; updated: number; created: number; errors: string[] }> => {
    const response = await api.post('/update/update');
    return response.data;
  },
  updateCompany: async (companyName: string, companyType: '생명보험' | '손해보험'): Promise<{ message: string; updated: number; created: number; errors: string[] }> => {
    const response = await api.post('/update/update/company', { companyName, companyType });
    return response.data;
  },
  getProducts: async (): Promise<{ companies: CompanyProducts[]; totalProducts: number }> => {
    const response = await api.get('/update/products');
    return response.data;
  },
  deleteProduct: async (productId: number): Promise<{ success: boolean; message: string; deletedId: number }> => {
    const response = await api.delete(`/update/products/${productId}`);
    return response.data;
  },
  deleteAllProducts: async (): Promise<{ success: boolean; message: string; deletedCount: number }> => {
    const response = await api.delete('/update/products');
    return response.data;
  }
};

