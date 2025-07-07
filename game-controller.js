// game-controller.js - 실시간 간격 조정 시스템

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
        
        // 🆕 실시간 간격 조정 관련 변수
        this.spacingCheckInterval = null;
        this.lastSpacingUpdate = 0;
        this.lastCrowdingCheck = 0;
        this.spacingUpdateCount = 0;
        
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

    // 🆕 초기 간격 설정
    initializeSpacing() {
        console.log('🎯 초기 간격 패턴 설정 중...');
        
        this.players.forEach((player, index) => {
            player.setInitialSpacing(index, this.players.length);
        });
        
        this.players.forEach(player => {
            console.log(`${player.name}: ${(player.targetSpacing * 100).toFixed(1)}% 간격`);
        });
    }

    // 🆕 실시간 간격 체크 시스템 시작
    startRealtimeSpacingSystem() {
        this.lastSpacingUpdate = Date.now();
        
        // 0.5초마다 간격 상태 체크
        this.spacingCheckInterval = setInterval(() => {
            if (this.gameRunning) {
                this.checkAndAdjustSpacing();
            }
        }, 500);
        
        console.log('🔄 실시간 간격 조정 시스템 시작');
    }

    // 🆕 실시간 간격 체크 및 조정
    checkAndAdjustSpacing() {
        const currentTime = Date.now();
        
        // 스킬 중에는 간격 조정 안함
        if (this.hasActiveSkills()) {
            return;
        }
        
        // 과밀 지역 체크 (1초마다만)
        let needsAdjustment = false;
        
        if (currentTime - this.lastCrowdingCheck > 1000) {
            this.lastCrowdingCheck = currentTime;
            
            // 1. 과밀 지역 체크
            const crowdedCount = this.countCrowdedPlayers();
            if (crowdedCount >= 3) {
                console.log(`🚨 과밀 감지: ${crowdedCount}명이 뭉쳐있음`);
                needsAdjustment = true;
            }
            
            // 2. 너무 오래 같은 패턴 체크 (8초)
            const timeSinceLastUpdate = currentTime - this.lastSpacingUpdate;
            if (timeSinceLastUpdate > 8000) {
                console.log(`⏰ 패턴 변경 시간: ${(timeSinceLastUpdate/1000).toFixed(1)}초 경과`);
                needsAdjustment = true;
            }
            
            // 3. 너무 자주 조정 방지 (최소 3초 간격)
            const minInterval = CONFIG.REALTIME_SPACING.MIN_ADJUSTMENT_INTERVAL;
            if (timeSinceLastUpdate < minInterval) {
                console.log(`🚫 간격 조정 대기 중: ${(minInterval - timeSinceLastUpdate)/1000}초 남음`);
                needsAdjustment = false;
            }
        }
        
        if (needsAdjustment) {
            this.executeSpacingAdjustment();
        }
    }

    // 🆕 과밀 상태 감지
    countCrowdedPlayers() {
        const activePlayers = this.players.filter(p => !p.finished);
        if (activePlayers.length < 2) return 0;   // 2명 미만이면 과밀 체크 불필요
        
        let crowdedCount = 0; 
        const CROWDING_THRESHOLD = 0.01; // 51 이내면 뭉쳐있다고 판단
        
        for (let i = 0; i < activePlayers.length; i++) {
            let nearbyCount = 1; // 자기 자신 포함
            
            for (let j = 0; j < activePlayers.length; j++) {
                if (i !== j) {
                    const distance = Math.abs(activePlayers[i].progress - activePlayers[j].progress);
                    if (distance <= CROWDING_THRESHOLD) {
                        nearbyCount++;
                    }
                }
            }
            
            if (nearbyCount >= 2) { //
                crowdedCount = Math.max(crowdedCount, nearbyCount);
            }
        }
        
        return crowdedCount;
    }

    // 🆕 활성 스킬 체크 (스킬 중에는 간격 조정 안함)
    hasActiveSkills() {
        // 알람이 표시 중이면 스킬 활성화 상태로 판단
        const notification = document.getElementById('eventNotification');
        const hasNotification = notification && notification.style.display === 'block';
        
        // 플레이어 중 추월 허용 상태인 사람이 있으면 스킬 활성화
        const hasOverlapPlayers = this.players.some(p => p.allowOverlap && !p.finished);
        
        return hasNotification || hasOverlapPlayers;
    }

    // 🆕 간격 조정 실행
    executeSpacingAdjustment() {
        this.spacingUpdateCount++;
        console.log(`🔄 간격 재조정 실행 #${this.spacingUpdateCount}`);
        
        this.players.forEach(player => {
            if (!player.finished) {
                player.redistributeSpacing(this.players);
            }
        });
        
        this.lastSpacingUpdate = Date.now();
    }

    // 🆕 실시간 간격 시스템 정리
    stopRealtimeSpacingSystem() {
        if (this.spacingCheckInterval) {
            clearInterval(this.spacingCheckInterval);
            this.spacingCheckInterval = null;
            console.log('🛑 실시간 간격 조정 시스템 종료');
        }
    }

    // 기존 함수들...
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
        
        // 간격 시스템 초기화
        this.initializeSpacing();
        
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
        
        // 🆕 실시간 간격 조정 시스템 시작
        this.startRealtimeSpacingSystem();
        
        this.raceLoop();
        this.scheduleEvents();
    }

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
        
        this.scheduleSpecialSkills();
    }

    scheduleSpecialSkills() {
        // 기존 특별 스킬 스케줄링 코드...
    }

    endRace() {
        this.gameRunning = false;
        
        // 🆕 실시간 간격 조정 시스템 정리
        this.stopRealtimeSpacingSystem();
        
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
    }

    resetGame() {
        this.gameRunning = false;
        this.players = [];
        this.eventSystem.reset();
        
        // 🆕 실시간 간격 조정 시스템 정리
        this.stopRealtimeSpacingSystem();
        
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
        
        console.log('🔄 게임 리셋 완료');
    }

    // 나머지 기존 함수들...
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