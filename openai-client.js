// OpenAI API 클라이언트
const OpenAI = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30초 타임아웃
    maxRetries: 2
});

// API 호출 래퍼 함수
async function callOpenAI(messages, options = {}) {
    try {
        const defaultOptions = {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 1000,
            ...options
        };

        console.log('[OpenAI] API 호출 시작:', {
            model: defaultOptions.model,
            messagesCount: messages.length
        });

        const response = await openai.chat.completions.create({
            messages: messages,
            ...defaultOptions
        });

        console.log('[OpenAI] API 호출 완료:', {
            usage: response.usage,
            model: response.model
        });

        return {
            success: true,
            content: response.choices[0].message.content,
            usage: response.usage,
            model: response.model
        };

    } catch (error) {
        console.error('[OpenAI] API 호출 오류:', error);

        // 에러 타입별 처리
        if (error.code === 'rate_limit_exceeded') {
            throw new Error('OpenAI API rate limit exceeded');
        } else if (error.code === 'insufficient_quota') {
            throw new Error('OpenAI API quota exceeded');
        } else if (error.code === 'invalid_api_key') {
            throw new Error('Invalid OpenAI API key');
        } else if (error.code === 'model_not_found') {
            throw new Error('OpenAI model not found');
        } else {
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
}

// 고객 분석용 프롬프트 생성
function createCustomerAnalysisPrompt(customerData, surveyAnswers, serviceType) {
    const basePrompt = `당신은 한국의 금융 전문가입니다. 고객의 정보를 바탕으로 ${serviceType === 'deposit' ? '예금' : '대출'} 상품에 대한 분석을 수행해주세요.

고객 정보:
- 이름: ${customerData.customerName}
- 직업: ${customerData.occupation}
- 연소득: ${customerData.income}`;

    if (serviceType === 'loan') {
        basePrompt += `
- 희망 대출 금액: ${customerData.loanAmount}
- 대출 목적: ${customerData.loanPurpose}`;
    }

    basePrompt += `

설문 응답:`;

    Object.entries(surveyAnswers).forEach(([questionIndex, answer]) => {
        basePrompt += `
- 질문 ${parseInt(questionIndex) + 1}: ${answer.value}`;
    });

    basePrompt += `

위 정보를 바탕으로 다음 형식의 JSON으로 분석 결과를 제공해주세요:

{
  "customerType": "고객 유형 (예: 안정형, 적극형, 보수형)",
  "characteristics": ["특성1", "특성2", "특성3"],
  "recommendationReason": "추천 이유에 대한 상세한 설명",
  "riskLevel": "위험도 (low/medium/high)",
  "confidence": 0.85
}

응답은 반드시 한국어로, JSON 형식만 제공해주세요.`;

    return basePrompt;
}

// 상품 추천용 프롬프트 생성
function createProductRecommendationPrompt(customerAnalysis, customerData, availableProducts, serviceType) {
    const prompt = `당신은 한국의 ${serviceType === 'deposit' ? '예금' : '대출'} 상품 전문가입니다.

고객 분석 결과:
- 고객 유형: ${customerAnalysis.customerType}
- 특성: ${customerAnalysis.characteristics.join(', ')}
- 추천 이유: ${customerAnalysis.recommendationReason}

고객 정보:
- 직업: ${customerData.occupation}
- 연소득: ${customerData.income}`;

    if (serviceType === 'loan') {
        prompt += `
- 희망 대출 금액: ${customerData.loanAmount}
- 대출 목적: ${customerData.loanPurpose}`;
    }

    prompt += `

이용 가능한 ${serviceType === 'deposit' ? '예금' : '대출'} 상품들:
${availableProducts.map((product, index) => `
${index + 1}. ${product.name}
   - 금리: ${product.interestRate || product.rate}
   - 기간: ${product.term}
   - 특징: ${product.features.join(', ')}
   - 기본 점수: ${product.aiScore}
`).join('')}

위 정보를 바탕으로 고객에게 가장 적합한 상위 3개 상품을 추천하고, 다음 형식의 JSON으로 결과를 제공해주세요:

{
  "summary": "전체 추천 요약 (2-3문장)",
  "products": [
    {
      "product": {상품 정보},
      "score": 추천 점수 (60-100),
      "reason": "이 상품을 추천하는 구체적인 이유"
    }
  ]
}

점수는 고객의 프로필과 상품의 적합성을 고려하여 60-100점 사이로 책정해주세요.
응답은 반드시 한국어로, JSON 형식만 제공해주세요.`;

    return prompt;
}

module.exports = {
    callOpenAI,
    createCustomerAnalysisPrompt,
    createProductRecommendationPrompt
};