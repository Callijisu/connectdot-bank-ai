// 예금 관련 API 라우트
const express = require('express');
const router = express.Router();
const { analyzeDepositCustomer, recommendDepositProducts } = require('../ai/deposit-analyzer');

// 입력 데이터 검증 미들웨어
const validateCustomerData = (req, res, next) => {
    const { customerData } = req.body;
    
    if (!customerData) {
        return res.status(400).json({
            error: 'Customer data is required',
            details: 'Missing customerData in request body'
        });
    }
    
    const requiredFields = ['customerName', 'birthDate', 'occupation', 'income'];
    const missingFields = requiredFields.filter(field => !customerData[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Missing required customer information',
            missingFields: missingFields
        });
    }
    
    next();
};

const validateSurveyData = (req, res, next) => {
    const { surveyAnswers } = req.body;
    
    if (!surveyAnswers || typeof surveyAnswers !== 'object') {
        return res.status(400).json({
            error: 'Survey answers are required',
            details: 'Missing or invalid surveyAnswers in request body'
        });
    }
    
    next();
};

// 고객 분석 엔드포인트
router.post('/analyze-customer', validateCustomerData, validateSurveyData, async (req, res) => {
    try {
        const { customerData, surveyAnswers } = req.body;
        
        console.log(`[예금] 고객 분석 요청: ${customerData.customerName || 'Anonymous'}`);
        
        // AI 분석 실행
        const analysis = await analyzeDepositCustomer(customerData, surveyAnswers);
        
        // 분석 결과 로깅
        console.log(`[예금] 분석 완료: ${analysis.customerType || 'unknown'} 타입`);
        
        res.json({
            success: true,
            analysis: analysis,
            timestamp: new Date().toISOString(),
            isBackup: analysis.isBackup || false
        });
        
    } catch (error) {
        console.error('[예금] 분석 오류:', error);
        
        // AI 서비스 오류 시 백업 분석으로 전환
        if (error.name === 'OpenAIError' || error.code === 'ECONNREFUSED') {
            try {
                const backupAnalysis = getBackupDepositAnalysis(req.body.customerData);
                
                res.json({
                    success: true,
                    analysis: backupAnalysis,
                    timestamp: new Date().toISOString(),
                    isBackup: true,
                    fallbackReason: 'AI service unavailable'
                });
            } catch (backupError) {
                console.error('[예금] 백업 분석 오류:', backupError);
                res.status(503).json({
                    error: 'Analysis service temporarily unavailable',
                    message: 'Please try again later'
                });
            }
        } else {
            res.status(500).json({
                error: 'Internal server error during analysis',
                requestId: req.headers['x-request-id'] || 'unknown'
            });
        }
    }
});

// 상품 추천 엔드포인트
router.post('/recommend-products', async (req, res) => {
    try {
        const { customerAnalysis, customerData } = req.body;
        
        if (!customerAnalysis || !customerData) {
            return res.status(400).json({
                error: 'Customer analysis and data are required'
            });
        }
        
        console.log(`[예금] 상품 추천 요청: ${customerData.customerName || 'Anonymous'}`);
        
        // AI 상품 추천 실행
        const recommendations = await recommendDepositProducts(customerAnalysis, customerData);
        
        res.json({
            success: true,
            recommendations: recommendations.products,
            summary: recommendations.summary,
            timestamp: new Date().toISOString(),
            isBackup: recommendations.isBackup || false
        });
        
    } catch (error) {
        console.error('[예금] 추천 오류:', error);
        
        // 백업 추천 시스템으로 전환
        try {
            const backupRecommendations = getBackupDepositRecommendations(req.body.customerData);
            
            res.json({
                success: true,
                recommendations: backupRecommendations.products,
                summary: backupRecommendations.summary,
                timestamp: new Date().toISOString(),
                isBackup: true,
                fallbackReason: 'AI service unavailable'
            });
        } catch (backupError) {
            console.error('[예금] 백업 추천 오류:', backupError);
            res.status(503).json({
                error: 'Recommendation service temporarily unavailable',
                message: 'Please try again later'
            });
        }
    }
});

// 예금 상품 정보 조회
router.get('/products', (req, res) => {
    try {
        const depositProducts = [
            {
                id: 1,
                name: "ConnectDot 정기예금",
                interestRate: 3.5,
                term: "1년",
                features: ["고정금리", "중도해지 가능", "만기 자동연장"],
                minAmount: 1000000,
                maxAmount: 1000000000,
                category: "fixed"
            },
            {
                id: 2,
                name: "ConnectDot 자유예금",
                interestRate: 2.8,
                term: "자유",
                features: ["언제든 입출금", "수수료 면제", "실시간 이체"],
                minAmount: 10000,
                maxAmount: 100000000,
                category: "flexible"
            },
            {
                id: 3,
                name: "ConnectDot 외화예금",
                interestRate: 4.2,
                term: "6개월",
                features: ["달러 예금", "환율 수익", "헤지 옵션"],
                minAmount: 1000,
                maxAmount: 1000000,
                category: "foreign",
                currency: "USD"
            }
        ];
        
        res.json({
            success: true,
            products: depositProducts,
            totalCount: depositProducts.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[예금] 상품 조회 오류:', error);
        res.status(500).json({
            error: 'Failed to retrieve deposit products'
        });
    }
});

// 예금 계산기
router.post('/calculate', (req, res) => {
    try {
        const { amount, rate, term, compound } = req.body;
        
        if (!amount || !rate || !term) {
            return res.status(400).json({
                error: 'Amount, rate, and term are required for calculation'
            });
        }
        
        const principal = parseFloat(amount);
        const annualRate = parseFloat(rate) / 100;
        const years = parseFloat(term);
        const compoundFrequency = compound || 1; // 연 복리 횟수
        
        // 복리 계산
        const finalAmount = principal * Math.pow(1 + annualRate / compoundFrequency, compoundFrequency * years);
        const interestEarned = finalAmount - principal;
        
        res.json({
            success: true,
            calculation: {
                principal: principal,
                finalAmount: Math.round(finalAmount),
                interestEarned: Math.round(interestEarned),
                effectiveRate: ((finalAmount / principal - 1) / years * 100).toFixed(2),
                term: years,
                rate: rate
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[예금] 계산 오류:', error);
        res.status(500).json({
            error: 'Failed to calculate deposit returns'
        });
    }
});

// 백업 분석 함수
function getBackupDepositAnalysis(customerData) {
    const { occupation, income } = customerData;
    const tags = [];
    
    // 간단한 규칙 기반 분석
    if (occupation === 'retiree' || income === 'below3000') {
        tags.push('안정 추구형', '원금 보장형');
    }
    if (occupation === 'business' || income === 'above10000') {
        tags.push('수익 중심형', '적극 투자형');
    }
    if (occupation === 'student') {
        tags.push('소액 저축형', '단기 선호형');
    }
    
    if (tags.length === 0) {
        tags.push('안정 추구형', '장기 저축형');
    }
    
    return {
        customerType: 'backup_analysis',
        characteristics: tags,
        recommendationReason: '고객의 기본 정보를 바탕으로 한 백업 분석 결과입니다.',
        isBackup: true,
        confidence: 0.7
    };
}

// 백업 추천 함수
function getBackupDepositRecommendations(customerData) {
    const { occupation, income } = customerData;
    
    const products = [
        {
            name: "ConnectDot 정기예금",
            interestRate: 3.5,
            term: "1년",
            features: ["고정금리", "중도해지 가능"],
            score: 85,
            reason: `${occupation} 고객님께 적합한 안정적인 상품입니다.`
        },
        {
            name: "ConnectDot 자유예금",
            interestRate: 2.8,
            term: "자유",
            features: ["언제든 입출금", "수수료 면제"],
            score: 78,
            reason: "유동성이 필요한 고객님께 추천합니다."
        }
    ];
    
    return {
        products: products,
        summary: "고객님의 프로필을 바탕으로 한 백업 추천 결과입니다.",
        isBackup: true
    };
}

module.exports = router;