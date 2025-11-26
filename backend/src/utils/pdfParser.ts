import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import OpenAI from 'openai';

export interface ParsedPDFData {
  title: string;
  /**
   * OpenAI가 추출/요약한 원문 텍스트 (최대 몇 천 자 정도로 제한)
   */
  content: string;
  /**
   * OpenAI가 직접 뽑아준 키워드 목록
   */
  keywords: string[];
  /**
   * OpenAI가 JSON 형태로 만들어 준 구조화 데이터
   */
  structuredData: StructuredData;
}

export interface StructuredData {
  premiumAmount?: number;
  coveragePeriod?: string;
  paymentPeriod?: string;
  renewalType?: string;
  mainContractType?: string;
  hasWaiver?: boolean;
  waiverDescription?: string;
  coverageAmounts: CoverageAmount[];
  specialConditions: string[];
}

export interface CoverageAmount {
  category: string;
  amount: number;
  condition?: string;
}

// OpenAI Node SDK를 사용해 "PDF 원본 + 분석까지" 전부 맡기는 함수
// - 서버에서는 PDF를 그대로 파일로 업로드만 하고
// - 나머지 텍스트 추출/요약/구조화(JSON)는 전부 OpenAI가 수행
async function extractStructuredJsonWithOpenAI(filePath: string): Promise<string> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 설정해주세요.');
  }

  // 최신 OpenAI SDK 기능(Responses 등)을 사용하기 위해 any 캐스팅
  const openai: any = new OpenAI({ apiKey: OPENAI_API_KEY });

  let fileId: string | null = null;

  try {
    console.log(`🔵 [OpenAI] Assistants PDF 분석 시작: ${path.basename(filePath)}`);
    console.log(`   PDF 파일 업로드 시작: ${path.basename(filePath)}`);

    // 1단계: PDF 파일을 OpenAI Files API에 업로드
    const upload = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'assistants'
    });

    fileId = upload.id;

    if (!fileId) {
      throw new Error('OpenAI Files API 업로드 응답에서 file id를 찾지 못했습니다.');
    }

    console.log(`   파일 업로드 완료 (file_id: ${fileId})`);

    // 2단계: Assistant 생성 (file_search 도구 사용)
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        name: '보험 PDF 분석 어시스턴트',
        instructions:
          '당신은 보험 상품 PDF 문서를 분석하는 전문가입니다. ' +
          '첨부된 PDF 파일을 기반으로, 아래 TypeScript 타입에 맞는 JSON 배열(ParsedPDFData[])만 출력하세요.\n\n' +
          'type CoverageAmount = { category: string; amount: number; condition?: string };\n' +
          'type StructuredData = {\n' +
          '  premiumAmount?: number;            // 대표 월 보험료 (원 단위)\n' +
          '  coveragePeriod?: string;          // 보장기간 (예: "평생", "100세 만기", "20년")\n' +
          '  paymentPeriod?: string;           // 납입기간 (예: "20년납", "60세납", "전기납")\n' +
          '  renewalType?: string;             // 갱신형 여부 (예: "갱신형", "비갱신형", "준갱신형")\n' +
          '  mainContractType?: string;        // 주계약/특약 구분 (예: "주계약", "특약", "주계약+특약")\n' +
          '  hasWaiver?: boolean;              // 납입면제 여부 (납입면제 관련 조항이 있으면 true)\n' +
          '  waiverDescription?: string;       // 납입면제 조건/내용 (문장)\n' +
          '  coverageAmounts: CoverageAmount[];\n' +
          '  specialConditions: string[];\n' +
          '};\n' +
          'type ParsedPDFData = {\n' +
          '  title: string;               // 보험 상품명 또는 문서 제목\n' +
          '  content: string;             // 한글 위주 핵심 내용 요약 (최대 약 5000자)\n' +
          '  keywords: string[];          // 보험 관련 핵심 키워드 목록 (예: 암, 입원, 수술, 사망, 치매 등)\n' +
          '  structuredData: StructuredData;\n' +
          '};\n\n' +
          '반환 형식은 항상 ParsedPDFData[] 타입의 JSON 배열이어야 합니다.\n' +
          '- 문서 안에 서로 다른 보험 상품이 여러 개 있으면, 각각을 ParsedPDFData 하나씩으로 만들어 배열에 담으세요.\n' +
          '- 문서 전체가 사실상 하나의 상품만 다루고 있다면, 길이가 1인 배열([ParsedPDFData])로 반환하세요.\n' +
          '- 필수 정보를 찾기 어렵거나 애매하더라도, PDF에 근거해 최대한 추론하거나 값이 없으면 null/빈 문자열로 명시하세요.\n' +
          '- 어떤 경우에도 자연어 설명, 사과문, 오류 메시지만 반환하지 말고 반드시 ParsedPDFData[] JSON 배열을 반환해야 합니다.\n\n' +
          '중요: 반드시 ParsedPDFData[] 타입에 정확히 맞는 JSON 배열만 출력하세요. ' +
          '마크다운 코드 블록(```json 또는 ```)을 사용하지 말고, 순수 JSON만 반환해야 합니다. ' +
          '자연어 설명, 주석, 마크다운 문법 등은 절대 포함하지 마세요. JSON 배열만 출력하세요.',
        tools: [{ type: 'file_search' }]
      })
    });

    if (!assistantResponse.ok) {
      const error: any = await assistantResponse.json().catch(() => ({}));
      throw new Error(`Assistant 생성 실패: ${(error as any)?.error?.message || assistantResponse.statusText}`);
    }

    const assistantData: any = await assistantResponse.json();
    const assistantId = assistantData.id;

    if (!assistantId) {
      throw new Error('Assistant 생성 응답에서 assistant id를 찾지 못했습니다.');
    }

    // 3단계: Thread 생성 + 메시지 + 파일 첨부
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content:
              '첨부된 보험 상품 PDF를 정밀하게 분석해서 ParsedPDFData[] 타입에 맞는 JSON 배열을 만들어 주세요.\n\n' +
              '【상품명(title) 추출 가이드】\n' +
              '- PDF 문서의 첫 페이지나 표지, 또는 문서 상단에 명시된 공식 상품명을 정확히 추출하세요.\n' +
              '- 상품명은 보험사가 공식적으로 사용하는 정확한 명칭이어야 합니다.\n' +
              '- 예: "동양생명 XXX보험", "삼성생명 OOO플랜" 등과 같이 보험사명과 상품명이 함께 있는 경우도 정확히 추출하세요.\n' +
              '- 문서 내에서 가장 크게 표시되거나 강조된 상품명을 우선적으로 찾으세요.\n' +
              '- 추측하거나 축약하지 말고, PDF에 명시된 그대로 정확히 추출하세요.\n\n' +
              '【내용(content) 추출 가이드】\n' +
              '- PDF의 모든 페이지를 꼼꼼히 검토하여 보험 상품의 핵심 내용을 추출하세요.\n' +
              '- 보장 내용, 보험금 지급 조건, 특약 사항, 면책 사항, 제외 사항 등 모든 중요한 정보를 포함하세요.\n' +
              '- 표나 리스트가 있는 경우, 그 내용을 텍스트로 상세히 변환하여 포함하세요.\n' +
              '- 보험료, 보장금액, 보장기간 등 구체적인 숫자와 조건을 정확히 기록하세요.\n' +
              '- 한글 위주로 최대 5000자 정도까지 상세하게 요약/발췌하되, 중요한 정보는 누락하지 마세요.\n' +
              '- 다른 상품과 비교 분석이 가능하도록 구체적이고 정확한 정보를 제공하세요.\n\n' +
              '【키워드(keywords) 추출 가이드】\n' +
              '- 암, 입원, 수술, 사망, 치매, 간병, 당뇨, 골절, 교통사고, 연금, 질병, 상해, 장애, 재해 등 핵심 보험 키워드 5~30개를 추출하세요.\n' +
              '- 해당 상품에서 실제로 보장하는 항목과 관련된 키워드를 우선적으로 포함하세요.\n\n' +
              '【구조화 데이터(structuredData) 추출 가이드】\n' +
              '- premiumAmount: 대표적인 월 보험료나 납입 보험료를 숫자만 추출 (원 단위, 예: 50000)\n' +
              '- coveragePeriod: 보장 기간을 사람이 이해하기 쉬운 표현으로 추출 (예: "평생", "80세까지", "100세 만기", "20년")\n' +
              '- paymentPeriod: 납입기간을 사람이 이해하기 쉬운 표현으로 추출 (예: "20년납", "60세납", "전기납")\n' +
              '- renewalType: 갱신형 여부를 추출 (예: "갱신형", "비갱신형", "준갱신형", "갱신/비갱신 혼합")\n' +
              '- mainContractType: 주계약/특약 구조를 요약 (예: "주계약", "특약", "주계약+특약")\n' +
              '- hasWaiver 및 waiverDescription:\n' +
              '  * 납입면제(보험료 납입 면제) 조항이 있으면 hasWaiver=true, 없으면 false 또는 undefined\n' +
              '  * 구체적인 납입면제 조건(예: 암 진단 시, 80% 이상 후유장해 시 등)을 waiverDescription에 한국어로 요약\n' +
              '- coverageAmounts: 보장 항목별 보장 금액과 조건을 상세히 추출\n' +
              '  * category: 보장 항목명 (예: "암진단금", "입원일당", "수술비", "사망보험금")\n' +
              '  * amount: 보장 금액 (숫자만, 원 단위)\n' +
              '  * condition: 지급 조건이나 특별 조건이 있으면 기록\n' +
              '- specialConditions: 특약, 면책, 제외, 지급조건 등 중요한 조건을 문장 형태로 상세히 기록\n\n' +
              '【정확도 향상을 위한 주의사항】\n' +
              '- PDF의 모든 페이지를 꼼꼼히 검토하여 정보를 누락하지 마세요.\n' +
              '- 숫자, 금액, 기간 등은 PDF에 적힌 값 그대로 정밀하게 추출하세요 (임의로 반올림/요약하지 마세요).\n' +
              '- 상품명은 PDF에 명시된 그대로 정확히 추출하세요.\n' +
              '- 필수 정보를 찾기 어려운 경우, 가능한 후보 중 가장 근거가 명확한 값을 선택하고, 구조화 데이터의 해당 필드에 null/빈 문자열을 사용하여 "값 없음"을 명시하세요.\n' +
              '- 어떤 경우에도 자연어 설명이나 오류 메시지만 반환하지 말고, 항상 ParsedPDFData[] JSON 배열을 반환해야 합니다.\n\n' +
              '중요: 마크다운 코드 블록(```json 또는 ```)을 사용하지 말고, 순수 JSON 배열만 반환하세요. ' +
              '자연어 설명, 사과문, 도움말, 주석, 마크다운 문법 등은 절대 포함하지 마세요. JSON 배열만 출력하세요.',
            attachments: [
              {
                file_id: fileId,
                tools: [{ type: 'file_search' }]
              }
            ]
          }
        ]
      })
    });

    if (!threadResponse.ok) {
      const error: any = await threadResponse.json().catch(() => ({}));
      throw new Error(`Thread 생성 실패: ${(error as any)?.error?.message || threadResponse.statusText}`);
    }

    const threadData: any = await threadResponse.json();
    const threadId = threadData.id;

    if (!threadId) {
      throw new Error('Thread 생성 응답에서 thread id를 찾지 못했습니다.');
    }

    // 4단계: Run 생성
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    if (!runResponse.ok) {
      const error: any = await runResponse.json().catch(() => ({}));
      throw new Error(`Run 생성 실패: ${(error as any)?.error?.message || runResponse.statusText}`);
    }

    const runData: any = await runResponse.json();
    const runId = runData.id;

    if (!runId) {
      throw new Error('Run 생성 응답에서 run id를 찾지 못했습니다.');
    }

    // 5단계: Run 상태 폴링
    let status = runData.status as string | undefined;
    let attempts = 0;
    const maxAttempts = 60;

    while (status && status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );

      if (!statusResponse.ok) {
        const error: any = await statusResponse.json().catch(() => ({}));
        throw new Error(`Run 상태 조회 실패: ${(error as any)?.error?.message || statusResponse.statusText}`);
      }

      const statusData: any = await statusResponse.json();
      status = statusData.status;
      attempts++;
    }

    if (status !== 'completed') {
      throw new Error(`Assistants API 실행 실패 또는 시간 초과 (status: ${status || 'unknown'})`);
    }

    // 6단계: Thread의 메시지에서 Assistant 응답 텍스트 추출
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      const error: any = await messagesResponse.json().catch(() => ({}));
      throw new Error(`메시지 조회 실패: ${(error as any)?.error?.message || messagesResponse.statusText}`);
    }

    const messagesData: any = await messagesResponse.json();
    const dataArr = messagesData.data as any[] | undefined;

    if (!dataArr || dataArr.length === 0) {
      throw new Error('Assistants API 응답 메시지를 찾지 못했습니다.');
    }

    // 가장 최근 assistant 메시지 찾기
    const assistantMessage = dataArr.find((m: any) => m.role === 'assistant') || dataArr[0];
    let extractedText = '';

    if (assistantMessage && Array.isArray(assistantMessage.content)) {
      for (const block of assistantMessage.content) {
        if (block.type === 'text' && block.text?.value) {
          extractedText += block.text.value + '\n';
        }
      }
    }

    extractedText = extractedText.trim();

    if (!extractedText || extractedText.length === 0) {
      throw new Error('OpenAI Assistants API가 JSON을 반환하지 않았습니다.');
    }

    console.log(
      `✅ [OpenAI] Assistants PDF JSON 분석 완료: ${path.basename(filePath)} (길이: ${extractedText.length}자)`
    );
    return extractedText;
  } catch (error: any) {
    console.error('OpenAI Assistants PDF 분석 오류:', error);
    throw new Error(`OpenAI Assistants PDF 분석 실패: ${error.message || '알 수 없는 오류'}`);
  } finally {
    // 업로드한 파일 정리 (가능한 경우)
    if (fileId) {
      try {
        await openai.files.del(fileId);
      } catch {
        // 정리 실패는 무시
      }
    }

    // Responses는 별도 리소스 정리가 필요 없음
  }
}

export async function parsePDF(filePath: string): Promise<ParsedPDFData[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 설정해주세요.'
    );
  }

  try {
    console.log(`🔵 OpenAI API로 PDF JSON 분석 시작: ${path.basename(filePath)}`);

    let jsonText = await extractStructuredJsonWithOpenAI(filePath);

    // 마크다운 코드 블록 마커 제거 (```json 또는 ```)
    jsonText = jsonText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    jsonText = jsonText.trim();

    let parsedRaw: any;

    try {
      parsedRaw = JSON.parse(jsonText);
    } catch (e) {
      console.error('OpenAI JSON 파싱 오류:', e);
      console.error('파싱 실패한 텍스트 (처음 500자):', jsonText.substring(0, 500));
      console.warn(
        `⚠️ JSON 형식이 아니어서 기본 상품 데이터로 대체합니다: ${path.basename(
          filePath
        )}`
      );
      // JSON이 아닐 경우, 이후 로직에서 기본 상품으로 대체할 수 있도록
      // 빈 배열을 반환하도록 설정
      parsedRaw = [];
    }

    // 배열 또는 단일 객체 모두 처리 가능하게 보정
    let parsedArray: ParsedPDFData[];

    if (Array.isArray(parsedRaw)) {
      parsedArray = parsedRaw;
    } else if (parsedRaw && typeof parsedRaw === 'object') {
      parsedArray = [parsedRaw as ParsedPDFData];
    } else {
      throw new Error('OpenAI가 올바른 ParsedPDFData[] JSON을 반환하지 않았습니다.');
    }

    // OpenAI가 빈 배열을 반환한 경우에도, 문서 전체를 하나의 상품/자료로 저장하기 위해
    // 파일명 기준 기본 ParsedPDFData를 하나 생성한다.
    if (parsedArray.length === 0) {
      console.warn(
        `⚠️ OpenAI가 비어 있는 ParsedPDFData[] 배열을 반환했습니다. 파일명을 기준으로 기본 상품 데이터를 생성합니다: ${path.basename(
          filePath
        )}`
      );
      parsedArray = [
        {
          title: path.basename(filePath, ".pdf"),
          content: "",
          keywords: [],
          structuredData: {
            premiumAmount: undefined,
            coveragePeriod: undefined,
            paymentPeriod: undefined,
            renewalType: undefined,
            mainContractType: undefined,
            hasWaiver: undefined,
            waiverDescription: undefined,
            coverageAmounts: [],
            specialConditions: [],
          },
        },
      ];
    }

    // 최소 필수 필드 보정 (각 상품별)
    const normalized = parsedArray.map((item, idx) => {
      const copy: ParsedPDFData = {
        title:
          item.title ||
          path.basename(filePath, '.pdf') +
            (parsedArray.length > 1 ? ` (#${idx + 1})` : ''),
        content: item.content || '',
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        structuredData:
          item.structuredData || {
            premiumAmount: undefined,
            coveragePeriod: undefined,
            paymentPeriod: undefined,
            renewalType: undefined,
            mainContractType: undefined,
            hasWaiver: undefined,
            waiverDescription: undefined,
            coverageAmounts: [],
            specialConditions: [],
          },
      };

      copy.structuredData.coverageAmounts =
        copy.structuredData.coverageAmounts || [];
      copy.structuredData.specialConditions =
        copy.structuredData.specialConditions || [];

      return copy;
    });

    console.log(
      `✓ OpenAI API로 PDF JSON 분석 성공: ${path.basename(
        filePath
      )} (상품 수: ${normalized.length})`
    );

    return normalized;
  } catch (error) {
    console.error('PDF 파싱 오류:', error);
    throw new Error('PDF 파싱에 실패했습니다.');
  }
}

export function getFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

export function getFileMtime(filePath: string): Date {
  const stats = fs.statSync(filePath);
  return stats.mtime;
}
