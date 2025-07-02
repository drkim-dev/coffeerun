// game-controller.js - 간소화된 게임 컨트롤러 (모달 연결 수정)
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
        
        // === 새로 추가: 기타 선택 관련 변수 ===
        this.customRanksSelected = []; // 기타 선택시 선택된 등수들
        this.selectionMode = 'single'; // 'single' 또는 'custom'
        // === 기타 선택 변수 끝 ===
        
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
                // === 새로 추가: 인원 변경시 체크박스도 업데이트 ===
                this.updateCustomRankSelector();
                // === 체크박스 업데이트 끝 ===
            }
        });
    }

    setupLoserRankSelector() {
        const setupContainer = document.querySelector('.setup-container');
        if (!setupContainer) return;

        setupContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('rank-btn')) {
                // 모든 버튼 비활성화
                document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                const type = e.target.dataset.type;
                const customSelector = document.getElementById('customRankSelector');
                
                if (type === 'custom') {
                    // === 수정: 기타 선택시 모달 열기 ===
                    this.selectionMode = 'custom';
                    // 기존 체크박스 방식 대신 모달 열기
                    if (typeof showCustomRanks === 'function') {
                        showCustomRanks();
                    } else {
                        // fallback: 직접 모달 열기
                        this.openCustomRanksModal();
                    }
                    // === 기타 선택 로직 끝 ===
                } else {
                    // 단일 선택
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

    // === 새로 추가: 직접 모달 열기 함수 ===
    openCustomRanksModal() {
        this.updateRankSelectionGrid();
        const modal = document.getElementById('customRanksModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    // === 새로 추가: 등수 선택 그리드 업데이트 ===
    updateRankSelectionGrid() {
        const grid = document.getElementById('rankSelectionGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // 등수별 버튼 생성
        for (let i = 1; i <= this.selectedPlayerCount; i++) {
            const item = document.createElement('div');
            item.className = 'rank-selection-item';
            item.dataset.rank = i;
            
            // 등수 텍스트
            let rankText;
            if (i === 1) rankText = '1등';
            else if (i === this.selectedPlayerCount) rankText = '꼴찌';
            else rankText = `${i}등`;
            
            item.textContent = rankText;
            
            // 이미 선택된 등수면 활성화
            if (this.customRanksSelected.includes(i)) {
                item.classList.add('selected');
            }
            
            // 클릭 이벤트
            item.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
            
            grid.appendChild(item);
        }
    }

    // === 새로 추가: 커스텀 선택 확인 함수 ===
    confirmCustomSelection() {
        const selectedItems = document.querySelectorAll('.rank-selection-item.selected');
        
        if (selectedItems.length === 0) {
            alert('최소 1개 이상의 등수를 선택해주세요!');
            return;
        }
        
        // 선택된 등수들 저장
        const selectedRanks = Array.from(selectedItems).map(item => parseInt(item.dataset.rank));
        this.customRanksSelected = selectedRanks;
        this.selectionMode = 'custom';
        
        // "기타" 버튼 텍스트 업데이트
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            const count = selectedRanks.length;
            customBtn.textContent = `기타 (${count}개)`;
        }
        
        // 모달 닫기
        this.closeModal('customRanksModal');
    }

    // === 새로 추가: 커스텀 선택 취소 함수 ===
    cancelCustomSelection() {
        // 이전 상태로 복원 (단일 선택으로)
        this.selectionMode = 'single';
        this.customRanksSelected = [];
        
        // 버튼 상태 초기화
        document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.rank-btn[data-rank="1"]').classList.add('active');
        this.selectedLoserRank = 1;
        
        // "기타" 버튼 텍스트 복원
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            customBtn.textContent = '기타';
        }
        
        // 모달 닫기
        this.closeModal('customRanksModal');
    }

    // === 새로 추가: 모달 닫기 함수 ===
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    // === 새로 추가: 기타 선택 체크박스 업데이트 함수 (사용 안함, 호환성 유지) ===
    updateCustomRankSelector() {
        // 이 함수는 더 이상 사용하지 않지만 호환성을 위해 유지
        console.log('Custom rank selector updated for', this.selectedPlayerCount, 'players');
    }
    // === 기타 선택 체크박스 함수 끝 ===

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            if (this.gameRunning && this.renderer.trackPath) {
                // 트랙 경로 재계산
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
            
            // Lottie 미리보기 로드 (실제 파일 경로 사용)
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
            
            // 🆕 호버 효과 이벤트 추가
            const playerInput = container.closest('.player-input');
            
            playerInput.addEventListener('mouseenter', () => {
                if (animation) {
                    animation.setSpeed(2.0); // 호버시 2배속
                }
            });
            
            playerInput.addEventListener('mouseleave', () => {
                if (animation) {
                    animation.setSpeed(1.5); // 원래 속도로 (기존과 동일)
                }
            });
            
            animation.addEventListener('config_ready', () => {
                console.log('✅ Lottie preview loaded successfully:', lottieFile);
                animation.setSpeed(1.5); // 기본 속도 설정
            });
            
            animation.addEventListener('data_failed', (error) => {
                console.error('❌ Lottie preview failed to load:', lottieFile, error);
                // 실패시 기본 이모지로 대체
                container.innerHTML = '🏃‍♂️';
                container.style.fontSize = '20px';
            });
            
        } catch (error) {
            console.error('Error loading Lottie preview:', error);
            container.innerHTML = '🏃‍♂️';
            container.style.fontSize = '20px';
        }
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
        
        // === 새로 추가: 기타 선택 모드 검증 ===
        if (this.selectionMode === 'custom' && this.customRanksSelected.length === 0) {
            alert('당첨 등수를 최소 1개 이상 선택해주세요!');
            return;
        }
        // === 기타 선택 검증 끝 ===
        
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
        
        // 특별 이벤트 스케줄링
        this.scheduleSpecialSkills();
    }

    scheduleSpecialSkills() {
        // 🎪 중간 대혼란 - 30초 후
        // setTimeout(() => {
        //     if (this.gameRunning) {
        //         this.eventSystem.showEventNotification('🎪 중간 대혼란!', '상하위 속도 반전!');
        //         setTimeout(() => {
        //             if (this.gameRunning) {
        //                 this.eventSystem.bigReverseEvent(this.players.filter(p => !p.finished));
        //             }
        //         }, 500);
        //     }
        // }, 30000);

        // // 🌟 막판 역전의 기회 - 45초 후
        // setTimeout(() => {
        //     if (this.gameRunning) {
        //         this.eventSystem.showEventNotification('🌟 막판 역전의 기회!', '하위권 마지막 찬스!');
        //         setTimeout(() => {
        //             if (this.gameRunning) {
        //                 this.eventSystem.comebackEvent(this.players.filter(p => !p.finished));
        //             }
        //         }, 100);
        //     }
        // }, 45000);
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
        
        // 최종 순위 계산
        const sortedPlayers = [...this.players].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.progress - a.progress;
        });
        
        // === 새로 추가: 당첨자 결정 로직 ===
        let winners = [];
        
        if (this.selectionMode === 'single') {
            // 단일 선택 모드
            const loserIndex = sortedPlayers.length - this.selectedLoserRank;
            const winner = sortedPlayers[Math.max(0, loserIndex)];
            if (winner) {
                winners.push({
                    player: winner,
                    rank: this.selectedLoserRank === 1 ? '꼴찌' : `뒤에서 ${this.selectedLoserRank}등`
                });
            }
        } else {
            // 기타 선택 모드 (복수 선택)
            this.customRanksSelected.forEach(rank => {
                const playerIndex = rank - 1; // 1등 = index 0
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
        // === 당첨자 결정 로직 끝 ===
        
        setTimeout(() => {
            this.renderer.showModernResults(winners, this.selectionMode);
        }, 1000);
    }

    resetGame() {
        this.gameRunning = false;
        this.players = [];
        this.eventSystem.reset();
        // === 새로 추가: 리셋시 기타 선택 초기화 ===
        this.customRanksSelected = [];
        this.selectionMode = 'single';
        // === 기타 선택 초기화 끝 ===
        
        document.getElementById('resultOverlay').style.display = 'none';
        
        document.querySelector('.setup-container').style.display = 'block';
        document.getElementById('raceContainer').style.display = 'none';
        
        // === 새로 추가: 기타 선택 영역 숨기기 ===
        const customSelector = document.getElementById('customRankSelector');
        if (customSelector) {
            customSelector.style.display = 'none';
        }
        
        // 버튼 상태 초기화
        document.querySelectorAll('.rank-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.rank-btn[data-rank="1"]').classList.add('active');
        this.selectedLoserRank = 1;
        
        // "기타" 버튼 텍스트 복원
        const customBtn = document.querySelector('.rank-btn[data-type="custom"]');
        if (customBtn) {
            customBtn.textContent = '기타';
        }
        // === 기타 선택 리셋 끝 ===
        
        document.querySelectorAll('.player-input input').forEach(input => {
            input.value = '';
        });
        
        const progressFill = document.getElementById('progressFill');
        const timeLeft = document.getElementById('timeLeft');
        
        if (progressFill) progressFill.style.width = '0%';
        if (timeLeft) timeLeft.textContent = '60.0s';
        
        this.updatePlayerInputs();
    }
}