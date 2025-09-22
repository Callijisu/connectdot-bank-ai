// 공통 JavaScript 함수들
let currentLang = 'ko';

// 언어 변경 함수
function changeLanguage(lang) {
    currentLang = lang;
    document.getElementById('currentLang').textContent = getLanguageName(lang);
    toggleLanguageDropdown();
    updateTexts();
}

function getLanguageName(lang) {
    const names = { 
        ko: '한국어', 
        en: 'English', 
        ja: '日本語', 
        zh: '中文', 
        vi: 'Tiếng Việt' 
    };
    return names[lang] || '한국어';
}

function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// 텍스트 업데이트 함수
function updateTexts() {
    const texts = translations[currentLang] || translations.ko;
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (texts[key]) {
            if (element.tagName.toLowerCase() === 'input' && element.type === 'text') {
                element.placeholder = texts[key];
            } else {
                element.textContent = texts[key];
            }
        }
    });
    
    // 셀렉트 옵션 업데이트
    updateSelectOptions();
}

// 셀렉트 옵션 업데이트
function updateSelectOptions() {
    const texts = translations[currentLang] || translations.ko;
    
    // 직업 셀렉트
    const occupationSelect = document.getElementById('occupation');
    if (occupationSelect && occupationSelect.options) {
        occupationSelect.options[0].textContent = texts.select_option;
        if (occupationSelect.options[1]) occupationSelect.options[1].textContent = texts.employee;
        if (occupationSelect.options[2]) occupationSelect.options[2].textContent = texts.business;
        if (occupationSelect.options[3]) occupationSelect.options[3].textContent = texts.student;
        if (occupationSelect.options[4]) occupationSelect.options[4].textContent = texts.housewife || texts.public;
        if (occupationSelect.options[5]) occupationSelect.options[5].textContent = texts.retiree || texts.professional;
        if (occupationSelect.options[6]) occupationSelect.options[6].textContent = texts.freelancer;
        if (occupationSelect.options[7]) occupationSelect.options[7].textContent = texts.other;
    }
    
    // 소득 셀렉트
    const incomeSelect = document.getElementById('income');
    if (incomeSelect && incomeSelect.options) {
        incomeSelect.options[0].textContent = texts.select_option;
        if (incomeSelect.options[1]) incomeSelect.options[1].textContent = texts.below3000;
        if (incomeSelect.options[2]) incomeSelect.options[2].textContent = texts['3000to5000'];
        if (incomeSelect.options[3]) incomeSelect.options[3].textContent = texts['5000to7000'];
        if (incomeSelect.options[4]) incomeSelect.options[4].textContent = texts['7000to10000'];
        if (incomeSelect.options[5]) incomeSelect.options[5].textContent = texts.above10000;
    }
    
    // 대출 관련 셀렉트 (대출 페이지에서만)
    const loanAmountSelect = document.getElementById('loanAmount');
    if (loanAmountSelect && loanAmountSelect.options) {
        loanAmountSelect.options[0].textContent = texts.select_option;
        if (loanAmountSelect.options[1]) loanAmountSelect.options[1].textContent = texts.below10m;
        if (loanAmountSelect.options[2]) loanAmountSelect.options[2].textContent = texts['10to50m'];
        if (loanAmountSelect.options[3]) loanAmountSelect.options[3].textContent = texts['50to100m'];
        if (loanAmountSelect.options[4]) loanAmountSelect.options[4].textContent = texts['100to300m'];
        if (loanAmountSelect.options[5]) loanAmountSelect.options[5].textContent = texts.above300m;
    }
    
    const loanPurposeSelect = document.getElementById('loanPurpose');
    if (loanPurposeSelect && loanPurposeSelect.options) {
        loanPurposeSelect.options[0].textContent = texts.select_option;
        if (loanPurposeSelect.options[1]) loanPurposeSelect.options[1].textContent = texts.house_purchase;
        if (loanPurposeSelect.options[2]) loanPurposeSelect.options[2].textContent = texts.house_lease;
        if (loanPurposeSelect.options[3]) loanPurposeSelect.options[3].textContent = texts.business_fund;
        if (loanPurposeSelect.options[4]) loanPurposeSelect.options[4].textContent = texts.living_fund;
        if (loanPurposeSelect.options[5]) loanPurposeSelect.options[5].textContent = texts.investment_fund;
        if (loanPurposeSelect.options[6]) loanPurposeSelect.options[6].textContent = texts.other;
    }
}

// 날짜/시간 업데이트
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        let locale = 'ko-KR';
        switch(currentLang) {
            case 'en': locale = 'en-US'; break;
            case 'ja': locale = 'ja-JP'; break;
            case 'zh': locale = 'zh-CN'; break;
            case 'vi': locale = 'vi-VN'; break;
            default: locale = 'ko-KR'; break;
        }
        dateTimeElement.textContent = now.toLocaleDateString(locale, options);
    }
}

// 대기 정보 업데이트 (각 페이지별로 다르게)
function updateWaitingInfo() {
    const texts = translations[currentLang] || translations.ko;
    
    // 메인 페이지 대기 정보
    const depositWaiting = document.getElementById('depositWaiting');
    const depositTime = document.getElementById('depositTime');
    const loanWaiting = document.getElementById('loanWaiting');
    const loanTime = document.getElementById('loanTime');
    
    if (depositWaiting && depositTime) {
        const dWait = Math.floor(Math.random() * 5) + 5;
        const dTime = Math.floor(Math.random() * 10) + 15;
        depositWaiting.textContent = dWait + texts.people;
        depositTime.textContent = texts.about + ' ' + dTime + texts.minutes;
    }
    
    if (loanWaiting && loanTime) {
        const lWait = Math.floor(Math.random() * 4) + 4;
        const lTime = Math.floor(Math.random() * 15) + 20;
        loanWaiting.textContent = lWait + texts.people;
        loanTime.textContent = texts.about + ' ' + lTime + texts.minutes;
    }
    
    // 개별 서비스 페이지 대기 정보
    const waitingCount = document.getElementById('waitingCount');
    const estimatedTime = document.getElementById('estimatedTime');
    
    if (waitingCount && estimatedTime) {
        const count = Math.floor(Math.random() * 6) + 4;
        const time = Math.floor(Math.random() * 15) + 15;
        waitingCount.textContent = count + texts.people;
        estimatedTime.textContent = time + texts.minutes;
    }
}

// 번호표 생성
function generateTicketNumber() {
    const ticketNumber = Math.floor(Math.random() * 500) + 1;
    const currentProcessingNumber = Math.max(1, ticketNumber - Math.floor(Math.random() * 10) - 5);
    const texts = translations[currentLang] || translations.ko;
    
    // 예금은 D-, 대출은 L- 접두사 사용
    const prefix = window.location.pathname.includes('deposit') ? 'D' : 'L';
    
    const issuedElement = document.getElementById('issuedTicketNumber');
    const currentElement = document.getElementById('currentProcessingNumber');
    const waitTimeElement = document.getElementById('estimatedWaitTime');
    
    if (issuedElement) {
        issuedElement.textContent = `${prefix}-${String(ticketNumber).padStart(3, '0')}`;
    }
    
    if (currentElement) {
        currentElement.textContent = `${prefix}-${String(currentProcessingNumber).padStart(3, '0')}`;
    }
    
    if (waitTimeElement) {
        const waitTime = Math.max(1, Math.floor((ticketNumber - currentProcessingNumber) * 2.5));
        waitTimeElement.textContent = `${texts.about} ${waitTime}${texts.minutes}`;
    }
}

// 에러 메시지 표시
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fee2e2;
        color: #dc2626;
        padding: 12px;
        border-radius: 8px;
        margin: 10px 0;
        border: 1px solid #fca5a5;
    `;
    errorDiv.textContent = message;
    
    const content = document.querySelector('.step.active') || document.querySelector('.content');
    if (content) {
        content.insertBefore(errorDiv, content.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// 성공 메시지 표시
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: #f0fdf4;
        color: #166534;
        padding: 12px;
        border-radius: 8px;
        margin: 10px 0;
        border: 1px solid #10b981;
    `;
    successDiv.textContent = message;
    
    const content = document.querySelector('.step.active') || document.querySelector('.content');
    if (content) {
        content.insertBefore(successDiv, content.firstChild);
        setTimeout(() => successDiv.remove(), 5000);
    }
}

// AI 상태 표시
function showAIStatus(message) {
    hideAIStatus(); // 기존 상태 제거
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'ai-status';
    statusDiv.id = 'aiStatusMessage';
    statusDiv.style.cssText = `
        background: #1e40af;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 15px 0;
        font-size: 0.9rem;
        border: 1px solid #3b82f6;
    `;
    statusDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="loading-spinner" style="
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
            "></div>
            <span>${message}</span>
        </div>
    `;
    
    // CSS 애니메이션 추가
    if (!document.getElementById('spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const content = document.querySelector('.step.active') || document.querySelector('.content');
    if (content) {
        content.insertBefore(statusDiv, content.firstChild);
    }
}

function hideAIStatus() {
    const existingStatus = document.getElementById('aiStatusMessage');
    if (existingStatus) {
        existingStatus.remove();
    }
}

// 로컬 스토리지 대신 메모리에 데이터 저장 (Claude.ai 환경 고려)
const sessionData = {
    customerData: {},
    surveyAnswers: {},
    aiAnalysisResult: null
};

// 데이터 저장/불러오기 함수
function saveData(key, data) {
    sessionData[key] = data;
}

function loadData(key) {
    return sessionData[key] || null;
}

function clearData() {
    Object.keys(sessionData).forEach(key => {
        sessionData[key] = key === 'surveyAnswers' ? {} : null;
    });
}

// 초기화 함수
function initCommon() {
    updateDateTime();
    updateWaitingInfo();
    
    // 주기적 업데이트
    setInterval(updateDateTime, 60000);  // 1분마다
    setInterval(updateWaitingInfo, 30000);  // 30초마다
    
    // 언어 드롭다운 외