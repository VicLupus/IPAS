import { database } from '../database/db';
import { promisify } from 'util';

const db = database.getDb();
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

export interface CoverageDetail {
  id: number;
  company_id: number;
  title: string;
  content: string;
  keywords: string;
  category: string | null;
  pdf_path: string;
  pdf_filename: string;
  pdf_hash: string | null;
  pdf_mtime: string | null;
  premium_amount: number | null;
  coverage_period: string | null;
  structured_data: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CoverageDetailWithCompany extends CoverageDetail {
  company_name: string;
  company_type: string;
}

export interface StructuredData {
  premiumAmount?: number;
  coveragePeriod?: string; // 보장기간
  paymentPeriod?: string; // 납입기간
  renewalType?: string; // 갱신형/비갱신형 등
  mainContractType?: string; // 주계약/특약 구분
  hasWaiver?: boolean; // 납입면제 여부
  waiverDescription?: string; // 납입면제 조건/내용
  coverageAmounts: Array<{ category: string; amount: number; condition?: string }>;
  specialConditions: string[];
}

export class CoverageDetailModel {
  static async create(data: {
    company_id: number;
    title: string;
    content: string;
    keywords: string;
    category?: string;
    pdf_path: string;
    pdf_filename: string;
    pdf_hash?: string;
    pdf_mtime?: Date;
    premium_amount?: number;
    coverage_period?: string;
    structured_data?: StructuredData;
  }): Promise<CoverageDetail> {
    return new Promise((resolve, reject) => {
      const structuredDataJson = data.structured_data ? JSON.stringify(data.structured_data) : null;
      
      db.run(
        `INSERT INTO coverage_details 
         (company_id, title, content, keywords, category, pdf_path, pdf_filename, 
          pdf_hash, pdf_mtime, premium_amount, coverage_period, structured_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.company_id, data.title, data.content, data.keywords, 
          data.category || null, data.pdf_path, data.pdf_filename,
          data.pdf_hash || null, data.pdf_mtime?.toISOString() || null,
          data.premium_amount || null, data.coverage_period || null, structuredDataJson
        ],
        function (err) {
          if (err) {
            reject(err);
          } else {
            const coverageId = this.lastID;
            
            // 보장금액 저장
            if (data.structured_data?.coverageAmounts) {
              data.structured_data.coverageAmounts.forEach(ca => {
                db.run(
                  'INSERT INTO coverage_amounts (coverage_id, category, amount, condition_text) VALUES (?, ?, ?, ?)',
                  [coverageId, ca.category, ca.amount, ca.condition || null]
                );
              });
            }

            // 특약사항 저장
            if (data.structured_data?.specialConditions) {
              data.structured_data.specialConditions.forEach(sc => {
                db.run(
                  'INSERT INTO special_conditions (coverage_id, condition_name, condition_detail) VALUES (?, ?, ?)',
                  [coverageId, sc.substring(0, 100), sc]
                );
              });
            }

            // 키워드 인덱스 생성
            const keywords = data.keywords.split(',').map(k => k.trim()).filter(k => k);
            keywords.forEach(keyword => {
              db.run('INSERT INTO keyword_index (coverage_id, keyword) VALUES (?, ?)', [coverageId, keyword]);
            });

            db.get('SELECT * FROM coverage_details WHERE id = ?', [coverageId], (err, row: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        }
      );
    });
  }

  static async update(data: {
    id: number;
    title?: string;
    content?: string;
    keywords?: string;
    pdf_hash?: string;
    pdf_mtime?: Date;
    premium_amount?: number;
    coverage_period?: string;
    structured_data?: StructuredData;
  }): Promise<CoverageDetail> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.title) { updates.push('title = ?'); values.push(data.title); }
      if (data.content) { updates.push('content = ?'); values.push(data.content); }
      if (data.keywords) { updates.push('keywords = ?'); values.push(data.keywords); }
      if (data.pdf_hash) { updates.push('pdf_hash = ?'); values.push(data.pdf_hash); }
      if (data.pdf_mtime) { updates.push('pdf_mtime = ?'); values.push(data.pdf_mtime.toISOString()); }
      if (data.premium_amount !== undefined) { updates.push('premium_amount = ?'); values.push(data.premium_amount); }
      if (data.coverage_period) { updates.push('coverage_period = ?'); values.push(data.coverage_period); }
      if (data.structured_data) { 
        updates.push('structured_data = ?'); 
        values.push(JSON.stringify(data.structured_data)); 
      }
      
      updates.push('version = version + 1');
      updates.push('updated_at = CURRENT_TIMESTAMP');

      values.push(data.id);

      db.run(
        `UPDATE coverage_details SET ${updates.join(', ')} WHERE id = ?`,
        values,
        function (err) {
          if (err) {
            reject(err);
          } else {
            // 기존 보장금액 및 특약사항 삭제 후 재생성
            db.run('DELETE FROM coverage_amounts WHERE coverage_id = ?', [data.id]);
            db.run('DELETE FROM special_conditions WHERE coverage_id = ?', [data.id]);

            if (data.structured_data?.coverageAmounts) {
              data.structured_data.coverageAmounts.forEach(ca => {
                db.run(
                  'INSERT INTO coverage_amounts (coverage_id, category, amount, condition_text) VALUES (?, ?, ?, ?)',
                  [data.id, ca.category, ca.amount, ca.condition || null]
                );
              });
            }

            if (data.structured_data?.specialConditions) {
              data.structured_data.specialConditions.forEach(sc => {
                db.run(
                  'INSERT INTO special_conditions (coverage_id, condition_name, condition_detail) VALUES (?, ?, ?)',
                  [data.id, sc.substring(0, 100), sc]
                );
              });
            }

            db.get('SELECT * FROM coverage_details WHERE id = ?', [data.id], (err, row: any) => {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            });
          }
        }
      );
    });
  }

  static async findById(id: number): Promise<CoverageDetailWithCompany | null> {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT cd.*, ic.name as company_name, ic.type as company_type
         FROM coverage_details cd
         JOIN insurance_companies ic ON cd.company_id = ic.id
         WHERE cd.id = ?`,
        [id],
        (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }

  static async findByPdfPath(pdfPath: string): Promise<CoverageDetail | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM coverage_details WHERE pdf_path = ?', [pdfPath], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async findAllByPdfPath(pdfPath: string): Promise<CoverageDetail[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM coverage_details WHERE pdf_path = ?', [pdfPath], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getCoverageAmounts(coverageId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM coverage_amounts WHERE coverage_id = ?', [coverageId], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getSpecialConditions(coverageId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM special_conditions WHERE coverage_id = ?', [coverageId], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async search(query: string, filters?: {
    companyType?: '생명보험' | '손해보험';
    companyId?: number;
    companyIds?: number[];
    category?: string;
    categories?: string[];
    keywords?: string[];
  }): Promise<CoverageDetailWithCompany[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          cd.*,
          ic.name as company_name,
          ic.type as company_type
        FROM coverage_details cd
        JOIN insurance_companies ic ON cd.company_id = ic.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (query) {
        sql += ` AND (cd.title LIKE ? OR cd.content LIKE ? OR cd.keywords LIKE ?)`;
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters?.companyType) {
        sql += ` AND ic.type = ?`;
        params.push(filters.companyType);
      }

      if (filters?.companyIds && filters.companyIds.length > 0) {
        const companyPlaceholders = filters.companyIds.map(() => '?').join(',');
        sql += ` AND cd.company_id IN (${companyPlaceholders})`;
        params.push(...filters.companyIds);
      } else if (filters?.companyId) {
        sql += ` AND cd.company_id = ?`;
        params.push(filters.companyId);
      }

      if (filters?.categories && filters.categories.length > 0) {
        const categoryPlaceholders = filters.categories.map(() => '?').join(',');
        sql += ` AND cd.category IN (${categoryPlaceholders})`;
        params.push(...filters.categories);
      } else if (filters?.category) {
        sql += ` AND cd.category = ?`;
        params.push(filters.category);
      }

      if (filters?.keywords && filters.keywords.length > 0) {
        const keywordPlaceholders = filters.keywords.map(() => '?').join(',');
        sql += ` AND cd.id IN (
          SELECT DISTINCT coverage_id FROM keyword_index 
          WHERE keyword IN (${keywordPlaceholders})
        )`;
        params.push(...filters.keywords);
      }

      if (query) {
        sql += ` ORDER BY 
          CASE 
            WHEN cd.title LIKE ? THEN 1
            WHEN cd.keywords LIKE ? THEN 2
            ELSE 3
          END,
          cd.updated_at DESC`;
        const searchTerm = `%${query}%`;
        params.push(searchTerm, searchTerm);
      } else {
        sql += ` ORDER BY cd.updated_at DESC`;
      }

      db.all(sql, params, (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findAll(limit?: number, offset?: number): Promise<CoverageDetailWithCompany[]> {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          cd.*,
          ic.name as company_name,
          ic.type as company_type
        FROM coverage_details cd
        JOIN insurance_companies ic ON cd.company_id = ic.id
        ORDER BY cd.updated_at DESC
      `;

      if (limit) {
        sql += ` LIMIT ?`;
        if (offset) {
          sql += ` OFFSET ?`;
          db.all(sql, [limit, offset], (err, rows: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows || []);
            }
          });
        } else {
          db.all(sql, [limit], (err, rows: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows || []);
            }
          });
        }
      } else {
        db.all(sql, (err, rows: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        });
      }
    });
  }

  static async findByCompany(companyId: number): Promise<CoverageDetail[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM coverage_details WHERE company_id = ? ORDER BY updated_at DESC', [companyId], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getCategories(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT category FROM coverage_details WHERE category IS NOT NULL', (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows ? rows.map((r: any) => r.category).filter((c: string) => c) : []);
        }
      });
    });
  }

  static async getKeywords(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT DISTINCT keyword FROM keyword_index ORDER BY keyword', (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows ? rows.map((r: any) => r.keyword) : []);
        }
      });
    });
  }

  static async delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // 관련 데이터 먼저 삭제
      db.run('DELETE FROM coverage_amounts WHERE coverage_id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        db.run('DELETE FROM special_conditions WHERE coverage_id = ?', [id], (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // product_scores 테이블의 점수도 삭제
          db.run('DELETE FROM product_scores WHERE coverage_id = ?', [id], (err) => {
            if (err) {
              reject(err);
              return;
            }
            
            // 마지막으로 상품 삭제
            db.run('DELETE FROM coverage_details WHERE id = ?', [id], (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });
      });
    });
  }

  static async deleteByPdfPath(pdfPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      db.all('SELECT id FROM coverage_details WHERE pdf_path = ?', [pdfPath], async (err, rows: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!rows || rows.length === 0) {
          resolve(0);
          return;
        }

        try {
          for (const row of rows) {
            await CoverageDetailModel.delete(row.id);
          }
          resolve(rows.length);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  static async getAllGroupedByCompany(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          cd.*,
          ic.name as company_name,
          ic.type as company_type
        FROM coverage_details cd
        JOIN insurance_companies ic ON cd.company_id = ic.id
        ORDER BY ic.name, cd.title
      `, [], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          // 보험사별로 그룹화
          const grouped: { [key: string]: any[] } = {};
          rows.forEach((row: any) => {
            const key = `${row.company_name}|${row.company_type}`;
            if (!grouped[key]) {
              grouped[key] = [];
            }
            grouped[key].push(row);
          });
          
          // 배열로 변환
          const result = Object.keys(grouped).map(key => {
            const [companyName, companyType] = key.split('|');
            return {
              companyName,
              companyType,
              products: grouped[key]
            };
          });
          
          resolve(result);
        }
      });
    });
  }
}
