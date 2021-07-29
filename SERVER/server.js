const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

//-----STATES
const rooms = {};
const userToRoom = {};

io.on("connection", (client) => {
    require('./SOCKET/render.socket')(io, client, rooms, userToRoom)
    require('./SOCKET/webRTC.socket')(io, client, rooms, userToRoom)
});

app.get("/", (req, res) => res.json({ message: "api working" }));
server.listen(8080, () => console.log("you'll do it, Red!!"));
