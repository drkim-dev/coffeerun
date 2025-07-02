// player.js - 간격 확대 & 긴장감 강화 버전
class Player {
    constructor(name, lottieFile, index) {
        this.name = name;
        this.lottieFile = lottieFile;
        this.index = index;
        
        // 🎯 초기 위치를 간격을 두고 시작
        this.progress = this.getInitialPosition(index); 
        
        // 🚀 개인별 고유한 기본 속도 (격차 확대)
        this.baseSpeed = this.generateUniqueSpeed();
        
        this.element = null;
        this.nameElement = null;
        this.lottieAnimation = null;
        this.stunned = false;
        this.boosted = false;
        this.reversed = false;
        this.finished = false;
        this.finishTime = 0;
        
        // 🎯 개인 특성 적당히 (너무 큰 격차 방지)
        this.personalMultiplier = 0.8 + Math.random() * 0.4; // 0.7~1.3 → 0.8~1.2 (격차 줄임)
        this.lastRandomSpeedUpdate = 0;
        this.consistencyFactor = Math.random(); // 일관성 vs 변동성
    }

    // 🎯 초기 위치 간격 설정
    getInitialPosition(index) {
        if (!CONFIG.STARTING_POSITIONS) return 0;
        
        const baseSpread = CONFIG.STARTING_POSITIONS.SPREAD_FACTOR;
        const randomSpread = CONFIG.STARTING_POSITIONS.RANDOM_SPREAD;
        
        // 인덱스별로 약간씩 뒤에서 시작 + 랜덤 요소
        const baseOffset = index * baseSpread;
        const randomOffset = (Math.random() - 0.5) * randomSpread;
        
        return Math.max(0, -(baseOffset + randomOffset));
    }

    // 🚀 개인별 고유 속도 생성 (격차 적당히)
    generateUniqueSpeed() {
        const min = CONFIG.SPEED.BASE_MIN;
        const max = CONFIG.SPEED.BASE_MAX;
        const range = max - min;
        
        // 플레이어별로 적당한 속도 범위 할당
        const personalRange = range * (0.7 + Math.random() * 0.6); // 격차 적당히
        const personalMin = min + (Math.random() * (range - personalRange));
        
        return personalMin + Math.random() * personalRange;
    }

    updateRandomSpeed(allPlayers = []) {
        const ranking = this.getRanking(allPlayers);
        const totalPlayers = allPlayers.filter(p => !p.finished).length;
        
        // 🎯 일관성 vs 변동성 개인 특성 반영
        const stabilityFactor = this.consistencyFactor > 0.7 ? 1.2 : 0.8;
        
        // 🚀 기본 랜덤 속도를 개인 특성으로 조정
        const baseRandom = 0.8 + Math.random() * 0.4;
        this.randomSpeedMultiplier = baseRandom * this.personalMultiplier * stabilityFactor;
        
        // 순위별 조정 강화 (격차 줄이기)
        if (ranking === totalPlayers) {
            this.randomSpeedMultiplier *= 1.2; // 1.1 → 1.2 (꼴찌 더 도움)
        } else if (ranking === totalPlayers - 1) {
            this.randomSpeedMultiplier *= 1.1; // 뒤에서 2등도 도움
        } else if (ranking === 1) {
            this.randomSpeedMultiplier *= 0.9; // 0.95 → 0.9 (1등 더 페널티)
        } else if (ranking === 2) {
            this.randomSpeedMultiplier *= 0.95; // 2등도 약간 페널티
        }
    }
    
    getLeaderProgress(allPlayers) {
        const activePlayers = allPlayers.filter(p => !p.finished);
        return Math.max(...activePlayers.map(p => p.progress));
    }

    updatePosition(deltaTime, allPlayers = [], trackPath) {
        if (this.finished || this.stunned) return;

        const currentTime = Date.now();
        if (currentTime - this.lastRandomSpeedUpdate >= CONFIG.SPEED.RANDOM_INTERVAL) {
            this.updateRandomSpeed(allPlayers);
            this.lastRandomSpeedUpdate = currentTime;
        }

        let speed = this.baseSpeed;
        
        // 🎯 캐치업 시스템 대폭 약화 (격차 유지)
        if (allPlayers.length > 0) {
            const ranking = this.getRanking(allPlayers);
            const totalPlayers = allPlayers.filter(p => !p.finished).length;
            const leader = this.getLeaderProgress(allPlayers);
            const progressGap = leader - this.progress;
            
            // 캐치업은 적당한 격차일 때부터 (25% 이상)
            if (progressGap >= CONFIG.CATCHUP_SYSTEM.MIN_CATCHUP_DISTANCE) {
                const gapRatio = Math.min(progressGap / CONFIG.CATCHUP_SYSTEM.MAX_CATCHUP_DISTANCE, 1.0);
                
                if (ranking === totalPlayers) {
                    // 꼴찌는 적당한 부스트
                    const boost = 1.0 + (CONFIG.CATCHUP_SYSTEM.LAST_PLACE_BOOST - 1.0) * gapRatio;
                    speed *= boost;
                } else if (ranking === totalPlayers - 1) {
                    // 뒤에서 2등도 도움
                    const boost = 1.0 + (CONFIG.CATCHUP_SYSTEM.SECOND_LAST_BOOST - 1.0) * gapRatio;
                    speed *= boost;
                }
            }
            
            // 상위권 페널티도 최소화
            if (ranking === 1) {
                speed *= CONFIG.CATCHUP_SYSTEM.LEADER_PENALTY;
            } else if (ranking === 2) {
                speed *= CONFIG.CATCHUP_SYSTEM.SECOND_PENALTY;
            }
        }
        
        // 상태별 효과
        if (this.boosted) speed *= 2.8;        // 부스터는 더 강하게
        if (this.reversed) speed *= -1.2;      // 역주행도 더 강하게
        
        speed *= this.randomSpeedMultiplier;
        
        this.progress += speed * (deltaTime / 1000);
        this.progress = Math.max(0, this.progress);
        
        // 완주 체크
        if (this.progress >= 1 && !this.finished) {
            this.finished = true;
            this.finishTime = Date.now();
            this.fadeOut();
        }
    }

    getRanking(allPlayers) {
        const activePlayers = allPlayers.filter(p => !p.finished);
        const sorted = activePlayers.sort((a, b) => b.progress - a.progress);
        return sorted.findIndex(p => p === this) + 1;
    }

    getPosition(trackPath) {
        const normalizedProgress = this.progress % 1;
        
        let x, y, angle = 0;
        
        if (normalizedProgress < trackPath.topRatio) {
            // 상단 직선
            const segmentProgress = normalizedProgress / trackPath.topRatio;
            x = trackPath.margin + (segmentProgress * trackPath.width);
            y = trackPath.margin;
            angle = 0;
        } 
        else if (normalizedProgress < trackPath.topRatio + trackPath.rightRatio) {
            // 우측 직선
            const segmentProgress = (normalizedProgress - trackPath.topRatio) / trackPath.rightRatio;
            x = trackPath.margin + trackPath.width;
            y = trackPath.margin + (segmentProgress * trackPath.height);
            angle = 90;
        }
        else if (normalizedProgress < trackPath.topRatio + trackPath.rightRatio + trackPath.bottomRatio) {
            // 하단 직선
            const segmentProgress = (normalizedProgress - trackPath.topRatio - trackPath.rightRatio) / trackPath.bottomRatio;
            x = trackPath.margin + trackPath.width - (segmentProgress * trackPath.width);
            y = trackPath.margin + trackPath.height;
            angle = 180;
        }
        else {
            // 좌측 직선
            const segmentProgress = (normalizedProgress - trackPath.topRatio - trackPath.rightRatio - trackPath.bottomRatio) / trackPath.leftRatio;
            x = trackPath.margin;
            y = trackPath.margin + trackPath.height - (segmentProgress * trackPath.height);
            angle = 270;
        }
        
        return { x, y, angle };
    }

    updateVisual(trackPath) {
        if (!this.element) return;
        
        const pos = this.getPosition(trackPath);
        const vehicleSize = Math.min(window.innerWidth, window.innerHeight) * CONFIG.TRACK.VEHICLE_SIZE_RATIO;
        
        // Lottie 이미지 상단 공백 보정
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
        
        // 중심점 업데이트
        if (this.centerDot) {
            this.centerDot.style.left = (pos.x - 2) + 'px';
            this.centerDot.style.top = (pos.y - 2) + 'px';
        }
        
        // 방향 설정
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
        
        // 상태별 효과
        let statusTransform = '';
        if (this.stunned) {
            statusTransform = baseTransform;
        } else if (this.boosted) {
            statusTransform = baseTransform + ' scale(1.2)'; // 부스터 효과 강화
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
        
        // Lottie 애니메이션 속도 조정
        if (this.lottieAnimation) {
            if (this.stunned) {
                this.lottieAnimation.setSpeed(0.1);
            } else if (this.boosted) {
                this.lottieAnimation.setSpeed(3.0); // 부스터시 더 빠르게
            } else if (this.reversed) {
                this.lottieAnimation.setDirection(-1);
                this.lottieAnimation.setSpeed(2.0);
            } else {
                this.lottieAnimation.setDirection(1);
                this.lottieAnimation.setSpeed(1.5);
            }
        }
        
        // 상태 클래스 적용
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

    applyStun(duration = 3500) { // 스턴 시간 늘림
        this.stunned = true;
        setTimeout(() => {
            this.stunned = false;
        }, duration);
    }

    applyBoost(duration = 4500) { // 부스트 시간 늘림
        this.boosted = true;
        setTimeout(() => {
            this.boosted = false;
        }, duration);
    }

    applyReverse(duration = 4000) { // 역주행 시간 늘림
        this.reversed = true;
        setTimeout(() => {
            this.reversed = false;
        }, duration);
    }
}