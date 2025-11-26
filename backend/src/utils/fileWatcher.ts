import fs from 'fs';
import path from 'path';
import { getFileHash, getFileMtime } from './pdfParser';
import { database } from '../database/db';

const db = database.getDb();

export interface FileInfo {
  filePath: string;
  filename: string;
  hash: string;
  mtime: Date;
  companyName: string;
  companyType: '생명보험' | '손해보험';
}

export async function scanDirectory(dirPath: string, type: '생명보험' | '손해보험'): Promise<FileInfo[]> {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  // UTF-8 인코딩으로 파일명 읽기
  const files = fs.readdirSync(dirPath, { encoding: 'utf-8' });
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  const fileInfos: FileInfo[] = [];

  for (const file of pdfFiles) {
    const filePath = path.join(dirPath, file);
    try {
      const hash = getFileHash(filePath);
      const mtime = getFileMtime(filePath);
      const companyName = extractCompanyName(file, type);

      fileInfos.push({
        filePath,
        filename: file,
        hash,
        mtime,
        companyName,
        companyType: type
      });
    } catch (error) {
      console.error(`파일 정보 읽기 오류 (${file}):`, error);
    }
  }

  return fileInfos;
}

export async function findChangedFiles(
  dirPath: string,
  type: '생명보험' | '손해보험'
): Promise<FileInfo[]> {
  const currentFiles = await scanDirectory(dirPath, type);
  const changedFiles: FileInfo[] = [];

  for (const fileInfo of currentFiles) {
    const isChanged = await checkFileChanged(fileInfo);
    if (isChanged) {
      changedFiles.push(fileInfo);
    }
  }

  return changedFiles;
}

async function checkFileChanged(fileInfo: FileInfo): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT pdf_hash, pdf_mtime FROM coverage_details 
       WHERE pdf_filename = ? AND pdf_path = ?`,
      [fileInfo.filename, fileInfo.filePath],
      (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        // 파일이 데이터베이스에 없으면 변경된 것으로 간주
        if (!row) {
          resolve(true);
          return;
        }

        // 해시가 다르면 변경됨
        if (row.pdf_hash !== fileInfo.hash) {
          resolve(true);
          return;
        }

        // 수정일시가 다르면 변경됨
        const dbMtime = row.pdf_mtime ? new Date(row.pdf_mtime) : null;
        if (dbMtime && dbMtime.getTime() !== fileInfo.mtime.getTime()) {
          resolve(true);
          return;
        }

        resolve(false);
      }
    );
  });
}

function extractCompanyName(filename: string, type: '생명보험' | '손해보험'): string {
  let name = filename.replace('.pdf', '');
  
  const removePatterns = [
    '_영업방향', '_영업이슈', '_사망보험금유동화', '_간병치매플랜',
    '_당뇨보험', '_교육자료', '_교안', '_신규특약', '_판매포인트',
    '_상품전략', '_마케팅팩', '_GA뉴스', '_5배더 행복한 종신'
  ];

  removePatterns.forEach(pattern => {
    name = name.replace(pattern, '');
  });

  name = name.replace(/\(\d+\)/g, '');
  return name.trim();
}

