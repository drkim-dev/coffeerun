// event-system.js - GameController와 연결된 스킬 시스템

class EventSystem {
    constructor() {
        this.events = [
            {
                name: '💣 대폭발!',
                description: '선두 2명이 느려진다!',
                execute: (players) => this.bombEvent(players)
            },
            {
                name: '⚡ 번개 공격!',
                description: '상위권이 마비된다!',
                execute: (players) => this.lightningEvent(players)
            },
            {
                name: '🚀 터보 부스터!',
                description: '꼴찌가 빨라진다!',
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
                description: '하위권이 각성한다!',
                execute: (players) => this.spurtEvent(players)
            }
        ];
        this.usedEvents = [];
    }

    // 🆕 GameController 참조 획득
    getGameController() {
        return window.gameController;
    }

    // 🆕 스킬 종료시 간격 재조정 호출
    scheduleSpacingUpdate(delay = 100) {
        setTimeout(() => {
            const controller = this.getGameController();
            if (controller && typeof controller.onSkillEnd === 'function') {
                controller.onSkillEnd();
            }
        }, delay);
    }

    // 💣 대폭발 - 스턴 스킬 (추월당함 허용)
    bombEvent(players) {
        const sorted = players.sort((a, b) => b.progress - a.progress); // progress 기준 정렬
        const topPlayers = sorted.slice(0, Math.min(2, sorted.length));
        
        this.showEventNotification('💣 대폭발!', '선두 2명이 느려진다!', 3000);
        
        // 🎯 상위권만 스턴 + 이펙트
        topPlayers.forEach(player => {
            player.applyStun(3000);
           // this.addParticleEffect(player.element, '💥', '#ff4757');
            
            setTimeout(() => {
            //    this.addParticleEffect(player.element, '🔥', '#ff4757');
            }, 500);
        });

        // 🆕 뒷사람들은 조용히 속도만 증가 (이펙트 없음)
        sorted.forEach(player => {
            if (!topPlayers.includes(player)) {
                player.applyBoost(3000); // 부스트 적용하되 파티클 없음
            }
        });

        // 🆕 스킬 종료 후 간격 재조정
        this.scheduleSpacingUpdate(3000);
    }

    // ⚡ 번개공격 - 스턴 스킬 (추월당함 허용)
    lightningEvent(players) {
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const targetCount = Math.min(3, Math.ceil(players.length / 2));
        const targets = sorted.slice(0, targetCount);
        
        this.showEventNotification('⚡ 번개 공격!', '상위권이 마비된다!', 3000);
        
        // 🎯 상위권만 스턴 + 이펙트
        targets.forEach(target => {
            target.applyStun(3000);
            //this.addParticleEffect(target.element, '⚡', '#fdcb6e');
            
            setTimeout(() => {
             //   this.addParticleEffect(target.element, '⚡', '#fdcb6e');
            }, 300);
        });

        // 🆕 뒷사람들은 조용히 속도만 증가 (이펙트 없음)
        sorted.forEach(player => {
            if (!targets.includes(player)) {
                player.applyBoost(3000); // 부스트 적용하되 파티클 없음
            }
        });

        // 🆕 스킬 종료 후 간격 재조정
        this.scheduleSpacingUpdate(3000);
    }

    // 🚀 터보부스터 - 부스트 스킬 (추월 허용)
    boostEvent(players) {
        const sorted = players.sort((a, b) => a.progress - b.progress);
        const bottomPlayers = sorted.slice(0, Math.min(2, sorted.length));
        
        this.showEventNotification('🚀 터보 부스터!', '꼴찌가 빨라진다!', 5000);
        
        bottomPlayers.forEach(player => {
            player.applyBoost(5000);
            //this.addParticleEffect(player.element, '🚀', '#00b894');
            
            setTimeout(() => {
            //    this.addParticleEffect(player.element, '✨', '#00b894');
            }, 1000);
            setTimeout(() => {
             //   this.addParticleEffect(player.element, '💫', '#00b894');
            }, 2000);
        });

        // 🆕 스킬 종료 후 간격 재조정
        this.scheduleSpacingUpdate(5000);
    }

    // 🔥 각성 - 부스트 스킬 (추월 허용)
    spurtEvent(players) {
        const sorted = players.sort((a, b) => a.progress - b.progress);
        const bottomHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
        
        this.showEventNotification('🔥 각성!', '하위권이 각성한다!', 5000);
        
        bottomHalf.forEach(player => {
            player.applyBoost(5000);
            //this.addParticleEffect(player.element, '🔥', '#fd79a8');
            
            setTimeout(() => {
               // this.addParticleEffect(player.element, '💨', '#fd79a8');
            }, 500);
            setTimeout(() => {
               // this.addParticleEffect(player.element, '⚡', '#fd79a8');
            }, 1000);
        });

        // 🆕 스킬 종료 후 간격 재조정
        this.scheduleSpacingUpdate(5000);
    }

    // 🌪️ 대혼란 - 즉시 효과 (추월 시스템 무시)
    chaosEvent(players) {
        const activePlayers = players.filter(p => !p.finished);
        if (activePlayers.length < 2) return;
        
        this.showEventNotification('🌪️ 대혼란!', '모든 순위가 뒤바뀐다!', 3000);
        
        // progress 기준으로 섞기
        const progressValues = activePlayers.map(p => p.progress);
        const shuffledProgress = [...progressValues];
        
        // Fisher-Yates 셔플
        for (let i = shuffledProgress.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledProgress[i], shuffledProgress[j]] = [shuffledProgress[j], shuffledProgress[i]];
        }
        
        // 🆕 progress만 업데이트
        activePlayers.forEach((player, index) => {
            player.progress = shuffledProgress[index];
            
            //this.addParticleEffect(player.element, '🌪️', '#a29bfe');
            
            setTimeout(() => {
                //this.addParticleEffect(player.element, '💫', '#a29bfe');
            }, 200 * index);
        });
        
        // 🆕 즉시 간격 재조정 (섞인 후 새로운 간격 패턴 적용)
        this.scheduleSpacingUpdate(500);
        
        console.log('🌪️ 대혼란! 모든 순위가 뒤바뀌었습니다!');
    }

    // 🎯 저격 - 즉시 효과 (추월 시스템 무시)
    snipeEvent(players) {
        if (players.length < 2) return;
        
        this.showEventNotification('🎯 저격!', '1등이 꼴찌가 된다!', 3000);
        
        const sorted = players.sort((a, b) => b.progress - a.progress);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        
        // 🆕 progress 교환
        const tempProgress = first.progress;
        first.progress = last.progress;
        last.progress = tempProgress;
        
        //this.addParticleEffect(first.element, '🎯', '#e17055');
        //this.addParticleEffect(last.element, '🚀', '#e17055');
        
        setTimeout(() => {
            this.addParticleEffect(first.element, '💫', '#e17055');
            this.addParticleEffect(last.element, '💫', '#e17055');
        }, 300);
        
        // 🆕 즉시 간격 재조정 (교환 후 새로운 간격 패턴 적용)
        this.scheduleSpacingUpdate(500);
        
        console.log('🎯 저격! 1등과 꼴찌가 자리를 바꿨습니다!');
    }

    // 수정된 알람 표시 함수
    showEventNotification(title, description, duration = 3000) {
        const notification = document.getElementById('eventNotification');
        
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
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, duration);
    }

    // 파티클 효과 (기존 코드)
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
        
        particle.style.animation = `particle-float-${direction} 1.5s ease-out forwards`;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
    
    getPlayerFromElement(element) {
        if (window.gameController && window.gameController.players) {
            return window.gameController.players.find(p => p.element === element);
        }
        return null;
    }
    
    getTrackPath() {
        if (window.gameController && window.gameController.renderer) {
            return window.gameController.renderer.trackPath;
        }
        return null;
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
        
        event.execute(activePlayers);
    }

    reset() {
        this.usedEvents = [];
    }
}