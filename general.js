// 일반 API 라우트
const express = require('express');
const router = express.Router();

// 시스템 상태 확인
router.get('/status', (req, res) => {
    try {
        const systemStatus = {
            server: 'operational',
            database: 'operational',
            ai: process.env.OPENAI_API_KEY ? 'operational' : 'disabled',
            services: {
                deposit: 'operational',
                loan: 'operational'
            },
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime()
        };

        res.json({
            success: true,
            status: systemStatus
        });
    } catch (error) {
        console.error('[일반] 상태 확인 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system status'
        });
    }
});

// 대기 정보 조회
router.get('/waiting-info', (req, res) => {
    try {
        const waitingInfo = {
            deposit: {
                currentNumber: `D-${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`,
                waitingCount: Math.floor(Math.random() * 8) + 3,
                estimatedTime: Math.floor(Math.random() * 15) + 10
            },
            loan: {
                currentNumber: `L-${String(Math.floor(Math.random() * 500) + 1).padStart(3, '0')}`,
                waitingCount: Math.floor(Math.random() * 6) + 2,
                estimatedTime: Math.floor(Math.random() * 20) + 15
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            waitingInfo: waitingInfo
        });
    } catch (error) {
        console.error('[일반] 대기 정보 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve waiting information'
        });
    }
});

// 번호표 발급
router.post('/issue-ticket', (req, res) => {
    try {
        const { serviceType } = req.body;
        
        if (!serviceType || !['deposit', 'loan'].includes(serviceType)) {
            return res.status(400).json({
                success: false,
                error: 'Valid service type is required (deposit or loan)'
            });
        }

        const prefix = serviceType === 'deposit' ? 'D' : 'L';
        const ticketNumber = Math.floor(Math.random() * 500) + 1;
        const currentNumber = Math.max(1, ticketNumber - Math.floor(Math.random() * 10) - 5);
        const waitTime = Math.max(1, Math.floor((ticketNumber - currentNumber) * (serviceType === 'deposit' ? 2.3 : 3.2)));

        const ticket = {
            ticketNumber: `${prefix}-${String(ticketNumber).padStart(3, '0')}`,
            currentNumber: `${prefix}-${String(currentNumber).padStart(3, '0')}`,
            estimatedWaitTime: waitTime,
            serviceType: serviceType,
            issuedAt: new Date().toISOString(),
            status: 'active'
        };

        res.json({
            success: true,
            ticket: ticket
        });
    } catch (error) {
        console.error('[일반] 번호표 발급 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to issue ticket'
        });
    }
});

// 피드백 수집
router.post('/feedback', (req, res) => {
    try {
        const { rating, comment, serviceType, ticketNumber } = req.body;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const feedback = {
            id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            rating: parseInt(rating),
            comment: comment || '',
            serviceType: serviceType || 'general',
            ticketNumber: ticketNumber || null,
            submittedAt: new Date().toISOString(),
            processed: false
        };

        // 실제 환경에서는 데이터베이스에 저장
        console.log('[피드백] 새 피드백 수집:', feedback);

        res.json({
            success: true,
            message: '소중한 피드백을 주셔서 감사합니다.',
            feedbackId: feedback.id
        });
    } catch (error) {
        console.error('[일반] 피드백 수집 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});

// 고객 지원 정보
router.get('/support', (req, res) => {
    try {
        const supportInfo = {
            contactMethods: [
                {
                    id: 1,
                    question: 'AI 분석은 얼마나 정확한가요?',
                    answer: 'ConnectDot Bank의 AI 시스템은 OpenAI GPT-4를 기반으로 하며, 94% 이상의 정확도를 보여줍니다. 다만 최종 결정은 전문 상담사와 함께 하시기를 권장합니다.'
                },
                {
                    id: 2,
                    question: '대출 승인까지 얼마나 걸리나요?',
                    answer: 'AI 사전 심사는 즉시 완료되며, 실제 대출 승인은 필요 서류 제출 후 1-3영업일 소요됩니다.'
                },
                {
                    id: 3,
                    question: '예금 상품 추천은 어떤 기준으로 하나요?',
                    answer: '고객님의 나이, 직업, 소득, 투자성향, 목표 등을 종합적으로 분석하여 최적의 상품을 추천합니다.'
                },
                {
                    id: 4,
                    question: '개인정보는 안전하게 보호되나요?',
                    answer: '256비트 SSL 암호화와 금융권 보안 표준을 준수하여 고객 정보를 안전하게 보호합니다.'
                }
            ],
            emergencyContact: {
                title: '긴급 상황 문의',
                phone: '1588-0000',
                available24h: true
            }
        };

        res.json({
            success: true,
            support: supportInfo
        });
    } catch (error) {
        console.error('[일반] 지원 정보 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve support information'
        });
    }
});

// 통계 및 분석 데이터
router.get('/analytics', (req, res) => {
    try {
        const analytics = {
            totalCustomers: Math.floor(Math.random() * 10000) + 50000,
            aiAnalysisCompleted: Math.floor(Math.random() * 1000) + 15000,
            averageAccuracy: 94.2,
            customerSatisfaction: 4.7,
            serviceStats: {
                deposit: {
                    totalAnalysis: Math.floor(Math.random() * 500) + 8000,
                    avgWaitTime: 18,
                    successRate: 96.8
                },
                loan: {
                    totalAnalysis: Math.floor(Math.random() * 300) + 5000,
                    avgWaitTime: 25,
                    approvalRate: 78.5
                }
            },
            recentActivity: [
                {
                    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                    action: 'deposit_analysis',
                    result: 'completed'
                },
                {
                    time: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
                    action: 'loan_analysis',
                    result: 'completed'
                },
                {
                    time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
                    action: 'deposit_analysis',
                    result: 'completed'
                }
            ],
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            analytics: analytics
        });
    } catch (error) {
        console.error('[일반] 분석 데이터 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics data'
        });
    }
});

// 언어 설정
router.post('/language', (req, res) => {
    try {
        const { language } = req.body;
        const supportedLanguages = ['ko', 'en', 'ja', 'zh', 'vi'];
        
        if (!language || !supportedLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                error: 'Supported languages: ' + supportedLanguages.join(', ')
            });
        }

        // 실제 환경에서는 사용자 설정에 저장
        console.log('[언어] 언어 설정 변경:', language);

        res.json({
            success: true,
            message: 'Language preference updated',
            language: language,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[일반] 언어 설정 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update language preference'
        });
    }
});

// 알림 설정
router.post('/notifications', (req, res) => {
    try {
        const { email, sms, push, analysisComplete, promotions } = req.body;
        
        const notificationSettings = {
            email: Boolean(email),
            sms: Boolean(sms),
            push: Boolean(push),
            types: {
                analysisComplete: Boolean(analysisComplete),
                promotions: Boolean(promotions)
            },
            updatedAt: new Date().toISOString()
        };

        // 실제 환경에서는 사용자 설정에 저장
        console.log('[알림] 알림 설정 업데이트:', notificationSettings);

        res.json({
            success: true,
            message: 'Notification settings updated',
            settings: notificationSettings
        });
    } catch (error) {
        console.error('[일반] 알림 설정 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update notification settings'
        });
    }
});

// 버전 정보
router.get('/version', (req, res) => {
    try {
        const versionInfo = {
            api: '1.0.0',
            frontend: '1.0.0',
            ai: 'GPT-4',
            lastUpdated: '2024-01-15',
            features: [
                'OpenAI GPT-4 Integration',
                'Real-time Analysis',
                'Multi-language Support',
                'Mobile Responsive Design',
                'Advanced Security'
            ],
            environment: process.env.NODE_ENV || 'development',
            buildDate: new Date().toISOString()
        };

        res.json({
            success: true,
            version: versionInfo
        });
    } catch (error) {
        console.error('[일반] 버전 정보 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve version information'
        });
    }
});

// 에러 리포팅
router.post('/error-report', (req, res) => {
    try {
        const { errorType, message, stackTrace, userAgent, url, timestamp } = req.body;
        
        const errorReport = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: errorType || 'unknown',
            message: message || 'No message provided',
            stackTrace: stackTrace || null,
            userAgent: userAgent || req.get('User-Agent'),
            url: url || req.get('Referer'),
            timestamp: timestamp || new Date().toISOString(),
            ip: req.ip,
            processed: false
        };

        // 실제 환경에서는 로깅 시스템에 전송
        console.error('[에러리포트] 클라이언트 에러:', errorReport);

        res.json({
            success: true,
            message: 'Error report received',
            reportId: errorReport.id
        });
    } catch (error) {
        console.error('[일반] 에러 리포팅 오류:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit error report'
        });
    }
});

module.exports = router;
                    type: 'phone',
                    title: '고객센터',
                    value: '1588-0000',
                    hours: '평일 09:00-18:00, 토요일 09:00-13:00',
                    available: true
                },
                {
                    type: 'chat',
                    title: '라이브 채팅',
                    value: 'chat.connectdot-bank.com',
                    hours: '24시간 (AI 챗봇)',
                    available: true
                },
                {
                    type: 'email',
                    title: '이메일 문의',
                    value: 'support@connectdot-bank.com',
                    hours: '24시간 접수, 1영업일 내 답변',
                    available: true
                }
            ],
            faq: [
                {