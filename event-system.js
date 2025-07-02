// event-system.js - 긴장감 강화 버전 (완전판)
class EventSystem {
    constructor() {
        this.events = [
            {
                name: '💣 대폭발!',
                description: '선두 2명이 크게 느려진다!',
                execute: (players) => this.bombEvent(players)
            },
            {
                name: '⚡ 번개 공격!',
                description: '상위권이 마비된다!',
                execute: (players) => this.lightningEvent(players)
            },
            {
                name: '🚀 터보 부스터!',
                description: '꼴찌가 폭발적으로 빨라진다!',
                execute: (players) => this.boostEvent(players)
            },
            {
                name: '🌪️ 대혼란!',
                description: '모든 순위가 뒤바뀐다!',
                execute: (players) => this.chaosEvent(players)
            },
            {
                name: '🎯 저격!',
                description: '1등이 꼴찌가 된다!',
                execute: (players) => this.snipeEvent(players)
            },
            {
                name: '🔥 각성!',
                description: '하위권 전체가 각성한다!',
                execute: (players) => this.spurtEvent(players)
            }
        ];
        this.usedEvents = [];
    }

    triggerRandomEvent(players) {
        const activePlayers = players.filter(p => !p.finished);
        if (activePlayers.length < 2) return;
        
        const availableEvents = this.events.filter((_, index) => 
            !this.usedEvents.includes(index)
        );
        
        if (availableEvents.length === 0) {
            this.usedEvents = [];
            return this.triggerRandomEvent(players);
        }
        
        const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        const eventIndex = this.events.indexOf(event);
        this.usedEvents.push(eventIndex);
        
        this.showEventNotification(event.name, event.description);
        event.execute(activePlayers);
    }

    // 🎯 이벤트들을 더 임팩트 있게 강화

    bombEvent(players) {
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const topPlayers = sorted.slice(0, Math.min(2, sorted.length)); // 상위 2명
        
        topPlayers.forEach(player => {
            player.applyStun(3000); // 3초 긴 스턴
            this.addParticleEffect(player.element, '💥', '#ff4757');
            
            // 추가 파티클 효과
            setTimeout(() => {
                this.addParticleEffect(player.element, '🔥', '#ff4757');
            }, 500);
        });
    }

    lightningEvent(players) {
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const targetCount = Math.min(3, Math.ceil(players.length / 2));
        const targets = sorted.slice(0, targetCount);
        
        targets.forEach(target => {
            target.applyStun(3000); // 3초 스턴
            this.addParticleEffect(target.element, '⚡', '#fdcb6e');
            
            // 연쇄 번개 효과
            setTimeout(() => {
                this.addParticleEffect(target.element, '⚡', '#fdcb6e');
            }, 300);
        });
    }

    boostEvent(players) {
        const sorted = players.sort((a, b) => a.progress - b.progress);
        const bottomPlayers = sorted.slice(0, Math.min(2, sorted.length));
        
        bottomPlayers.forEach(player => {
            player.applyBoost(6000); // 6초 긴 부스트
            this.addParticleEffect(player.element, '🚀', '#00b894');
            
            // 연속 부스터 효과
            setTimeout(() => {
                this.addParticleEffect(player.element, '✨', '#00b894');
            }, 1000);
            setTimeout(() => {
                this.addParticleEffect(player.element, '💫', '#00b894');
            }, 2000);
        });
    }

    // 🌪️ 새로운 대혼란 이벤트 (더 극적)
    chaosEvent(players) {
        const activePlayers = players.filter(p => !p.finished);
        if (activePlayers.length < 2) return;
        
        // 진행률들을 완전히 섞기
        const progressValues = activePlayers.map(p => p.progress);
        const shuffledProgress = [...progressValues];
        
        // Fisher-Yates 셔플
        for (let i = shuffledProgress.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledProgress[i], shuffledProgress[j]] = [shuffledProgress[j], shuffledProgress[i]];
        }
        
        // 섞인 진행률 재배정
        activePlayers.forEach((player, index) => {
            player.progress = shuffledProgress[index];
            this.addParticleEffect(player.element, '🌪️', '#a29bfe');
            
            // 혼란 효과 연출
            setTimeout(() => {
                this.addParticleEffect(player.element, '💫', '#a29bfe');
            }, 200 * index);
        });
        
        console.log('🌪️ 대혼란! 모든 순위가 뒤바뀌었습니다!');
    }

    // 🎯 1등 저격 이벤트
    snipeEvent(players) {
        if (players.length < 2) return;
        
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const first = sorted[0];  // 1등
        const last = sorted[sorted.length - 1];  // 꼴찌
        
        // 진행률 교환
        const tempProgress = first.progress;
        first.progress = last.progress;
        last.progress = tempProgress;
        
        // 파티클 효과
        this.addParticleEffect(first.element, '🎯', '#e17055');
        this.addParticleEffect(last.element, '🚀', '#e17055');
        
        // 교환 효과 연출
        setTimeout(() => {
            this.addParticleEffect(first.element, '💫', '#e17055');
            this.addParticleEffect(last.element, '💫', '#e17055');
        }, 300);
        
        console.log('🎯 저격! 1등과 꼴찌가 자리를 바꿨습니다!');
    }

    // 🔥 막판 스퍼트 이벤트
    spurtEvent(players) {
        const sorted = players.sort((a, b) => a.progress - b.progress);
        const bottomHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
        
        bottomHalf.forEach(player => {
            player.applyBoost(5000); // 5초 부스트
            this.addParticleEffect(player.element, '🔥', '#fd79a8');
            
            // 스퍼트 효과 연출
            setTimeout(() => {
                this.addParticleEffect(player.element, '💨', '#fd79a8');
            }, 500);
            setTimeout(() => {
                this.addParticleEffect(player.element, '⚡', '#fd79a8');
            }, 1000);
        });
    }

    // 기존 이벤트들도 강화
    reverseEvent(players) {
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const upperHalf = sorted.slice(0, Math.ceil(players.length / 2));
        
        upperHalf.forEach(player => {
            player.applyReverse(4000); // 4초 역주행
            this.addParticleEffect(player.element, '🔄', '#a29bfe');
        });
    }

    swapEvent(players) {
        if (players.length < 2) return;
        
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const first = sorted[0];
        const second = sorted[1];
        
        // 점진적 위치 교환 (순간이동 방지)
        const tempProgress = first.progress;
        const progressDiff = first.progress - second.progress;
        
        // 1등을 뒤로, 2등을 앞으로 점진적 이동
        first.progress = second.progress + progressDiff * 0.3;
        second.progress = tempProgress - progressDiff * 0.3;
        
        this.addParticleEffect(first.element, '🎯', '#74b9ff');
        this.addParticleEffect(second.element, '🎯', '#74b9ff');
    }

    // 파티클 효과 강화
    addParticleEffect(element, emoji, color) {
        if (!element) return;
        
        const player = this.getPlayerFromElement(element);
        let direction = 'top';
        
        if (player && player.getPosition) {
            const trackPath = this.getTrackPath();
            if (trackPath) {
                const pos = player.getPosition(trackPath);
                if (pos.angle === 90) direction = 'right';
                else if (pos.angle === 180) direction = 'bottom';
                else if (pos.angle === 270) direction = 'left';
            }
        }
        
        const particle = document.createElement('div');
        particle.textContent = emoji;
        particle.style.cssText = `
            position: absolute;
            font-size: 20px;
            pointer-events: none;
            z-index: 1000;
            text-shadow: 0 0 10px ${color};
        `;
        
        const rect = element.getBoundingClientRect();
        particle.style.left = rect.left + 'px';
        particle.style.top = rect.top + 'px';
        
        // 더 임팩트 있는 파티클 애니메이션
        if (!document.getElementById('particle-styles')) {
            const style = document.createElement('style');
            style.id = 'particle-styles';
            style.textContent = `
                @keyframes particle-float-top {
                    0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
                    50% { transform: translateY(-30px) scale(1.5) rotate(180deg); opacity: 1; }
                    100% { transform: translateY(-60px) scale(2) rotate(360deg); opacity: 0; }
                }
                @keyframes particle-float-right {
                    0% { transform: rotate(90deg) translateY(0) scale(1); opacity: 1; }
                    50% { transform: rotate(90deg) translateY(-30px) scale(1.5); opacity: 1; }
                    100% { transform: rotate(90deg) translateY(-60px) scale(2); opacity: 0; }
                }
                @keyframes particle-float-bottom {
                    0% { transform: scaleX(-1) translateY(0) scale(1); opacity: 1; }
                    50% { transform: scaleX(-1) translateY(-30px) scale(1.5); opacity: 1; }
                    100% { transform: scaleX(-1) translateY(-60px) scale(2); opacity: 0; }
                }
                @keyframes particle-float-left {
                    0% { transform: rotate(-90deg) translateY(0) scale(1); opacity: 1; }
                    50% { transform: rotate(-90deg) translateY(-30px) scale(1.5); opacity: 1; }
                    100% { transform: rotate(-90deg) translateY(-60px) scale(2); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 방향에 따른 애니메이션 적용
        particle.style.animation = `particle-float-${direction} 1.5s ease-out forwards`;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
    
    // 요소에서 플레이어 객체 찾기
    getPlayerFromElement(element) {
        if (window.gameController && window.gameController.players) {
            return window.gameController.players.find(p => p.element === element);
        }
        return null;
    }
    
    // 트랙 경로 정보 가져오기
    getTrackPath() {
        if (window.gameController && window.gameController.renderer) {
            return window.gameController.renderer.trackPath;
        }
        return null;
    }

    // 🎆 다중 파티클 효과 (더 화려하게)
    addMultipleParticles(element, emojis, color) {
        emojis.forEach((emoji, index) => {
            setTimeout(() => {
                this.addParticleEffect(element, emoji, color);
            }, index * 150);
        });
    }

    // 🔥 폭발적 파티클 효과
    addExplosionEffect(element) {
        const explosionEmojis = ['💥', '🔥', '💫', '✨', '⚡'];
        explosionEmojis.forEach((emoji, index) => {
            setTimeout(() => {
                this.addParticleEffect(element, emoji, '#ff4757');
            }, index * 100);
        });
    }

    // 📢 이벤트 알림 강화
    showEventNotification(title, description) {
        const notification = document.getElementById('eventNotification');
        
        // 이벤트 종류별 색상 구분
        let bgColor = '#ff4757';
        if (title.includes('🚀') || title.includes('🔥')) bgColor = '#00b894';
        else if (title.includes('⚡') || title.includes('💣')) bgColor = '#fdcb6e';
        else if (title.includes('🌪️') || title.includes('🎯')) bgColor = '#a29bfe';
        
        notification.style.background = `linear-gradient(45deg, ${bgColor}, ${bgColor}cc)`;
        notification.innerHTML = `
            <div style="font-size: 20px; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${title}</div>
            <div style="font-size: 14px; opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${description}</div>
        `;
        notification.style.display = 'block';
        
        // 더 긴 표시 시간
        setTimeout(() => {
            notification.style.display = 'none';
        }, 2500);
    }

    reset() {
        this.usedEvents = [];
    }
}