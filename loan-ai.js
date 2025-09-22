// 대출 AI 분석 전용 로직
let currentStep = 1;
let customerData = {};
let surveyAnswers = {};
let aiAnalysisResult = null;
let autoResetTimer = null;

// 대출 상품 AI 설문 질문
const loanSurveyQuestions = {
    ko: [
        {
            question: "기존 대출 보유 현황은 어떻게 되나요?",
            options: ["없음", "주택담보대출만 보유", "신용대출만 보유", "주택담보+신용대출", "기타 대출 보유"],
            aiWeight: 0.3
        },
        {
            question: "현재 부채 대비 소득 비율(DTI)은 대략 어느 정도인가요?",
            options: ["30% 미만", "30-40%", "40-50%", "50-60%", "60% 이상"],
            aiWeight: 0.25
        },
        {
            question: "담보로 제공할 수 있는 부동산이 있나요?",
            options: ["자가 주택 소유", "부동산 투자 보유", "가족 소유 부동산", "담보 없음", "기타"],
            aiWeight: 0.25
        },
        {
            question: "대출 상환 계획은 어떻게 되나요?",
            options: ["원리금 균등상환", "원금 균등상환", "만기일시상환", "체증식 상환", "상황에 따라"],
            aiWeight: 0.2
        }
    ],
    en: [
        {
            question: "What is your current loan status?",
            options: ["No existing loans", "Mortgage only", "Personal loan only", "Both mortgage & personal", "Other loans"],
            aiWeight: 0.3
        },
        {
            question: "What is your approximate debt-to-income ratio?",
            options: ["Under 30%", "30-40%", "40-50%", "50-60%", "Over 60%"],
            aiWeight: 0.25
        },
        {
            question: "Do you have real estate for collateral?",
            options: ["Own residence", "Investment property", "Family property", "No collateral", "Other"],
            aiWeight: 0.25
        },
        {
            question: "What is your preferred repayment plan?",
            options: ["Equal installments", "Equal principal", "Bullet payment", "Graduated payment", "Depends on situation"],
            aiWeight: 0.2
        }
    ]
};

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

// 시스템 초기화
function initLoanSystem() {
    updateStepDisplay();
    generateTicketNumber();
    
    // 개인정보 입력 검증 이벤트 리스너
    const formInputs = ['customerName', 'birthDate', 'accountNumber', 'occupation', 'income', 'loanAmount', 'loanPurpose'];
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
    const validation = validateForm(['customerName', 'birthDate', 'accountNumber', 'occupation', 'income', 'loanAmount', 'loanPurpose']);
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
    const questions = loanSurveyQuestions[currentLang] || loanSurveyQuestions.ko;
    const surveyForm = document.getElementById('surveyForm');
    const texts = translations[currentLang] || translations.ko;
    
    surveyForm.innerHTML = `
        <div class="survey-header">
            <h3>🤖 ${texts.loan_expert_ai}</h3>
            <p>${texts.realtime_financial_desc}</p>
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
    const questions = loanSurveyQuestions[currentLang] || loanSurveyQuestions.ko;
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
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    const texts = translations[currentLang] || translations.ko;
    const tags = [];
    
    // 직업별 분석
    if (occupation === 'public' || occupation === 'employee') {
        tags.push(texts.excellent_credit, texts.stable_income);
    }
    if (income === 'above10000' || income === '7000to10000') {
        tags.push(texts.high_income, texts.preferred_customer);
    }
    if (loanPurpose === 'house_purchase' || loanPurpose === 'house_lease') {
        tags.push(texts.collateral_available, texts.housing_related);
    }
    if (occupation === 'business') {
        tags.push(texts.business_owner, texts.income_volatility);
    }
    
    // 기본 태그 추가
    if (tags.length === 0) {
        tags.push(texts.general_customer, texts.basic_screening);
    }

    aiAnalysisResult = {
        customerType: "backup_analysis",
        characteristics: tags,
        recommendationReason: "고객의 신용도와 소득 수준을 종합적으로 분석한 결과입니다.",
        isBackup: true
    };
    
    // 분석 결과 표시
    setTimeout(() => displayAIAnalysis(aiAnalysisResult), 1000);
}

// 실제 AI 분석 (OpenAI API 연동)
async function performRealAIAnalysis() {
    try {
        showAIStatus('OpenAI GPT-4가 대출 적격성을 분석하고 있습니다...');

        const analysisData = {
            customerData: customerData,
            surveyAnswers: surveyAnswers,
            serviceType: 'loan'
        };

        const result = await callAI('analyze-loan-customer', analysisData);
        
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
                '<br><small style="color: #dc2626;">✓ OpenAI GPT-4가 실시간으로 분석한 결과입니다.</small>'
            }
        </div>
    `;
    
    containerDiv.style.display = 'block';
    hideAIStatus();
}

// 실제 AI 상품 추천
async function performRealAIRecommendation() {
    try {
        showAIStatus('OpenAI GPT-4가 맞춤 대출 상품을 추천하고 있습니다...');

        const recommendationData = {
            customerAnalysis: aiAnalysisResult,
            customerData: customerData,
            availableProducts: loanProducts
        };

        const result = await callAI('recommend-loan-products', recommendationData);
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
    const { occupation, income, loanAmount, loanPurpose } = customerData;
    let adjustedProducts = [...loanProducts];
    
    // 고객 프로필에 따른 점수 조정
    adjustedProducts = adjustedProducts.map(product => {
        let scoreAdjustment = Math.random() * 10 - 5; // -5 ~ +5 랜덤 조정
        
        // 대출 목적별 조정
        if (loanPurpose === 'house_purchase' && product.category === 'mortgage') scoreAdjustment += 20;
        if (loanPurpose === 'house_lease' && product.category === 'jeonse') scoreAdjustment += 18;
        if (loanPurpose === 'business' && product.category === 'business') scoreAdjustment += 15;
        if (loanPurpose === 'living' && product.category === 'credit') scoreAdjustment += 12;
        
        // 직업별 조정
        if (occupation === 'public' && (product.category === 'mortgage' || product.category === 'jeonse')) scoreAdjustment += 10;
        if (occupation === 'business' && product.category === 'business') scoreAdjustment += 15;
        if (occupation === 'employee' && product.category === 'credit') scoreAdjustment += 8;
        
        // 소득별 조정
        if (income === 'above10000' && product.aiScore > 85) scoreAdjustment += 5;
        if (income === 'below3000' && product.category === 'overdraft') scoreAdjustment += 8;
        
        return {
            ...product,
            adjustedScore: Math.min(100, Math.max(60, product.aiScore + scoreAdjustment)),
            reason: `${occupation === 'business' ? '사업자' : occupation === 'public' ? '공무원' : '일반'} 고객님께 적합한 상품으로 분석되었습니다.`
        };
    });
    
    // 점수순 정렬 후 상위 3개만 선택
    adjustedProducts.sort((a, b) => b.adjustedScore - a.adjustedScore);
    const topProducts = adjustedProducts.slice(0, 3);
    
    displayAIRecommendations(
        topProducts, 
        "고객님의 신용도와 대출 목적을 종합적으로 분석한 결과입니다.", 
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
            const reason = rec.reason || `고객님의 대출 조건에 적합한 상품으로 분석되었습니다.`;
            
            return `
                <div class="recommendation-item loan-product-card">
                    <div class="recommendation-score">${Math.round(score)}점</div>
                    <h4>${product.name}</h4>
                    <div class="product-details">
                        <p><strong>금리:</strong> <span class="loan-rate">${product.rate}</span> (${product.term})</p>
                        <p><strong>한도:</strong> <span class="loan-limit">최대 ${product.maxAmount}</span></p>
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
    const baseReward = 1500;
    const bonusReward = Math.floor(Math.random() * 700) + 1;
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
        initLoanSystem();
    }
});