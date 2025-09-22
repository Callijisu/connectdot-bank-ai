// 대출 관련 API 라우트
const express = require('express');
const router = express.Router();
const { analyzeLoanCustomer, recommendLoanProducts } = require('../ai/loan-analyzer');

// 입력 데이터 검증 미들웨어
const validateLoanCustomerData = (req, res, next) => {
    const { customerData } = req.body;
    
    if (!customerData) {
        return res.status(400).json({
            error: 'Customer data is required',
            details: 'Missing customerData in request body'
        });
    }
    
    const requiredFields = ['customerName', 'birthDate', 'occupation', 'income', 'loanAmount', 'loanPurpose'];
    const missingFields = requiredFields.filter(field => !customerData[field]);
    
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: 'Missing required customer information',
            missingFields: missingFields
        });
    }
    
    // 대출 금액 유효성 검증
    const loanAmountRanges = ['below10m', '10to50m', '50to100m', '100to300m', 'above300m'];
    if (!loanAmountRanges.includes(customerData.loanAmount)) {
        return res.status(400).json({
            error: 'Invalid loan amount range',
            validRanges: loanAmountRanges
        });
    }
    
    next();
};

// 대출 고객 분석 엔드포인트
router.post('/analyze-customer', validateLoanCustomerData, async (req, res) => {
    try {
        const { customerData, surveyAnswers } = req.body;
        
        console.log(`[대출] 고객 분석 요청: ${customerData.customerName || 'Anonymous'} - 목적: ${customerData.loanPurpose}`);
        
        // 신용도 사전 체크 (간단한 규칙 기반)
        const creditCheck = performBasicCreditCheck(customerData);
        
        if (!creditCheck.eligible) {
            return res.status(200).json({
                success: true,
                analysis: {
                    customerType: 'ineligible',
                    characteristics: ['기본 요건 미충족'],
                    recommendationReason: creditCheck.reason,
                    eligible: false,
                    isBackup: false
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // AI 분석 실행
        const analysis = await analyzeLoanCustomer(customerData, surveyAnswers);
        
        console.log(`[대출] 분석 완료: ${analysis.customerType || 'unknown'} 타입`);
        
        res.json({
            success: true,
            analysis: {
                ...analysis,
                creditScore: creditCheck.estimatedScore,
                eligible: true
            },
            timestamp: new Date().toISOString(),
            isBackup: analysis.isBackup || false
        });
        
    } catch (error) {
        console.error('[대출] 분석 오류:', error);
        
        // AI 서비스 오류 시 백업 분석으로 전환
        if (error.name === 'OpenAIError' || error.code === 'ECONNREFUSED') {
            try {
                const backupAnalysis = getBackupLoanAnalysis(req.body.customerData);
                
                res.json({
                    success: true,
                    analysis: backupAnalysis,
                    timestamp: new Date().toISOString(),
                    isBackup: true,
                    fallbackReason: 'AI service unavailable'
                });
            } catch (backupError) {
                console.error('[대출] 백업 분석 오류:', backupError);
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

// 대출 상품 추천 엔드포인트
router.post('/recommend-products', async (req, res) => {
    try {
        const { customerAnalysis, customerData } = req.body;
        
        if (!customerAnalysis || !customerData) {
            return res.status(400).json({
                error: 'Customer analysis and data are required'
            });
        }
        
        // 부적격 고객 처리
        if (customerAnalysis.eligible === false) {
            return res.json({
                success: true,
                recommendations: [],
                summary: '현재 기본 대출 요건을 충족하지 않습니다. 신용도 개선 후 재신청을 권장합니다.',
                timestamp: new Date().toISOString(),
                eligible: false
            });
        }
        
        console.log(`[대출] 상품 추천 요청: ${customerData.customerName || 'Anonymous'} - ${customerData.loanAmount}`);
        
        // AI 상품 추천 실행
        const recommendations = await recommendLoanProducts(customerAnalysis, customerData);
        
        res.json({
            success: true,
            recommendations: recommendations.products,
            summary: recommendations.summary,
            timestamp: new Date().toISOString(),
            isBackup: recommendations.isBackup || false,
            eligible: true
        });
        
    } catch (error) {
        console.error('[대출] 추천 오류:', error);
        
        // 백업 추천 시스템으로 전환
        try {
            const backupRecommendations = getBackupLoanRecommendations(req.body.customerData);
            
            res.json({
                success: true,
                recommendations: backupRecommendations.products,
                summary: backupRecommendations.summary,
                timestamp: new Date().toISOString(),
                isBackup: true,
                eligible: true,
                fallbackReason: 'AI service unavailable'
            });
        } catch (backupError) {
            console.error('[대출] 백업 추천 오류:', backupError);
            res.status(503).json({
                error: 'Recommendation service temporarily unavailable',
                message: 'Please try again later'
            });
        }
    }
});

// 대출 상품 정보 조회
router.get('/products', (req, res) => {
    try {
        const loanProducts = [
            {
                id: 1,
                name: "ConnectDot 주택담보대출",
                rate: "연 3.2%",
                term: "최대 30년",
                features: ["주택 구입/전세 가능", "중도상환 수수료 면제", "LTV 최대 80%"],
                minAmount: 10000000,
                maxAmount: 1000000000,
                category: "mortgage",
                ltv: 80,
                dti: 60
            },
            {
                id: 2,
                name: "ConnectDot 신용대출",
                rate: "연 4.8%",
                term: "최대 7년",
                features: ["소득 증빙만으로 간편 대출", "한도 최대 1억원", "온라인 신청 가능"],
                minAmount: 1000000,
                maxAmount: 100000000,
                category: "credit",
                dti: 40
            },
            {
                id: 3,
                name: "ConnectDot 사업자대출",
                rate: "연 4.2%",
                term: "최대 10년",
                features: ["사업자금 전용", "우대금리 적용", "운영자금/시설자금"],
                minAmount: 5000000,
                maxAmount: 500000000,
                category: "business",
                businessYears: 2
            }
        ];
        
        res.json({
            success: true,
            products: loanProducts,
            totalCount: loanProducts.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[대출] 상품 조회 오류:', error);
        res.status(500).json({
            error: 'Failed to retrieve loan products'
        });
    }
});

// 대출 상환 시뮬레이터
router.post('/simulate-repayment', (req, res) => {
    try {
        const { amount, rate, term, type } = req.body;
        
        if (!amount || !rate || !term) {
            return res.status(400).json({
                error: 'Amount, rate, and term are required for simulation'
            });
        }
        
        const principal = parseFloat(amount);
        const monthlyRate = parseFloat(rate) / 100 / 12;
        const months = parseInt(term) * 12;
        const repaymentType = type || 'equal'; // equal, principal, interest-only
        
        let schedule = [];
        
        if (repaymentType === 'equal') {
            // 원리금 균등상환
            const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                  (Math.pow(1 + monthlyRate, months) - 1);
            
            let remainingPrincipal = principal;
            
            for (let month = 1; month <= months; month++) {
                const interestPayment = remainingPrincipal * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                remainingPrincipal -= principalPayment;
                
                if (month <= 12 || month % 12 === 0) { // 첫 1년과 매년 말 데이터만 저장
                    schedule.push({
                        month: month,
                        monthlyPayment: Math.round(monthlyPayment),
                        principalPayment: Math.round(principalPayment),
                        interestPayment: Math.round(interestPayment),
                        remainingBalance: Math.round(Math.max(0, remainingPrincipal))
                    });
                }
            }
            
            const totalPayment = monthlyPayment * months;
            const totalInterest = totalPayment - principal;
            
            res.json({
                success: true,
                simulation: {
                    loanAmount: principal,
                    interestRate: rate,
                    termYears: term,
                    repaymentType: repaymentType,
                    monthlyPayment: Math.round(monthlyPayment),
                    totalPayment: Math.round(totalPayment),
                    totalInterest: Math.round(totalInterest),
                    schedule: schedule
                },
                timestamp: new Date().toISOString()
            });
            
        } else {
            res.status(400).json({
                error: 'Only equal repayment type is currently supported'
            });
        }
        
    } catch (error) {
        console.error('[대출] 상환 시뮬레이션 오류:', error);
        res.status(500).json({
            error: 'Failed to simulate loan repayment'
        });
    }
});

// 기본 신용도 체크 함수
function performBasicCreditCheck(customerData) {
    const { occupation, income, birthDate } = customerData;
    
    // 나이 계산
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    
    // 기본 자격 요건 체크
    if (age < 20 || age > 70) {
        return {
            eligible: false,
            reason: '대출 가능 연령 범위를 벗어납니다. (만 20세-70세)',
            estimatedScore: 0
        };
    }
    
    // 소득 기반 기본 점수 계산
    let score = 600; // 기본 점수
    
    switch (income) {
        case 'below3000': score += 50; break;
        case '3000to5000': score += 100; break;
        case '5000to7000': score += 150; break;
        case '7000to10000': score += 200; break;
        case 'above10000': score += 250; break;
    }
    
    // 직업 안정성 보정
    switch (occupation) {
        case 'public': score += 100; break;
        case 'employee': score += 80; break;
        case 'professional': score += 60; break;
        case 'business': score += 40; break;
        case 'freelancer': score += 20; break;
        case 'student': score -= 50; break;
    }
    
    return {
        eligible: score >= 650,
        reason: score >= 650 ? '기본 요건을 충족합니다.' : '신용도 또는 소득 요건이 부족합니다.',
        estimatedScore: Math.min(950, Math.max(300, score))
    };
}

// 백업 분석 함수
function getBackupLoanAnalysis(customerData) {
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    const tags = [];
    
    // 직업별 분석
    if (occupation === 'public' || occupation === 'employee') {
        tags.push('신용우량고객', '안정적 소득');
    }
    if (income === 'above10000' || income === '7000to10000') {
        tags.push('고소득자', '우대 고객');
    }
    if (loanPurpose === 'house_purchase' || loanPurpose === 'house_lease') {
        tags.push('담보 가능', '주택 관련');
    }
    if (occupation === 'business') {
        tags.push('사업자', '소득 변동성');
    }
    
    if (tags.length === 0) {
        tags.push('일반 고객', '기본 심사');
    }
    
    return {
        customerType: 'backup_analysis',
        characteristics: tags,
        recommendationReason: '고객의 신용도와 소득 수준을 종합적으로 분석한 결과입니다.',
        isBackup: true,
        confidence: 0.7,
        eligible: true
    };
}

// 백업 추천 함수
function getBackupLoanRecommendations(customerData) {
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    
    const products = [
        {
            name: "ConnectDot 주택담보대출",
            rate: "연 3.2%",
            term: "최대 30년",
            features: ["주택 구입/전세 가능", "중도상환 수수료 면제"],
            score: 90,
            reason: `주택 관련 대출로 ${occupation} 고객님께 적합합니다.`,
            maxAmount: "10억원"
        },
        {
            name: "ConnectDot 신용대출",
            rate: "연 4.8%",
            term: "최대 7년",
            features: ["소득 증빙만으로 간편 대출", "온라인 신청 가능"],
            score: 82,
            reason: "안정적인 소득을 바탕으로 한 신용대출입니다.",
            maxAmount: "1억원"
        },
        {
            name: "ConnectDot 사업자대출",
            rate: "연 4.2%",
            term: "최대 10년",
            features: ["사업자금 전용", "우대금리 적용"],
            score: 75,
            reason: "사업 운영에 필요한 자금을 지원합니다.",
            maxAmount: "5억원"
        }
    ];
    
    // 대출 목적에 따른 점수 조정
    const adjustedProducts = products.map(product => {
        let scoreBonus = 0;
        if (loanPurpose === 'house_purchase' && product.name.includes('주택담보')) {
            scoreBonus = 15;
        } else if (loanPurpose === 'business' && product.name.includes('사업자')) {
            scoreBonus = 12;
        } else if (loanPurpose === 'living' && product.name.includes('신용')) {
            scoreBonus = 10;
        }
        
        return {
            ...product,
            score: product.score + scoreBonus
        };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    
    return {
        products: adjustedProducts,
        summary: `${occupation} 고객님의 ${loanPurpose} 목적에 적합한 대출 상품을 추천드립니다.`,
        isBackup: true
    };
}

module.exports = router;