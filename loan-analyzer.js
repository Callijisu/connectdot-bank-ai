// 대출 AI 분석 모듈
const { callOpenAI, createCustomerAnalysisPrompt, createProductRecommendationPrompt } = require('./openai-client');

// 대출 상품 데이터
const loanProducts = [
    {
        id: 1,
        name: "ConnectDot 주택담보대출",
        rate: "연 3.2%",
        term: "최대 30년",
        features: ["주택 구입/전세 가능", "중도상환 수수료 면제", "LTV 최대 80%"],
        aiScore: 95,
        category: "mortgage",
        maxAmount: "10억원"
    },
    {
        id: 2,
        name: "ConnectDot 신용대출",
        rate: "연 4.8%",
        term: "최대 7년",
        features: ["소득 증빙만으로 간편 대출", "한도 최대 1억원", "온라인 신청 가능"],
        aiScore: 82,
        category: "credit",
        maxAmount: "1억원"
    },
    {
        id: 3,
        name: "ConnectDot 사업자대출",
        rate: "연 4.2%",
        term: "최대 10년",
        features: ["사업자금 전용", "우대금리 적용", "운영자금/시설자금"],
        aiScore: 88,
        category: "business",
        maxAmount: "5억원"
    },
    {
        id: 4,
        name: "ConnectDot 전세자금대출",
        rate: "연 2.9%",
        term: "최대 10년",
        features: ["전세보증금 지원", "정부 지원 상품", "LTV 최대 80%"],
        aiScore: 90,
        category: "jeonse",
        maxAmount: "5억원"
    },
    {
        id: 5,
        name: "ConnectDot 마이너스통장",
        rate: "연 5.2%",
        term: "1년 (자동갱신)",
        features: ["필요할 때만 이자", "한도 내 자유 사용", "급여이체 시 우대"],
        aiScore: 75,
        category: "overdraft",
        maxAmount: "5000만원"
    }
];

/**
 * 대출 고객 분석
 * @param {Object} customerData - 고객 데이터
 * @param {Object} surveyAnswers - 설문 응답
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeLoanCustomer(customerData, surveyAnswers) {
    try {
        // OpenAI API 호출
        const prompt = createLoanAnalysisPrompt(customerData, surveyAnswers);
        const messages = [
            {
                role: 'system',
                content: '당신은 한국의 대출 심사 전문가로서 고객의 대출 적격성과 위험도를 분석하는 역할을 합니다. 신중하고 보수적인 관점에서 분석해주세요.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callOpenAI(messages, {
            temperature: 0.2, // 대출 분석은 더 보수적으로
            max_tokens: 900
        });

        // JSON 파싱
        let analysisResult;
        try {
            analysisResult = JSON.parse(response.content);
        } catch (parseError) {
            console.error('[대출] JSON 파싱 오류:', parseError);
            throw new Error('AI 응답 파싱 실패');
        }

        // 결과 검증 및 보완
        if (!analysisResult.characteristics || !Array.isArray(analysisResult.characteristics)) {
            analysisResult.characteristics = ['일반 고객'];
        }

        if (!analysisResult.recommendationReason) {
            analysisResult.recommendationReason = '고객님의 신용도와 소득을 바탕으로 분석한 결과입니다.';
        }

        // 위험도 기본값 설정
        if (!analysisResult.riskLevel) {
            analysisResult.riskLevel = 'medium';
        }

        console.log('[대출] AI 분석 완료:', analysisResult.customerType);

        return {
            ...analysisResult,
            isBackup: false,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[대출] AI 분석 오류:', error);
        
        // OpenAI 오류시 백업 분석으로 전환
        return getBackupLoanAnalysis(customerData);
    }
}

/**
 * 대출 상품 추천
 * @param {Object} customerAnalysis - 고객 분석 결과
 * @param {Object} customerData - 고객 데이터
 * @returns {Promise<Object>} 추천 결과
 */
async function recommendLoanProducts(customerAnalysis, customerData) {
    try {
        // OpenAI API 호출
        const prompt = createProductRecommendationPrompt(
            customerAnalysis, 
            customerData, 
            loanProducts, 
            'loan'
        );
        
        const messages = [
            {
                role: 'system',
                content: '당신은 한국의 대출 상품 전문가로서 고객에게 최적의 상품을 추천하는 역할을 합니다. 대출의 위험성을 고려하여 신중하게 추천해주세요.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callOpenAI(messages, {
            temperature: 0.3,
            max_tokens: 1200
        });

        // JSON 파싱
        let recommendationResult;
        try {
            recommendationResult = JSON.parse(response.content);
        } catch (parseError) {
            console.error('[대출] 추천 결과 JSON 파싱 오류:', parseError);
            throw new Error('AI 추천 응답 파싱 실패');
        }

        // 추천 결과 검증
        if (!recommendationResult.products || !Array.isArray(recommendationResult.products)) {
            throw new Error('유효하지 않은 추천 결과');
        }

        // 점수 범위 검증 및 조정
        recommendationResult.products = recommendationResult.products.map(item => ({
            ...item,
            score: Math.min(100, Math.max(60, item.score || 75))
        }));

        console.log('[대출] AI 추천 완료:', recommendationResult.products.length + '개 상품');

        return {
            products: recommendationResult.products,
            summary: recommendationResult.summary || '고객님께 적합한 대출 상품을 추천드립니다.',
            isBackup: false,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[대출] AI 추천 오류:', error);
        
        // OpenAI 오류시 백업 추천으로 전환
        return getBackupLoanRecommendations(customerData);
    }
}

/**
 * 대출 분석용 프롬프트 생성 (대출 특화)
 */
function createLoanAnalysisPrompt(customerData, surveyAnswers) {
    const prompt = `당신은 한국의 대출 심사 전문가입니다. 고객의 정보를 바탕으로 대출 적격성을 분석해주세요.

고객 정보:
- 이름: ${customerData.customerName}
- 직업: ${customerData.occupation}
- 연소득: ${customerData.income}
- 희망 대출 금액: ${customerData.loanAmount}
- 대출 목적: ${customerData.loanPurpose}

설문 응답:`;

    Object.entries(surveyAnswers).forEach(([questionIndex, answer]) => {
        prompt += `
- 질문 ${parseInt(questionIndex) + 1}: ${answer.value}`;
    });

    prompt += `

위 정보를 바탕으로 다음 형식의 JSON으로 분석 결과를 제공해주세요:

{
  "customerType": "고객 유형 (예: 우량고객, 일반고객, 주의고객)",
  "characteristics": ["특성1", "특성2", "특성3"],
  "recommendationReason": "대출 적격성에 대한 상세한 분석",
  "riskLevel": "위험도 (low/medium/high)",
  "creditAssessment": "신용도 평가 (excellent/good/fair/poor)",
  "confidence": 0.85
}

대출의 특성상 보수적이고 신중하게 분석해주세요. 응답은 반드시 한국어로, JSON 형식만 제공해주세요.`;

    return prompt;
}

/**
 * 백업 분석 함수 (OpenAI API 실패시 사용)
 */
function getBackupLoanAnalysis(customerData) {
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    const tags = [];
    let riskLevel = 'medium';
    let creditAssessment = 'fair';
    
    console.log('[대출] 백업 분석 시작:', occupation, income);
    
    // 직업별 신용도 평가
    switch (occupation) {
        case 'public':
            tags.push('신용우량고객', '안정적 소득', '공무원 우대');
            riskLevel = 'low';
            creditAssessment = 'excellent';
            break;
        case 'employee':
            tags.push('신용우량고객', '안정적 소득');
            riskLevel = 'low';
            creditAssessment = 'good';
            break;
        case 'professional':
            tags.push('전문직 고객', '고소득 예상');
            riskLevel = 'low';
            creditAssessment = 'good';
            break;
        case 'business':
            tags.push('사업자', '소득 변동성', '담보 필요');
            riskLevel = 'medium';
            creditAssessment = 'fair';
            break;
        case 'freelancer':
            tags.push('프리랜서', '소득 불안정');
            riskLevel = 'high';
            creditAssessment = 'fair';
            break;
        case 'student':
            tags.push('학생', '소득 제한적');
            riskLevel = 'high';
            creditAssessment = 'poor';
            break;
        default:
            tags.push('일반 고객', '기본 심사');
    }
    
    // 소득별 조정
    switch (income) {
        case 'above10000':
            tags.push('고소득자', '우대 고객');
            if (riskLevel === 'medium') riskLevel = 'low';
            break;
        case 'below3000':
            tags.push('저소득층', '신중 심사');
            if (riskLevel === 'low') riskLevel = 'medium';
            if (riskLevel === 'medium') riskLevel = 'high';
            break;
    }
    
    // 대출 목적별 조정
    if (loanPurpose === 'house_purchase' || loanPurpose === 'house_lease') {
        tags.push('주택 관련', '담보 가능');
    } else if (loanPurpose === 'business') {
        tags.push('사업 목적', '수익성 검토');
    }
    
    return {
        customerType: `${occupation}_${riskLevel}_backup`,
        characteristics: tags,
        recommendationReason: '고객의 직업과 소득 수준을 바탕으로 한 백업 분석 결과입니다. 실제 대출 승인은 별도 심사를 거쳐야 합니다.',
        riskLevel: riskLevel,
        creditAssessment: creditAssessment,
        confidence: 0.6,
        isBackup: true,
        timestamp: new Date().toISOString()
    };
}

/**
 * 백업 추천 함수 (OpenAI API 실패시 사용)
 */
function getBackupLoanRecommendations(customerData) {
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    
    console.log('[대출] 백업 추천 시작:', occupation, income, loanPurpose);
    
    // 고객 프로필에 따른 상품 점수 조정
    const adjustedProducts = loanProducts.map(product => {
        let scoreAdjustment = 0;
        
        // 대출 목적별 조정
        if (loanPurpose === 'house_purchase' && product.category === 'mortgage') {
            scoreAdjustment += 20;
        } else if (loanPurpose === 'house_lease' && product.category === 'jeonse') {
            scoreAdjustment += 18;
        } else if (loanPurpose === 'business' && product.category === 'business') {
            scoreAdjustment += 15;
        } else if (loanPurpose === 'living' && product.category === 'credit') {
            scoreAdjustment += 12;
        }
        
        // 직업별 조정
        if (occupation === 'public' && (product.category === 'mortgage' || product.category === 'jeonse')) {
            scoreAdjustment += 12;
        } else if (occupation === 'business' && product.category === 'business') {
            scoreAdjustment += 15;
        } else if (occupation === 'employee' && product.category === 'credit') {
            scoreAdjustment += 8;
        }
        
        // 소득별 조정
        if (income === 'above10000' && product.aiScore > 85) {
            scoreAdjustment += 8;
        } else if (income === 'below3000') {
            scoreAdjustment -= 10; // 저소득자는 점수 하향 조정
        }
        
        const adjustedScore = Math.min(100, Math.max(60, product.aiScore + scoreAdjustment + (Math.random() * 8 - 4)));
        
        return {
            product: product,
            score: Math.round(adjustedScore),
            reason: generateBackupLoanReason(customerData, product)
        };
    });
    
    // 상위 3개 선택
    const topProducts = adjustedProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    
    return {
        products: topProducts,
        summary: `${occupation} 고객님의 ${loanPurpose} 목적에 적합한 대출 상품을 백업 시스템으로 분석하여 추천드립니다.`,
        isBackup: true,
        timestamp: new Date().toISOString()
    };
}

/**
 * 백업 추천 이유 생성
 */
function generateBackupLoanReason(customerData, product) {
    const { occupation, income, loanPurpose } = customerData;
    
    const reasons = {
        occupation: {
            'public': '공무원으로서 안정적인 소득이 있는',
            'employee': '직장인으로서 정기적인 소득이 있는',
            'business': '사업자로서 사업 운영 경험이 있는',
            'professional': '전문직으로서 전문성을 인정받는',
            'freelancer': '프리랜서로서 다양한 경험이 있는',
            'student': '학생으로서 미래 가능성이 있는'
        },
        purpose: {
            'house_purchase': '주택 구입 목적의',
            'house_lease': '전세 자금 목적의',
            'business': '사업 자금 목적의',
            'living': '생활 자금 목적의',
            'investment': '투자 목적의'
        },
        product: {
            'mortgage': '주택을 담보로 하는 안정적인 대출',
            'credit': '신용도 기반의 무담보 대출',
            'business': '사업 운영에 특화된 대출',
            'jeonse': '전세 보증금 지원을 위한 대출',
            'overdraft': '필요시 사용할 수 있는 한도 대출'
        }
    };
    
    const occupationDesc = reasons.occupation[occupation] || '고객님께서';
    const purposeDesc = reasons.purpose[loanPurpose] || '대출';
    const productDesc = reasons.product[product.category] || '해당 상품';
    
    return `${occupationDesc} 고객님의 ${purposeDesc} 요구에 ${productDesc}이 적합하다고 판단됩니다.`;
}

module.exports = {
    analyzeLoanCustomer,
    recommendLoanProducts
};