import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CoverageDetailModel } from '../models/CoverageDetail';
import OpenAI from 'openai';

const router = express.Router();
router.use(authMiddleware);

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 챗봇 대화
router.post('/message', async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지가 필요합니다.' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API 키가 설정되지 않았습니다.' });
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    // 보험상품 정보를 컨텍스트로 가져오기 (간결하게)
    const allProducts = await CoverageDetailModel.findAll(100); // 최대 100개 상품 정보
    const productsContext = allProducts.map(product => ({
      id: product.id,
      title: product.title,
      company: product.company_name,
      companyType: product.company_type,
      category: product.category,
      premiumAmount: product.premium_amount,
      coveragePeriod: product.coverage_period,
      keywords: product.keywords?.split(',').slice(0, 5).join(', ') || '', // 키워드 일부만
    }));

    // 시스템 프롬프트 (엄격하게 등록된 상품만 참조하도록)
    const systemPrompt = `당신은 보험상품 전문 상담사입니다. **중요: 오직 아래에 나열된 등록된 보험상품 정보만을 사용하여 답변해야 합니다.** 등록되지 않은 상품이나 일반적인 보험 지식에 대한 질문에는 "등록된 보험상품 정보를 기반으로 답변드릴 수 없습니다"라고 답변하세요.

등록된 보험상품 목록:
${productsContext.map(p => `- ID: ${p.id}, 상품명: ${p.title}, 보험사: ${p.company} (${p.companyType}), 카테고리: ${p.category || '미분류'}, 보험료: ${p.premiumAmount ? p.premiumAmount.toLocaleString() + '원' : '정보 없음'}, 보장기간: ${p.coveragePeriod || '정보 없음'}, 키워드: ${p.keywords}`).join('\n')}

**엄격한 규칙:**
1. 위 목록에 없는 상품에 대해서는 답변하지 마세요
2. 일반적인 보험 지식이나 등록되지 않은 상품에 대한 질문은 거절하세요
3. 등록된 상품의 상세 정보가 필요한 경우, 사용자에게 해당 상품의 ID나 이름을 알려주고 검색 페이지에서 확인하도록 안내하세요
4. 등록된 상품 목록에서만 비교, 추천, 정보 제공을 하세요

답변은 한국어로 작성하고, 친절하고 전문적인 톤을 유지하세요.`;

    // 대화 히스토리 구성
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // OpenAI Chat Completions API 호출
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';

    res.json({
      success: true,
      message: assistantMessage,
      conversationHistory: [
        ...conversationHistory,
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage }
      ]
    });
  } catch (error: any) {
    console.error('챗봇 오류:', error);
    res.status(500).json({ 
      error: error.message || '챗봇 응답 생성 중 오류가 발생했습니다.' 
    });
  }
});

export default router;

