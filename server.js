// ConnectDot Bank AI Agent 백엔드 서버
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 라우터 모듈 import
const depositRoutes = require('./routes/deposit');
const loanRoutes = require('./routes/loan');

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // IP당 최대 요청 수
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

// AI API 전용 Rate limiting (더 엄격)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1분
    max: 10, // AI API는 분당 10회로 제한
    message: {
        error: 'AI service rate limit exceeded. Please wait before making another request.',
        retryAfter: '1 minute'
    }
});

app.use(limiter);

// 로깅
app.use(morgan('combined'));

// CORS 설정
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://connectdot-bank.com', 'https://www.connectdot-bank.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080'],
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API 라우터 등록
app.use('/api/deposit', aiLimiter, depositRoutes);
app.use('/api/loan', aiLimiter, loanRoutes);

// 일반 API 엔드포인트들
app.use('/api', require('./routes/general'));

// 메인 페이지 라우팅
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// SPA 라우팅 지원
app.get('/pages/:page', (req, res) => {
    const page = req.params.page;
    const allowedPages = ['deposit.html', 'loan.html'];
    
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, `../pages/${page}`));
    } else {
        res.status(404).json({ error: 'Page not found' });
    }
});

// 에러 처리 미들웨어
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    // OpenAI API 에러 처리
    if (err.name === 'OpenAIError') {
        return res.status(503).json({
            error: 'AI service temporarily unavailable',
            message: 'Please try again later',
            useBackup: true
        });
    }
    
    // Rate limit 에러 처리
    if (err.name === 'RateLimitError') {
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: err.message,
            retryAfter: err.retryAfter
        });
    }
    
    // 일반적인 에러 처리
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: statusCode === 500 ? 'Internal Server Error' : err.message,
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// 404 처리
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `The requested resource ${req.originalUrl} was not found on this server.`,
        timestamp: new Date().toISOString()
    });
});

// 서버 시작
const server = app.listen(PORT, () => {
    console.log(`🚀 ConnectDot Bank AI Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Local access: http://localhost:${PORT}`);
        console.log(`📱 Network access: http://[your-ip]:${PORT}`);
    }
});

// 그레이스풀 셧다운
process.on('SIGTERM', () => {
    console.log('📴 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📴 SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

// 예상치 못한 에러 처리
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;