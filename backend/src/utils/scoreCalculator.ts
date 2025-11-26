import { CoverageDetailModel } from '../models/CoverageDetail';
import { database } from '../database/db';

const db = database.getDb();

export interface ProductScore {
  coverageScore: number;
  premiumScore: number;
  specialConditionScore: number;
  totalScore: number;
}

export async function calculateProductScore(coverageId: number): Promise<ProductScore> {
  const product = await CoverageDetailModel.findById(coverageId);
  if (!product) {
    throw new Error('상품을 찾을 수 없습니다.');
  }

  const amounts = await CoverageDetailModel.getCoverageAmounts(coverageId);
  const conditions = await CoverageDetailModel.getSpecialConditions(coverageId);
  const structuredData = product.structured_data 
    ? JSON.parse(product.structured_data) 
    : null;

  // 1. 보장범위 점수 (0-40점)
  const coverageScore = calculateCoverageScore(amounts, structuredData);

  // 2. 보험료 대비 보장금액 점수 (0-40점)
  const premiumScore = calculatePremiumScore(
    product.premium_amount,
    amounts,
    structuredData
  );

  // 3. 특약사항 점수 (0-20점)
  const specialConditionScore = calculateSpecialConditionScore(conditions, structuredData);

  const totalScore = coverageScore + premiumScore + specialConditionScore;

  // 점수 저장
  await saveScore(coverageId, {
    coverageScore,
    premiumScore,
    specialConditionScore,
    totalScore
  });

  return {
    coverageScore,
    premiumScore,
    specialConditionScore,
    totalScore
  };
}

function calculateCoverageScore(
  amounts: any[],
  structuredData: any
): number {
  let score = 0;

  // 카테고리별 가중치 정의 (중요도에 따라 차등)
  const categoryWeights: { [key: string]: number } = {
    '암': 5,           // 최고 중요
    '사망': 5,         // 최고 중요
    '장애': 4,         // 높은 중요도
    '뇌혈관': 4,       // 높은 중요도
    '심장': 4,         // 높은 중요도
    '입원': 3,         // 중간 중요도
    '수술': 3,         // 중간 중요도
    '상해': 2,         // 일반 중요도
    '질병': 2,         // 일반 중요도
    '간병': 3,         // 중간 중요도
    '치매': 4,         // 높은 중요도
    '당뇨': 2,         // 일반 중요도
    '골절': 2,         // 일반 중요도
    '교통사고': 2,     // 일반 중요도
    '연금': 1,         // 낮은 중요도
    '재가급여': 2,     // 일반 중요도
    '방문요양': 2      // 일반 중요도
  };

  // 카테고리별 보장 점수 계산 (최대 25점, 더 세분화)
  let categoryScore = 0;
  const coveredCategories = new Set<string>();
  const categoryAmounts: { [key: string]: number } = {};
  
  amounts.forEach(a => {
    const category = a.category || '';
    const amount = a.amount || 0;
    const weight = categoryWeights[category] || 1;
    
    if (amount > 0) {
      coveredCategories.add(category);
      if (!categoryAmounts[category]) {
        categoryAmounts[category] = 0;
      }
      categoryAmounts[category] += amount;
    }
  });

  // 각 카테고리별로 보장금액에 따른 점수 계산 (더 세분화)
  Object.keys(categoryAmounts).forEach(category => {
    const amount = categoryAmounts[category];
    const weight = categoryWeights[category] || 1;
    
    // 보장금액 구간별 점수 (카테고리별 가중치 적용)
    let amountScore = 0;
    if (amount >= 200000000) {        // 2억원 이상
      amountScore = 3.0 * weight;
    } else if (amount >= 100000000) { // 1억원 이상
      amountScore = 2.5 * weight;
    } else if (amount >= 50000000) {  // 5천만원 이상
      amountScore = 2.0 * weight;
    } else if (amount >= 30000000) {  // 3천만원 이상
      amountScore = 1.5 * weight;
    } else if (amount >= 10000000) {  // 1천만원 이상
      amountScore = 1.0 * weight;
    } else if (amount >= 5000000) {  // 5백만원 이상
      amountScore = 0.7 * weight;
    } else if (amount >= 1000000) {  // 1백만원 이상
      amountScore = 0.4 * weight;
    } else {
      amountScore = 0.2 * weight;
    }
    
    categoryScore += Math.min(amountScore, 5); // 카테고리당 최대 5점
  });

  // 카테고리 다양성 보너스 (더 세분화)
  const uniqueCategories = coveredCategories.size;
  let diversityBonus = 0;
  if (uniqueCategories >= 10) {
    diversityBonus = 5;
  } else if (uniqueCategories >= 8) {
    diversityBonus = 4;
  } else if (uniqueCategories >= 6) {
    diversityBonus = 3;
  } else if (uniqueCategories >= 4) {
    diversityBonus = 2;
  } else if (uniqueCategories >= 2) {
    diversityBonus = 1;
  }
  categoryScore += diversityBonus;

  score += Math.min(categoryScore, 25);

  // 보장금액 총합 점수 (최대 15점, 더 세분화)
  const totalAmount = amounts.reduce((sum, a) => sum + (a.amount || 0), 0);
  if (totalAmount > 0) {
    if (totalAmount >= 1000000000) {       // 10억원 이상
      score += 15;
    } else if (totalAmount >= 700000000) { // 7억원 이상
      score += 14;
    } else if (totalAmount >= 500000000) {  // 5억원 이상
      score += 13;
    } else if (totalAmount >= 400000000) { // 4억원 이상
      score += 12;
    } else if (totalAmount >= 300000000) { // 3억원 이상
      score += 11;
    } else if (totalAmount >= 250000000) { // 2.5억원 이상
      score += 10;
    } else if (totalAmount >= 200000000) { // 2억원 이상
      score += 9;
    } else if (totalAmount >= 150000000) { // 1.5억원 이상
      score += 8;
    } else if (totalAmount >= 100000000) { // 1억원 이상
      score += 7;
    } else if (totalAmount >= 80000000) {  // 8천만원 이상
      score += 6;
    } else if (totalAmount >= 50000000) {  // 5천만원 이상
      score += 5;
    } else if (totalAmount >= 30000000) { // 3천만원 이상
      score += 4;
    } else if (totalAmount >= 20000000) { // 2천만원 이상
      score += 3;
    } else if (totalAmount >= 10000000) { // 1천만원 이상
      score += 2;
    } else if (totalAmount >= 5000000) {  // 5백만원 이상
      score += 1.5;
    } else {
      score += 0.5;
    }
  }

  return Math.min(score, 40);
}

function calculatePremiumScore(
  premiumAmount: number | null,
  amounts: any[],
  structuredData: any
): number {
  if (!premiumAmount || premiumAmount <= 0) {
    return 20; // 보험료 정보가 없으면 중간 점수
  }

  const totalAmount = amounts.reduce((sum, a) => sum + (a.amount || 0), 0);
  if (totalAmount <= 0) {
    return 20;
  }

  // 보험료 대비 보장금액 비율 계산
  const ratio = totalAmount / premiumAmount;

  // 비율 점수 (최대 25점, 더 세분화)
  let ratioScore = 0;
  if (ratio >= 3000) {
    ratioScore = 25;
  } else if (ratio >= 2500) {
    ratioScore = 24;
  } else if (ratio >= 2000) {
    ratioScore = 23;
  } else if (ratio >= 1800) {
    ratioScore = 22;
  } else if (ratio >= 1500) {
    ratioScore = 21;
  } else if (ratio >= 1200) {
    ratioScore = 20;
  } else if (ratio >= 1000) {
    ratioScore = 19;
  } else if (ratio >= 900) {
    ratioScore = 18;
  } else if (ratio >= 800) {
    ratioScore = 17;
  } else if (ratio >= 700) {
    ratioScore = 16;
  } else if (ratio >= 600) {
    ratioScore = 15;
  } else if (ratio >= 500) {
    ratioScore = 14;
  } else if (ratio >= 450) {
    ratioScore = 13;
  } else if (ratio >= 400) {
    ratioScore = 12;
  } else if (ratio >= 350) {
    ratioScore = 11;
  } else if (ratio >= 300) {
    ratioScore = 10;
  } else if (ratio >= 250) {
    ratioScore = 9;
  } else if (ratio >= 200) {
    ratioScore = 8;
  } else if (ratio >= 180) {
    ratioScore = 7;
  } else if (ratio >= 150) {
    ratioScore = 6;
  } else if (ratio >= 120) {
    ratioScore = 5;
  } else if (ratio >= 100) {
    ratioScore = 4;
  } else if (ratio >= 80) {
    ratioScore = 3;
  } else if (ratio >= 50) {
    ratioScore = 2;
  } else if (ratio >= 30) {
    ratioScore = 1;
  } else {
    ratioScore = 0.5;
  }

  // 보험료 적정성 점수 (최대 10점, 더 세분화)
  // 월 보험료가 적정 범위에 있는지 평가
  let premiumAppropriateness = 0;
  const monthlyPremium = premiumAmount; // 이미 월 단위로 가정
  
  if (monthlyPremium <= 30000) {        // 3만원 이하: 매우 합리적
    premiumAppropriateness = 10;
  } else if (monthlyPremium <= 50000) { // 5만원 이하: 매우 합리적
    premiumAppropriateness = 9.5;
  } else if (monthlyPremium <= 70000) { // 7만원 이하: 합리적
    premiumAppropriateness = 9;
  } else if (monthlyPremium <= 100000) { // 10만원 이하: 합리적
    premiumAppropriateness = 8;
  } else if (monthlyPremium <= 120000) { // 12만원 이하: 보통
    premiumAppropriateness = 7;
  } else if (monthlyPremium <= 150000) { // 15만원 이하: 보통
    premiumAppropriateness = 6;
  } else if (monthlyPremium <= 180000) { // 18만원 이하: 다소 높음
    premiumAppropriateness = 5;
  } else if (monthlyPremium <= 200000) { // 20만원 이하: 다소 높음
    premiumAppropriateness = 4;
  } else if (monthlyPremium <= 250000) { // 25만원 이하: 높음
    premiumAppropriateness = 3;
  } else if (monthlyPremium <= 300000) { // 30만원 이하: 높음
    premiumAppropriateness = 2;
  } else if (monthlyPremium <= 400000) { // 40만원 이하: 매우 높음
    premiumAppropriateness = 1;
  } else {                                // 40만원 초과: 매우 높음
    premiumAppropriateness = 0.5;
  }

  // 보장기간 고려 (최대 5점, 더 세분화)
  let periodScore = 0;
  if (structuredData?.coveragePeriod) {
    const period = structuredData.coveragePeriod.toString().toLowerCase();
    if (period.includes('평생') || period.includes('종신') || period.includes('100세') || period.includes('무기한')) {
      periodScore = 5;
    } else if (period.includes('95세') || period.includes('90세')) {
      periodScore = 4.5;
    } else if (period.includes('85세') || period.includes('88세')) {
      periodScore = 4;
    } else if (period.includes('80세') || period.includes('82세')) {
      periodScore = 3.5;
    } else if (period.includes('75세') || period.includes('77세')) {
      periodScore = 3;
    } else if (period.includes('70세') || period.includes('72세')) {
      periodScore = 2.5;
    } else if (period.includes('65세') || period.includes('67세')) {
      periodScore = 2;
    } else if (period.includes('60세') || period.includes('62세')) {
      periodScore = 1.5;
    } else if (/\d+년/.test(period)) {
      const years = parseInt(period.match(/(\d+)년/)?.[1] || '0');
      if (years >= 40) {
        periodScore = 4;
      } else if (years >= 30) {
        periodScore = 3.5;
      } else if (years >= 25) {
        periodScore = 3;
      } else if (years >= 20) {
        periodScore = 2.5;
      } else if (years >= 15) {
        periodScore = 2;
      } else if (years >= 10) {
        periodScore = 1.5;
      } else if (years >= 5) {
        periodScore = 1;
      } else {
        periodScore = 0.5;
      }
    }
  }

  return Math.min(ratioScore + premiumAppropriateness + periodScore, 40);
}

function calculateSpecialConditionScore(
  conditions: any[],
  structuredData: any
): number {
  let score = 0;

  if (conditions.length === 0) {
    return 0;
  }

  // 특약사항 개수 점수 (최대 8점, 더 세분화)
  const conditionCount = conditions.length;
  if (conditionCount >= 10) {
    score += 8;
  } else if (conditionCount >= 8) {
    score += 7;
  } else if (conditionCount >= 6) {
    score += 6;
  } else if (conditionCount >= 4) {
    score += 5;
  } else if (conditionCount >= 3) {
    score += 4;
  } else if (conditionCount >= 2) {
    score += 3;
  } else {
    score += 2;
  }

  // 특약사항 품질 평가 (키워드별 가중치 적용, 최대 12점)
  const qualityKeywords: { [key: string]: number } = {
    // 고가치 특약 (높은 가중치)
    '면제': 3,              // 보험료 납입 면제
    '무해지': 3,            // 해지 시 환급
    '자동갱신': 2,          // 자동 갱신
    '환급': 2,              // 환급금
    '적립': 2,              // 적립금
    
    // 추가 보장 특약 (중간 가중치)
    '추가보장': 2,          // 추가 보장
    '특약': 1.5,            // 특약 가입
    '확대보장': 1.5,        // 보장 확대
    '보장확대': 1.5,        // 보장 확대
    
    // 편의성 특약 (중간 가중치)
    '간병': 1.5,            // 간병 보장
    '치매': 1.5,            // 치매 보장
    '재활': 1,              // 재활 치료
    '통원': 1,              // 통원 치료
    '내원': 1,              // 내원 치료
    
    // 혜택 특약 (낮은 가중치)
    '할인': 0.5,            // 할인
    '보너스': 0.5,          // 보너스
    '프리미엄': 0.5,        // 프리미엄
    '리워드': 0.5           // 리워드
  };

  let qualityScore = 0;
  const foundKeywords = new Set<string>();

  conditions.forEach(condition => {
    const name = (condition.condition_name || '').toLowerCase();
    const detail = (condition.condition_detail || '').toLowerCase();
    const text = name + ' ' + detail;

    Object.keys(qualityKeywords).forEach(keyword => {
      if (text.includes(keyword.toLowerCase()) && !foundKeywords.has(keyword)) {
        foundKeywords.add(keyword);
        qualityScore += qualityKeywords[keyword];
      }
    });
  });

  score += Math.min(qualityScore, 12);

  return Math.min(score, 20);
}

async function saveScore(
  coverageId: number,
  score: ProductScore
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO product_scores 
       (coverage_id, coverage_score, premium_score, special_condition_score, total_score, calculated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        coverageId,
        score.coverageScore,
        score.premiumScore,
        score.specialConditionScore,
        score.totalScore
      ],
      (err) => {
        if (err) {
          console.error(`점수 저장 오류 (상품 ${coverageId}):`, err);
          reject(err);
        } else {
          console.log(`✓ 상품 ${coverageId} 점수 저장 완료: 총점 ${score.totalScore.toFixed(1)}점`);
          resolve();
        }
      }
    );
  });
}

export async function getProductScore(coverageId: number): Promise<ProductScore | null> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM product_scores WHERE coverage_id = ? ORDER BY calculated_at DESC LIMIT 1`,
      [coverageId],
      (err, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            coverageScore: row.coverage_score,
            premiumScore: row.premium_score,
            specialConditionScore: row.special_condition_score,
            totalScore: row.total_score
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

