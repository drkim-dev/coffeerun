// config.js - 캐치업 시스템 대폭 약화 & 간격 조정 시스템 호환

const CONFIG = {
    MAX_PLAYERS: 8,
    DEFAULT_PLAYERS: 3,
    DEFAULT_LOSER_RANK: 1,
    RACE_DURATION: 60000, // 1분 (60초)
    
    // 🎯 이벤트를 1분에 맞춰 재배치 (초반 격차 형성 후 후반 집중)
    EVENT_TIMES: [4500, 10000, 18000, 25000, 32000, 38000, 44000, 50000, 56000, 58000], 
    
    // 특별 이벤트 타이밍 (실제 사용되는 것만)
    SPECIAL_EVENTS: {
        BIG_CHAOS_TIME: 40000,  // 40초 후 중반 대혼란 (사용안함)
        FINAL_CHANCE_TIME: 50000 // 50초 후 막판 역전 (사용안함)
    },
    
    // 🔧 캐치업 시스템 대폭 약화 (간격 조정과 충돌 방지)
    CATCHUP_SYSTEM: {
        // 🆕 평상시 캐치업 (간격 조정 중에는 거의 무의미)
        NORMAL_LAST_PLACE_BOOST: 1.03,    // 1.25 → 1.05 (5%만 증가)
        NORMAL_SECOND_LAST_BOOST: 1.01,   // 1.15 → 1.02 (2%만 증가)
        NORMAL_LEADER_PENALTY: 0.98,      // 0.94 → 0.98 (2%만 감소)
        NORMAL_SECOND_PENALTY: 0.99,      // 0.97 → 0.99 (1%만 감소)
        
        // 🆕 스킬 중 캐치업 (추월 가능할 때만 강화)
        SKILL_LAST_PLACE_BOOST: 1.3,      // 스킬 중에는 30% 부스트
        SKILL_SECOND_LAST_BOOST: 1.15,    // 스킬 중에는 15% 부스트
        SKILL_LEADER_PENALTY: 0.85,       // 스킬 중에는 15% 페널티
        SKILL_SECOND_PENALTY: 0.92,       // 스킬 중에는 8% 페널티
        
        // 🎯 캐치업 적용 조건 (더 엄격하게)
        MIN_CATCHUP_DISTANCE: 0.35,       // 0.25 → 0.35 (35% 차이부터 적용)
        MAX_CATCHUP_DISTANCE: 0.7,        // 0.5 → 0.7 (70% 최대)
    },
    
    // 🚀 속도 설정 (기본 속도 약간 증가로 게임 활력 증진)
    SPEED: {
        BASE_MIN: 0.015,        // 0.015 → 0.012 (최저속도 약간 감소)
        BASE_MAX: 0.022,        // 0.025 → 0.020 (최고속도 약간 감소)
        RANDOM_INTERVAL: 3000,  // 2초마다 속도 변화
    },
    
    // 🎨 초기 간격 설정 (더 다양한 패턴)
    STARTING_POSITIONS: {
        SPREAD_FACTOR: 0.07,    // 0.07 → 0.05 (시작 간격 더 줄임)
        RANDOM_SPREAD: 0.02,    // 0.03 → 0.02 (랜덤 요소도 줄임)
    },
    
    // 🆕 실시간 간격 조정 시스템 설정
    REALTIME_SPACING: {
        // 체크 주기
        CHECK_INTERVAL: 500,            // 0.5초마다 체크
        CROWDING_CHECK_INTERVAL: 2000,  // 1초마다 과밀 체크
        
        // 과밀 감지 설정
        CROWDING_THRESHOLD: 0.02,       // 1% 이내면 뭉쳐있다고 판단
        CROWDING_MIN_PLAYERS: 2,        // 2명 이상이 뭉쳐야 과밀로 판단
        
        // 조정 타이밍
        MIN_ADJUSTMENT_INTERVAL: 2000,  // 최소 2초 간격으로 조정
        MAX_PATTERN_TIME: 8000,         // 8초 이상 같은 패턴이면 강제 조정
        
        // 디버그 로그
        LOG_CROWDING_DETECTION: true,   // 과밀 감지 로그
        LOG_PATTERN_CHANGES: true,      // 패턴 변경 로그
        LOG_ADJUSTMENT_TIMING: true,    // 조정 타이밍 로그
    },
    
    // 반응형 트랙 설정
    TRACK: {
        BORDER_RATIO: 0.08,    
        VEHICLE_SIZE_RATIO: 0.09, 
        FONT_SIZE_RATIO: 0.035, 
    },
    
    // Lottie 애니메이션 파일 경로
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
    
    // 🆕 스킬 시스템 설정
    SKILL_SYSTEM: {
        // 추월 허용 스킬들
        OVERTAKING_SKILLS: ['boost', 'stun'],
        
        // 즉시 효과 스킬들 (추월 시스템 무시)
        INSTANT_SKILLS: ['chaos', 'snipe'],
        
        // 스킬 효과 지속시간
        SKILL_DURATIONS: {
            STUN: 3000,      // 스턴 3초
            BOOST: 5000,     // 부스트 5초 (터보부스터)
            BOOST_SHORT: 5000, // 부스트 5초 (각성)
        },
        
        // 알람 표시 시간 (스킬 지속시간과 연동)
        NOTIFICATION_DURATIONS: {
            STUN: 3000,      // 스턴 스킬 알람 3초
            BOOST_LONG: 5000, // 긴 부스트 알람 5초
            BOOST_SHORT: 5000, // 짧은 부스트 알람 5초
            INSTANT: 3000,   // 즉시 효과 알람 3초
        }
    },
    
    // 🆕 디버그 모드 설정
    DEBUG: {
        SHOW_SPACING_LOGS: false,        // 간격 조정 로그 표시
        SHOW_SKILL_LOGS: false,          // 스킬 로그 표시
        SHOW_PROGRESS_LOGS: false,      // 진행률 로그 표시 (너무 많음)
        SHOW_TRACK_DEBUG: false,        // 트랙 디버그 라인 표시
    }
};
