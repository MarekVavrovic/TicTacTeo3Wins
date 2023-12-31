const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  formatMessage,
} = require("./public/utils/users");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//Static folder front-end
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatBoot";
const games = new Map(); // key: roomID, value: gameState
const playerSymbols = new Map(); // key: socketId, value: playerSymbol ('X' or 'O')

function determineGameResult(gameState) {
  // Winning combinations
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // Check for a win
  for (let combination of winningCombinations) {
    const [a, b, c] = combination;
    if (
      gameState.board[a] &&
      gameState.board[a] === gameState.board[b] &&
      gameState.board[a] === gameState.board[c]
    ) {
      // If any winning combination is met, return the winner
      return {
        winner: gameState.board[a],
        message: `${gameState.board[a]} Wins!`,
      };
    }
  }

  // Check for a draw (if all cells are filled)
  const isDraw = gameState.board.every((cell) => cell !== null);
  if (isDraw) {
    return { isDraw: true, message: "Draw!" };
  }

  // If no win or draw, continue the game
  return { continue: true };
}

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("joinRoom", ({ username, room }) => {
    const roomUsers = getRoomUsers(room);

    if (roomUsers.length < 2) {
      // Initialize gameState if not already initialized

      const user = userJoin(socket.id, username, room);
      socket.join(user.room);

      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to the game"));

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the game`)
        );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      // Send back the room ID to the client
      socket.emit("roomJoined", room);

      if (!games.has(user.room)) {
        games.set(user.room, {
          board: Array(9).fill(null),
          currentTurn: "X",
        });
      }

      if (!playerSymbols.has(socket.id)) {
        const symbol = getRoomUsers(room).length === 1 ? "O" : "X";
        playerSymbols.set(socket.id, symbol);
      }

      //GAME LOGIC START
      socket.on("makeMove", ({ roomId, cellIndex }) => {
        const gameState = games.get(roomId);
        const playerSymbol = playerSymbols.get(socket.id); // Retrieve the player's symbol

        // Check if gameState exists
        if (!gameState) {
          console.error(`Game state not found for room: ${roomId}`);
          // Handle the error appropriately
          return;
        }

        // Check if the cell is already taken or if it's not the player's turn
        if (
          gameState.board[cellIndex] ||
          gameState.currentTurn !== playerSymbol
        ) {
          // Handle invalid move
          return;
        }

        // Make the move
        gameState.board[cellIndex] = gameState.currentTurn;
        // Check for win or draw
        const gameEnded = checkGameEnd(gameState);

        if (gameEnded) {
          const result = determineGameResult(gameState);
          io.to(roomId).emit("gameEnd", result);
        }else{
          // Toggle turn
          gameState.currentTurn = gameState.currentTurn === "X" ? "O" : "X";

          // Update game state in the map
          games.set(roomId, gameState);
          // Broadcast updated game state
          io.to(roomId).emit("gameStateUpdate", gameState);
        }

      
       
      });


    } else {
      console.log(roomUsers);
      // Room is full, send a message back to the client
      socket.emit("roomFull", "Room is full. Please try another room.");
    }

    socket.on("restartGame", ({ roomId }) => {
      const gameState = games.get(roomId);
      if (gameState) {
        // Reset the game state
        gameState.board = Array(9).fill(null);
        gameState.currentTurn = "X"; // Or alternate starting player based on your logic
        games.set(roomId, gameState);

        // Notify all clients in the room about the game restart
        io.to(roomId).emit("gameRestarted", gameState);
      }
    });

  });
  //GAME LOGIC END

  //on disconnect
  socket.on("disconnect", () => {
    //emit for everyone
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the game`)
      );

      //user and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

function checkGameEnd(gameState) {
  // Winning combinations
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // Check for a win
  for (let combination of winningCombinations) {
    const [a, b, c] = combination;
    if (
      gameState.board[a] &&
      gameState.board[a] === gameState.board[b] &&
      gameState.board[a] === gameState.board[c]
    ) {
      // If any winning combination is met, return true (game ended with a win)
      return true;
    }
  }

  // Check for a draw (if all cells are filled)
  const isDraw = gameState.board.every((cell) => cell !== null);
  if (isDraw) {
    return true; // Game ended with a draw
  }

  // If no win or draw, return false (game continues)
  return false;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on: ${PORT}`));
