let balance = 1000000;  
let betAmount = 10000;  
let selectedBet = null;

const suits = ['♠', '♦', '♥', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const lightningMultipliers = [2, 3, 4, 5, 8]; 

let roadmapData = [];
let countP = 0, countB = 0, countT = 0;

function changeBetAmount(val) {
    if (val === 'ALL') {
        betAmount = balance;
    } else {
        betAmount = Math.max(10000, betAmount + val); 
    }
    document.getElementById('bet-amount').innerText = betAmount.toLocaleString();
}

function selectBet(type) {
    selectedBet = type;
    document.getElementById('current-bet-type').innerText = type;
    document.getElementById('deal-btn').disabled = false;
    document.getElementById('result-text').innerText = `${type} 배팅 완료! ⚡ DEAL을 눌러 게임을 시작하세요.`;
}

function getCardScore(val) {
    if (['10', 'J', 'Q', 'K'].includes(val)) return 0;
    if (val === 'A') return 1;
    return parseInt(val);
}

function generateLightningCards() {
    let list = [];
    const count = Math.floor(Math.random() * 3) + 1; 
    for(let i=0; i<count; i++) {
        let card = {
            suit: suits[Math.floor(Math.random() * suits.length)],
            value: values[Math.floor(Math.random() * values.length)],
            mul: lightningMultipliers[Math.floor(Math.random() * lightningMultipliers.length)]
        };
        if (!list.some(item => item.suit === card.suit && item.value === card.value)) {
            list.push(card);
        }
    }
    return list;
}

function renderCardWithFlip(card, containerId, delay, activeLightningCards, targetSideCardsArray) {
    setTimeout(() => {
        const container = document.getElementById(containerId);
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        
        const isRed = card.suit === '♦' || card.suit === '♥';
        const isLightningMatch = activeLightningCards.some(l => l.suit === card.suit && l.value === card.value);
        let lightningTagHtml = '';
        
        if (isLightningMatch) {
            const matched = activeLightningCards.find(l => l.suit === card.suit && l.value === card.value);
            wrapper.classList.add('lightning-card-active');
            lightningTagHtml = `<div class="multiplier-tag">⚡x${matched.mul}</div>`;
            card.finalMul = matched.mul; 
        }

        wrapper.innerHTML = `
            ${lightningTagHtml}
            <div class="card-inner" id="card-${containerId}-${delay}">
                <div class="card-back"></div>
                <div class="card-front ${isRed ? 'red-suit' : ''}">
                    <div>${card.value}</div>
                    <div style="align-self: center; font-size: 2.2rem;">${card.suit}</div>
                    <div style="align-self: flex-end; transform: rotate(180deg);">${card.value}</div>
                </div>
            </div>
        `;
        
        container.appendChild(wrapper);
        targetSideCardsArray.push(card); 

        setTimeout(() => {
            const inner = document.getElementById(`card-${containerId}-${delay}`);
            if (inner) inner.classList.add('flipped');
        }, 100);

    }, delay);
}

function playGame() {
    if (!selectedBet || balance < betAmount) return;

    balance -= betAmount;
    document.getElementById('balance').innerText = balance.toLocaleString();
    document.getElementById('deal-btn').disabled = true;
    
    document.getElementById('player-cards').innerHTML = '';
    document.getElementById('banker-cards').innerHTML = '';
    document.getElementById('lightning-cards').innerHTML = '';

    const flash = document.getElementById('flash-screen');
    flash.classList.add('flash-active');
    setTimeout(() => flash.classList.remove('flash-active'), 400);

    const activeLightnings = generateLightningCards();
    activeLightnings.forEach(lc => {
        const div = document.createElement('div');
        div.className = 'card-front' + (lc.suit==='♦'||lc.suit==='♥'?' red-suit':'');
        div.style.cssText = "width:60px; height:90px; font-size:1rem; position:relative; border:2px solid #ffcc00; box-shadow: 0 0 8px #ffcc00;";
        div.innerHTML = `<div>${lc.value}</div><div style="font-size:1.5rem; text-align:center;">${lc.suit}</div><div style="position:absolute; bottom:2px; right:5px; font-weight:bold; color:#ff8800;">x${lc.mul}</div>`;
        document.getElementById('lightning-cards').appendChild(div);
    });

    let rawPlayerCards = [drawRawCard(), drawRawCard()];
    let rawBankerCards = [drawRawCard(), drawRawCard()];
    
    let pCardsHand = [];
    let bCardsHand = [];

    renderCardWithFlip(rawPlayerCards[0], 'player-cards', 400, activeLightnings, pCardsHand);
    renderCardWithFlip(rawBankerCards[0], 'banker-cards', 800, activeLightnings, bCardsHand);
    renderCardWithFlip(rawPlayerCards[1], 'player-cards', 1200, activeLightnings, pCardsHand);
    renderCardWithFlip(rawBankerCards[1], 'banker-cards', 1600, activeLightnings, bCardsHand);

    setTimeout(() => {
        let pScore = calculateRealScore(pCardsHand);
        let bScore = calculateRealScore(bCardsHand);
        
        document.getElementById('player-score').innerText = pScore;
        document.getElementById('banker-score').innerText = bScore;

        if (pScore >= 8 || bScore >= 8) {
            concludeGame(pCardsHand, bCardsHand);
            return;
        }

        let pThirdDrew = false;
        let pThirdScoreVal = -1;
        let nextDelay = 400;

        if (pScore <= 5) {
            let extraCard = drawRawCard();
            renderCardWithFlip(extraCard, 'player-cards', nextDelay, activeLightnings, pCardsHand);
            pThirdDrew = true;
            pThirdScoreVal = getCardScore(extraCard.value);
            nextDelay += 500;
        }

        setTimeout(() => {
            let pScoreCurrent = calculateRealScore(pCardsHand);
            document.getElementById('player-score').innerText = pScoreCurrent;

            if (!pThirdDrew) {
                if (bScore <= 5) {
                    renderCardWithFlip(drawRawCard(), 'banker-cards', 100, activeLightnings, bCardsHand);
                }
            } else {
                if (bScore <= 2) drawBankerExtra();
                else if (bScore === 3 && pThirdScoreVal !== 8) drawBankerExtra();
                else if (bScore === 4 && [2,3,4,5,6,7].includes(pThirdScoreVal)) drawBankerExtra();
                else if (bScore === 5 && [4,5,6,7].includes(pThirdScoreVal)) drawBankerExtra();
                else if (bScore === 6 && [6,7].includes(pThirdScoreVal)) drawBankerExtra();
            }

            function drawBankerExtra() {
                renderCardWithFlip(drawRawCard(), 'banker-cards', 100, activeLightnings, bCardsHand);
            }

            setTimeout(() => {
                document.getElementById('banker-score').innerText = calculateRealScore(bCardsHand);
                concludeGame(pCardsHand, bCardsHand);
            }, 600);

        }, nextDelay);

    }, 2200);
}

function drawRawCard() {
    return {
        suit: suits[Math.floor(Math.random() * suits.length)],
        value: values[Math.floor(Math.random() * values.length)],
        finalMul: 1
    };
}

function calculateRealScore(hand) {
    let total = hand.reduce((sum, c) => sum + getCardScore(c.value), 0);
    return total % 10;
}

function concludeGame(pHand, bHand) {
    let pScore = calculateRealScore(pHand);
    let bScore = calculateRealScore(bHand);
    
    let winner = 'TIE';
    if (pScore > bScore) winner = 'PLAYER';
    else if (bScore > pScore) winner = 'BANKER';

    let finalSystemMultiplier = 1;
    let winningHand = (winner === 'PLAYER') ? pHand : (winner === 'BANKER' ? bHand : []);
    
    if (winner !== 'TIE') {
        winningHand.forEach(card => {
            if (card.finalMul > 1) finalSystemMultiplier *= card.finalMul;
        });
    }

    let resultText = `[${winner} 승리] `;
    if (selectedBet === winner) {
        let basePayout = (winner === 'TIE') ? betAmount * 9 : betAmount * 2;
        let totalPayout = basePayout * finalSystemMultiplier;
        balance += totalPayout;
        
        resultText += finalSystemMultiplier > 1 
            ? `⚡⚡ 대박! 라이트닝 보너스 x${finalSystemMultiplier}배! (+${totalPayout.toLocaleString()}원)`
            : `🎉 베팅 성공! (+${totalPayout.toLocaleString()}원)`;
    } else {
        resultText += `💸 베팅 실패...`;
    }

    document.getElementById('result-text').innerText = resultText;
    document.getElementById('balance').innerText = balance.toLocaleString();

    pushToRoadmap(winner);
    
    selectedBet = null;
    document.getElementById('current-bet-type').innerText = '없음';
}

function pushToRoadmap(winner) {
    if (winner === 'PLAYER') countP++;
    else if (winner === 'BANKER') countB++;
    else if (winner === 'TIE') countT++;

    document.getElementById('count-p').innerText = countP;
    document.getElementById('count-b').innerText = countB;
    document.getElementById('count-t').innerText = countT;

    if (winner !== 'INITIAL_EMPTY_CALL_DUMMY') {
        roadmapData.push(winner);
    }
    if (roadmapData.length > 72) roadmapData.shift();

    const grid = document.getElementById('roadmap-grid');
    grid.innerHTML = '';

    for(let i=0; i<72; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        if (roadmapData[i]) {
            if (roadmapData[i] === 'PLAYER') { cell.classList.add('cell-p'); cell.innerText = 'P'; }
            else if (roadmapData[i] === 'BANKER') { cell.classList.add('cell-b'); cell.innerText = 'B'; }
            else if (roadmapData[i] === 'TIE') { cell.classList.add('cell-t'); cell.innerText = 'T'; }
        }
        grid.appendChild(cell);
    }
}

pushToRoadmap('INITIAL_EMPTY_CALL_DUMMY');
