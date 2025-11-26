import fs from 'fs';
import path from 'path';
import { parsePDF, getFileHash, getFileMtime } from '../utils/pdfParser';
import { InsuranceCompanyModel } from '../models/InsuranceCompany';
import { CoverageDetailModel } from '../models/CoverageDetail';
import { database } from '../database/db';

async function parseAllPDFs() {
  const baseDir = path.join(__dirname, '../../');
  const lifeInsuranceDir = path.join(baseDir, '생명보험');
  const nonLifeInsuranceDir = path.join(baseDir, '손해보험');

  async function processDirectory(dirPath: string, type: '생명보험' | '손해보험') {
    if (!fs.existsSync(dirPath)) {
      console.log(`디렉토리가 존재하지 않습니다: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(dirPath, { encoding: 'utf-8' });
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    console.log(`${type} 폴더에서 ${pdfFiles.length}개의 PDF 파일을 찾았습니다.`);

    for (const file of pdfFiles) {
      try {
        const filePath = path.join(dirPath, file);
        console.log(`처리 중: ${file}`);

        // 파일명에서 보험사명 추출
        const companyName = extractCompanyName(file, type);

        // PDF 파싱 (다중 상품 가능)
        const parsedList = await parsePDF(filePath);
        if (!parsedList || parsedList.length === 0) {
          console.warn(`⚠️ PDF에서 상품 정보를 찾지 못했습니다: ${file}`);
          continue;
        }

        const hash = getFileHash(filePath);
        const mtime = getFileMtime(filePath);

        // 보험사 찾기 또는 생성
        const company = await InsuranceCompanyModel.findOrCreate(companyName, type);

        // 기존 상품들 제거 후 새로 생성 (해당 PDF 기준 전체 리프레시)
        await CoverageDetailModel.deleteByPdfPath(filePath);

        for (const parsedData of parsedList) {
          await CoverageDetailModel.create({
            company_id: company.id,
            title: parsedData.title,
            content: parsedData.content,
            keywords: parsedData.keywords.join(','),
            category: extractCategory(file),
            pdf_path: filePath,
            pdf_filename: file,
            pdf_hash: hash,
            pdf_mtime: mtime,
            premium_amount: parsedData.structuredData.premiumAmount,
            coverage_period: parsedData.structuredData.coveragePeriod,
            structured_data: parsedData.structuredData
          });
        }

        console.log(`✓ 완료: ${file} (상품 수: ${parsedList.length})`);
      } catch (error) {
        console.error(`✗ 오류 (${file}):`, error);
      }
    }
  }

  await processDirectory(lifeInsuranceDir, '생명보험');
  await processDirectory(nonLifeInsuranceDir, '손해보험');

  console.log('모든 PDF 파싱이 완료되었습니다.');
  database.close();
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

function extractCategory(filename: string): string | undefined {
  const categories: { [key: string]: string } = {
    '사망보험금유동화': '사망보험금유동화',
    '간병치매플랜': '간병/치매',
    '당뇨보험': '당뇨',
    '영업방향': '영업자료',
    '영업이슈': '영업자료',
    '교안': '교육자료',
    '교육자료': '교육자료',
    '상품전략': '상품전략',
    '마케팅팩': '마케팅',
    '판매포인트': '판매자료'
  };

  for (const [key, category] of Object.entries(categories)) {
    if (filename.includes(key)) {
      return category;
    }
  }

  return undefined;
}

parseAllPDFs().catch(console.error);
