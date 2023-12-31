const roomName = document.getElementById("room-name");
const userList=document.getElementById("users")

const socket = io();

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit("joinRoom", { username, room });

// Get room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on("roomJoined", (receivedRoomId) => {
  document.body.dataset.roomId = receivedRoomId; // Storing the room ID
  console.log("Room ID set:", receivedRoomId); // Debugging
});


// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.innerText = user.username;
    userList.appendChild(li);
  });
}






