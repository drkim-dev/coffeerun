// race-renderer.js - baseProgress 기준 순위 표시로 수정

class RaceRenderer {
    constructor() {
        this.trackPath = null;
    }

    // 기존 함수들은 그대로 유지...
    
    drawDebugPath() {
        const debugPath = document.getElementById('debugPath');
        if (!debugPath || !this.trackPath) return;
        
        debugPath.innerHTML = '';
        
        const path = this.trackPath;
        
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
        
        const pathInfo = document.createElement('div');
        pathInfo.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            
            color: white;
            padding: 5px;
            font-size: 10px;
            border-radius: 3px;
            z-index: 60;
        `;
        debugPath.appendChild(pathInfo);
    }

    loadLottieAnimation(player) {
        if (typeof lottie === 'undefined') {
            console.warn('Lottie library not loaded');
            return;
        }
        
        //console.log('Loading Lottie animation for:', player.name, 'File:', player.lottieFile);
        
        try {
            player.lottieAnimation = lottie.loadAnimation({
                container: player.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: player.lottieFile
            });
            
            player.lottieAnimation.addEventListener('config_ready', () => {
                //console.log('Lottie animation loaded successfully for:', player.name);
                player.lottieAnimation.setSpeed(1.5);
            });
            
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
        
        const trackBorderElement = track.querySelector('.track-border');
        const computedStyle = window.getComputedStyle(trackBorderElement);
        const borderWidth = parseFloat(computedStyle.borderWidth) || parseFloat(computedStyle.borderTopWidth);
        
        const pathMargin = borderWidth / 2;
        const pathWidth = rect.width - (pathMargin * 2);
        const pathHeight = rect.height - (pathMargin * 2);
        const perimeter = (pathWidth + pathHeight) * 2;
        
        this.trackPath = {
            width: pathWidth,
            height: pathHeight,
            margin: pathMargin,
            borderWidth: borderWidth,
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
        
        raceTrack.innerHTML = '';
        
        this.setupTrackElements(raceTrack);
        this.calculateTrackPath();
        this.drawDebugPath();
        
        players.forEach(player => {
            this.createPlayerElements(raceTrack, player);
        });
    }

    setupTrackElements(raceTrack) {
        const trackBorder = document.createElement('div');
        trackBorder.className = 'track-border';
        raceTrack.appendChild(trackBorder);
        
        const centerField = document.createElement('div');
        centerField.className = 'track-inner';
        raceTrack.appendChild(centerField);
        
        const debugPath = document.createElement('div');
        debugPath.className = 'debug-path';
        debugPath.id = 'debugPath';
        raceTrack.appendChild(debugPath);
        
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
        const isMobile = window.innerWidth <= 768;
        const vehicleSizeRatio = isMobile ? 0.16 : CONFIG.TRACK.VEHICLE_SIZE_RATIO;
        const vehicleSize = Math.min(window.innerWidth, window.innerHeight) * vehicleSizeRatio;
        
        const vehicle = document.createElement('div');
        vehicle.className = 'vehicle lottie-container moving';
        vehicle.style.width = vehicleSize + 'px';
        vehicle.style.height = vehicleSize + 'px';
        
        const playerName = document.createElement('div');
        playerName.className = 'player-name';
        playerName.textContent = player.name;
        
        raceTrack.appendChild(vehicle);
        raceTrack.appendChild(playerName);
        
        player.element = vehicle;
        player.nameElement = playerName;
        
        this.loadLottieAnimation(player);
        
        const startPos = player.getPosition(this.trackPath);
        
        const offsetY = vehicleSize * 0.35;
        
        vehicle.style.left = (startPos.x - vehicleSize/2) + 'px';
        vehicle.style.top = (startPos.y - vehicleSize/2 - offsetY) + 'px';
        
        const centerDot = document.createElement('div');
        player.centerDot = centerDot;
        
        playerName.style.left = (startPos.x - vehicleSize/2) + 'px';
        playerName.style.top = (startPos.y + vehicleSize/2 + 5) + 'px';
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

// race-renderer.js - updateRankings() 함수 수정

        updateRankings(players) {
            const centerRankingList = document.getElementById('centerRankingList');
            if (!centerRankingList) return;
            
            // 🎯 progress 기준으로 정렬 (실제 순위)
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
                
                //  스킬 상태별 시각 효과 추가
                if (player.allowOverlap && !player.finished) {
                    if (player.boosted) {
                        rankItem.classList.add('player-boosted'); // 금색 효과
                    } else if (player.stunned) {
                        rankItem.classList.add('player-stunned'); // 빨간색 효과
                    }
                }
                
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
                
                //  기존 이모티콘 코드 제거
                // if (player.allowOverlap && !player.finished) {
                //     const statusIcon = document.createElement('span');
                //     if (player.boosted) {
                //         statusIcon.textContent = '🚀';
                //         statusIcon.title = '부스터 활성화';
                //     } else if (player.stunned) {
                //         statusIcon.textContent = '💥';
                //         statusIcon.title = '스턴 상태';
                //     }
                //     statusIcon.style.cssText = `
                //         margin-left: 5px;
                //         font-size: 12px;
                //     `;
                //     rankProgress.appendChild(statusIcon);
                // }
                
                rankItem.appendChild(rankNumber);
                rankItem.appendChild(rankName);
                rankItem.appendChild(rankProgress);
                
                centerRankingList.appendChild(rankItem);
            });
        }

    // 복수 당첨자 지원하는 결과 화면
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

    //  최종 순위도 progress 기준으로 수정
    setupFinalRankings(winners) {
        const finalRankings = document.getElementById('finalRankings');
        finalRankings.innerHTML = '';
        
        // progress 기준으로 전체 플레이어 순위 계산
        const sortedPlayers = [...window.gameController.players].sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishTime - b.finishTime;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;
            return b.progress - a.progress; //  progress 기준
        });
        
        const winnerPlayers = new Set(winners.map(w => w.player));
        
        sortedPlayers.forEach((player, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'final-rank-item';
            
            const isWinner = winnerPlayers.has(player);
            if (isWinner) {
                rankItem.classList.add('winner');
            }
            
            const rankNumber = document.createElement('div');
            rankNumber.className = 'final-rank-number';
            rankNumber.textContent = index + 1;
            
            if (index === 0) rankNumber.classList.add('rank-1');
            else if (index === 1) rankNumber.classList.add('rank-2');
            else if (index === 2) rankNumber.classList.add('rank-3');
            else rankNumber.classList.add('other');
            
            const rankCharacter = document.createElement('div');
            rankCharacter.className = 'final-rank-character';
            this.loadResultCharacter(rankCharacter, player);
            
            const rankInfo = document.createElement('div');
            rankInfo.className = 'final-rank-info';
            
            const rankName = document.createElement('div');
            rankName.className = 'final-rank-name';
            rankName.textContent = player.name;
            
            const rankStatus = document.createElement('div');
            rankStatus.className = 'final-rank-status';
            // 🎯 progress 기준으로 상태 표시
            rankStatus.textContent = player.finished ? '완주' : `${Math.round(player.progress * 100)}% 진행`;
            
            rankInfo.appendChild(rankName);
            rankInfo.appendChild(rankStatus);
            
            rankItem.appendChild(rankNumber);
            rankItem.appendChild(rankCharacter);
            rankItem.appendChild(rankInfo);
            
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
    // race-renderer.js에 추가할 함수
    createFinishLineTiles(players) {
        // 기존 결승선 제거
        const existingFinishLine = document.querySelector('.finish-line');
        if (existingFinishLine) {
            existingFinishLine.remove();
        }
        
        // 각 플레이어의 시작 위치 계산
        players.forEach((player, index) => {
            const startPos = player.getPosition(this.trackPath);
            
            // 해당 위치에 체크무늬 타일 생성
            const finishTile = document.createElement('div');
            finishTile.className = 'finish-line-tile';
            finishTile.style.cssText = `
                position: absolute;
                left: ${startPos.x - 15}px;
                top: ${startPos.y - 15}px;
                width: 30px;
                height: 30px;
                background-image: 
                    linear-gradient(45deg, #000 25%, transparent 25%),
                    linear-gradient(-45deg, #000 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #000 75%),
                    linear-gradient(-45deg, transparent 75%, #000 75%);
                background-size: 10px 10px;
                background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
                background-color: #fff;
                z-index: 50;
                border-radius: 3px;
            `;
            
            document.getElementById('raceTrack').appendChild(finishTile);
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
        
        prevBtn.onclick = () => {
            if (currentPage > 0) showPage(currentPage - 1);
        };
        
        nextBtn.onclick = () => {
            if (currentPage < pages.length - 1) showPage(currentPage + 1);
        };
        
        indicators.forEach((indicator, index) => {
            indicator.onclick = () => showPage(index);
        });
        
        showPage(0);
    }

    loadResultCharacter(container, player) {
        container.innerHTML = '';
        
        if (typeof lottie === 'undefined' || !player.lottieFile) {
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
                resultAnimation.setSpeed(0.8);
            });
            
            resultAnimation.addEventListener('data_failed', () => {
                container.textContent = '🏃‍♂️';
                container.style.fontSize = container.classList.contains('winner-character') ? '25px' : '40px';
            });
        } catch (error) {
            console.error('Error loading result character:', error);
            container.textContent = '🏃‍♂️';
            container.style.fontSize = container.classList.contains('winner-character') ? '25px' : '40px';
        }
    }

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
