socket.on("gameStateUpdate", (gameState) => { 

  // Update the board
  gameState.board.forEach((cell, index) => {
    if (cell === "X") {
      cellElements[index].classList.add(X_CLASS);
    } else if (cell === "O") {
      cellElements[index].classList.add(CIRCLE_CLASS);
    }
  });

  // Update the turn indicator
  setBoardHoverClass(gameState.turn);
});

socket.on("gameEnd", (result) => {
  // Handle game end (show winner, draw, etc.)
  endGame(result.isDraw);
  winningMessageTextElement.innerText = result.message;
});

socket.on("gameRestarted", (gameState) => {
  // Reset the game view based on the new gameState
  startGame();
  // You may also need to update the board based on the received gameState
});


const X_CLASS = "x";
const CIRCLE_CLASS = "circle";
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const cellElements = document.querySelectorAll("[data-cell]");
const board = document.getElementById("board");
const winningMessageElement = document.getElementById("winningMessage");
const restartButton = document.getElementById("restartButton");
const winningMessageTextElement = document.querySelector(
  "[data-winning-message-text]"
);
let circleTurn;

startGame();

function startGame() {
  circleTurn = false;
  cellElements.forEach((cell) => {
    cell.classList.remove(X_CLASS, CIRCLE_CLASS);
    cell.removeEventListener("click", handleClick);
    cell.addEventListener("click", handleClick, { once: true });
  });
  setBoardHoverClass();
  winningMessageElement.classList.remove("show");
}

// Use the roomId from the dataset in the restart event listener
restartButton.addEventListener("click", () => {
  const roomId = document.body.dataset.roomId; // Assuming roomId is stored here
  if (roomId) {
    socket.emit("restartGame", { roomId });
  } else {
    console.error("Room ID is not set. Cannot restart game.");
  }
});




function handleClick(e) {
  const cell = e.target;
  const cellIndex = Array.from(cellElements).indexOf(cell);
  const roomId = document.body.dataset.roomId;
   console.log("Emitting move for room:", roomId); 
  socket.emit("makeMove", { roomId, cellIndex });
}

function endGame(draw) {
  if (draw) {
    winningMessageTextElement.innerText = "Draw!";
  } else {
    winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!`;
  }
  winningMessageElement.classList.add("show");
}

function isDraw() {
  return [...cellElements].every((cell) => {
    return (
      cell.classList.contains(X_CLASS) || cell.classList.contains(CIRCLE_CLASS)
    );
  });
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
}

function swapTurns() {
  circleTurn = !circleTurn;
}

function setBoardHoverClass(currentTurn) {
  board.classList.remove(X_CLASS);
  board.classList.remove(CIRCLE_CLASS);
  if (currentTurn === "O") {
    board.classList.add(CIRCLE_CLASS);
  } else {
    board.classList.add(X_CLASS);
  }
}

function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some((combination) => {
    return combination.every((index) => {
      return cellElements[index].classList.contains(currentClass);
    });
  });
}

