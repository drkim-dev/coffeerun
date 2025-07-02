// config.js - 간격 확대 & 긴장감 강화 버전
const CONFIG = {
    MAX_PLAYERS: 8,
    DEFAULT_PLAYERS: 3,
    DEFAULT_LOSER_RANK: 1,
    RACE_DURATION: 60000, // 1분 (60초)
    
    // 🎯 이벤트를 1분에 맞춰 재배치 (초반 격차 형성 후 후반 집중)
    EVENT_TIMES: [10000, 20000, 25000, 30000, 35000, 40000, 44000, 48000, 52000, 56000], 
    
    // 특별 이벤트 타이밍 (실제 사용되는 것만)
    SPECIAL_EVENTS: {
        BIG_CHAOS_TIME: 40000,  // 40초 후 중반 대혼란 (사용안함)
        FINAL_CHANCE_TIME: 50000 // 50초 후 막판 역전 (사용안함)
    },
    
    // 🔧 격차 적당히 유지하는 캐치업 시스템
    CATCHUP_SYSTEM: {
        LAST_PLACE_BOOST: 1.25,    // 1.15 → 1.25 (꼴찌 도움 증가)
        SECOND_LAST_BOOST: 1.15,   // 1.05 → 1.15 (뒤에서 2등도 도움)
        LEADER_PENALTY: 0.94,      // 0.98 → 0.94 (1등 페널티 증가)
        SECOND_PENALTY: 0.97,      // 0.99 → 0.97 (2등도 약간 페널티)
        
        // 🎯 격차가 적당히 벌어지면 캐치업 적용
        MIN_CATCHUP_DISTANCE: 0.25, // 0.35 → 0.25 (25% 차이부터 적용)
        MAX_CATCHUP_DISTANCE: 0.5,  // 0.6 → 0.5 (50% 최대)
    },
    
    // 🚀 속도 격차 적당히 조정
    SPEED: {
        BASE_MIN: 0.015,        // 0.008 → 0.010 (최저속도 올림)
        BASE_MAX: 0.025,        // 0.028 → 0.025 (최고속도 내림)
        RANDOM_INTERVAL: 2000,  // 2500 → 2000 (속도 변화 좀 더 자주)
    },
    
    // 🎨 초기 간격 설정 (격차 줄임)
    STARTING_POSITIONS: {
        SPREAD_FACTOR: 0.07,    // 0.15 → 0.08 (시작 간격 줄임)
        RANDOM_SPREAD: 0.03,    // 0.05 → 0.03 (랜덤 요소도 줄임)
    },
    
    // 반응형 트랙 설정
    TRACK: {
        BORDER_RATIO: 0.08,    
        VEHICLE_SIZE_RATIO: 0.09, 
        FONT_SIZE_RATIO: 0.035, 
    },
    // Lottie 애니메이션 파일 경로 (실제 존재하는 파일들)
    LOTTIE_FILES: [
          'animations/camel2.json',
        'animations/run2.json', 
        'animations/dog1.json',
        'animations/superman1.json',
        'animations/bycicle1.json',
        'animations/bike1.json',
        'animations/circle1.json',
        'animations/imposter.json'
    ],
};