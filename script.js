const cells = [...document.querySelectorAll(".cell")];
const statusText = document.getElementById("status");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const playerOneEl = document.getElementById("playerOne");
const playerTwoEl = document.getElementById("playerTwo");
const playerTwoName = document.getElementById("playerTwoName");
const celebrationLayer = document.getElementById("celebrationLayer");

const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let mode = "computer";
let scores = { X: 0, O: 0 };
let soundOn = false;
let audioContext;

function winningLine(state) {
  return WIN_LINES.find(line => line.every(index => state[index] && state[index] === state[line[0]]));
}

function updateStatus(message, winner = null) {
  statusText.innerHTML = `<span class="status-dot"></span> ${message}`;
  playerOneEl.classList.toggle("active", !gameOver && currentPlayer === "X");
  playerTwoEl.classList.toggle("active", !gameOver && currentPlayer === "O");
  if (winner) {
    playerOneEl.classList.toggle("active", winner === "X");
    playerTwoEl.classList.toggle("active", winner === "O");
  }
}

function updateScores() {
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
}

function renderBoard() {
  cells.forEach((cell, index) => {
    const value = board[index];
    cell.textContent = value === "X" ? "🪔" : value === "O" ? "🎆" : "";
    cell.classList.toggle("x", value === "X");
    cell.classList.toggle("o", value === "O");
    cell.disabled = Boolean(value) || gameOver;
    cell.setAttribute("aria-label", `Cell ${index + 1}${value ? `, ${value === "X" ? "diya" : "fireworks"}` : ", empty"}`);
    cell.classList.remove("winner");
  });
}

function playTone(frequency = 660, duration = .11) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Sound is an optional enhancement. */ }
}

function burstConfetti() {
  const symbols = ["✦", "✧", "•"];
  for (let i = 0; i < 42; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * .7}s`;
    piece.style.color = ["#f4c76e", "#f18a50", "#f9e8b8", "#e77a83"][i % 4];
    piece.style.fontSize = `${8 + Math.random() * 10}px`;
    celebrationLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

function finishRound() {
  const line = winningLine(board);
  if (line) {
    gameOver = true;
    scores[board[line[0]]]++;
    updateScores();
    renderBoard();
    line.forEach(index => cells[index].classList.add("winner"));
    const winner = board[line[0]];
    const winnerName = winner === "X" ? "The diyas" : (mode === "computer" ? "The fireworks" : "Player 2");
    updateStatus(`${winnerName} win! ${winner === "X" ? "A beautiful victory!" : "What a festive spark!"}`, winner);
    burstConfetti();
    playTone(880, .22);
    setTimeout(() => playTone(1100, .3), 140);
    return true;
  }
  if (board.every(Boolean)) {
    gameOver = true;
    renderBoard();
    updateStatus("It's a draw! A celebration for everyone.");
    playTone(440, .18);
    return true;
  }
  return false;
}

function placeMove(index, player) {
  if (gameOver || board[index]) return;
  board[index] = player;
  currentPlayer = player === "X" ? "O" : "X";
  renderBoard();
  playTone(player === "X" ? 700 : 520);
  if (!finishRound()) {
    updateStatus(currentPlayer === "X" ? "Your turn — place a diya!" : (mode === "computer" ? "The fireworks are thinking…" : "Player 2 — your turn!"));
  }
}

function computerMove() {
  if (gameOver) return;
  // Win if possible, otherwise block the player, otherwise choose a strong open square.
  const findTacticalMove = (player) => {
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        const test = [...board];
        test[i] = player;
        if (winningLine(test)) return i;
      }
    }
    return null;
  };
  let move = findTacticalMove("O");
  if (move === null) move = findTacticalMove("X");
  if (move === null && !board[4]) move = 4;
  if (move === null) {
    const corners = [0, 2, 6, 8].filter(i => !board[i]);
    if (corners.length) move = corners[Math.floor(Math.random() * corners.length)];
  }
  if (move === null) {
    const available = board.map((v, i) => v ? null : i).filter(v => v !== null);
    move = available[Math.floor(Math.random() * available.length)];
  }
  if (move !== undefined && move !== null) placeMove(move, "O");
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (gameOver || board[index] || (mode === "computer" && currentPlayer !== "X")) return;
  placeMove(index, currentPlayer);
  if (mode === "computer" && !gameOver && currentPlayer === "O") {
    cells.forEach(cell => cell.disabled = true);
    setTimeout(() => {
      computerMove();
      if (!gameOver) renderBoard();
    }, 520);
  }
}

function resetRound() {
  board = Array(9).fill("");
  currentPlayer = "X";
  gameOver = false;
  renderBoard();
  updateStatus("Your turn — place a diya!");
}

function newGame() {
  scores = { X: 0, O: 0 };
  updateScores();
  resetRound();
}

cells.forEach(cell => cell.addEventListener("click", handleCellClick));

document.getElementById("resetRound").addEventListener("click", resetRound);
document.getElementById("newGame").addEventListener("click", newGame);

document.querySelectorAll(".mode-button").forEach(button => {
  button.addEventListener("click", () => {
    mode = button.dataset.mode;
    document.querySelectorAll(".mode-button").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    playerTwoName.textContent = mode === "computer" ? "CPU" : "PLAYER 2";
    newGame();
    updateStatus("Your turn — place a diya!");
  });
});

document.getElementById("soundToggle").addEventListener("click", (event) => {
  soundOn = !soundOn;
  event.currentTarget.setAttribute("aria-pressed", String(soundOn));
  event.currentTarget.innerHTML = soundOn ? "♫ <span>Sound on</span>" : "♪ <span>Sound off</span>";
  if (soundOn) playTone(760, .16);
});

renderBoard();
updateScores();
