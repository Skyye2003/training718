const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage, generateLocationMessage } = require("./utils/messages");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

require("dotenv").config();

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", socket => {
  console.log("New WebSocket connection");

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    } else {
      socket.join(user.room);

      socket.emit("message", generateMessage("Admin", "Welcome!"));
      socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined!`));
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });

      callback();
    }
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    } else {
      io.to(user.room).emit("message", generateMessage(user.username, message));
      callback();
    }
  });

  socket.on("sendLocation", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("locationMessage", generateLocationMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`));
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});

const mysql = require("mysql2");

// Connect to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'n3u3da!',
  database: 'historical_currency_rate'
});

connection.connect((err) => {
  if (err) {
    console.log("Failed to connect to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database with thread ID: " + connection.threadId);

  // Query the currencyHistoricalRate table
  const query = "SELECT * FROM currencyHistoricalRate";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error executing query: " + error.stack);
      return;
    }
    console.log("Query results:", results);
  });
});


