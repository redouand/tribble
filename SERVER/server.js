const app = require("express")();
const server = require("http").Server(app);
const { CatcherHandler } = require("./UTILS/catcher");
const { socketMessageHandler } = require("./SOCKET/render.socket");
const io = require("socket.io")(server, { cors: { origin: "*" } });

const catcherHandled = new CatcherHandler();

io.on("connection", (client) => {
  socketMessageHandler(io, client, catcherHandled);
  // require("./SOCKET/render.socket")(io, client, rooms, userToRoom);
  require("./SOCKET/webRTC.socket")(io, client, rooms, userToRoom);
});

app.get("/", (_req, res) => res.json({ message: "api working" }));
server.listen(8080, () => console.log("you'll do it, Red!!"));
