const socket = io();

const form = document.getElementById("joinForm");
let globalUsername, globalRoom; // Define variables at a higher scope

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const room = document.getElementById("room").value;

  globalUsername = username;
  globalRoom = room;

  socket.emit("joinRoom", { username, room });
  let actualRoomId = room; // Store the room ID
});

// Listen for successful room join confirmation
socket.on("roomJoined", () => {
  
  // Use global variables for redirection
  window.location.href = `game.html?username=${encodeURIComponent(globalUsername)}&room=${encodeURIComponent(globalRoom)}`;
});

// Handle 'roomFull' event
socket.on("roomFull", (message) => {
  alert(message);
  const joinButton = document.querySelector(".btn");
  joinButton.textContent = "Room taken";
  joinButton.disabled = true;
});

// Reset Button State
const roomInput = document.getElementById("room");
roomInput.addEventListener("input", () => {
  const joinButton = document.querySelector(".btn");
  joinButton.textContent = "Join Game";
  joinButton.disabled = false;
});
