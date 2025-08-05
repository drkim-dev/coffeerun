// config.js - 게임시간별 동적 설정 시스템

const BASE_CONFIG = {
    MAX_PLAYERS: 8,
    DEFAULT_PLAYERS: 3,
    DEFAULT_LOSER_RANK: 1,
    DEFAULT_GAME_DURATION: 20, // 기본 20초
    
    // 게임 시간별 설정 (60초 기준을 1.0으로 설정)
    DURATION_SETTINGS: {
        20: {
            name: "빠른 게임",
            speedMultiplier: 3.0,      // 속도 3배
            eventTimeRatio: 0.33,      // 이벤트 간격 1/3
            skillDurationRatio: 0.33,  // 스킬 지속시간 1/3
            catchupStrength: 1.5,      // 캐치업 강도 1.5배
            overtakeCooldown: 1000,    // 추월 쿨다운 1초
            overtakeDistance: 0.05,    // 추월 목표 거리 5%
            showEffects: false         // 알림/파티클 제거
        },
        40: {
            name: "표준 게임", 
            speedMultiplier: 1.5,      // 속도 1.5배
            eventTimeRatio: 0.67,      // 이벤트 간격 2/3
            skillDurationRatio: 0.67,  // 스킬 지속시간 2/3
            catchupStrength: 1.2,      // 캐치업 강도 1.2배
            overtakeCooldown: 1500,    // 추월 쿨다운 1.5초
            overtakeDistance: 0.04,    // 추월 목표 거리 4%
            showEffects: true          // 알림/파티클 표시
        },
        60: {
            name: "느긋한 게임",
            speedMultiplier: 1.0,      // 속도 기본
            eventTimeRatio: 1.0,       // 이벤트 간격 기본
            skillDurationRatio: 1.0,   // 스킬 지속시간 기본
            catchupStrength: 1.0,      // 캐치업 강도 기본
            overtakeCooldown: 2000,    // 추월 쿨다운 2초
            overtakeDistance: 0.03,    // 추월 목표 거리 3%
            showEffects: true          // 알림/파티클 표시
        }
    },
    
    // 기본 설정들 (60초 기준)
    BASE_RACE_DURATION: 60000,
    BASE_EVENT_TIMES: [10000, 18000, 25000, 32000, 38000, 44000, 50000, 56000, 58000],
    BASE_SPEED: {
        BASE_MIN: 0.012,
        BASE_MAX: 0.020,
        RANDOM_INTERVAL: 5000,
    },
    BASE_SKILL_DURATIONS: {
        STUN: 3000,
        BOOST: 5000,
    },
    BASE_CATCHUP_SYSTEM: {
        LAST_PLACE_BOOST: 1.05,
        LEADER_PENALTY: 0.97,
        MIN_DISTANCE_FOR_CATCHUP: 0.3,
    },
    
    // 고정 설정들
    OVERLAP_PREVENTION: {
        PUSH_DISTANCE: 0.015,
        PUSH_FORCE: 0.0003,
        OVERTAKE_BOOST: 0.02,
        ENABLED: true
    },
    
    TRACK: {
        BORDER_RATIO: 0.08,    
        VEHICLE_SIZE_RATIO: 0.09, 
        FONT_SIZE_RATIO: 0.035, 
    },
    
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
    
    SKILL_SYSTEM: {
        OVERTAKING_SKILLS: ['boost', 'stun'],
        INSTANT_SKILLS: ['chaos', 'snipe'],
        NOTIFICATION_DURATIONS: {
            STUN: 3000,
            BOOST: 5000,
            INSTANT: 3000,
        }
    },
    
    DEBUG: {
        SHOW_SPACING_LOGS: false,
        SHOW_SKILL_LOGS: false,
        SHOW_PROGRESS_LOGS: false,
        SHOW_OVERLAP_PREVENTION: false,
    }
};

// 동적 CONFIG 생성 함수
function createDynamicConfig(gameDuration = 20) {
    const settings = BASE_CONFIG.DURATION_SETTINGS[gameDuration];
    if (!settings) {
        console.warn(`⚠️ 지원하지 않는 게임 시간: ${gameDuration}초, 20초로 설정합니다.`);
        return createDynamicConfig(20);
    }
    
    console.log(`게임 설정 생성: ${gameDuration}초 (${settings.name})`);
    
    return {
        ...BASE_CONFIG,
        
        // 현재 게임 시간
        CURRENT_GAME_DURATION: gameDuration,
        RACE_DURATION: gameDuration * 1000,
        
        // 동적 이벤트 타이밍
        EVENT_TIMES: BASE_CONFIG.BASE_EVENT_TIMES.map(time => 
            Math.round(time * settings.eventTimeRatio)
        ).filter(time => time < gameDuration * 1000), // 게임 시간을 넘지 않도록
        
        // 동적 속도 설정
        SPEED: {
            BASE_MIN: BASE_CONFIG.BASE_SPEED.BASE_MIN * settings.speedMultiplier,
            BASE_MAX: BASE_CONFIG.BASE_SPEED.BASE_MAX * settings.speedMultiplier,
            RANDOM_INTERVAL: Math.round(BASE_CONFIG.BASE_SPEED.RANDOM_INTERVAL * settings.eventTimeRatio),
        },
        
        // 동적 스킬 지속시간
        SKILL_SYSTEM: {
            ...BASE_CONFIG.SKILL_SYSTEM,
            SKILL_DURATIONS: {
                STUN: Math.round(BASE_CONFIG.BASE_SKILL_DURATIONS.STUN * settings.skillDurationRatio),
                BOOST: Math.round(BASE_CONFIG.BASE_SKILL_DURATIONS.BOOST * settings.skillDurationRatio),
            },
            NOTIFICATION_DURATIONS: {
                STUN: Math.round(BASE_CONFIG.SKILL_SYSTEM.NOTIFICATION_DURATIONS.STUN * settings.skillDurationRatio),
                BOOST: Math.round(BASE_CONFIG.SKILL_SYSTEM.NOTIFICATION_DURATIONS.BOOST * settings.skillDurationRatio),
                INSTANT: Math.round(BASE_CONFIG.SKILL_SYSTEM.NOTIFICATION_DURATIONS.INSTANT * settings.skillDurationRatio),
            }
        },
        
        // 동적 캐치업 시스템
        CATCHUP_SYSTEM: {
            LAST_PLACE_BOOST: 1 + ((BASE_CONFIG.BASE_CATCHUP_SYSTEM.LAST_PLACE_BOOST - 1) * settings.catchupStrength),
            LEADER_PENALTY: 1 - ((1 - BASE_CONFIG.BASE_CATCHUP_SYSTEM.LEADER_PENALTY) * settings.catchupStrength),
            MIN_DISTANCE_FOR_CATCHUP: BASE_CONFIG.BASE_CATCHUP_SYSTEM.MIN_DISTANCE_FOR_CATCHUP,
        },
        
        // 동적 추월 설정
        OVERLAP_PREVENTION: {
            ...BASE_CONFIG.OVERLAP_PREVENTION,
            OVERTAKE_COOLDOWN: settings.overtakeCooldown,
            OVERTAKE_DISTANCE: settings.overtakeDistance,
        },
        
        // 효과 표시 여부
        SHOW_EFFECTS: settings.showEffects
    };
}

// 전역 CONFIG 변수 (기본값: 20초)
let CONFIG = createDynamicConfig(20);

// CONFIG 업데이트 함수
function updateGameConfig(gameDuration) {
    CONFIG = createDynamicConfig(gameDuration);
    console.log(` CONFIG 업데이트 완료:`, {
        duration: `${gameDuration}초`,
        raceTime: `${CONFIG.RACE_DURATION}ms`,
        eventCount: CONFIG.EVENT_TIMES.length,
        speedRange: `${CONFIG.SPEED.BASE_MIN.toFixed(3)}~${CONFIG.SPEED.BASE_MAX.toFixed(3)}`,
        stunDuration: `${CONFIG.SKILL_SYSTEM.SKILL_DURATIONS.STUN}ms`,
        boostDuration: `${CONFIG.SKILL_SYSTEM.SKILL_DURATIONS.BOOST}ms`,
        showEffects: CONFIG.SHOW_EFFECTS ? '표시' : '숨김' // 효과 표시 여부
    });
    return CONFIG;
}

//   현재 CONFIG 정보 출력 함수 (디버깅용)
function logCurrentConfig() {
    console.log(` 현재 CONFIG 설정:`, {
        gameDuration: `${CONFIG.CURRENT_GAME_DURATION}초`,
        raceDuration: `${CONFIG.RACE_DURATION}ms`,
        eventTimes: CONFIG.EVENT_TIMES,
        speedMin: CONFIG.SPEED.BASE_MIN,
        speedMax: CONFIG.SPEED.BASE_MAX,
        stunDuration: CONFIG.SKILL_SYSTEM.SKILL_DURATIONS.STUN,
        boostDuration: CONFIG.SKILL_SYSTEM.SKILL_DURATIONS.BOOST,
        catchupBoost: CONFIG.CATCHUP_SYSTEM.LAST_PLACE_BOOST,
        leaderPenalty: CONFIG.CATCHUP_SYSTEM.LEADER_PENALTY
    });
}