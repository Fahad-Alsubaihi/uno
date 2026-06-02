const { v4: uuidv4 } = require('uuid');

const COLORS = ['red', 'green', 'blue', 'yellow'];

function createDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push({ id: uuidv4(), color, type: 'number', value: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: uuidv4(), color, type: 'number', value: n });
      deck.push({ id: uuidv4(), color, type: 'number', value: n });
    }
    for (let i = 0; i < 2; i++) {
      deck.push({ id: uuidv4(), color, type: 'skip',        value: 'skip' });
      deck.push({ id: uuidv4(), color, type: 'reverse',     value: 'reverse' });
      deck.push({ id: uuidv4(), color, type: 'draw-two',    value: '+2',  drawValue: 2 });
      deck.push({ id: uuidv4(), color, type: 'draw-four',   value: '+4',  drawValue: 4 });
      deck.push({ id: uuidv4(), color, type: 'skip-all',    value: 'skip-all' });
      deck.push({ id: uuidv4(), color, type: 'discard-all', value: 'discard-all' });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-draw-six',          value: '+6',    drawValue: 6 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-draw-ten',          value: '+10',   drawValue: 10 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-reverse-draw-four', value: 'عكس+4', drawValue: 4 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-color-roulette',    value: 'روليت' });
  }
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MERCY_LIMIT = 25;

let _sid = 1;
function sid() { return String(_sid++); }

const DEFAULT_SEGMENTS = [
  { id: sid(), type: 'punishment', text: 'اشرب كوب ماء كامل',        size: 3, color: '#EF4444' },
  { id: sid(), type: 'punishment', text: 'قلد صوت حيوان 10 ثواني',   size: 2, color: '#F97316' },
  { id: sid(), type: 'luck',       text: 'retry',                     size: 2, color: '#7C3AED' },
  { id: sid(), type: 'punishment', text: 'افعل 10 ضغط',              size: 3, color: '#EC4899' },
  { id: sid(), type: 'punishment', text: 'غني مقطع',                  size: 2, color: '#DC2626' },
  { id: sid(), type: 'luck',       text: 'reverse',                   size: 1, color: '#2563EB' },
  { id: sid(), type: 'punishment', text: 'قل سراً محرجاً',            size: 2, color: '#B45309' },
  { id: sid(), type: 'punishment', text: 'تخطي دورك مرتين',           size: 2, color: '#EA580C' },
];

class GameRoom {
  constructor(code) {
    this.code = code;
    // players: { clientId, id: socketId, name, hand, unoCalled, connected }
    this.players = [];
    this.hostClientId = null;
    this.eliminatedPlayers = []; // { clientId, id: socketId, name }
    this.gameStarted = false;
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.pendingDraw = 0;
    this.lastDrawValue = 0;
    this.pendingSevenSwap = false;
    this.pendingSevenClientId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRouletteClientId = null;
    this.rouletteChosenColor = null;
    this.currentColor = null;
    // Punishment
    this.punishmentMode = false;
    this.segments = DEFAULT_SEGMENTS.map(s => ({ ...s }));
    this.punishmentApprovals = new Set(); // stores clientIds
    this.wheelRetryCount = 0;
    this.wheelCumAngle = 0;
    this.currentSpinnerId = null;   // clientId of current spinner
    this.currentSpinnerName = null;
    this.lastWinner = null;
    this.lastLoserId = null;
    this.lastLoserName = null;
    this.totalRounds = 3;
    this.currentRound = 1;
    this.scores = {};
    this.waitingForNextRound = false;
    // Draw-phase tracking (draw one card at a time until playable)
    this.inDrawPhase = false;
    this.drawPhaseFoundPlayable = false;
    this.lastDrawnCardId = null;
    // Activity tracking for expiration
    this.lastActivityAt = Date.now();
  }

  touch() {
    this.lastActivityAt = Date.now();
  }

  get status() {
    if (this.gameStarted || this.waitingForNextRound) return 'playing';
    return 'waiting';
  }

  _transferHostIfNeeded(removedClientId) {
    if (this.hostClientId !== removedClientId) return false;
    const next = this.players[0];
    if (next) { this.hostClientId = next.clientId; return true; }
    return false;
  }

  // ── Player management ──

  addPlayer(clientId, socketId, name) {
    if (!this.hostClientId) this.hostClientId = clientId;
    this.players.push({ clientId, id: socketId, name, hand: [], unoCalled: false, connected: true, away: false });
  }

  reconnectPlayer(clientId, newSocketId) {
    const p = this.players.find(p => p.clientId === clientId);
    if (!p) return false;
    p.id = newSocketId;
    p.connected = true;
    p.away = false;
    return true;
  }

  setPlayerAway(clientId, away) {
    const p = this.players.find(p => p.clientId === clientId);
    if (p) p.away = !!away;
  }

  disconnectPlayer(clientId) {
    const p = this.players.find(p => p.clientId === clientId);
    if (p) p.connected = false;
  }

  removePlayer(clientId) {
    const idx = this.players.findIndex(p => p.clientId === clientId);
    if (idx === -1) return;
    if (this.gameStarted) {
      this.deck.push(...this.players[idx].hand);
      this.deck = shuffle(this.deck);
    }
    this.players.splice(idx, 1);
    if (this.gameStarted && this.players.length > 0) {
      if (idx < this.currentPlayerIndex) this.currentPlayerIndex--;
      this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
    }
    this._transferHostIfNeeded(clientId);
  }

  // ── Game start ──

  startGame() {
    if (this.punishmentMode) {
      const notApproved = this.players.filter(p => !this.punishmentApprovals.has(p.clientId));
      if (notApproved.length > 0) return { error: `${notApproved[0].name} لم يوافق بعد` };
    }
    this.gameStarted = true;
    this.eliminatedPlayers = [];
    this.deck = shuffle(createDeck());
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.pendingDraw = 0;
    this.lastDrawValue = 0;
    this.currentRound = 1;
    this.scores = {};
    this.waitingForNextRound = false;
    this.pendingSevenSwap = false;
    this.pendingSevenClientId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRouletteClientId = null;
    this.inDrawPhase = false;
    this.drawPhaseFoundPlayable = false;
    this.lastDrawnCardId = null;

    for (const player of this.players) {
      player.hand = [];
      player.unoCalled = false;
      for (let i = 0; i < 7; i++) player.hand.push(this.deck.pop());
    }

    let startCard;
    do {
      startCard = this.deck.pop();
      if (startCard.type !== 'number') {
        this.deck.unshift(startCard);
        startCard = null;
      }
    } while (!startCard);

    this.discardPile.push(startCard);
    this.currentColor = startCard.color;
    if (startCard.type === 'skip') this._advanceTurn(1);
    else if (startCard.type === 'reverse') this.direction = -1;
  }

  // ── Turn helpers ──

  _advanceTurn(times = 1) {
    this.inDrawPhase = false;
    this.drawPhaseFoundPlayable = false;
    this.lastDrawnCardId = null;
    for (let i = 0; i < times; i++) {
      this.currentPlayerIndex =
        (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
    }
  }

  _reshuffleDeck() {
    if (this.discardPile.length <= 1) return;
    const top = this.discardPile.pop();
    this.deck = shuffle(this.discardPile);
    this.discardPile = [top];
  }

  _drawCards(player, count) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) this._reshuffleDeck();
      if (this.deck.length > 0) player.hand.push(this.deck.pop());
    }
  }

  _checkMercyRule(player) {
    if (player.hand.length >= MERCY_LIMIT) {
      this._eliminatePlayer(player.clientId);
      return true;
    }
    return false;
  }

  _eliminatePlayer(clientId) {
    const idx = this.players.findIndex(p => p.clientId === clientId);
    if (idx === -1) return;
    const p = this.players[idx];
    this.eliminatedPlayers.push({ clientId: p.clientId, id: p.id, name: p.name });
    this.deck.push(...p.hand);
    this.deck = shuffle(this.deck);
    this.players.splice(idx, 1);
    if (idx < this.currentPlayerIndex) this.currentPlayerIndex--;
    if (this.players.length > 0) this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
  }

  _isPlayable(card) {
    const top = this.discardPile[this.discardPile.length - 1];
    if (this.pendingDraw > 0) return (card.drawValue || 0) >= this.lastDrawValue;
    if (this._isWildCard(card.type)) return true;
    const activeColor = this.currentColor || top?.color;
    if (!activeColor) return true;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && top && top.color !== 'wild' && card.type === top.type) return true;
    if (card.type === 'number' && top?.type === 'number' && card.value === top.value) return true;
    return false;
  }

  _rotateHands() {
    if (this.players.length < 2) return;
    const hands = this.players.map(p => p.hand);
    if (this.direction === 1) { const first = hands.shift(); hands.push(first); }
    else { const last = hands.pop(); hands.unshift(last); }
    this.players.forEach((p, i) => { p.hand = hands[i]; });
  }

  _checkUnoPenalties(exceptClientId) {
    for (const player of this.players) {
      if (player.clientId === exceptClientId) continue;
      if (player.hand.length === 1 && !player.unoCalled) this._drawCards(player, 2);
    }
  }

  _isWildCard(type) {
    return ['wild-draw-six', 'wild-draw-ten', 'wild-reverse-draw-four', 'wild-color-roulette'].includes(type);
  }

  // ── Card actions ──

  playCard(clientId, cardIndex, chosenColor = null) {
    if (this.waitingForNextRound) return { error: 'في انتظار بدء الجولة التالية' };
    if (this.pendingSevenSwap)    return { error: 'أكمل تبادل السبعة أولاً' };
    if (this.pendingColorRoulette) return { error: 'أكمل روليت الألوان أولاً' };

    const pIdx = this.players.findIndex(p => p.clientId === clientId);
    if (pIdx === -1)                        return { error: 'لاعب غير موجود' };
    if (pIdx !== this.currentPlayerIndex)   return { error: 'ليس دورك' };

    const player = this.players[pIdx];
    const card = player.hand[cardIndex];
    if (!card)                 return { error: 'ورقة غير صالحة' };
    if (!this._isPlayable(card)) return { error: 'لا يمكنك لعب هذه البطاقة' };

    // Enforce: after drawing a playable card, must play that specific card
    if (this.drawPhaseFoundPlayable && card.id !== this.lastDrawnCardId) {
      return { error: 'يجب لعب الورقة التي سحبتها' };
    }

    player.hand.splice(cardIndex, 1);
    player.unoCalled = false;
    // Reset draw phase on successful play
    this.inDrawPhase = false;
    this.drawPhaseFoundPlayable = false;
    this.lastDrawnCardId = null;

    if (this._isWildCard(card.type)) {
      if (card.type !== 'wild-color-roulette') {
        card.chosenColor = COLORS.includes(chosenColor) ? chosenColor : 'red';
        this.currentColor = card.chosenColor;
      }
    } else {
      this.currentColor = card.color;
    }

    this.discardPile.push(card);

    if (card.drawValue > 0) {
      this.lastDrawValue = card.drawValue;
      this.pendingDraw += card.drawValue;
    }

    if (player.hand.length === 0) {
      const winResult = this._handleWin(player);
      return { card, ...winResult };
    }

    switch (card.type) {
      case 'skip':
        this._advanceTurn(2);
        break;
      case 'skip-all':
        break;
      case 'reverse':
        this.direction *= -1;
        this._advanceTurn(this.players.length === 2 ? 2 : 1);
        break;
      case 'draw-two':
      case 'draw-four':
      case 'wild-draw-six':
      case 'wild-draw-ten':
        this._advanceTurn(1);
        break;
      case 'wild-reverse-draw-four':
        this.direction *= -1;
        if (this.players.length === 2) {
          // 2-player: reverse skips opponent → current player has pendingDraw=4
          // Stay on current player so they can counter-stack or draw manually
        } else {
          this._advanceTurn(1);
        }
        break;
      case 'discard-all': {
        const col = card.color;
        player.hand = player.hand.filter(c => c.color !== col);
        if (player.hand.length === 0) {
          const winResult = this._handleWin(player);
          return { card, ...winResult };
        }
        this._advanceTurn(1);
        break;
      }
      case 'wild-color-roulette':
        this._advanceTurn(1);
        this.pendingColorRoulette = true;
        this.pendingColorRouletteClientId = this.players[this.currentPlayerIndex]?.clientId;
        break;
      case 'number':
        if (card.value === 7) {
          this.pendingSevenSwap = true;
          this.pendingSevenClientId = clientId;
        } else if (card.value === 0) {
          this._rotateHands();
          this._advanceTurn(1);
        } else {
          this._advanceTurn(1);
        }
        break;
      default:
        this._advanceTurn(1);
    }

    this._checkUnoPenalties(clientId);
    return { card };
  }

  drawCard(clientId) {
    const pIdx = this.players.findIndex(p => p.clientId === clientId);
    if (pIdx === -1)                      return { error: 'لاعب غير موجود' };
    if (pIdx !== this.currentPlayerIndex) return { error: 'ليس دورك' };

    const player = this.players[pIdx];

    // Stacking draw penalty — take all at once
    if (this.pendingDraw > 0) {
      const count = this.pendingDraw;
      this._drawCards(player, count);
      this.pendingDraw = 0;
      this.lastDrawValue = 0;
      const eliminated = this._checkMercyRule(player);
      if (!eliminated) this._advanceTurn(1);
      return { drew: count, eliminated };
    }

    // Already found a playable drawn card — must play it first
    if (this.drawPhaseFoundPlayable) {
      return { error: 'العب الورقة المسحوبة أولاً' };
    }

    // Official rule: can only draw if you have NO playable card in hand
    if (!this.inDrawPhase && player.hand.some(c => this._isPlayable(c))) {
      return { error: 'لديك ورقة قابلة للعب، العبها' };
    }

    // Draw exactly one card
    if (this.deck.length === 0) this._reshuffleDeck();
    if (this.deck.length === 0) return { error: 'الدكة فارغة' };

    const drawnCard = this.deck.pop();
    player.hand.push(drawnCard);
    this.inDrawPhase = true;
    this.lastDrawnCardId = drawnCard.id;

    const mustPlay = this._isPlayable(drawnCard);
    if (mustPlay) this.drawPhaseFoundPlayable = true;

    const eliminated = this._checkMercyRule(player);
    if (eliminated) return { drew: 1, eliminated: true };

    return { drew: 1, card: drawnCard, mustPlay, eliminated: false };
  }

  passTurn(clientId) {
    const pIdx = this.players.findIndex(p => p.clientId === clientId);
    if (pIdx === -1)                      return { error: 'لاعب غير موجود' };
    if (pIdx !== this.currentPlayerIndex) return { error: 'ليس دورك' };
    if (this.inDrawPhase) return { error: 'يجب مواصلة السحب حتى تجد ورقة قابلة للعب' };
    this._advanceTurn(1);
    return { ok: true };
  }

  sevenSwap(clientId, targetClientId) {
    if (!this.pendingSevenSwap)              return { error: 'لا يوجد تبادل معلق' };
    if (clientId !== this.pendingSevenClientId) return { error: 'ليس تبادلك' };

    const pIdx = this.players.findIndex(p => p.clientId === clientId);
    const tIdx = this.players.findIndex(p => p.clientId === targetClientId);
    if (pIdx === -1 || tIdx === -1) return { error: 'لاعب غير موجود' };
    if (pIdx === tIdx)              return { error: 'لا يمكن التبادل مع نفسك' };

    const tmp = this.players[pIdx].hand;
    this.players[pIdx].hand = this.players[tIdx].hand;
    this.players[tIdx].hand = tmp;

    this.pendingSevenSwap = false;
    this.pendingSevenClientId = null;
    this._advanceTurn(1);
    return { swapped: true };
  }

  colorRoulettePick(clientId, chosenColor) {
    if (!this.pendingColorRoulette)                      return { error: 'لا يوجد روليت معلق' };
    if (clientId !== this.pendingColorRouletteClientId)  return { error: 'ليس روليتك' };
    if (!COLORS.includes(chosenColor))                   return { error: 'لون غير صالح' };
    this.rouletteChosenColor = chosenColor;
    this.currentColor = chosenColor;
    return { colorChosen: true, chosenColor };
  }

  rouletteDraw(clientId) {
    if (!this.pendingColorRoulette)                      return { error: 'لا يوجد روليت معلق' };
    if (clientId !== this.pendingColorRouletteClientId)  return { error: 'ليس روليتك' };
    if (!this.rouletteChosenColor)                       return { error: 'اختر اللون أولاً' };

    const player = this.players.find(p => p.clientId === clientId);
    if (!player) return { error: 'لاعب غير موجود' };

    if (this.deck.length === 0) this._reshuffleDeck();
    if (this.deck.length === 0) return { error: 'الدكة فارغة' };

    const drawnCard = this.deck.pop();
    player.hand.push(drawnCard);
    const found = drawnCard.color === this.rouletteChosenColor;

    if (found) {
      this.pendingColorRoulette = false;
      this.pendingColorRouletteClientId = null;
      this.rouletteChosenColor = null;
      const eliminated = this._checkMercyRule(player);
      if (!eliminated) this._advanceTurn(1);
      return { drew: 1, card: drawnCard, found: true, eliminated };
    }

    const eliminated = this._checkMercyRule(player);
    if (eliminated) {
      this.pendingColorRoulette = false;
      this.pendingColorRouletteClientId = null;
      this.rouletteChosenColor = null;
      return { drew: 1, card: drawnCard, found: false, eliminated: true };
    }
    return { drew: 1, card: drawnCard, found: false, eliminated: false };
  }

  callUno(clientId) {
    const player = this.players.find(p => p.clientId === clientId);
    if (!player)                  return { error: 'لاعب غير موجود' };
    if (player.hand.length !== 1) return { error: 'لا يمكن الصياح UNO' };
    player.unoCalled = true;
    return { success: true };
  }

  catchUno(callerClientId, targetClientId) {
    const target = this.players.find(p => p.clientId === targetClientId);
    if (!target)                                       return { error: 'لاعب غير موجود' };
    if (target.hand.length !== 1 || target.unoCalled) return { error: 'لا يمكن مسكه' };
    this._drawCards(target, 2);
    return { caught: true, targetName: target.name };
  }

  // ── Punishment mode ──

  setPunishmentMode(clientId, enabled) {
    if (this.hostClientId !== clientId) return { error: 'فقط المضيف' };
    this.punishmentMode = enabled;
    this.punishmentApprovals.clear();
    return { ok: true };
  }

  setSegments(clientId, segments) {
    if (this.hostClientId !== clientId) return { error: 'فقط المضيف' };
    if (!Array.isArray(segments) || segments.length < 1) return { error: 'يجب أن يكون هناك قسم واحد على الأقل' };
    this.segments = segments.slice(0, 20);
    return { ok: true };
  }

  approvePunishment(clientId) {
    this.punishmentApprovals.add(clientId);
    return { ok: true };
  }

  spinWheel(clientId) {
    if (!this.punishmentMode)               return { error: 'وضع العقوبات غير مفعّل' };
    if (clientId !== this.currentSpinnerId) return { error: 'ليس دورك للدوران' };
    if (!this.segments?.length)             return { error: 'لا توجد أقسام' };

    const segs = this.segments;
    const totalSize = segs.reduce((s, g) => s + g.size, 0);

    let rand = Math.random() * totalSize;
    let chosen = segs[segs.length - 1];
    let cumAngle = 0, chosenStart = 0, chosenSpan = 0;

    for (const seg of segs) {
      const span = (seg.size / totalSize) * 360;
      rand -= seg.size;
      if (rand <= 0) { chosen = seg; chosenStart = cumAngle; chosenSpan = span; break; }
      cumAngle += span;
    }

    const landAngle = chosenStart + Math.random() * chosenSpan;
    const baseStop = (360 - (landAngle % 360) + 360) % 360;
    this.wheelCumAngle += 5 * 360 + baseStop;
    const stopAngle = this.wheelCumAngle;

    if (chosen.type === 'luck') {
      if (chosen.text === 'retry') {
        this.wheelRetryCount = (this.wheelRetryCount || 0) + 1;
        if (this.wheelRetryCount >= 3) {
          const punishments = segs.filter(s => s.type === 'punishment');
          const forced = punishments[Math.floor(Math.random() * punishments.length)];
          this.wheelRetryCount = 0;
          this.lastLoserId = this.currentSpinnerId;
          this.lastLoserName = this.currentSpinnerName;
          this.currentSpinnerId = null;
          return { type: 'execute', segment: forced, stopAngle, forced: true, loserName: this.lastLoserName };
        }
        return { type: 'retry', segment: chosen, stopAngle, retryCount: this.wheelRetryCount, loserName: this.currentSpinnerName };
      }
      if (chosen.text === 'reverse') {
        const punishments = segs.filter(s => s.type === 'punishment');
        const punished = punishments[Math.floor(Math.random() * punishments.length)];
        this.lastLoserId = this.currentSpinnerId;
        this.lastLoserName = this.currentSpinnerName;
        this.currentSpinnerId = null;
        return {
          type: 'reverse', segment: chosen, stopAngle,
          punishment: punished?.text || 'عقوبة',
          winnerName: this.lastWinner?.name,
          loserName: this.lastLoserName,
        };
      }
    }

    this.wheelRetryCount = 0;
    this.lastLoserId = this.currentSpinnerId;
    this.lastLoserName = this.currentSpinnerName;
    this.currentSpinnerId = null;
    return { type: 'execute', segment: chosen, stopAngle, loserName: this.lastLoserName };
  }

  getPunishmentState() {
    return {
      enabled: this.punishmentMode,
      segments: this.segments,
      approvals: [...this.punishmentApprovals],
      totalPlayers: this.players.length,
    };
  }

  // ── Rounds ──

  setRounds(clientId, rounds) {
    if (this.hostClientId !== clientId) return { error: 'فقط المضيف' };
    this.totalRounds = rounds === '∞' ? Infinity : Number(rounds);
    return { ok: true };
  }

  _calcRoundScore(hand) {
    return hand.reduce((sum, card) => {
      if (card.type === 'number') return sum + Number(card.value);
      if (card.color === 'wild')  return sum + 50;
      return sum + 20;
    }, 0);
  }

  _handleWin(player) {
    const roundWinner = { id: player.clientId, name: player.name };
    const allPlayers = [...this.players, ...this.eliminatedPlayers];

    for (const p of this.players) {
      if (p.clientId === roundWinner.id) continue;
      this.scores[roundWinner.id] = (this.scores[roundWinner.id] || 0) + this._calcRoundScore(p.hand);
    }
    for (const e of this.eliminatedPlayers) {
      this.scores[roundWinner.id] = (this.scores[roundWinner.id] || 0) + 250;
    }

    console.log(`[Round ${this.currentRound}/${this.totalRounds}] RoundWinner: ${roundWinner.name}, Scores:`, this.scores);

    const isLastRound = this.totalRounds !== Infinity && this.currentRound >= this.totalRounds;
    const hasReachedLimit = Object.values(this.scores).some(s => s >= 1000);

    if (!isLastRound && !hasReachedLimit) {
      this.waitingForNextRound = true;
      return {
        roundOver: true,
        roundWinner,
        scores: { ...this.scores },
        currentRound: this.currentRound,
        totalRounds: this.totalRounds,
      };
    }

    // Game over — winner = highest score
    let topScore = -1, gameWinnerId = roundWinner.id;
    for (const p of allPlayers) {
      const s = this.scores[p.clientId] || 0;
      if (s > topScore) { topScore = s; gameWinnerId = p.clientId; }
    }
    const gameWinnerPlayer = allPlayers.find(p => p.clientId === gameWinnerId);
    const gameWinner = { id: gameWinnerId, name: gameWinnerPlayer?.name || roundWinner.name };

    const loserPlayer = [...this.players]
      .filter(p => p.clientId !== gameWinnerId)
      .sort((a, b) => (this.scores[a.clientId] || 0) - (this.scores[b.clientId] || 0))[0];
    const gameLoser = loserPlayer ? { id: loserPlayer.clientId, name: loserPlayer.name } : null;

    this.gameStarted = false;
    if (this.punishmentMode && gameLoser) {
      this.currentSpinnerId = gameLoser.id;
      this.currentSpinnerName = gameLoser.name;
      this.lastWinner = gameWinner;
      this.wheelRetryCount = 0;
      this.wheelCumAngle = 0;
    }

    return {
      gameOver: true, finalRound: true,
      winner: gameWinner,
      loser: gameLoser,
      scores: { ...this.scores },
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
    };
  }

  _startNewRound() {
    for (const ep of this.eliminatedPlayers) {
      if (!this.players.find(p => p.clientId === ep.clientId)) {
        this.players.push({ clientId: ep.clientId, id: ep.id, name: ep.name, hand: [], unoCalled: false, connected: true, away: false });
      }
    }
    this.eliminatedPlayers = [];
    this.deck = shuffle(createDeck());
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.pendingDraw = 0;
    this.lastDrawValue = 0;
    this.pendingSevenSwap = false;
    this.pendingSevenClientId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRouletteClientId = null;
    this.rouletteChosenColor = null;
    this.inDrawPhase = false;
    this.drawPhaseFoundPlayable = false;
    this.lastDrawnCardId = null;

    for (const player of this.players) {
      player.hand = [];
      player.unoCalled = false;
      for (let i = 0; i < 7; i++) player.hand.push(this.deck.pop());
    }

    let startCard;
    do {
      startCard = this.deck.pop();
      if (startCard.type !== 'number') { this.deck.unshift(startCard); startCard = null; }
    } while (!startCard);

    this.discardPile.push(startCard);
    this.currentColor = startCard.color;
  }

  startNextRound(clientId) {
    if (this.hostClientId !== clientId) return { error: 'فقط المضيف' };
    if (!this.waitingForNextRound)      return { error: 'لا يوجد جولة معلقة' };
    this.currentRound++;
    this.waitingForNextRound = false;
    this._startNewRound();
    console.log(`[Starting Round ${this.currentRound}/${this.totalRounds}]`);
    return { ok: true };
  }

  forceResetToLobby() {
    // Restore all eliminated players back into the room
    for (const ep of this.eliminatedPlayers) {
      if (!this.players.find(p => p.clientId === ep.clientId)) {
        this.players.push({ clientId: ep.clientId, id: ep.id, name: ep.name, hand: [], unoCalled: false, connected: false, away: false });
      }
    }
    this.eliminatedPlayers = [];
    this.gameStarted = false;
    this.waitingForNextRound = false;
    this.scores = {};
    this.currentRound = 1;
    this.pendingDraw = 0;
    this.lastDrawValue = 0;
    this.pendingSevenSwap = false;
    this.pendingSevenClientId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRouletteClientId = null;
    this.punishmentApprovals = new Set();
    this.currentSpinnerId = null;
    this.currentSpinnerName = null;
    this.lastLoserId = null;
    this.lastLoserName = null;
    this.lastWinner = null;
    this.wheelRetryCount = 0;
    this.wheelCumAngle = 0;
    // Keep: hostClientId, segments, totalRounds, punishmentMode
  }

  restartGame(clientId) {
    if (this.hostClientId !== clientId) return { error: 'فقط المضيف' };

    // Restore all eliminated players back into the room
    for (const ep of this.eliminatedPlayers) {
      if (!this.players.find(p => p.clientId === ep.clientId)) {
        this.players.push({ clientId: ep.clientId, id: ep.id, name: ep.name, hand: [], unoCalled: false, connected: ep.connected ?? true, away: false });
      }
    }
    // Ensure host stays at index 0
    this.players.sort((a, b) => {
      if (a.clientId === this.hostClientId) return -1;
      if (b.clientId === this.hostClientId) return 1;
      return 0;
    });

    this.eliminatedPlayers = [];
    this.currentRound = 1;
    this.scores = {};
    this.gameStarted = false;
    this.waitingForNextRound = false;
    this.punishmentApprovals = new Set();
    this.currentSpinnerId = null;
    this.currentSpinnerName = null;
    this.lastLoserId = null;
    this.lastLoserName = null;
    this.lastWinner = null;
    this.wheelRetryCount = 0;
    this.wheelCumAngle = 0;
    return { ok: true };
  }

  // ── State snapshots ──

  getState() {
    return {
      code: this.code,
      hostId: this.hostClientId,
      players: this.players.map(p => ({
        id: p.clientId,
        name: p.name,
        cardCount: p.hand.length,
        unoCalled: p.unoCalled,
        connected: p.connected,
        away: p.away || false,
      })),
      gameStarted: this.gameStarted,
      status: this.status,
      totalRounds: this.totalRounds,
    };
  }

  getGameState() {
    const topCard = this.discardPile[this.discardPile.length - 1];
    return {
      players: this.players.map(p => ({
        id: p.clientId,
        name: p.name,
        cardCount: p.hand.length,
        unoCalled: p.unoCalled,
        connected: p.connected,
        away: p.away || false,
      })),
      eliminatedPlayers: this.eliminatedPlayers.map(e => ({ id: e.clientId, name: e.name })),
      topCard,
      currentColor: this.currentColor || topCard?.color,
      currentPlayerId: this.players[this.currentPlayerIndex]?.clientId,
      direction: this.direction,
      pendingDraw: this.pendingDraw,
      lastDrawValue: this.lastDrawValue,
      pendingSevenSwap: this.pendingSevenSwap,
      pendingSevenPlayerId: this.pendingSevenClientId,
      pendingColorRoulette: this.pendingColorRoulette,
      pendingColorRoulettePlayerId: this.pendingColorRouletteClientId,
      rouletteChosenColor: this.rouletteChosenColor,
      inDrawPhase: this.inDrawPhase,
      drawPhaseFoundPlayable: this.drawPhaseFoundPlayable,
      lastDrawnCardId: this.lastDrawnCardId,
      deckCount: this.deck.length,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      scores: this.scores,
      waitingForNextRound: this.waitingForNextRound,
    };
  }
}

module.exports = GameRoom;
