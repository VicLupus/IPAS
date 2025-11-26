import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.join(__dirname, '../../insurance.db');

export class Database {
  private db: sqlite3.Database;
  private initialized: Promise<void>;

  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('데이터베이스 연결 오류:', err);
      } else {
        console.log('데이터베이스 연결 성공');
      }
    });
    this.initialized = this.initTables();
  }

  private async initTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      const runQuery = (sql: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          this.db.run(sql, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      };

      (async () => {
        try {
          // 사용자 테이블
          await runQuery(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 보험사 테이블
          await runQuery(`
            CREATE TABLE IF NOT EXISTS insurance_companies (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              type TEXT NOT NULL CHECK(type IN ('생명보험', '손해보험')),
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // 보장내역 테이블 (확장)
          await runQuery(`
            CREATE TABLE IF NOT EXISTS coverage_details (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              company_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              keywords TEXT,
              category TEXT,
              pdf_path TEXT,
              pdf_filename TEXT,
              pdf_hash TEXT,
              pdf_mtime DATETIME,
              premium_amount REAL,
              coverage_period TEXT,
              structured_data TEXT,
              version INTEGER DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (company_id) REFERENCES insurance_companies(id)
            )
          `);

          // 보장금액 상세 테이블 (카테고리별)
          await runQuery(`
            CREATE TABLE IF NOT EXISTS coverage_amounts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              coverage_id INTEGER NOT NULL,
              category TEXT NOT NULL,
              amount REAL,
              condition_text TEXT,
              FOREIGN KEY (coverage_id) REFERENCES coverage_details(id) ON DELETE CASCADE
            )
          `);

          // 특약사항 테이블
          await runQuery(`
            CREATE TABLE IF NOT EXISTS special_conditions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              coverage_id INTEGER NOT NULL,
              condition_name TEXT NOT NULL,
              condition_detail TEXT,
              FOREIGN KEY (coverage_id) REFERENCES coverage_details(id) ON DELETE CASCADE
            )
          `);

          // 상품 버전 이력 테이블
          await runQuery(`
            CREATE TABLE IF NOT EXISTS coverage_versions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              coverage_id INTEGER NOT NULL,
              version INTEGER NOT NULL,
              pdf_filename TEXT,
              pdf_hash TEXT,
              structured_data TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (coverage_id) REFERENCES coverage_details(id) ON DELETE CASCADE
            )
          `);

          // 상품 평가 점수 테이블
          await runQuery(`
            CREATE TABLE IF NOT EXISTS product_scores (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              coverage_id INTEGER NOT NULL,
              coverage_score REAL,
              premium_score REAL,
              special_condition_score REAL,
              total_score REAL,
              calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (coverage_id) REFERENCES coverage_details(id) ON DELETE CASCADE
            )
          `);

          // 키워드 인덱스 테이블 (검색 성능 향상)
          await runQuery(`
            CREATE TABLE IF NOT EXISTS keyword_index (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              coverage_id INTEGER NOT NULL,
              keyword TEXT NOT NULL,
              FOREIGN KEY (coverage_id) REFERENCES coverage_details(id)
            )
          `);

          // 인덱스 생성
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_keywords ON keyword_index(keyword)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_coverage_keywords ON coverage_details(keywords)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_coverage_title ON coverage_details(title)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_coverage_category ON coverage_details(category)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_coverage_pdf_hash ON coverage_details(pdf_hash)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_coverage_amounts_category ON coverage_amounts(category)`);
          await runQuery(`CREATE INDEX IF NOT EXISTS idx_product_scores_total ON product_scores(total_score DESC)`);

          console.log('데이터베이스 테이블 초기화 완료');

          // 기본 사용자 계정 5개 생성
          await this.initDefaultUsers();
          
          resolve();
        } catch (err) {
          reject(err);
        }
      })();
    });
  }

  private async initDefaultUsers(): Promise<void> {
    const bcrypt = require('bcryptjs');
    const defaultUsers = [
      { username: 'admin1', password: 'admin123!' },
      { username: 'admin2', password: 'admin123!' },
      { username: 'admin3', password: 'admin123!' },
      { username: 'admin4', password: 'admin123!' },
      { username: 'admin5', password: 'admin123!' }
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await new Promise<void>((resolve, reject) => {
        this.db.run(
          `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
          [user.username, hashedPassword],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    console.log('기본 사용자 계정 생성 완료');
  }

  async waitForInit(): Promise<void> {
    return this.initialized;
  }

  getDb(): sqlite3.Database {
    return this.db;
  }

  close() {
    this.db.close();
  }
}

export const database = new Database();

