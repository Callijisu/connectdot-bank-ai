// 예금 AI 분석 모듈
const { callOpenAI, createCustomerAnalysisPrompt, createProductRecommendationPrompt } = require('./openai-client');

// 예금 상품 데이터
const depositProducts = [
    {
        id: 1,
        name: "ConnectDot 정기예금",
        interestRate: 3.5,
        term: "1년",
        features: ["고정금리", "중도해지 가능", "만기 자동연장"],
        aiScore: 92,
        category: "fixed"
    },
    {
        id: 2,
        name: "ConnectDot 자유예금",
        interestRate: 2.8,
        term: "자유",
        features: ["언제든 입출금", "수수료 면제", "실시간 이체"],
        aiScore: 85,
        category: "flexible"
    },
    {
        id: 3,
        name: "ConnectDot 외화예금",
        interestRate: 4.2,
        term: "6개월",
        features: ["달러 예금", "환율 수익", "헤지 옵션"],
        aiScore: 78,
        category: "foreign"
    },
    {
        id: 4,
        name: "ConnectDot 특판예금",
        interestRate: 4.0,
        term: "3개월",
        features: ["한정 특가", "높은 금리", "조기해지 불가"],
        aiScore: 88,
        category: "special"
    },
    {
        id: 5,
        name: "ConnectDot 적금",
        interestRate: 3.8,
        term: "12개월",
        features: ["매월 적립", "목돈 마련", "세제혜택"],
        aiScore: 90,
        category: "savings"
    }
];

/**
 * 예금 고객 분석
 * @param {Object} customerData - 고객 데이터
 * @param {Object} surveyAnswers - 설문 응답
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeDepositCustomer(customerData, surveyAnswers) {
    try {
        // OpenAI API 호출
        const prompt = createCustomerAnalysisPrompt(customerData, surveyAnswers, 'deposit');
        const messages = [
            {
                role: 'system',
                content: '당신은 한국의 금융 전문가로서 고객의 예금 성향을 분석하는 역할을 합니다.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callOpenAI(messages, {
            temperature: 0.3,
            max_tokens: 800
        });

        // JSON 파싱
        let analysisResult;
        try {
            analysisResult = JSON.parse(response.content);
        } catch (parseError) {
            console.error('[예금] JSON 파싱 오류:', parseError);
            throw new Error('AI 응답 파싱 실패');
        }

        // 결과 검증 및 보완
        if (!analysisResult.characteristics || !Array.isArray(analysisResult.characteristics)) {
            analysisResult.characteristics = ['일반 고객'];
        }

        if (!analysisResult.recommendationReason) {
            analysisResult.recommendationReason = '고객님의 프로필을 바탕으로 분석한 결과입니다.';
        }

        console.log('[예금] AI 분석 완료:', analysisResult.customerType);

        return {
            ...analysisResult,
            isBackup: false,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[예금] AI 분석 오류:', error);
        
        // OpenAI 오류시 백업 분석으로 전환
        return getBackupAnalysis(customerData, 'deposit');
    }
}

/**
 * 예금 상품 추천
 * @param {Object} customerAnalysis - 고객 분석 결과
 * @param {Object} customerData - 고객 데이터
 * @returns {Promise<Object>} 추천 결과
 */
async function recommendDepositProducts(customerAnalysis, customerData) {
    try {
        // OpenAI API 호출
        const prompt = createProductRecommendationPrompt(
            customerAnalysis, 
            customerData, 
            depositProducts, 
            'deposit'
        );
        
        const messages = [
            {
                role: 'system',
                content: '당신은 한국의 예금 상품 전문가로서 고객에게 최적의 상품을 추천하는 역할을 합니다.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        const response = await callOpenAI(messages, {
            temperature: 0.4,
            max_tokens: 1200
        });

        // JSON 파싱
        let recommendationResult;
        try {
            recommendationResult = JSON.parse(response.content);
        } catch (parseError) {
            console.error('[예금] 추천 결과 JSON 파싱 오류:', parseError);
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

        console.log('[예금] AI 추천 완료:', recommendationResult.products.length + '개 상품');

        return {
            products: recommendationResult.products,
            summary: recommendationResult.summary || '고객님께 적합한 예금 상품을 추천드립니다.',
            isBackup: false,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('[예금] AI 추천 오류:', error);
        
        // OpenAI 오류시 백업 추천으로 전환
        return getBackupRecommendations(customerData, 'deposit');
    }
}

/**
 * 백업 분석 함수 (OpenAI API 실패시 사용)
 */
function getBackupAnalysis(customerData, serviceType) {
    const { occupation, income } = customerData;
    const tags = [];
    
    console.log(`[${serviceType}] 백업 분석 시작:`, occupation, income);
    
    // 직업별 성향 분석
    switch (occupation) {
        case 'retiree':
            tags.push('안정 추구형', '원금 보장형', '장기 저축형');
            break;
        case 'business':
            tags.push('수익 중심형', '적극 투자형');
            break;
        case 'student':
            tags.push('소액 저축형', '단기 선호형');
            break;
        case 'employee':
            tags.push('안정 추구형', '정기 적립형');
            break;
        case 'housewife':
            tags.push('가계 관리형', '안전 지향형');
            break;
        case 'freelancer':
            tags.push('유동성 중시형', '변동 수익형');
            break;
        default:
            tags.push('일반 고객형');
    }
    
    // 소득별 성향 보정
    switch (income) {
        case 'above10000':
            tags.push('고액 투자형');
            break;
        case 'below3000':
            tags.push('소액 저축형');
            break;
    }
    
    // 기본 태그 추가 (빈 경우)
    if (tags.length === 0) {
        tags.push('안정 추구형', '일반 고객형');
    }
    
    return {
        customerType: `${occupation}_${income}_backup`,
        characteristics: tags,
        recommendationReason: '고객의 기본 정보를 바탕으로 한 백업 분석 결과입니다. AI 서비스 복구 후 더 정확한 분석을 받으실 수 있습니다.',
        riskLevel: income === 'above10000' ? 'medium' : 'low',
        confidence: 0.7,
        isBackup: true,
        timestamp: new Date().toISOString()
    };
}

/**
 * 백업 추천 함수 (OpenAI API 실패시 사용)
 */
function getBackupRecommendations(customerData, serviceType) {
    const { occupation, income } = customerData;
    
    console.log(`[${serviceType}] 백업 추천 시작:`, occupation, income);
    
    // 고객 프로필에 따른 상품 점수 조정
    const adjustedProducts = depositProducts.map(product => {
        let scoreAdjustment = 0;
        
        // 직업별 조정
        if (occupation === 'retiree' && product.category === 'fixed') {
            scoreAdjustment += 15;
        } else if (occupation === 'business' && product.category === 'flexible') {
            scoreAdjustment += 12;
        } else if (occupation === 'student' && product.category === 'savings') {
            scoreAdjustment += 10;
        }
        
        // 소득별 조정
        if (income === 'above10000' && product.interestRate > 4.0) {
            scoreAdjustment += 8;
        } else if (income === 'below3000' && product.category === 'savings') {
            scoreAdjustment += 10;
        }
        
        const adjustedScore = Math.min(100, Math.max(60, product.aiScore + scoreAdjustment + (Math.random() * 10 - 5)));
        
        return {
            product: product,
            score: Math.round(adjustedScore),
            reason: generateBackupReason(customerData, product)
        };
    });
    
    // 상위 3개 선택
    const topProducts = adjustedProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    
    return {
        products: topProducts,
        summary: `${occupation} 고객님의 프로필에 맞는 예금 상품을 백업 시스템으로 분석하여 추천드립니다.`,
        isBackup: true,
        timestamp: new Date().toISOString()
    };
}

/**
 * 백업 추천 이유 생성
 */
function generateBackupReason(customerData, product) {
    const { occupation, income } = customerData;
    
    const reasons = {
        occupation: {
            'retiree': '은퇴 후 안정적인 수익을 추구하는',
            'business': '사업자금 관리가 중요한',
            'student': '목돈 마련이 필요한',
            'employee': '정기적인 적립이 가능한',
            'housewife': '가계 재정 관리를 하는',
            'freelancer': '수입 변동이 있는'
        },
        product: {
            'fixed': '안정적이고 예측 가능한 수익',
            'flexible': '필요시 자유로운 입출금',
            'foreign': '환율 수익 기회',
            'special': '높은 금리 혜택',
            'savings': '체계적인 목돈 마련'
        }
    };
    
    const occupationDesc = reasons.occupation[occupation] || '고객님께서';
    const productDesc = reasons.product[product.category] || '해당 상품의 특성';
    
    return `${occupationDesc} 고객님께 ${productDesc}을 제공하여 적합합니다.`;
}

module.exports = {
    analyzeDepositCustomer,
    recommendDepositProducts
};