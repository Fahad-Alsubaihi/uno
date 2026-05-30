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
      deck.push({ id: uuidv4(), color, type: 'skip', value: 'skip' });
      deck.push({ id: uuidv4(), color, type: 'reverse', value: 'reverse' });
      deck.push({ id: uuidv4(), color, type: 'draw-two', value: '+2', drawValue: 2 });
    }
    // No Mercy special colored cards
    deck.push({ id: uuidv4(), color, type: 'draw-six',   value: '+6',        drawValue: 6 });
    deck.push({ id: uuidv4(), color, type: 'draw-ten',   value: '+10',       drawValue: 10 });
    deck.push({ id: uuidv4(), color, type: 'skip-all',   value: 'skip-all' });
    deck.push({ id: uuidv4(), color, type: 'discard-all',value: 'discard-all' });
  }
  // Standard wilds x4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild',           value: 'wild' });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-draw-four', value: '+4', drawValue: 4 });
  }
  // No Mercy special wilds x2
  for (let i = 0; i < 2; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-draw-six',         value: '+6',     drawValue: 6 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-draw-ten',         value: '+10',    drawValue: 10 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-reverse-draw-four',value: 'عكس+4', drawValue: 4 });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild-color-roulette',   value: 'روليت' });
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

const WARM = ['#EF4444','#F97316','#EC4899','#DC2626','#B45309','#EA580C','#DB2777','#991B1B'];
const COOL = ['#7C3AED','#2563EB','#0891B2','#4F46E5'];

let _sid = 1;
function sid() { return String(_sid++); }

const DEFAULT_SEGMENTS = [
  { id: sid(), type: 'punishment', text: 'اشرب كوب ماء كامل',               size: 3, color: '#EF4444' },
  { id: sid(), type: 'punishment', text: 'قلد صوت حيوان 10 ثواني',           size: 2, color: '#F97316' },
  { id: sid(), type: 'luck',       text: 'retry',                            size: 2, color: '#7C3AED' },
  { id: sid(), type: 'punishment', text: 'افعل 10 ضغط',                     size: 3, color: '#EC4899' },
  { id: sid(), type: 'punishment', text: 'غني مقطع',                         size: 2, color: '#DC2626' },
  { id: sid(), type: 'luck',       text: 'reverse',                          size: 1, color: '#2563EB' },
  { id: sid(), type: 'punishment', text: 'قل سراً محرجاً',                   size: 2, color: '#B45309' },
  { id: sid(), type: 'punishment', text: 'تخطي دورك مرتين',                  size: 2, color: '#EA580C' },
];

class GameRoom {
  constructor(code) {
    this.code = code;
    this.players = [];
    this.eliminatedPlayers = [];
    this.gameStarted = false;
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.pendingDraw = 0;
    this.pendingSevenSwap = false;
    this.pendingSevenPlayerId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRoulettePlayerId = null;
    this.currentColor = null;
    // Punishment mode
    this.punishmentMode = false;
    this.segments = DEFAULT_SEGMENTS.map(s => ({ ...s }));
    this.punishmentApprovals = new Set();
    this.wheelRetryCount = 0;
    this.wheelCumAngle = 0;
    this.currentSpinnerId = null;
    this.currentSpinnerName = null;
    this.lastWinner = null;
  }

  addPlayer(id, name) {
    this.players.push({ id, name, hand: [], unoCalled: false });
  }

  removePlayer(id) {
    const idx = this.players.findIndex(p => p.id === id);
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
  }

  startGame() {
    // Check all approved if punishment mode is on
    if (this.punishmentMode) {
      const notApproved = this.players.filter(p => !this.punishmentApprovals.has(p.id));
      if (notApproved.length > 0) return { error: `${notApproved[0].name} لم يوافق بعد` };
    }
    this.gameStarted = true;
    this.eliminatedPlayers = [];
    this.deck = shuffle(createDeck());
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1;
    this.pendingDraw = 0;
    this.pendingSevenSwap = false;
    this.pendingSevenPlayerId = null;
    this.pendingColorRoulette = false;
    this.pendingColorRoulettePlayerId = null;

    for (const player of this.players) {
      player.hand = [];
      player.unoCalled = false;
      for (let i = 0; i < 7; i++) player.hand.push(this.deck.pop());
    }

    // First card: skip any wild type
    let startCard;
    do {
      startCard = this.deck.pop();
      if (startCard.color === 'wild') {
        this.deck.unshift(startCard);
        startCard = null;
      }
    } while (!startCard);

    this.discardPile.push(startCard);
    this.currentColor = startCard.color;

    if (startCard.type === 'skip') this._advanceTurn(1);
    else if (startCard.type === 'reverse') this.direction = -1;
  }

  _advanceTurn(times = 1) {
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

  // Returns true if the player was eliminated (mercy rule)
  _checkMercyRule(player) {
    if (player.hand.length >= MERCY_LIMIT) {
      this._eliminatePlayer(player.id);
      return true;
    }
    return false;
  }

  _eliminatePlayer(playerId) {
    const idx = this.players.findIndex(p => p.id === playerId);
    if (idx === -1) return;
    this.eliminatedPlayers.push({ id: this.players[idx].id, name: this.players[idx].name });
    this.deck.push(...this.players[idx].hand);
    this.deck = shuffle(this.deck);
    this.players.splice(idx, 1);
    // Adjust currentPlayerIndex
    if (idx < this.currentPlayerIndex) this.currentPlayerIndex--;
    if (this.players.length > 0) {
      this.currentPlayerIndex = this.currentPlayerIndex % this.players.length;
    }
  }

  // Stacking rule: card.drawValue >= current pendingDraw total
  _isPlayable(card) {
    const top = this.discardPile[this.discardPile.length - 1];

    if (this.pendingDraw > 0) {
      return (card.drawValue || 0) >= this.pendingDraw;
    }

    if (card.color === 'wild') return true;

    const activeColor = this.currentColor || top?.color;
    if (!activeColor) return true;
    if (card.color === activeColor) return true;
    if (card.type !== 'number' && top && card.type === top.type) return true;
    if (card.type === 'number' && top?.type === 'number' && card.value === top.value) return true;
    return false;
  }

  _rotateHands() {
    if (this.players.length < 2) return;
    const hands = this.players.map(p => p.hand);
    if (this.direction === 1) {
      const first = hands.shift();
      hands.push(first);
    } else {
      const last = hands.pop();
      hands.unshift(last);
    }
    this.players.forEach((p, i) => { p.hand = hands[i]; });
  }

  _checkUnoPenalties(exceptId) {
    for (const player of this.players) {
      if (player.id === exceptId) continue;
      if (player.hand.length === 1 && !player.unoCalled) {
        this._drawCards(player, 2);
      }
    }
  }

  _isWildCard(type) {
    return ['wild','wild-draw-four','wild-draw-six','wild-draw-ten',
            'wild-reverse-draw-four','wild-color-roulette'].includes(type);
  }

  playCard(playerId, cardIndex, chosenColor = null) {
    if (this.pendingSevenSwap)    return { error: 'أكمل تبادل السبعة أولاً' };
    if (this.pendingColorRoulette) return { error: 'أكمل روليت الألوان أولاً' };

    const pIdx = this.players.findIndex(p => p.id === playerId);
    if (pIdx === -1)                   return { error: 'لاعب غير موجود' };
    if (pIdx !== this.currentPlayerIndex) return { error: 'ليس دورك' };

    const player = this.players[pIdx];
    const card = player.hand[cardIndex];
    if (!card)                return { error: 'ورقة غير صالحة' };
    if (!this._isPlayable(card)) return { error: 'لا يمكنك لعب هذه البطاقة' };

    player.hand.splice(cardIndex, 1);
    player.unoCalled = false;

    if (this._isWildCard(card.type)) {
      card.chosenColor = COLORS.includes(chosenColor) ? chosenColor : 'red';
      this.currentColor = card.chosenColor;
    } else {
      this.currentColor = card.color;
    }

    this.discardPile.push(card);

    // Win check
    if (player.hand.length === 0) {
      this.gameStarted = false;
      const loser = this.players
        .filter(p => p.id !== player.id)
        .sort((a, b) => b.hand.length - a.hand.length)[0];
      if (this.punishmentMode && loser) {
        this.currentSpinnerId = loser.id;
        this.currentSpinnerName = loser.name;
        const penaltyIdx = Math.floor(Math.random() * this.penalties.length);
        this.currentPenalty = this.penalties[penaltyIdx];
        this.lastWinner = { id: player.id, name: player.name };
        this.wheelRetryCount = 0;
      }
      return {
        card, gameOver: true,
        winner: { id: player.id, name: player.name },
        loser: loser ? { id: loser.id, name: loser.name } : null,
        punishment: this.punishmentMode ? this.currentPenalty : null,
      };
    }

    // Apply card effects
    switch (card.type) {
      case 'skip':
        this._advanceTurn(2);
        break;

      case 'skip-all':
        // Everyone loses their turn, current player goes again — no advance
        break;

      case 'reverse':
        this.direction *= -1;
        this._advanceTurn(this.players.length === 2 ? 2 : 1);
        break;

      case 'draw-two':
        this.pendingDraw += 2;
        this._advanceTurn(1);
        break;

      case 'draw-six':
        this.pendingDraw += 6;
        this._advanceTurn(1);
        break;

      case 'draw-ten':
        this.pendingDraw += 10;
        this._advanceTurn(1);
        break;

      case 'discard-all': {
        // Discard all remaining cards of same color from hand
        const col = card.color;
        player.hand = player.hand.filter(c => c.color !== col);
        if (player.hand.length === 0) {
          this.gameStarted = false;
          return { card, gameOver: true, winner: { id: player.id, name: player.name } };
        }
        this._advanceTurn(1);
        break;
      }

      case 'wild':
        this._advanceTurn(1);
        break;

      case 'wild-draw-four':
        this.pendingDraw += 4;
        this._advanceTurn(1);
        break;

      case 'wild-draw-six':
        this.pendingDraw += 6;
        this._advanceTurn(1);
        break;

      case 'wild-draw-ten':
        this.pendingDraw += 10;
        this._advanceTurn(1);
        break;

      case 'wild-reverse-draw-four':
        this.direction *= -1;
        if (this.players.length === 2) {
          // In 2-player: the player who played draws 4
          this._drawCards(player, 4);
          this._checkMercyRule(player);
          this._advanceTurn(1);
        } else {
          this.pendingDraw += 4;
          this._advanceTurn(1);
        }
        break;

      case 'wild-color-roulette':
        // Advance to next player — they pick color and draw
        this._advanceTurn(1);
        this.pendingColorRoulette = true;
        this.pendingColorRoulettePlayerId = this.players[this.currentPlayerIndex]?.id;
        break;

      case 'number':
        if (card.value === 7) {
          this.pendingSevenSwap = true;
          this.pendingSevenPlayerId = playerId;
          // No advance — wait for swap
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

    this._checkUnoPenalties(playerId);
    return { card };
  }

  // Draw until you get a playable card (or stack penalty)
  drawCard(playerId) {
    const pIdx = this.players.findIndex(p => p.id === playerId);
    if (pIdx === -1)                   return { error: 'لاعب غير موجود' };
    if (pIdx !== this.currentPlayerIndex) return { error: 'ليس دورك' };

    const player = this.players[pIdx];

    // Accept stack penalty
    if (this.pendingDraw > 0) {
      const count = this.pendingDraw;
      this.pendingDraw = 0;
      this._drawCards(player, count);
      const eliminated = this._checkMercyRule(player);
      if (!eliminated) this._advanceTurn(1);
      return { drew: count, eliminated };
    }

    // Draw until playable card found
    let drew = 0;
    let drawnCard;
    do {
      if (this.deck.length === 0) this._reshuffleDeck();
      if (this.deck.length === 0) break;
      drawnCard = this.deck.pop();
      player.hand.push(drawnCard);
      drew++;
    } while (!this._isPlayable(drawnCard) && drew < 30);

    const eliminated = this._checkMercyRule(player);
    if (!eliminated) this._advanceTurn(1);
    return { drew, eliminated };
  }

  sevenSwap(playerId, targetPlayerId) {
    if (!this.pendingSevenSwap)            return { error: 'لا يوجد تبادل معلق' };
    if (playerId !== this.pendingSevenPlayerId) return { error: 'ليس تبادلك' };

    const pIdx = this.players.findIndex(p => p.id === playerId);
    const tIdx = this.players.findIndex(p => p.id === targetPlayerId);
    if (pIdx === -1 || tIdx === -1) return { error: 'لاعب غير موجود' };
    if (pIdx === tIdx)              return { error: 'لا يمكن التبادل مع نفسك' };

    const tmp = this.players[pIdx].hand;
    this.players[pIdx].hand = this.players[tIdx].hand;
    this.players[tIdx].hand = tmp;

    this.pendingSevenSwap = false;
    this.pendingSevenPlayerId = null;
    this._advanceTurn(1);
    return { swapped: true };
  }

  // Next player picked color → draw until that color appears
  colorRoulettePick(playerId, chosenColor) {
    if (!this.pendingColorRoulette)                    return { error: 'لا يوجد روليت معلق' };
    if (playerId !== this.pendingColorRoulettePlayerId) return { error: 'ليس روليتك' };
    if (!COLORS.includes(chosenColor))                  return { error: 'لون غير صالح' };

    const player = this.players.find(p => p.id === playerId);
    if (!player) return { error: 'لاعب غير موجود' };

    let drew = 0;
    let drawnCard;
    do {
      if (this.deck.length === 0) this._reshuffleDeck();
      if (this.deck.length === 0) break;
      drawnCard = this.deck.pop();
      player.hand.push(drawnCard);
      drew++;
    } while (drawnCard.color !== chosenColor && drew < 40);

    this.currentColor = chosenColor;
    this.pendingColorRoulette = false;
    this.pendingColorRoulettePlayerId = null;

    const eliminated = this._checkMercyRule(player);
    if (!eliminated) this._advanceTurn(1);  // player loses their turn
    return { drew, eliminated };
  }

  callUno(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player)                   return { error: 'لاعب غير موجود' };
    if (player.hand.length !== 1)  return { error: 'لا يمكن الصياح UNO' };
    player.unoCalled = true;
    return { success: true };
  }

  catchUno(callerId, targetId) {
    const target = this.players.find(p => p.id === targetId);
    if (!target)                                    return { error: 'لاعب غير موجود' };
    if (target.hand.length !== 1 || target.unoCalled) return { error: 'لا يمكن مسكه' };
    this._drawCards(target, 2);
    return { caught: true, targetName: target.name };
  }

  jumpIn(playerId, cardIndex) {
    if (this.pendingSevenSwap)    return { error: 'لا يمكن الاقتحام أثناء التبادل' };
    if (this.pendingColorRoulette) return { error: 'لا يمكن الاقتحام أثناء الروليت' };

    const pIdx = this.players.findIndex(p => p.id === playerId);
    if (pIdx === -1)                            return { error: 'لاعب غير موجود' };
    if (pIdx === this.currentPlayerIndex)        return { error: 'دورك بالفعل' };

    const player = this.players[pIdx];
    const card = player.hand[cardIndex];
    if (!card) return { error: 'ورقة غير صالحة' };

    const top = this.discardPile[this.discardPile.length - 1];
    const sameCard =
      card.color === top.color &&
      card.type === top.type &&
      (card.type !== 'number' || card.value === top.value);

    if (!sameCard) return { error: 'الورقة لا تتطابق للاقتحام' };

    player.hand.splice(cardIndex, 1);
    this.currentColor = card.color;
    this.discardPile.push(card);
    this.currentPlayerIndex = pIdx;

    if (player.hand.length === 0) {
      this.gameStarted = false;
      return { card, gameOver: true, winner: { id: player.id, name: player.name } };
    }

    switch (card.type) {
      case 'skip':     this._advanceTurn(2); break;
      case 'skip-all': break; // go again
      case 'reverse':
        this.direction *= -1;
        this._advanceTurn(this.players.length === 2 ? 2 : 1);
        break;
      case 'draw-two':
        this.pendingDraw += 2;
        this._advanceTurn(1);
        break;
      case 'draw-six':
        this.pendingDraw += 6;
        this._advanceTurn(1);
        break;
      case 'draw-ten':
        this.pendingDraw += 10;
        this._advanceTurn(1);
        break;
      case 'discard-all': {
        const col = card.color;
        player.hand = player.hand.filter(c => c.color !== col);
        if (player.hand.length === 0) {
          this.gameStarted = false;
          return { card, gameOver: true, winner: { id: player.id, name: player.name } };
        }
        this._advanceTurn(1);
        break;
      }
      default:
        this._advanceTurn(1);
    }

    this._checkUnoPenalties(playerId);
    return { card };
  }

  /* ── Punishment Mode ── */
  setPunishmentMode(playerId, enabled) {
    if (this.players[0]?.id !== playerId) return { error: 'فقط المضيف' };
    this.punishmentMode = enabled;
    this.punishmentApprovals.clear();
    return { ok: true };
  }

  setSegments(playerId, segments) {
    if (this.players[0]?.id !== playerId) return { error: 'فقط المضيف' };
    if (!Array.isArray(segments) || segments.length < 2) return { error: 'يجب أن يكون هناك قسمان على الأقل' };
    this.segments = segments.slice(0, 20);
    return { ok: true };
  }

  approvePunishment(playerId) {
    this.punishmentApprovals.add(playerId);
    return { ok: true };
  }

  spinWheel(playerId) {
    if (!this.punishmentMode) return { error: 'وضع العقوبات غير مفعّل' };
    if (playerId !== this.currentSpinnerId) return { error: 'ليس دورك للدوران' };
    if (!this.segments || this.segments.length === 0) return { error: 'لا توجد أقسام' };

    const segs = this.segments;
    const totalSize = segs.reduce((s, g) => s + g.size, 0);

    // Weighted random pick
    let rand = Math.random() * totalSize;
    let chosen = segs[segs.length - 1];
    let cumAngle = 0;
    let chosenStart = 0;
    let chosenSpan = 0;

    for (const seg of segs) {
      const span = (seg.size / totalSize) * 360;
      rand -= seg.size;
      if (rand <= 0) {
        chosen = seg;
        chosenStart = cumAngle;
        chosenSpan = span;
        break;
      }
      cumAngle += span;
    }

    // Pick random angle inside chosen segment, compute total wheel rotation
    const landAngle = chosenStart + Math.random() * chosenSpan;
    const baseStop = (360 - (landAngle % 360) + 360) % 360;
    this.wheelCumAngle += 5 * 360 + baseStop;
    const stopAngle = this.wheelCumAngle;

    // Handle luck segments
    if (chosen.type === 'luck') {
      if (chosen.text === 'retry') {
        this.wheelRetryCount = (this.wheelRetryCount || 0) + 1;
        if (this.wheelRetryCount >= 3) {
          // Force a random punishment
          const punishments = segs.filter(s => s.type === 'punishment');
          const forced = punishments[Math.floor(Math.random() * punishments.length)];
          this.wheelRetryCount = 0;
          this.currentSpinnerId = null;
          return { type: 'execute', segment: forced, stopAngle, forced: true, loserName: this.currentSpinnerName };
        }
        // Allow retry — spinner stays
        return { type: 'retry', segment: chosen, stopAngle, retryCount: this.wheelRetryCount, loserName: this.currentSpinnerName };
      }
      if (chosen.text === 'reverse') {
        const punishments = segs.filter(s => s.type === 'punishment');
        const punished = punishments[Math.floor(Math.random() * punishments.length)];
        this.currentSpinnerId = null;
        return {
          type: 'reverse', segment: chosen, stopAngle,
          punishment: punished?.text || 'عقوبة',
          winnerName: this.lastWinner?.name,
          loserName: this.currentSpinnerName,
        };
      }
    }

    // Regular punishment
    this.wheelRetryCount = 0;
    this.currentSpinnerId = null;
    return { type: 'execute', segment: chosen, stopAngle, loserName: this.currentSpinnerName };
  }

  getPunishmentState() {
    return {
      enabled: this.punishmentMode,
      segments: this.segments,
      approvals: [...this.punishmentApprovals],
      totalPlayers: this.players.length,
    };
  }

  getState() {
    return {
      code: this.code,
      players: this.players.map(p => ({
        id: p.id, name: p.name, cardCount: p.hand.length, unoCalled: p.unoCalled,
      })),
      gameStarted: this.gameStarted,
    };
  }

  getGameState() {
    const topCard = this.discardPile[this.discardPile.length - 1];
    return {
      players: this.players.map(p => ({
        id: p.id, name: p.name, cardCount: p.hand.length, unoCalled: p.unoCalled,
      })),
      eliminatedPlayers: this.eliminatedPlayers,
      topCard,
      currentColor: this.currentColor || topCard?.color,
      currentPlayerId: this.players[this.currentPlayerIndex]?.id,
      direction: this.direction,
      pendingDraw: this.pendingDraw,
      pendingSevenSwap: this.pendingSevenSwap,
      pendingSevenPlayerId: this.pendingSevenPlayerId,
      pendingColorRoulette: this.pendingColorRoulette,
      pendingColorRoulettePlayerId: this.pendingColorRoulettePlayerId,
      deckCount: this.deck.length,
    };
  }
}

module.exports = GameRoom;
