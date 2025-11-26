import { database } from '../database/db';
import bcrypt from 'bcryptjs';
import { promisify } from 'util';

const db = database.getDb();
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));

export interface User {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

export class UserModel {
  static async findByUsername(username: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

