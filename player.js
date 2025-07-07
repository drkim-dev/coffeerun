// player.js - 자연스러운 속도 조정 간격 시스템

class Player {
    constructor(name, lottieFile, index) {
        this.name = name;
        this.lottieFile = lottieFile;
        this.index = index;
        
        this.progress = this.getInitialPosition(index); 
        this.baseSpeed = this.generateUniqueSpeed();
        
        this.element = null;
        this.nameElement = null;
        this.lottieAnimation = null;
        this.stunned = false;
        this.boosted = false;
        this.reversed = false;
        this.finished = false;
        this.finishTime = 0;
        
        // 🆕 속도 조정 기반 간격 시스템
        this.allowOverlap = false;           // 추월 허용 여부 (스킬 중에만 true)
        this.targetSpacing = 0;              // 목표 간격
        this.spacingSpeedMultiplier = 1.0;   // 간격 조정용 속도 배수
        this.lastSpacingCheck = 0;           // 마지막 간격 체크 시간
        
        this.personalMultiplier = 0.8 + Math.random() * 0.4; 
        this.lastRandomSpeedUpdate = 0; //
        this.consistencyFactor = Math.random();
    }

    // 🆕 초기 목표 간격 설정
    setInitialSpacing(playerIndex, totalPlayers) {
        // 플레이어별로 목표 간격 설정 (앞 플레이어와의 거리)
        const spacingOptions = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12]; // 2%~12%
        this.targetSpacing = spacingOptions[Math.floor(Math.random() * spacingOptions.length)]; 
        
        console.log(`${this.name} 목표 간격: ${(this.targetSpacing * 100).toFixed(1)}%`); 
    }

    // 🆕 주기적으로 새로운 목표 간격 설정 (5-7초마다)
    redistributeSpacing(allPlayers) {
        if (this.allowOverlap) return; // 스킬 중에는 간격 조정 안함
        
        const spacingOptions = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12];
        this.targetSpacing = spacingOptions[Math.floor(Math.random() * spacingOptions.length)];
        
        console.log(`${this.name} 새로운 목표 간격: ${(this.targetSpacing * 100).toFixed(1)}%`);
    }

    // 🆕 자연스러운 속도 조정으로 간격 유지
    adjustSpacingSpeed(allPlayers) {
        if (this.allowOverlap || this.finished) {
            // 스킬 중이거나 완주했으면 간격 조정 안함
            this.spacingSpeedMultiplier = 1.0;
            return;
        }

        const currentTime = Date.now();
        // 너무 자주 체크하지 않음 (0.5초마다)
        if (currentTime - this.lastSpacingCheck < 500) return;
        this.lastSpacingCheck = currentTime;

        // 현재 순위 기준으로 정렬 (진행률 기준)
        const activePlayers = allPlayers.filter(p => !p.finished);
        const sortedByProgress = activePlayers.sort((a, b) => b.progress - a.progress);
        const myRankIndex = sortedByProgress.findIndex(p => p === this);
        
        if (myRankIndex === 0) {
            // 1등은 간격 조정 안함
            this.spacingSpeedMultiplier = 1.0;
            return;
        }

        // 바로 앞 플레이어와의 거리 계산
        const playerAhead = sortedByProgress[myRankIndex - 1];
        const currentDistance = playerAhead.progress - this.progress;
        
        // 🎯 목표 간격과 현재 간격 비교
        const distanceDifference = currentDistance - this.targetSpacing;
        
        if (Math.abs(distanceDifference) < 0.01) {
            // 목표 간격에 거의 도달했으면 조정 안함
            this.spacingSpeedMultiplier = 1.0;
        } else if (distanceDifference > 0) {
            // 너무 멀리 떨어져 있음 → 살짝 빨라지기
            this.spacingSpeedMultiplier = 1.0 + Math.min(distanceDifference * 2, 0.15); // 최대 15% 증가
        } else {
            // 너무 가까이 붙어있음 → 살짝 느려지기
            this.spacingSpeedMultiplier = 1.0 + Math.max(distanceDifference * 2, -0.25); // 최대 15% 감소
        }
        
        // 🚫 뒤로 가는 것 방지 (최소 50% 속도는 유지)
        this.spacingSpeedMultiplier = Math.max(0.5, this.spacingSpeedMultiplier);
        
        // 디버그 로그 (너무 많이 나오지 않게 가끔만)
        if (Math.random() < 0.05) { // 5% 확률로만 로그
            console.log(`${this.name}: 거리차=${(distanceDifference*100).toFixed(1)}%, 속도배수=${this.spacingSpeedMultiplier.toFixed(2)}`);
        }
    }

    updatePosition(deltaTime, allPlayers = [], trackPath) {
        if (this.finished || this.stunned) return;

        const currentTime = Date.now();
        if (currentTime - this.lastRandomSpeedUpdate >= CONFIG.SPEED.RANDOM_INTERVAL) {
            this.updateRandomSpeed(allPlayers);
            this.lastRandomSpeedUpdate = currentTime;
        }

        // 🆕 간격 조정 속도 계산
        this.adjustSpacingSpeed(allPlayers);

        let speed = this.baseSpeed;
        
        // 캐치업 시스템 (스킬 중일 때만 적용)
        if (allPlayers.length > 0 && this.allowOverlap) {
            const ranking = this.getRanking(allPlayers);
            const totalPlayers = allPlayers.filter(p => !p.finished).length;
            
            if (ranking === totalPlayers) {
                speed *= 1.3; // 꼴찌 30% 부스트 (스킬 중에만)
            } else if (ranking === 1) {
                speed *= 0.9; // 1등 10% 페널티 (스킬 중에만)
            }
        }
        
        // 상태별 효과
        if (this.boosted) speed *= 2.8;
        if (this.reversed) speed *= -1.2;
        
        // 랜덤 속도
        speed *= this.randomSpeedMultiplier;
        
        // 🆕 간격 조정 속도 적용 (가장 중요!)
        speed *= this.spacingSpeedMultiplier;
        
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

    // 🆕 스킬 적용 함수들 - 추월 허용 설정
    applyStun(duration = 3500) {
        this.stunned = true;
        this.allowOverlap = true; // 스턴 중에는 추월당할 수 있음
        
        setTimeout(() => {
            this.stunned = false;
            this.allowOverlap = false; // 스킬 종료시 간격 조정 복구
        }, duration);
    }

    applyBoost(duration = 4500) {
        this.boosted = true;
        this.allowOverlap = true; // 부스트 중에는 추월 가능
        
        setTimeout(() => {
            this.boosted = false;
            this.allowOverlap = false; // 스킬 종료시 간격 조정 복구
        }, duration);
    }

    applyReverse(duration = 4000) {
        this.reversed = true;
        this.allowOverlap = true;
        
        setTimeout(() => {
            this.reversed = false;
            this.allowOverlap = false;
        }, duration);
    }

    // 기존 함수들...
    getInitialPosition(index) {
        if (!CONFIG.STARTING_POSITIONS) return 0;
        
        const baseSpread = CONFIG.STARTING_POSITIONS.SPREAD_FACTOR;
        const randomSpread = CONFIG.STARTING_POSITIONS.RANDOM_SPREAD;
        
        const baseOffset = index * baseSpread;
        const randomOffset = (Math.random() - 0.5) * randomSpread;
        
        return Math.max(0, -(baseOffset + randomOffset));
    }

    generateUniqueSpeed() {
        const min = CONFIG.SPEED.BASE_MIN;
        const max = CONFIG.SPEED.BASE_MAX;
        const range = max - min;
        
        const personalRange = range * (0.7 + Math.random() * 0.6);
        const personalMin = min + (Math.random() * (range - personalRange));
        
        return personalMin + Math.random() * personalRange;
    }

    updateRandomSpeed(allPlayers = []) {
        const ranking = this.getRanking(allPlayers);
        const totalPlayers = allPlayers.filter(p => !p.finished).length;
        
        const stabilityFactor = this.consistencyFactor > 0.7 ? 1.2 : 0.8;
        const baseRandom = 0.8 + Math.random() * 0.4;
        this.randomSpeedMultiplier = baseRandom * this.personalMultiplier * stabilityFactor;
        
        // 스킬 중일 때만 순위별 조정
        if (this.allowOverlap) {
            if (ranking === totalPlayers) {
                this.randomSpeedMultiplier *= 1.2;
            } else if (ranking === totalPlayers - 1) {
                this.randomSpeedMultiplier *= 1.1;
            } else if (ranking === 1) {
                this.randomSpeedMultiplier *= 0.9;
            } else if (ranking === 2) {
                this.randomSpeedMultiplier *= 0.95;
            }
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