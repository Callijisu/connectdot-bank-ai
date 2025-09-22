// 예금 AI 분석 전용 로직
let currentStep = 1;
let customerData = {};
let surveyAnswers = {};
let aiAnalysisResult = null;
let autoResetTimer = null;

// 예금 상품 AI 설문 질문
const depositSurveyQuestions = {
    ko: [
        {
            question: "예금의 주된 목적은 무엇인가요?",
            options: ["비상자금 마련", "단기 자금 저축", "안전한 이자 수익", "유동성 확보", "목돈 관리"],
            aiWeight: 0.3
        },
        {
            question: "예치하고 싶은 금액은 얼마 정도인가요?",
            options: ["100만원 미만", "100-500만원", "500-1,000만원", "1,000-5,000만원", "5,000만원 이상"],
            aiWeight: 0.25
        },
        {
            question: "예금 기간은 어느 정도를 원하시나요?",
            options: ["1개월 이하", "1-3개월", "3-6개월", "6개월-1년", "1년 이상"],
            aiWeight: 0.25
        },
        {
            question: "금리 변동에 대한 선호도는?",
            options: ["고정금리 선호", "변동금리 선호", "혼합형 선호", "상관없음", "잘 모르겠음"],
            aiWeight: 0.2
        }
    ],
    en: [
        {
            question: "What is the main purpose of your deposit?",
            options: ["Emergency fund", "Short-term savings", "Safe interest income", "Liquidity", "Large sum management"],
            aiWeight: 0.3
        },
        {
            question: "How much would you like to deposit?",
            options: ["Under 1M KRW", "1-5M KRW", "5-10M KRW", "10-50M KRW", "Over 50M KRW"],
            aiWeight: 0.25
        },
        {
            question: "What deposit period do you prefer?",
            options: ["Under 1 month", "1-3 months", "3-6 months", "6 months-1 year", "Over 1 year"],
            aiWeight: 0.25
        },
        {
            question: "Interest rate preference?",
            options: ["Fixed rate", "Variable rate", "Mixed type", "No preference", "Not sure"],
            aiWeight: 0.2
        }
    ]
};

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

// 시스템 초기화
function initDepositSystem() {
    updateStepDisplay();
    generateTicketNumber();
    
    // 개인정보 입력 검증 이벤트 리스너
    const formInputs = ['customerName', 'birthDate', 'accountNumber', 'occupation', 'income'];
    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', validatePersonalInfo);
            element.addEventListener('change', validatePersonalInfo);
        }
    });
    
    generateSurvey();
}

// 개인정보 검증
function validatePersonalInfo() {
    const validation = validateForm(['customerName', 'birthDate', 'accountNumber', 'occupation', 'income']);
    const nextBtn = document.getElementById('personalInfoNext');
    
    if (nextBtn) {
        nextBtn.disabled = !validation.isValid;
    }
    
    if (validation.isValid) {
        customerData = validation.data;
        // 실시간으로 간단한 분석 수행
        setTimeout(simulateAIAnalysis, 500);
    }
}

// 설문 생성
function generateSurvey() {
    const questions = depositSurveyQuestions[currentLang] || depositSurveyQuestions.ko;
    const surveyForm = document.getElementById('surveyForm');
    const texts = translations[currentLang] || translations.ko;
    
    surveyForm.innerHTML = `
        <div class="survey-header">
            <h3>🤖 ${texts.deposit_expert_ai}</h3>
            <p>${texts.realtime_analysis_desc}</p>
        </div>
        ${questions.map((q, index) => `
            <div class="question">
                <h3>${q.question}</h3>
                <div class="options">
                    ${q.options.map(option => `
                        <div class="option" onclick="selectOption(${index}, '${option}', ${q.aiWeight})" 
                             data-question="${index}" data-value="${option}">
                            ${option}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    `;
}

// 옵션 선택
function selectOption(questionIndex, value, weight) {
    // 기존 선택 제거
    document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(opt => 
        opt.classList.remove('selected'));
    
    // 새 선택 추가
    event.target.classList.add('selected');
    surveyAnswers[questionIndex] = { value: value, weight: weight };
    
    validateSurvey();
}

// 설문 검증
function validateSurvey() {
    const questions = depositSurveyQuestions[currentLang] || depositSurveyQuestions.ko;
    const answeredCount = Object.keys(surveyAnswers).length;
    const isComplete = answeredCount === questions.length;
    
    const surveyNextBtn = document.getElementById('surveyNext');
    if (surveyNextBtn) surveyNextBtn.disabled = !isComplete;
    return isComplete;
}

// 단계별 네비게이션
function startAIAnalysis() {
    currentStep = 2;
    updateStepDisplay();
}

function nextStep() {
    if (currentStep === 2) {
        generateSurvey();
        currentStep = 3;
    }
    updateStepDisplay();
}

function prevStep() {
    if (currentStep > 2) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
}

// 백업 AI 분석 (API 실패 시)
function simulateAIAnalysis() {
    const { occupation, income } = customerData;
    const texts = translations[currentLang] || translations.ko;
    const tags = [];
    
    // 직업별 분석
    if (occupation === 'retiree' || income === 'below3000') {
        tags.push(texts.stability_seeking, texts.principal_protection);
    }
    if (occupation === 'business' || income === 'above10000') {
        tags.push(texts.profit_focused, texts.active_investment);
    }
    if (occupation === 'student') {
        tags.push(texts.small_savings, texts.short_term_preference);
    }
    if (occupation === 'employee' || occupation === 'public') {
        tags.push(texts.stable_income, texts.long_term_savings);
    }
    
    // 기본 태그 추가
    if (tags.length === 0) {
        tags.push(texts.stability_seeking, texts.long_term_savings);
    }

    aiAnalysisResult = {
        customerType: "backup_analysis",
        characteristics: tags,
        recommendationReason: "고객의 기본 정보를 바탕으로 한 백업 분석 결과입니다.",
        isBackup: true
    };
    
    // 분석 결과 표시
    setTimeout(() => displayAIAnalysis(aiAnalysisResult), 1000);
}

// 실제 AI 분석 (OpenAI API 연동)
async function performRealAIAnalysis() {
    try {
        showAIStatus('OpenAI GPT-4가 고객님의 프로필을 분석하고 있습니다...');

        const analysisData = {
            customerData: customerData,
            surveyAnswers: surveyAnswers,
            serviceType: 'deposit'
        };

        const result = await callAI('analyze-deposit-customer', analysisData);
        
        aiAnalysisResult = {
            ...result.analysis,
            isBackup: false
        };

        displayAIAnalysis(aiAnalysisResult);
        await performRealAIRecommendation();

    } catch (error) {
        console.error('AI 분석 오류:', error);
        showError('실제 AI 분석 중 오류가 발생했습니다. 백업 시스템으로 전환합니다.');
        simulateAIAnalysis();
    }
}

// AI 분석 결과 표시
function displayAIAnalysis(analysis) {
    const analysisResult = document.getElementById('aiAnalysisResult');
    const containerDiv = document.getElementById('customerAnalysisResult');
    
    if (!analysisResult || !containerDiv) return;
    
    const tags = analysis.characteristics.map(characteristic => 
        `<span class="analysis-tag">${characteristic}</span>`
    ).join('');
    
    analysisResult.innerHTML = `
        ${tags}
        <div class="analysis-summary">
            <strong>${analysis.isBackup ? '백업 AI 분석 결과:' : '실제 GPT-4 분석 결과:'}</strong><br>
            ${analysis.recommendationReason}
            ${analysis.isBackup ? 
                '<br><small style="color: #666;">※ AI 서버 연결 실패로 규칙 기반 분석 결과입니다.</small>' : 
                '<br><small style="color: #059669;">✓ OpenAI GPT-4가 실시간으로 분석한 결과입니다.</small>'
            }
        </div>
    `;
    
    containerDiv.style.display = 'block';
    hideAIStatus();
}

// 실제 AI 상품 추천
async function performRealAIRecommendation() {
    try {
        showAIStatus('OpenAI GPT-4가 맞춤 상품을 추천하고 있습니다...');

        const recommendationData = {
            customerAnalysis: aiAnalysisResult,
            customerData: customerData,
            availableProducts: depositProducts
        };

        const result = await callAI('recommend-deposit-products', recommendationData);
        displayAIRecommendations(result.recommendations, result.summary, false);

    } catch (error) {
        console.error('AI 추천 오류:', error);
        showError('실제 AI 추천 중 오류가 발생했습니다. 백업 시스템으로 전환합니다.');
        generateRecommendations();
    } finally {
        hideAIStatus();
    }
}

// 백업 상품 추천
function generateRecommendations() {
    const { occupation, income } = customerData;
    let adjustedProducts = [...depositProducts];
    
    // 고객 프로필에 따른 점수 조정
    adjustedProducts = adjustedProducts.map(product => {
        let scoreAdjustment = Math.random() * 10 - 5; // -5 ~ +5 랜덤 조정
        
        // 직업별 조정
        if (occupation === 'retiree' && product.category === 'fixed') scoreAdjustment += 15;
        if (occupation === 'business' && product.category === 'flexible') scoreAdjustment += 10;
        if (occupation === 'student' && product.category === 'savings') scoreAdjustment += 12;
        
        // 소득별 조정
        if (income === 'above10000' && product.interestRate > 4.0) scoreAdjustment += 8;
        if (income === 'below3000' && product.category === 'savings') scoreAdjustment += 10;
        
        return {
            ...product,
            adjustedScore: Math.min(100, Math.max(60, product.aiScore + scoreAdjustment)),
            reason: `${occupation === 'business' ? '사업자' : occupation === 'student' ? '학생' : '일반'} 고객님의 프로필에 적합한 상품입니다.`
        };
    });
    
    // 점수순 정렬 후 상위 3개만 선택
    adjustedProducts.sort((a, b) => b.adjustedScore - a.adjustedScore);
    const topProducts = adjustedProducts.slice(0, 3);
    
    displayAIRecommendations(
        topProducts, 
        "고객님의 정보를 바탕으로 분석한 결과입니다.", 
        true
    );
}

// AI 추천 결과 표시
function displayAIRecommendations(recommendations, summary, isBackup) {
    // 요약 표시
    if (summary) {
        const summaryDiv = document.getElementById('aiSummary');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <h4>📊 ${isBackup ? '백업' : '실제 GPT-4'} AI 분석 요약</h4>
                <p>${summary}</p>
                ${isBackup ? 
                    '<small style="opacity: 0.7;">※ 백업 분석 결과</small>' : 
                    '<small style="opacity: 0.8;">✓ OpenAI GPT-4 실시간 분석</small>'
                }
            `;
            summaryDiv.style.display = 'block';
        }
    }
    
    // 추천 상품 표시
    const recommendationList = document.getElementById('aiRecommendationList');
    if (recommendationList) {
        recommendationList.innerHTML = recommendations.map((rec, index) => {
            const product = rec.product || rec; // 구조에 따라 유연하게 처리
            const score = rec.adjustedScore || rec.score || product.aiScore;
            const reason = rec.reason || `고객님께 적합한 상품으로 분석되었습니다.`;
            
            return `
                <div class="recommendation-item">
                    <div class="recommendation-score">${Math.round(score)}점</div>
                    <h4>${product.name}</h4>
                    <div class="product-details">
                        <p><strong>금리:</strong> ${product.interestRate}% (${product.term})</p>
                        <p><strong>특징:</strong> ${Array.isArray(product.features) ? product.features.join(' • ') : product.features}</p>
                    </div>
                    <div class="ai-reason">
                        <strong>${isBackup ? '백업' : 'GPT-4'} AI 추천 이유:</strong><br>
                        <span>${reason}</span>
                    </div>
                    <div class="ranking-badge">
                        ${index === 0 ? '🥇 AI 최고 추천' : 
                          index === 1 ? '🥈 AI 차선 추천' : 
                          '🥉 AI 대안 추천'}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// AI 분석 완료
function completeAIAnalysis() {
    currentStep = 4;
    updateStepDisplay();
    calculateReward();
    
    // 실제 AI 분석 시도, 실패시 백업 분석으로 전환
    performRealAIAnalysis().catch(() => {
        generateRecommendations();
    });
    
    startAutoReset();
}

// 포인트 계산
function calculateReward() {
    const baseReward = 800;
    const bonusReward = Math.floor(Math.random() * 400) + 1;
    const totalReward = baseReward + bonusReward;
    
    const rewardAmountElement = document.getElementById('rewardAmount');
    const rewardAccountElement = document.getElementById('rewardAccount');
    
    if (rewardAmountElement) {
        rewardAmountElement.textContent = `${totalReward.toLocaleString()}원`;
    }
    
    if (rewardAccountElement && customerData.accountNumber) {
        rewardAccountElement.textContent = customerData.accountNumber;
    }
}

// 자동 리셋 타이머
function startAutoReset() {
    let countdown = 10;
    const timerElement = document.getElementById('autoResetTimer');
    
    autoResetTimer = setInterval(() => {
        countdown--;
        if (timerElement) {
            const texts = translations[currentLang] || translations.ko;
            const message = currentLang === 'en' ? 
                `Returning to home screen in ${countdown} seconds` :
                `${countdown}초 후 자동으로 처음 화면으로 돌아갑니다`;
            timerElement.textContent = message;
        }
        
        if (countdown <= 0) {
            clearInterval(autoResetTimer);
            resetSystem();
        }
    }, 1000);
}

// 시스템 리셋 (오버라이드)
function resetSystem() {
    if (autoResetTimer) {
        clearInterval(autoResetTimer);
        autoResetTimer = null;
    }
    
    currentStep = 1;
    customerData = {};
    surveyAnswers = {};
    aiAnalysisResult = null;
    
    // 폼 리셋
    document.querySelectorAll('input, select').forEach(input => input.value = '');
    
    // 버튼 상태 리셋
    const personalInfoNext = document.getElementById('personalInfoNext');
    const surveyNext = document.getElementById('surveyNext');
    if (personalInfoNext) personalInfoNext.disabled = true;
    if (surveyNext) surveyNext.disabled = true;
    
    // 선택된 옵션 초기화
    document.querySelectorAll('.option.selected').forEach(opt => 
        opt.classList.remove('selected'));
    
    // 결과 화면 초기화
    const customerAnalysisResult = document.getElementById('customerAnalysisResult');
    const aiSummary = document.getElementById('aiSummary');
    const aiRecommendationList = document.getElementById('aiRecommendationList');
    
    if (customerAnalysisResult) customerAnalysisResult.style.display = 'none';
    if (aiSummary) aiSummary.style.display = 'none';
    if (aiRecommendationList) aiRecommendationList.innerHTML = '';
    
    hideAIStatus();
    generateTicketNumber();
    updateStepDisplay();
}

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (checkBrowserSupport()) {
        initDepositSystem();
    }
});