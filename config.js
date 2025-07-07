// config.js - 간소화된 설정 (복잡한 간격 조정 시스템 제거)

const CONFIG = {
    MAX_PLAYERS: 8,
    DEFAULT_PLAYERS: 3,
    DEFAULT_LOSER_RANK: 1,
    RACE_DURATION: 60000, // 1분 (60초)
    
    // 이벤트 타이밍
    EVENT_TIMES: [10000, 18000, 25000, 32000, 38000, 44000, 50000, 56000, 58000], 
    //EVENT_TIMES: [58000],
    
    // 🆕 간단한 밀어내기 시스템 설정
    OVERLAP_PREVENTION: {
        PUSH_DISTANCE: 0.015,    // 1.5% 이내로 가까우면 밀어내기
        PUSH_FORCE: 0.0003,      // 밀어내는 힘 (부드럽게)
        OVERTAKE_BOOST: 0.02,    // 🆕 추월 시 부스트 (2% 점프)
        ENABLED: true            // 밀어내기 시스템 활성화
    },
    
    // 🔧 단순화된 캐치업 시스템 (아주 약하게만)
    CATCHUP_SYSTEM: {
        LAST_PLACE_BOOST: 1.05,     // 꼴찌 5% 부스트
        LEADER_PENALTY: 0.97,       // 1등 3% 페널티
        MIN_DISTANCE_FOR_CATCHUP: 0.3,  // 30% 차이날 때만 적용
    },
    
    // 속도 설정
    SPEED: {
        BASE_MIN: 0.012,
        BASE_MAX: 0.020,
        RANDOM_INTERVAL: 5000,  // 5초마다 속도 변화
    },
    
    // 🗑️ 복잡한 간격 설정 모두 제거
    // STARTING_POSITIONS, REALTIME_SPACING 등 삭제
    
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
    
    // 스킬 시스템 설정
    SKILL_SYSTEM: {
        // 추월 허용 스킬들 (밀어내기 비활성화)
        OVERTAKING_SKILLS: ['boost', 'stun'],
        
        // 즉시 효과 스킬들
        INSTANT_SKILLS: ['chaos', 'snipe'],
        
        // 스킬 효과 지속시간
        SKILL_DURATIONS: {
            STUN: 3000,      // 스턴 3초
            BOOST: 5000,     // 부스트 5초
        },
        
        // 알람 표시 시간
        NOTIFICATION_DURATIONS: {
            STUN: 3000,
            BOOST: 5000,
            INSTANT: 3000,
        }
    },
    
    // 디버그 모드 설정
    DEBUG: {
        SHOW_SPACING_LOGS: false,
        SHOW_SKILL_LOGS: false,
        SHOW_PROGRESS_LOGS: false,
        SHOW_OVERLAP_PREVENTION: false,  // 밀어내기 디버그
    }
};