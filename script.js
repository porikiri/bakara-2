// 게임 상태 변수
let balance = 10000;
const betAmount = 1000;
let selectedBet = null;

const suits = ['♠', '♦', '♥', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// 📊 출목표(경기 기록) 데이터 변수
let history = [];
let countP = 0;
let countB = 0;
let countT = 0;

// 베팅 선택 함수
function selectBet(type) {
    selectedBet = type;
    document.getElementById('current-bet-type').innerText = type;
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('result-text').innerText = `${type}에 베팅 완료! DEAL 버튼을 눌러주세요.`;
}

// 바카라 스코어 계산 알고리즘
function getCardScore(cardValue) {
    if (['10', 'J', 'Q', 'K'].includes(cardValue)) return 0;
    if (cardValue === 'A') return 1;
    return parseInt(cardValue);
}

function calculateScore(cards) {
    let total = cards.reduce((sum, card) => sum + getCardScore(card.value), 0);
    return total % 10; // 10의 자리는 버림 (바카라 규칙)
}

// 랜덤 카드 뽑기
function drawCard() {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    const isRed = suit === '♦' || suit === '♥';
    return { suit, value, isRed };
}

// 카드 화면 렌더링
function renderCard(card, containerId) {
    const container = document.getElementById(containerId);
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.isRed ? 'red' : ''}`;
    cardEl.innerHTML = `
        <div>${card.value}</div>
        <div style="align-self: center; font-size: 2rem;">${card.suit}</div>
        <div style="align-self: flex-end; transform: rotate(180deg);">${card.value}</div>
    `;
    container.appendChild(cardEl);
}

// 메인 게임 로직
function playGame() {
    if (!selectedBet) return;
    if (balance < betAmount) {
        document.getElementById('result-text').innerText = "잔액이 부족합니다! 게임을 새로고침 하세요.";
        return;
    }

    // 초기화
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('banker-cards').innerHTML = '';
    document.getElementById('deal-btn').disabled = true;

    balance -= betAmount;
    document.getElementById('balance').innerText = balance.toLocaleString();

    // 1. 플레이어, 뱅커 각각 2장씩 기본 지급
    let pCards = [drawCard(), drawCard()];
    let bCards = [drawCard(), drawCard()];

    pCards.forEach(c => renderCard(c, 'player-cards'));
    bCards.forEach(c => renderCard(c, 'banker-cards'));

    let pScore = calculateScore(pCards);
    let bScore = calculateScore(bCards);

    document.getElementById('player-score').innerText = pScore;
    document.getElementById('banker-score').innerText = bScore;

    // 2. 내추럴 확인 (누구든 8이나 9가 나오면 그대로 경기 종료)
    if (pScore >= 8 || bScore >= 8) {
        endGame(pScore, bScore);
        return;
    }

    // 3. 바카라 서드 카드(3번째 카드) 룰 적용
    let playerDrewThird = false;
    let thirdCardValue = -1;

    // 플레이어 룰: 0~5점이면 한 장 더 받음
    if (pScore <= 5) {
        const newCard = drawCard();
        pCards.push(newCard);
        renderCard(newCard, 'player-cards');
        pScore = calculateScore(pCards);
        document.getElementById('player-score').innerText = pScore;
        
        playerDrewThird = true;
        thirdCardValue = getCardScore(newCard.value);
    }

    // 뱅커 룰
    if (!playerDrewThird) {
        // 플레이어가 스탠드(6,7)인 경우, 뱅커는 0~5점일 때 한 장 더 받음
        if (bScore <= 5) {
            drawBankerThird();
        }
    } else {
        // 플레이어가 3번째 카드를 받았을 때의 뱅커 조건 규칙
        if (bScore <= 2) {
            drawBankerThird();
        } else if (bScore === 3 && thirdCardValue !== 8) {
            drawBankerThird();
        } else if (bScore === 4 && [2, 3, 4, 5, 6, 7].includes(thirdCardValue)) {
            drawBankerThird();
        } else if (bScore === 5 && [4, 5, 6, 7].includes(thirdCardValue)) {
            drawBankerThird();
        } else if (bScore === 6 && [6, 7].includes(thirdCardValue)) {
            drawBankerThird();
        }
    }

    function drawBankerThird() {
        const newCard = drawCard();
        bCards.push(newCard);
        renderCard(newCard, 'banker-cards');
        bScore = calculateScore(bCards);
    }

    document.getElementById('banker-score').innerText = bScore;
    endGame(pScore, bScore);
}

// 결과 판정, 정산 및 출목표 업데이트
function endGame(pScore, bScore) {
    let winner = '';
    if (pScore > bScore) winner = 'PLAYER';
    else if (bScore > pScore) winner = 'BANKER';
    else winner = 'TIE';

    let resultText = `결과: [${winner} 승리] `;
    
    if (selectedBet === winner) {
        let payout = 0;
        if (winner === 'TIE') payout = betAmount * 9;
        else payout = Math.floor(betAmount * 1.95);
        
        balance += payout;
        resultText += `🎉 베팅 성공! +${payout.toLocaleString()}원`;
    } else {
        resultText += `💸 베팅 실패...`;
    }

    document.getElementById('result-text').innerText = resultText;
    document.getElementById('balance').innerText = balance.toLocaleString();
    
    // 📊 출목표 시스템 연동
    updateRoadmap(winner);

    // 초기화
    selectedBet = null;
    document.getElementById('current-bet-type').innerText = '없음';
}

// 출목표 화면을 갱신하는 함수
function updateRoadmap(winner) {
    // 1. 카운트 증가 및 하단 스코어 텍스트 변경
    if (winner === 'PLAYER') { 
        countP++; 
        document.getElementById('count-p').innerText = countP; 
    } else if (winner === 'BANKER') { 
        countB++; 
        document.getElementById('count-b').innerText = countB; 
    } else { 
        countT++; 
        document.getElementById('count-t').innerText = countT; 
    }

    // 2. 전체 히스토리 배열에 데이터 삽입 (최근 20개까지만 유지)
    history.push(winner);
    if (history.length > 20) {
        history.shift(); // 20개가 넘어가면 가장 오래된 기록 삭제
    }

    // 3. 보드판 화면 그리기
    const board = document.getElementById('roadmap-board');
    board.innerHTML = ''; // 보드 리셋 후 다시 그리기

    history.forEach(result => {
        const dot = document.createElement('div');
        if (result === 'PLAYER') {
            dot.className = 'roadmap-dot dot-p';
            dot.innerText = 'P';
        } else if (result === 'BANKER') {
            dot.className = 'roadmap-dot dot-b';
            dot.innerText = 'B';
        } else {
            dot.className = 'roadmap-dot dot-t';
            dot.innerText = 'T';
        }
        board.appendChild(dot);
    });

    // 가로 스크롤을 항상 최신 기록(오른쪽 끝)으로 자동 이동
    board.scrollLeft = board.scrollWidth;
}
