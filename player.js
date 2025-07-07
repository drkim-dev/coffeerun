// player.js - 간소화된 플레이어 (복잡한 간격 시스템 제거)

class Player {
    constructor(name, lottieFile, index) {
        this.name = name;
        this.lottieFile = lottieFile;
        this.index = index;
        
        // 기본 진행률과 속도
        this.progress = this.getInitialPosition(index); 
        this.baseSpeed = this.generateUniqueSpeed();
        
        // DOM 요소들
        this.element = null;
        this.nameElement = null;
        this.lottieAnimation = null;
        
        // 상태
        this.stunned = false;
        this.boosted = false;
        this.reversed = false;
        this.finished = false;
        this.finishTime = 0;
        
        // 🆕 간단한 시스템
        this.allowOverlap = false;           // 스킬 중 추월 허용 여부
        this.personalMultiplier = 0.8 + Math.random() * 0.4; 
        this.randomSpeedMultiplier = 1.0;
        this.lastRandomSpeedUpdate = 0;
        this.consistencyFactor = Math.random();
        
        // 🆕 추월 상태 관리
        this.isOvertaking = false;           // 추월 중인지
        this.overtakeStartTime = 0;          // 추월 시작 시간
        this.overtakeTarget = 0;             // 추월 목표 위치
        
        // 🗑️ 복잡한 간격 관련 변수들 모두 제거
        // targetSpacing, spacingSpeedMultiplier, lastSpacingCheck 등
    }

    // 초기 위치 (랜덤하게 조금씩 다르게 시작)
    getInitialPosition(index) {
        const baseOffset = index * 0.02;  // 2%씩 차이
        const randomOffset = (Math.random() - 0.5) * 0.01;  // ±0.5% 랜덤
        return Math.max(0, -(baseOffset + randomOffset));
    }

    // 고유한 기본 속도 생성
    generateUniqueSpeed() {
        const min = CONFIG.SPEED.BASE_MIN;
        const max = CONFIG.SPEED.BASE_MAX;
        const range = max - min;
        
        const personalRange = range * (0.7 + Math.random() * 0.6);
        const personalMin = min + (Math.random() * (range - personalRange));
        
        return personalMin + Math.random() * personalRange;
    }

    // 🆕 간단한 위치 업데이트 (복잡한 간격 조정 제거)
    updatePosition(deltaTime, allPlayers = [], trackPath) {
        if (this.finished || this.stunned) return;

        const currentTime = Date.now();
        
        // 주기적으로 랜덤 속도 업데이트 (5초마다)
        if (currentTime - this.lastRandomSpeedUpdate >= CONFIG.SPEED.RANDOM_INTERVAL) {
            this.updateRandomSpeed(allPlayers);
            this.lastRandomSpeedUpdate = currentTime;
        }

        let speed = this.baseSpeed;
        
        // 🆕 간단한 캐치업 시스템 (아주 약하게만)
        if (allPlayers.length > 0) {
            const ranking = this.getRanking(allPlayers);
            const totalPlayers = allPlayers.filter(p => !p.finished).length;
            
            // 꼴찌면 약간 빠르게, 1등이면 약간 느리게
            if (ranking === totalPlayers) {
                const leadDistance = this.getDistanceToLeader(allPlayers);
                if (leadDistance > CONFIG.CATCHUP_SYSTEM.MIN_DISTANCE_FOR_CATCHUP) {
                    speed *= CONFIG.CATCHUP_SYSTEM.LAST_PLACE_BOOST;
                }
            } else if (ranking === 1) {
                const lastDistance = this.getDistanceToLast(allPlayers);
                if (lastDistance > CONFIG.CATCHUP_SYSTEM.MIN_DISTANCE_FOR_CATCHUP) {
                    speed *= CONFIG.CATCHUP_SYSTEM.LEADER_PENALTY;
                }
            }
        }
        
        // 상태별 효과
        if (this.boosted) speed *= 2.8;
        if (this.reversed) speed *= -1.2;
        
        // 🆕 추월 중이면 속도 2배!
        if (this.isOvertaking) {
            speed *= 2.0;
            
            console.log(`🚀 ${this.name} 추월 중! 진행률: ${(this.progress*100).toFixed(1)}%, 목표: ${(this.overtakeTarget*100).toFixed(1)}%`);
            
            // 추월 완료 체크 (목표 위치를 넘어섰는지)
            if (this.progress > this.overtakeTarget) {
                this.isOvertaking = false;
                console.log(`✅ ${this.name} 추월 완료!`);
            }
        }
        
        // 랜덤 속도
        speed *= this.randomSpeedMultiplier;
        
        // 진행률 업데이트
        this.progress += speed * (deltaTime / 1000);
        this.progress = Math.max(0, this.progress);
        
        // 완주 체크
        if (this.progress >= 1 && !this.finished) {
            this.finished = true;
            this.finishTime = Date.now();
            this.fadeOut();
        }
    }

    // 🆕 1등과의 거리
    getDistanceToLeader(allPlayers) {
        const activePlayers = allPlayers.filter(p => !p.finished);
        if (activePlayers.length === 0) return 0;
        
        const leader = activePlayers.reduce((prev, current) => 
            (prev.progress > current.progress) ? prev : current
        );
        return Math.abs(leader.progress - this.progress);
    }

    // 🆕 꼴찌와의 거리
    getDistanceToLast(allPlayers) {
        const activePlayers = allPlayers.filter(p => !p.finished);
        if (activePlayers.length === 0) return 0;
        
        const last = activePlayers.reduce((prev, current) => 
            (prev.progress < current.progress) ? prev : current
        );
        return Math.abs(this.progress - last.progress);
    }

    // 스킬 적용 함수들 (기존과 동일)
    applyStun(duration = 3000) {
        this.stunned = true;
        this.allowOverlap = true; // 스턴 중에는 추월당할 수 있음
        
        console.log(`${this.name} 스턴 시작 (${duration}ms)`);
        
        setTimeout(() => {
            this.stunned = false;
            this.allowOverlap = false;
            console.log(`${this.name} 스턴 종료`);
        }, duration);
    }

    applyBoost(duration = 5000) {
        this.boosted = true;
        this.allowOverlap = true; // 부스트 중에는 추월 가능
        
        console.log(`${this.name} 부스트 시작 (${duration}ms)`);
        
        setTimeout(() => {
            this.boosted = false;
            this.allowOverlap = false;
            console.log(`${this.name} 부스트 종료`);
        }, duration);
    }

    applyReverse(duration = 4000) {
        this.reversed = true;
        this.allowOverlap = true;
        
        console.log(`${this.name} 역주행 시작 (${duration}ms)`);
        
        setTimeout(() => {
            this.reversed = false;
            this.allowOverlap = false;
            console.log(`${this.name} 역주행 종료`);
        }, duration);
    }

    // 랜덤 속도 업데이트
    updateRandomSpeed(allPlayers = []) {
        const ranking = this.getRanking(allPlayers);
        const totalPlayers = allPlayers.filter(p => !p.finished).length;
        
        const stabilityFactor = this.consistencyFactor > 0.7 ? 1.2 : 0.8;
        const baseRandom = 0.8 + Math.random() * 0.4;
        this.randomSpeedMultiplier = baseRandom * this.personalMultiplier * stabilityFactor;
        
        // 🆕 baseSpeed도 5초마다 변경!
        this.baseSpeed = this.generateUniqueSpeed();
        
        // 약간의 순위별 조정
        if (ranking === totalPlayers) {
            this.randomSpeedMultiplier *= 1.1; // 꼴찌 10% 증가
        } else if (ranking === 1) {
            this.randomSpeedMultiplier *= 0.95; // 1등 5% 감소
        }
    }
    
    // 현재 순위 계산
    getRanking(allPlayers) {
        const activePlayers = allPlayers.filter(p => !p.finished);
        const sorted = activePlayers.sort((a, b) => b.progress - a.progress);
        return sorted.findIndex(p => p === this) + 1;
    }

    // 트랙 위의 위치 계산 (기존과 동일)
    getPosition(trackPath) {
        const normalizedProgress = this.progress % 1;
        
        let x, y, angle = 0;
        
        if (normalizedProgress < trackPath.topRatio) {
            const segmentProgress = normalizedProgress / trackPath.topRatio;
            x = trackPath.margin + (segmentProgress * trackPath.width);
            y = trackPath.margin;
            angle = 0;
        } 
        else if (normalizedProgress < trackPath.topRatio + trackPath.rightRatio) {
            const segmentProgress = (normalizedProgress - trackPath.topRatio) / trackPath.rightRatio;
            x = trackPath.margin + trackPath.width;
            y = trackPath.margin + (segmentProgress * trackPath.height);
            angle = 90;
        }
        else if (normalizedProgress < trackPath.topRatio + trackPath.rightRatio + trackPath.bottomRatio) {
            const segmentProgress = (normalizedProgress - trackPath.topRatio - trackPath.rightRatio) / trackPath.bottomRatio;
            x = trackPath.margin + trackPath.width - (segmentProgress * trackPath.width);
            y = trackPath.margin + trackPath.height;
            angle = 180;
        }
        else {
            const segmentProgress = (normalizedProgress - trackPath.topRatio - trackPath.rightRatio - trackPath.bottomRatio) / trackPath.leftRatio;
            x = trackPath.margin;
            y = trackPath.margin + trackPath.height - (segmentProgress * trackPath.height);
            angle = 270;
        }
        
        return { x, y, angle };
    }

    // 시각적 업데이트 (기존과 동일)
    updateVisual(trackPath) {
        if (!this.element) return;
        
        const pos = this.getPosition(trackPath);
        const vehicleSize = Math.min(window.innerWidth, window.innerHeight) * CONFIG.TRACK.VEHICLE_SIZE_RATIO;
        
        const offset = vehicleSize * 0.35;
        let left = pos.x - vehicleSize/2;
        let top = pos.y - vehicleSize/2;
        if (pos.angle === 0 || pos.angle === 180) {
            top -= offset;
        } else if (pos.angle === 90) {
            const isMobile = window.innerWidth <= 768;
            const extraOffset = isMobile ? vehicleSize * 0.6 : 0;
            left += offset - extraOffset;
        } else if (pos.angle === 270) {
            left -= offset;
        }
        this.element.style.left = left + 'px';
        this.element.style.top = top + 'px';
        
        if (this.centerDot) {
            this.centerDot.style.left = (pos.x - 2) + 'px';
            this.centerDot.style.top = (pos.y - 2) + 'px';
        }
        
        let baseTransform = '';
        if (pos.angle === 90) {
            baseTransform = 'rotate(90deg)';
        } else if (pos.angle === 180) {
            baseTransform = 'scaleX(-1)';
        } else if (pos.angle === 270) {
            baseTransform = 'rotate(-90deg)';
        } else {
            baseTransform = 'scaleX(1)';
        }
        
        let statusTransform = '';
        if (this.stunned) {
            statusTransform = baseTransform;
        } else if (this.boosted) {
            statusTransform = baseTransform + ' scale(1.2)';
        } else if (this.reversed) {
            statusTransform = baseTransform;
        } else {
            statusTransform = baseTransform;
        }
        
        this.element.style.transform = statusTransform;
        
        if (this.nameElement) {
            this.nameElement.style.left = (pos.x - vehicleSize/2) + 'px';
            this.nameElement.style.top = (pos.y + vehicleSize/2 + 5) + 'px';
        }
        
        if (this.lottieAnimation) {
            if (this.stunned) {
                this.lottieAnimation.setSpeed(0.1);
            } else if (this.boosted) {
                this.lottieAnimation.setSpeed(3.0);
            } else if (this.reversed) {
                this.lottieAnimation.setDirection(-1);
                this.lottieAnimation.setSpeed(2.0);
            } else {
                this.lottieAnimation.setDirection(1);
                this.lottieAnimation.setSpeed(1.5);
            }
        }
        
        this.element.className = 'vehicle lottie-container';
        if (!this.finished) this.element.classList.add('moving');
        if (this.stunned) this.element.classList.add('stunned');
        if (this.boosted) this.element.classList.add('boosted');
        if (this.reversed) this.element.classList.add('reversed');
    }

    fadeOut() {
        if (this.element) {
            this.element.style.display = 'none';
        }
        if (this.nameElement) {
            this.nameElement.style.display = 'none';
        }
        if (this.lottieAnimation) {
            this.lottieAnimation.pause();
        }
    }
}