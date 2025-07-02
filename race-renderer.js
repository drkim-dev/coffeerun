// race-renderer.js - 간소화된 렌더러 (모바일 친화적)
class RaceRenderer {
    constructor() {
        this.trackPath = null;
    }

    // ... 기존 함수들은 그대로 유지 ...
    
    drawDebugPath() {
        const debugPath = document.getElementById('debugPath');
        if (!debugPath || !this.trackPath) return;
        
        // 기존 경로 지우기
        debugPath.innerHTML = '';
        
        const path = this.trackPath;
        
        // 상단 선
        const topLine = document.createElement('div');
        topLine.className = 'debug-line debug-top';
        topLine.style.cssText = `
            position: absolute;
            left: ${path.margin}px;
            top: ${path.margin}px;
            width: ${path.width}px;
            height: 2px;
            background: black;
            z-index: 50;
        `;
        debugPath.appendChild(topLine);
        
        // 우측 선
        const rightLine = document.createElement('div');
        rightLine.className = 'debug-line debug-right';
        rightLine.style.cssText = `
            position: absolute;
            left: ${path.margin + path.width}px;
            top: ${path.margin}px;
            width: 2px;
            height: ${path.height}px;
            background: black;
            z-index: 50;
        `;
        debugPath.appendChild(rightLine);
        
        // 하단 선
        const bottomLine = document.createElement('div');
        bottomLine.className = 'debug-line debug-bottom';
        bottomLine.style.cssText = `
            position: absolute;
            left: ${path.margin}px;
            top: ${path.margin + path.height}px;
            width: ${path.width}px;
            height: 2px;
            background: black;
            z-index: 50;
        `;
        debugPath.appendChild(bottomLine);
        
        // 좌측 선
        const leftLine = document.createElement('div');
        leftLine.className = 'debug-line debug-left';
        leftLine.style.cssText = `
            position: absolute;
            left: ${path.margin}px;
            top: ${path.margin}px;
            width: 2px;
            height: ${path.height}px;
            background: black;
            z-index: 50;
        `;
        debugPath.appendChild(leftLine);
        
        // 경로 정보 표시
        const pathInfo = document.createElement('div');
        pathInfo.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px;
            font-size: 10px;
            border-radius: 3px;
            z-index: 60;
        `;
        // pathInfo.innerHTML = `
        //     🏁 TRACK DEBUG<br>
        //     CSS Border: ${path.borderWidth.toFixed(1)}px<br>
        //     Path Margin: ${path.margin.toFixed(1)}px<br>
        //     Gray Center: ${(path.borderWidth / 2).toFixed(1)}px<br>
        //     ✅ Correct: ${Math.abs(path.margin - path.borderWidth/2) < 1 ? 'YES' : 'NO'}<br>
        //     Screen: ${window.innerWidth}×${window.innerHeight}
        // `;
        debugPath.appendChild(pathInfo);
    }

    loadLottieAnimation(player) {
        if (typeof lottie === 'undefined') {
            console.warn('Lottie library not loaded');
            return;
        }
        
        console.log('Loading Lottie animation for:', player.name, 'File:', player.lottieFile);
        
        try {
            player.lottieAnimation = lottie.loadAnimation({
                container: player.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: player.lottieFile
            });
            
            // 애니메이션 로드 완료 이벤트
            player.lottieAnimation.addEventListener('config_ready', () => {
                console.log('Lottie animation loaded successfully for:', player.name);
                player.lottieAnimation.setSpeed(1.5);
            });
            
            // 로드 실패 이벤트
            player.lottieAnimation.addEventListener('data_failed', (error) => {
                console.error('Lottie animation failed for:', player.name, error);
            });
            
        } catch (error) {
            console.error('Error creating Lottie animation for:', player.name, error);
        }
    }

    calculateTrackPath() {
        const track = document.getElementById('raceTrack');
        const rect = track.getBoundingClientRect();
        
        // CSS에서 정의된 실제 border 크기 가져오기
        const trackBorderElement = track.querySelector('.track-border');
        const computedStyle = window.getComputedStyle(trackBorderElement);
        const borderWidth = parseFloat(computedStyle.borderWidth) || parseFloat(computedStyle.borderTopWidth);
        
        // 🎯 회색 트랙의 정중앙 = border 두께 ÷ 2
        const pathMargin = borderWidth / 2;
        const pathWidth = rect.width - (pathMargin * 2);
        const pathHeight = rect.height - (pathMargin * 2);
        const perimeter = (pathWidth + pathHeight) * 2;
        
        this.trackPath = {
            width: pathWidth,
            height: pathHeight,
            margin: pathMargin,
            borderWidth: borderWidth, // 실제 CSS border 크기
            perimeter: perimeter,
            topRatio: pathWidth / perimeter,
            rightRatio: pathHeight / perimeter,
            bottomRatio: pathWidth / perimeter,
            leftRatio: pathHeight / perimeter
        };
        
        return this.trackPath;
    }

    setupRaceTrack(players) {
        const raceContainer = document.getElementById('raceContainer');
        const setupContainer = document.querySelector('.setup-container');
        
        if (setupContainer) setupContainer.style.display = 'none';
        if (raceContainer) raceContainer.style.display = 'block';
        
        let raceTrack = document.getElementById('raceTrack');
        if (!raceTrack) {
            raceTrack = document.createElement('div');
            raceTrack.id = 'raceTrack';
            raceTrack.className = 'race-track';
            raceContainer.appendChild(raceTrack);
        }
        
        // 기존 요소 제거
        raceTrack.innerHTML = '';
        
        // 트랙 설정
        this.setupTrackElements(raceTrack);
        
        // 트랙 경로 계산
        this.calculateTrackPath();
        
        // 🐛 디버깅용: 경로 선 그리기
        this.drawDebugPath();
        
        // 플레이어 요소 생성
        players.forEach(player => {
            this.createPlayerElements(raceTrack, player);
        });
    }

    setupTrackElements(raceTrack) {
        // 트랙 경계
        const trackBorder = document.createElement('div');
        trackBorder.className = 'track-border';
        raceTrack.appendChild(trackBorder);
        
        // 중앙 필드
        const centerField = document.createElement('div');
        centerField.className = 'track-inner';
        raceTrack.appendChild(centerField);
        
        // 시작선
       // const startLine = document.createElement('div');
        //startLine.className = 'start-line';
       // raceTrack.appendChild(startLine);
        
        // 🐛 디버깅용: 경주마 경로 선
        const debugPath = document.createElement('div');
        debugPath.className = 'debug-path';
        debugPath.id = 'debugPath';
        raceTrack.appendChild(debugPath);
        
        // 중앙 순위표 (2열 방식)
        const centerRankings = document.createElement('div');
        centerRankings.className = 'center-rankings';
        centerRankings.id = 'centerRankings';
        centerRankings.innerHTML = `
            <h3>🏆 실시간 순위</h3>
            <div id="centerRankingList"></div>
        `;
        raceTrack.appendChild(centerRankings);
    }

    createPlayerElements(raceTrack, player) {
        // 모바일에서 차량 크기 다르게 적용 (기존 모바일 최적화 유지)
        const isMobile = window.innerWidth <= 768;
        const vehicleSizeRatio = isMobile ? 0.16 : CONFIG.TRACK.VEHICLE_SIZE_RATIO;
        const vehicleSize = Math.min(window.innerWidth, window.innerHeight) * vehicleSizeRatio;
        
        // Lottie 컨테이너 요소
        const vehicle = document.createElement('div');
        vehicle.className = 'vehicle lottie-container moving';
        vehicle.style.width = vehicleSize + 'px';
        vehicle.style.height = vehicleSize + 'px';
        
        // 이름표
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.name;
        
        raceTrack.appendChild(vehicle);
        raceTrack.appendChild(playerName);
        
        player.element = vehicle;
        player.nameElement = playerName;
        
        // Lottie 애니메이션 로드
        this.loadLottieAnimation(player);
        
        // 초기 위치 설정 (정확한 중심점으로)
        const startPos = player.getPosition(this.trackPath);
        
        // 🎯 Lottie 이미지 상단 공백 보정
        const offsetY = vehicleSize * 0.35; // 경주마 크기의 35%만큼 위로
        
        vehicle.style.left = (startPos.x - vehicleSize/2) + 'px';
        vehicle.style.top = (startPos.y - vehicleSize/2 - offsetY) + 'px'; // offsetY만큼 위로
        
        // 🐛 디버깅용: 경주마 중심점 표시
        const centerDot = document.createElement('div');
        // centerDot.style.cssText = `
        //     position: absolute;
        //     left: ${startPos.x - 2}px;
        //     top: ${startPos.y - 2}px;
        //     width: 4px;
        //     height: 4px;
        //     background: blue;
        //     border-radius: 50%;
        //     z-index: 200;
        // `;
        //raceTrack.appendChild(centerDot);
        player.centerDot = centerDot;
        
        playerName.style.left = (startPos.x - vehicleSize/2) + 'px';
        playerName.style.top = (startPos.y + vehicleSize/2 + 5) + 'px'; // 이름은 기존 위치
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = Math.min(percentage, 100) + '%';
        }
    }

    updateTimeDisplay(timeLeft) {
        const timeDisplay = document.getElementById('timeLeft');
        if (timeDisplay) {
            timeDisplay.textContent = timeLeft.toFixed(1) + 's';
            
            if (timeLeft <= 10) {
                timeDisplay.style.color = '#ff4757';
            } else if (timeLeft <= 20) {
                timeDisplay.style.color = '#ffa502';
            } else {
                timeDisplay.style.color = '#feca57';
            }
        }
    }

    updateRankings(players) {
        const centerRankingList = document.getElementById('centerRankingList');
        if (!centerRankingList) return;
        
        // 진행률순으로 정렬
        const sortedPlayers = [...players].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.progress - a.progress;
        });
        
        centerRankingList.innerHTML = '';
        
        sortedPlayers.forEach((player, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'ranking-item';
            
            const rankNumber = document.createElement('span');
            rankNumber.className = 'rank-number';
            rankNumber.textContent = index + 1;
            
            // 순위별 클래스 추가
            if (index === 0) rankNumber.classList.add('rank-1');
            else if (index === 1) rankNumber.classList.add('rank-2');
            else if (index === 2) rankNumber.classList.add('rank-3');
            else if (index === 3) rankNumber.classList.add('rank-4');
            else rankNumber.classList.add('rank-5');
            
            const rankName = document.createElement('span');
            rankName.textContent = player.name;
            rankName.style.cssText = `
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                color: white;
                font-size: 17px;
                flex: 1;
                margin-right: 40px;
            `;
            
            const rankProgress = document.createElement('span');
            rankProgress.textContent = player.finished ? '완주!' : Math.round(player.progress * 100) + '%';
            rankProgress.style.cssText = `
                font-size: 15px;
                color: #feca57;
                font-weight: bold;
                flex-shrink: 0;
            `;
            
            rankItem.appendChild(rankNumber);
            rankItem.appendChild(rankName);
            rankItem.appendChild(rankProgress);
            
            centerRankingList.appendChild(rankItem);
        });
    }

    // === 새로 추가: 복수 당첨자 지원하는 결과 화면 ===
    showModernResults(winners, selectionMode) {
    const overlay = document.getElementById('resultOverlay');
    const singleWinner = document.getElementById('singleWinner');
    const multipleWinners = document.getElementById('multipleWinners');
    const resultTitle = document.getElementById('resultTitle');
    
            // 첫 번째 페이지 설정 (당첨자)
            if (selectionMode === 'single' && winners.length === 1) {
                singleWinner.style.display = 'block';
                multipleWinners.style.display = 'none';
                
                const winner = winners[0];
                resultTitle.textContent = `🎯 ${winner.rank} 당첨!`;
                
                const resultCharacter = document.getElementById('resultCharacter');
                this.loadResultCharacter(resultCharacter, winner.player);
                
                const resultName = document.getElementById('resultName');
                const resultSubtitle = document.getElementById('resultSubtitle');
                
                resultName.textContent = `${winner.player.name}님`;
                resultSubtitle.textContent = "커피 한 잔 부탁드려요! ☕";
            } else {
                singleWinner.style.display = 'none';
                multipleWinners.style.display = 'block';
                
                resultTitle.textContent = `☕ 당첨자들! ☕`;
                
                const winnersGrid = document.getElementById('winnersGrid');
                winnersGrid.innerHTML = '';
                
                winners.forEach(winner => {
                    const winnerItem = document.createElement('div');
                    winnerItem.className = 'winner-item';
                    
                    const winnerCharacter = document.createElement('div');
                    winnerCharacter.className = 'winner-character';
                    this.loadResultCharacter(winnerCharacter, winner.player);
                    
                    const winnerName = document.createElement('div');
                    winnerName.className = 'winner-name';
                    winnerName.textContent = winner.player.name;
                    
                    const winnerRank = document.createElement('div');
                    winnerRank.className = 'winner-rank';
                    winnerRank.textContent = `(${winner.rank})`;
                    
                    winnerItem.appendChild(winnerCharacter);
                    winnerItem.appendChild(winnerName);
                    winnerItem.appendChild(winnerRank);
                    
                    winnersGrid.appendChild(winnerItem);
                });
            }
            
            // 두 번째 페이지 설정 (전체 순위)
            this.setupFinalRankings(winners);
            
            // 카르셀 초기화
            this.initializeCarousel();
            
            overlay.style.display = 'flex';
            this.createCelebration();
        }

        setupFinalRankings(winners) {
            const finalRankings = document.getElementById('finalRankings');
            finalRankings.innerHTML = '';
            
            // 전체 플레이어 순위 가져오기
            const sortedPlayers = [...window.gameController.players].sort((a, b) => {
                if (a.finished && b.finished) {
                    return a.finishTime - b.finishTime;
                }
                if (a.finished) return -1;
                if (b.finished) return 1;
                return b.progress - a.progress;
            });
            
            // 당첨자 이름 목록 생성 (정확한 비교)
            const winnerPlayers = new Set(winners.map(w => w.player)); // 객체 직접 비교
            
            sortedPlayers.forEach((player, index) => {
                const rankItem = document.createElement('div');
                rankItem.className = 'final-rank-item';
                
                const isWinner = winnerPlayers.has(player); // 객체로 직접 비교
                if (isWinner) {
                    rankItem.classList.add('winner');
                }
                
                // 순위 번호
                const rankNumber = document.createElement('div');
                rankNumber.className = 'final-rank-number';
                rankNumber.textContent = index + 1;
                
                if (index === 0) rankNumber.classList.add('rank-1');
                else if (index === 1) rankNumber.classList.add('rank-2');
                else if (index === 2) rankNumber.classList.add('rank-3');
                else rankNumber.classList.add('other');
                
                // 캐릭터
                const rankCharacter = document.createElement('div');
                rankCharacter.className = 'final-rank-character';
                this.loadResultCharacter(rankCharacter, player);
                
                // 정보
                const rankInfo = document.createElement('div');
                rankInfo.className = 'final-rank-info';
                
                const rankName = document.createElement('div');
                rankName.className = 'final-rank-name';
                rankName.textContent = player.name;
                
                const rankStatus = document.createElement('div');
                rankStatus.className = 'final-rank-status';
                rankStatus.textContent = player.finished ? '완주' : `${Math.round(player.progress * 100)}% 진행`;
                
                rankInfo.appendChild(rankName);
                rankInfo.appendChild(rankStatus);
                
                rankItem.appendChild(rankNumber);
                rankItem.appendChild(rankCharacter);
                rankItem.appendChild(rankInfo);
                
                // 당첨자 배지 (수정)
                if (isWinner) {
                    const winnerInfo = winners.find(w => w.player === player);
                    const badge = document.createElement('div');
                    badge.className = 'winner-badge';
                    badge.innerHTML = `☕ 당첨`;
                    rankItem.appendChild(badge);
                }
                
                finalRankings.appendChild(rankItem);
            });
        }


        initializeCarousel() {
            let currentPage = 0;
            const pages = document.querySelectorAll('.result-page');
            const indicators = document.querySelectorAll('.indicator');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            
            const showPage = (pageIndex) => {
                pages.forEach((page, index) => {
                    page.classList.remove('active', 'prev');
                    if (index === pageIndex) {
                        page.classList.add('active');
                    } else if (index < pageIndex) {
                        page.classList.add('prev');
                    }
                });
                
                indicators.forEach((indicator, index) => {
                    indicator.classList.toggle('active', index === pageIndex);
                });
                
                prevBtn.disabled = pageIndex === 0;
                nextBtn.disabled = pageIndex === pages.length - 1;
                
                currentPage = pageIndex;
            };
            
            // 버튼 이벤트
            prevBtn.onclick = () => {
                if (currentPage > 0) showPage(currentPage - 1);
            };
            
            nextBtn.onclick = () => {
                if (currentPage < pages.length - 1) showPage(currentPage + 1);
            };
            
            // 인디케이터 이벤트
            indicators.forEach((indicator, index) => {
                indicator.onclick = () => showPage(index);
            });
            
            // 스와이프 지원
            // let startX = 0;
            // const carousel = document.getElementById('resultCarousel');
            
            // carousel.ontouchstart = (e) => {
            //     startX = e.touches[0].clientX;
            // };
            
            // carousel.ontouchend = (e) => {
            //     const endX = e.changedTouches[0].clientX;
            //     const diff = startX - endX;
                
            //     if (Math.abs(diff) > 50) {
            //         if (diff > 0 && currentPage < pages.length - 1) {
            //             showPage(currentPage + 1);
            //         } else if (diff < 0 && currentPage > 0) {
            //             showPage(currentPage - 1);
            //         }
            //     }
            // };
            
            // 초기 페이지 설정
            showPage(0);
        }
    loadResultCharacter(container, player) {
        container.innerHTML = '';
        
        if (typeof lottie === 'undefined' || !player.lottieFile) {
            // Lottie 라이브러리가 없거나 파일이 없으면 기본 이모지
            container.textContent = '🏃‍♂️';
            container.style.fontSize = container.classList.contains('winner-character') ? '25px' : '40px';
            return;
        }
        
        try {
            const resultAnimation = lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: player.lottieFile
            });
            
            resultAnimation.addEventListener('config_ready', () => {
                resultAnimation.setSpeed(0.8); // 결과 화면에서는 천천히
            });
            
            resultAnimation.addEventListener('data_failed', () => {
                // 로드 실패시 기본 이모지로 대체
                container.textContent = '🏃‍♂️';
                container.style.fontSize = container.classList.contains('winner-character') ? '25px' : '40px';
            });
        } catch (error) {
            console.error('Error loading result character:', error);
            container.textContent = '🏃‍♂️';
            container.style.fontSize = container.classList.contains('winner-character') ? '25px' : '40px';
        }
    }
    // === 복수 당첨자 결과 화면 끝 ===

    createCelebration() {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => this.createConfetti(), i * 100);
        }
    }

    createConfetti() {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}vw;
            top: -20px;
            font-size: ${15 + Math.random() * 10}px;
            z-index: 10000;
            pointer-events: none;
        `;
        confetti.textContent = ['🎉', '🎊', '⭐', '💫', '✨', '🏆', '☕'][Math.floor(Math.random() * 7)];
        
        document.body.appendChild(confetti);
        
        confetti.animate([
            { transform: 'translateY(-20px)', opacity: 1 },
            { transform: `translateY(100vh) translateX(${(Math.random() - 0.5) * 200}px)`, opacity: 0 }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'ease-out'
        });
        
        setTimeout(() => confetti.remove(), 5000);
    }

    showCountdown(number) {
        const countdown = document.getElementById('countdown');
        countdown.textContent = number;
        countdown.classList.add('show');
        
        setTimeout(() => {
            countdown.classList.remove('show');
        }, 1000);
    }
}