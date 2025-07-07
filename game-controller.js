// game-controller.js - 간소화된 게임 컨트롤러 (복잡한 간격 시스템 제거)

class GameController {
    constructor() {
        this.players = [];
        this.gameRunning = false;
        this.eventSystem = new EventSystem();
        this.renderer = new RaceRenderer();
        this.raceStartTime = 0;
        this.lastFrameTime = 0;
        this.selectedPlayerCount = CONFIG.DEFAULT_PLAYERS;
        this.selectedLoserRank = CONFIG.DEFAULT_LOSER_RANK;
        this.shuffledVehicles = [];
        
        // 기타 선택 관련 변수
        this.customRanksSelected = [];
        this.selectionMode = 'single';
        
        // 🆕 개인별 추월 쿨다운 관리
        this.playerOvertakeCooldowns = new Map(); // "김철수" -> 종료시간
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeUI();
        this.setupPlayerCountSelector();
        this.setupLoserRankSelector();
        this.setupResizeHandler();
    }

    // 🆕 간단한 밀어내기 시스템 + 추월 시스템 (개인 쿨다운)
        preventOverlap(players) {
            if (!CONFIG.OVERLAP_PREVENTION.ENABLED) return;
            
            // 🆕 모바일 환경 감지하여 간격 조정
            const isMobile = window.innerWidth <= 768;
            const PUSH_DISTANCE = isMobile ? 
                CONFIG.OVERLAP_PREVENTION.PUSH_DISTANCE * 1.67 : // 모바일: 1.5% × 1.67 = 2.5%
                CONFIG.OVERLAP_PREVENTION.PUSH_DISTANCE;         // PC: 1.5% 유지
            
            const PUSH_FORCE = isMobile ?
                CONFIG.OVERLAP_PREVENTION.PUSH_FORCE * 1.5 :    // 모바일: 밀어내는 힘도 증가
                CONFIG.OVERLAP_PREVENTION.PUSH_FORCE;            // PC: 기본값 유지
            
            const currentTime = Date.now();
            
            for (let i = 0; i < players.length; i++) {
                for (let j = i + 1; j < players.length; j++) {
                    const p1 = players[i];
                    const p2 = players[j];
                    
                    // 스킬 중이거나 완주했으면 패스
                    if (p1.allowOverlap || p2.allowOverlap) continue;
                    if (p1.finished || p2.finished) continue;
                    
                    // 추월 중인 플레이어는 밀어내기 제외
                    if (p1.isOvertaking || p2.isOvertaking) continue;
                    
                    const distance = Math.abs(p1.progress - p2.progress);
                    
                    if (distance < PUSH_DISTANCE) { // 🆕 동적으로 조정된 간격 사용
                        // 앞사람/뒷사람 정의
                        const frontPlayer = p1.progress > p2.progress ? p1 : p2;
                        const backPlayer = p1.progress > p2.progress ? p2 : p1;
                        
                        // 뒷사람의 추월 쿨다운 체크
                        const backPlayerCooldown = this.playerOvertakeCooldowns.get(backPlayer.name) || 0;
                        
                        // 뒷사람이 더 빠르고 개인 쿨다운이 끝났으면 추월 허용
                        if (backPlayer.baseSpeed > frontPlayer.baseSpeed && currentTime > backPlayerCooldown) {
                            // 추월 완료까지 속도 2배 증가!
                            backPlayer.isOvertaking = true;
                            backPlayer.overtakeStartTime = currentTime;
                            // 🆕 모바일에서는 추월 목표도 더 크게
                            const overtakeDistance = isMobile ? 0.04 : 0.03; // 모바일: 4%, PC: 3%
                            backPlayer.overtakeTarget = frontPlayer.progress + overtakeDistance;
                            
                            console.log(`🏃‍♂️ ${backPlayer.name}이 ${frontPlayer.name}을 추월 시작! (${isMobile ? '모바일' : 'PC'} 모드)`);
                            
                            // 추월한 사람에게 2초 개인 쿨다운 설정
                            this.playerOvertakeCooldowns.set(backPlayer.name, currentTime + 2000);
                            
                        } else {
                            // 간격 유지 - 밀어내기 (🆕 동적으로 조정된 힘 사용)
                            frontPlayer.progress += PUSH_FORCE;
                            backPlayer.progress -= PUSH_FORCE;
                            
                            // 진행률이 음수가 되지 않도록 제한
                            p1.progress = Math.max(0, p1.progress);
                            p2.progress = Math.max(0, p2.progress);
                        }
                        
                        // 디버그 로그
                        if (CONFIG.DEBUG.SHOW_OVERLAP_PREVENTION) {
                            console.log(`${isMobile ? '[모바일]' : '[PC]'} 처리: ${p1.name} vs ${p2.name}, 거리: ${distance.toFixed(4)}, 기준: ${PUSH_DISTANCE.toFixed(3)}`);
                        }
                    }
                }
            }
            
            // 만료된 개인 쿨다운 정리
            for (const [playerName, endTime] of this.playerOvertakeCooldowns.entries()) {
                if (currentTime > endTime) {
                    this.playerOvertakeCooldowns.delete(playerName);
                }
            }
        }

    // 🆕 추월 알림 삭제 (더 이상 사용 안함)
    // showOvertakeNotification() 함수 제거

    async startGame() {
        const inputs = document.querySelectorAll('.player-input:not(.hidden) input');
        this.players = [];
        
        inputs.forEach((input, index) => {
            if (input.value.trim()) {
                this.players.push(new Player(
                    input.value.trim(),
                    this.shuffledLottieFiles[index],
                    index
                ));
            }
        });
        
        if (this.players.length < 2) {
            alert('최소 2명 이상 참가해야 합니다!');
            return;
        }
        
        if (this.selectionMode === 'custom' && this.customRanksSelected.length === 0) {
            alert('당첨 등수를 최소 1개 이상 선택해주세요!');
            return;
        }
        
        document.querySelector('.setup-container').style.display = 'none';
        document.getElementById('raceContainer').style.display = 'block';
        
        this.renderer.setupRaceTrack(this.players);
        
        await this.showCountdown();
        this.startRace();
    }

    async showCountdown() {
        for (let i = 3; i > 0; i--) {
            this.renderer.showCountdown(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.renderer.showCountdown('START!');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    startRace() {
        this.gameRunning = true;
        this.raceStartTime = Date.now();
        this.lastFrameTime = this.raceStartTime;
        this.eventSystem.reset();
        
        this.raceLoop();
        this.scheduleEvents();
        
        console.log('🏁 레이스 시작! (간소화된 시스템)');
    }

    // 🆕 간소화된 레이스 루프
    raceLoop() {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastFrameTime;
        const elapsed = currentTime - this.raceStartTime;
        const progress = (elapsed / CONFIG.RACE_DURATION) * 100;
        const timeLeft = Math.max(0, (CONFIG.RACE_DURATION - elapsed) / 1000);
        
        this.lastFrameTime = currentTime;
        
        // UI 업데이트
        this.renderer.updateProgress(progress);
        this.renderer.updateTimeDisplay(timeLeft);
        this.renderer.updateRankings(this.players);
        
        // 플레이어 위치 업데이트
        this.players.forEach(player => {
            player.updatePosition(deltaTime, this.players, this.renderer.trackPath);
        });
        
        // 🆕 간단한 밀어내기 시스템 (매 프레임마다)
        this.preventOverlap(this.players);
        
        // 시각적 업데이트
        this.players.forEach(player => {
            player.updateVisual(this.renderer.trackPath);
        });
        
        // 승부 체크
        const finishedPlayers = this.players.filter(p => p.finished);
        if (finishedPlayers.length === this.players.length || elapsed >= CONFIG.RACE_DURATION) {
            this.endRace();
            return;
        }
        
        requestAnimationFrame(() => this.raceLoop());
    }

    scheduleEvents() {
        CONFIG.EVENT_TIMES.forEach(eventTime => {
            setTimeout(() => {
                if (this.gameRunning) {
                    this.eventSystem.triggerRandomEvent(this.players);
                }
            }, eventTime);
        });
    }

    endRace() {
        this.gameRunning = false;
        
        // 미완주 플레이어 처리
        this.players.forEach(player => {
            if (!player.finished) {
                player.finished = true;
                player.finishTime = Date.now() + (1 - player.progress) * 1000;
            }
        });
        
        // 최종 순위 계산 (progress 기준)
        const sortedPlayers = [...this.players].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.progress - a.progress;
        });
        
        // 당첨자 결정 로직
        let winners = [];
        
        if (this.selectionMode === 'single') {
            const loserIndex = sortedPlayers.length - this.selectedLoserRank;
            const winner = sortedPlayers[Math.max(0, loserIndex)];
            if (winner) {
                winners.push({
                    player: winner,
                    rank: this.selectedLoserRank === 1 ? '꼴찌' : `뒤에서 ${this.selectedLoserRank}등`
                });
            }
        } else {
            this.customRanksSelected.forEach(rank => {
                const playerIndex = rank - 1;
                if (playerIndex < sortedPlayers.length) {
                    const player = sortedPlayers[playerIndex];
                    let rankText;
                    if (rank === 1) rankText = '1등';
                    else if (rank === sortedPlayers.length) rankText = '꼴찌';
                    else rankText = `${rank}등`;
                    
                    winners.push({
                        player: player,
                        rank: rankText
                    });
                }
            });
        }
        
        setTimeout(() => {
            this.renderer.showModernResults(winners, this.selectionMode);
        }, 1000);
        
        console.log('🏁 레이스 종료!');
    }

    resetGame() {
        this.gameRunning = false;
        this.players = [];
        this.eventSystem.reset();
        
        // 🆕 개인 추월 쿨다운 초기화
        this.playerOvertakeCooldowns.clear();
        
        // 기타 선택 초기화
        this.customRanksSelected = [];
        this.selectionMode = 'single';
        
        document.getElementById('resultOverlay').style.display = 'none';
        
        document.querySelector('.setup-container').style.display = 'block';
        document.getElementById('raceContainer').style.display = 'none';
        
        const customSelector = document.getElementById('customRankSelector');
        if (customSelector) {
            customSelector.style.display = 'none';
        }
        
        document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.rank-btn[data-rank="1"]').classList.add('active');
        this.selectedLoserRank = 1;
        
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            customBtn.textContent = '기타';
        }
        
        document.querySelectorAll('.player-input input').forEach(input => {
            input.value = '';
        });
        
        const progressFill = document.getElementById('progressFill');
        const timeLeft = document.getElementById('timeLeft');
        
        if (progressFill) progressFill.style.width = '0%';
        if (timeLeft) timeLeft.textContent = '60.0s';
        
        this.updatePlayerInputs();
        
        console.log('🔄 게임 리셋 완료 (간소화된 시스템)');
    }

    // 🗑️ 복잡한 간격 관련 함수들 모두 제거
    // initializeSpacing, startRealtimeSpacingSystem, checkAndAdjustSpacing,
    // countCrowdedPlayers, executeSpacingAdjustment, stopRealtimeSpacingSystem 등

    // 기존 UI 관련 함수들 (변경 없음)
    initializeUI() {
        console.log('Available Lottie files:', CONFIG.LOTTIE_FILES);
        this.shuffledLottieFiles = [...CONFIG.LOTTIE_FILES].sort(() => Math.random() - 0.5);
        console.log('Shuffled Lottie files:', this.shuffledLottieFiles);
        this.updatePlayerInputs();
    }

    setupPlayerCountSelector() {
        const setupContainer = document.querySelector('.setup-container');
        if (!setupContainer) return;

        setupContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('count-btn')) {
                const count = parseInt(e.target.dataset.count);
                this.selectedPlayerCount = count;
                
                document.querySelectorAll('.count-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                this.updatePlayerInputs();
                this.updateCustomRankSelector();
            }
        });
    }

    setupLoserRankSelector() {
        const setupContainer = document.querySelector('.setup-container');
        if (!setupContainer) return;

        setupContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rank-btn')) {
                document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const type = e.target.dataset.type;
                const customSelector = document.getElementById('customRankSelector');
                
                if (type === 'custom') {
                    this.selectionMode = 'custom';
                    if (typeof showCustomRanks === 'function') {
                        showCustomRanks();
                    } else {
                        this.openCustomRanksModal();
                    }
                } else {
                    this.selectionMode = 'single';
                    this.selectedLoserRank = parseInt(e.target.dataset.rank);
                    if (customSelector) {
                        customSelector.style.display = 'none';
                    }
                    this.customRanksSelected = [];
                }
            }
        });
    }

    openCustomRanksModal() {
        this.updateRankSelectionGrid();
        const modal = document.getElementById('customRanksModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    updateRankSelectionGrid() {
        const grid = document.getElementById('rankSelectionGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= this.selectedPlayerCount; i++) {
            const item = document.createElement('div');
            item.className = 'rank-selection-item';
            item.dataset.rank = i;
            
            let rankText;
            if (i === 1) rankText = '1등';
            else if (i === this.selectedPlayerCount) rankText = '꼴찌';
            else rankText = `${i}등`;
            
            item.textContent = rankText;
            
            if (this.customRanksSelected.includes(i)) {
                item.classList.add('selected');
            }
            
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
            
            grid.appendChild(item);
        }
    }

    confirmCustomSelection() {
        const selectedItems = document.querySelectorAll('.rank-selection-item.selected');
        
        if (selectedItems.length === 0) {
            alert('최소 1개 이상의 등수를 선택해주세요!');
            return;
        }
        
        const selectedRanks = Array.from(selectedItems).map(item => parseInt(item.dataset.rank));
        this.customRanksSelected = selectedRanks;
        this.selectionMode = 'custom';
        
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            const count = selectedRanks.length;
            customBtn.textContent = `기타 (${count}개)`;
        }
        
        this.closeModal('customRanksModal');
    }

    cancelCustomSelection() {
        this.selectionMode = 'single';
        this.customRanksSelected = [];
        
        document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.rank-btn[data-rank="1"]').classList.add('active');
        this.selectedLoserRank = 1;
        
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            customBtn.textContent = '기타';
        }
        
        this.closeModal('customRanksModal');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    updateCustomRankSelector() {
        console.log('Custom rank selector updated for', this.selectedPlayerCount, 'players');
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            if (this.gameRunning && this.renderer.trackPath) {
                this.renderer.calculateTrackPath();
            }
        });
    }

    updatePlayerInputs() {
        const playerInputsContainer = document.getElementById('playerInputs');
        if (!playerInputsContainer) return;
        
        playerInputsContainer.innerHTML = '';
        
        for (let i = 0; i < CONFIG.MAX_PLAYERS; i++) {
            const playerInput = document.createElement('div');
            playerInput.className = 'player-input';
            
            if (i >= this.selectedPlayerCount) {
                playerInput.classList.add('hidden');
            }
            
            const lottiePreview = document.createElement('div');
            lottiePreview.className = 'lottie-preview';
            lottiePreview.id = `preview-${i}`;
            
            playerInput.innerHTML = `
                <input type="text" placeholder="참가자 이름 입력" maxlength="12">
            `;
            playerInput.appendChild(lottiePreview);
            
            playerInputsContainer.appendChild(playerInput);
            
            if (i < this.shuffledLottieFiles.length) {
                console.log(`Loading preview ${i}:`, this.shuffledLottieFiles[i]);
                this.loadLottiePreview(lottiePreview, this.shuffledLottieFiles[i]);
            }
        }
    }

    loadLottiePreview(container, lottieFile) {
        container.innerHTML = '';
        
        if (typeof lottie === 'undefined') {
            console.warn('Lottie library not loaded');
            return;
        }
        
        console.log('Loading Lottie preview:', lottieFile);
        
        try {
            const animation = lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: lottieFile
            });
            
            const playerInput = container.closest('.player-input');
            
            playerInput.addEventListener('mouseenter', () => {
                if (animation) {
                    animation.setSpeed(2.0);
                }
            });
            
            playerInput.addEventListener('mouseleave', () => {
                if (animation) {
                    animation.setSpeed(1.5);
                }
            });
            
            animation.addEventListener('config_ready', () => {
                console.log('✅ Lottie preview loaded successfully:', lottieFile);
                animation.setSpeed(1.5);
            });
            
            animation.addEventListener('data_failed', (error) => {
                console.error('❌ Lottie preview failed to load:', lottieFile, error);
                container.innerHTML = '🏃‍♂️';
                container.style.fontSize = '20px';
            });
            
        } catch (error) {
            console.error('Error loading Lottie preview:', error);
            container.innerHTML = '🏃‍♂️';
            container.style.fontSize = '20px';
        }
    }
}