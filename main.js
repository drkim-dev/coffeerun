// main.js - 간소화된 메인 파일 (모달 연결 수정)
let gameController;

// 게임 컨트롤러 생성 및 전역 등록
gameController = new GameController();
window.gameController = gameController; // 전역 접근용

// 전역 함수들
window.startGame = function() {
    if (gameController) {
        gameController.startGame();
    }
};

window.resetGame = function() {
    if (gameController) {
        gameController.resetGame();
    }
};

/// main.js에 추가할 함수들

// 모달 열기 함수들 (게임규칙, 스킬정보)
function showGameRules() {
    openModal('rulesModal');
}

function showSkillGuide() {
    openModal('skillModal');
}

//  기타 등수 선택 모달
function showCustomRanks() {
    if (gameController) {
        gameController.updateRankSelectionGrid();
    }
    openModal('customRanksModal');
}

// === 새로 추가: 게임 컨트롤러와 연결된 함수들 ===
// 기타 선택 확인
function confirmCustomSelection() {
    if (gameController) {
        gameController.confirmCustomSelection();
    }
}

// 기타 선택 취소
function cancelCustomSelection() {
    if (gameController) {
        gameController.cancelCustomSelection();
    }
}
// === 게임 컨트롤러 연결 함수 끝 ===

// 등수 선택 그리드 업데이트
function updateRankSelectionGrid() {
    // 이 함수는 게임 컨트롤러에서 직접 처리하므로 여기서는 빈 함수
    console.log('updateRankSelectionGrid called from main.js');
}

// 모달 제어 함수들
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay.show');
        openModals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }
});

// 모달 배경 클릭시 닫기
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

// === 새로 추가: 연락처 관련 함수 ===
function showContact() {
    alert('문의사항이 있으시면 drkim1239@gmail.com으로 연락주세요!\n\n개발: 커피런 팀\n버전: v1.0');
}
// === 연락처 함수 끝 ===

// main.js에 추가할 모바일 배너 관련 함수들

// 모바일 배너 표시 함수
function showMobileBanner() {
    const isMobile = window.innerWidth <= 768;
    const banner = document.getElementById('mobilePcBanner');
    const bannerClosedTime = localStorage.getItem('mobileBannerClosed');
    
    // 하루(24시간) 경과 체크
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const hasSeenBanner = bannerClosedTime && parseInt(bannerClosedTime) > oneDayAgo;
    
    if (isMobile && !hasSeenBanner && banner) {
        banner.style.display = 'block';
        document.body.classList.add('banner-visible');
        
        // 0.1초 후에 애니메이션 시작
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }
}

// 모바일 배너 닫기 함수
function closeMobileBanner() {
    const banner = document.getElementById('mobilePcBanner');
    
    if (banner) {
        banner.classList.remove('show');
        document.body.classList.remove('banner-visible');
        
        // 애니메이션 완료 후 완전히 숨김
        setTimeout(() => {
            banner.style.display = 'none';
        }, 500);
        
        // 로컬스토리지에 닫은 시간 저장 (하루동안)
        localStorage.setItem('mobileBannerClosed', Date.now());
    }
}

// 페이지 로드시 배너 표시
document.addEventListener('DOMContentLoaded', function() {
    showMobileBanner();
});

// 화면 크기 변경시 배너 상태 조정
window.addEventListener('resize', function() {
    const isMobile = window.innerWidth <= 768;
    const banner = document.getElementById('mobilePcBanner');
    
    if (!isMobile && banner) {
        // PC로 변경되면 배너 숨김
        banner.classList.remove('show');
        document.body.classList.remove('banner-visible');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 500);
    } else if (isMobile && banner) {
        // 모바일로 변경되면 하루 경과 체크 후 표시
        const bannerClosedTime = localStorage.getItem('mobileBannerClosed');
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const hasSeenBanner = bannerClosedTime && parseInt(bannerClosedTime) > oneDayAgo;
        
        if (!hasSeenBanner) {
            showMobileBanner();
        }
    }
});

// 전역 함수로 등록
window.closeMobileBanner = closeMobileBanner;

console.log('커피런 게임 준비 완료!');