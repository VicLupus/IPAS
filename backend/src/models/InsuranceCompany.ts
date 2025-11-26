import { database } from '../database/db';
import { promisify } from 'util';

const db = database.getDb();
const dbRun = promisify(db.run.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));

export interface InsuranceCompany {
  id: number;
  name: string;
  type: '생명보험' | '손해보험';
  created_at: string;
  updated_at: string;
}

export class InsuranceCompanyModel {
  static async findAll(): Promise<InsuranceCompany[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM insurance_companies ORDER BY name', (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findByType(type: '생명보험' | '손해보험'): Promise<InsuranceCompany[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM insurance_companies WHERE type = ? ORDER BY name', [type], (err, rows: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findOrCreate(name: string, type: '생명보험' | '손해보험'): Promise<InsuranceCompany> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM insurance_companies WHERE name = ? AND type = ?', [name, type], async (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(row);
        } else {
          db.run(
            'INSERT INTO insurance_companies (name, type) VALUES (?, ?)',
            [name, type],
            function (err) {
              if (err) {
                reject(err);
              } else {
                db.get('SELECT * FROM insurance_companies WHERE id = ?', [this.lastID], (err, row: any) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                });
              }
            }
          );
        }
      });
    });
  }
}

