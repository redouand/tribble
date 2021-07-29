const { v1 } = require("uuid");
const {
  LOAD_ROOMS,
  CREATE_ROOM,
  ERROR,
  USER_JOINED,
  USER_LEFT,
  USER_JUMPED,
  UPDATE_ROOM,
  OTHER_PARTICIPANTS,
  USER_DISCONNECTED,
} = require("../UTILS/events");

const rendersEvent = (io, client, rooms, socketToRoom) => {
  client.emit(LOAD_ROOMS, rooms);

  client.on(CREATE_ROOM, ({ name, id }) => {
    const roomid = v1();
    if (!rooms[roomid]) {
      rooms[roomid] = {};
      io.emit(UPDATE_ROOM, { newRoom: { roomid } });
    } else client.emit(ERROR, { in: "create room", msg: "room already exists" });
  });

  client.on(USER_JOINED, ({ roomid, name, id }) => {
    const OTHERS = Object.keys(rooms[roomid])
    rooms[roomid][client.id] = { name, id };
    socketToRoom[client.id] = roomid;
    io.emit(UPDATE_ROOM, { push: { roomid, name, id, socketid: client.id } });
    client.emit(OTHER_PARTICIPANTS, OTHERS)
  });

  client.on(USER_LEFT, ({ roomid }) => {
    delete rooms[roomid][client.id];
    delete socketToRoom[client.id];
    io.emit(UPDATE_ROOM, { pop: { roomid, socketid: client.id } });
    Object.keys(rooms[roomid]).forEach(other=>io.to(other).emit(USER_DISCONNECTED, client.id))
  });

  client.on(USER_JUMPED, ({ prevRoom, currentRoom, name, id }) => {
    delete rooms[prevRoom][client.id];
    delete socketToRoom[client.id];
    rooms[currentRoom][client.id] = { name, id };
    socketToRoom[client.id] = currentRoom;
    io.emit(UPDATE_ROOM, {
      pop: {
        roomid: prevRoom,
        socketid: client.id,
      },
      push: {
        roomid: currentRoom,
        socketid: client.id,
        name,
        id,
      },
    });
  });

  client.on("disconnect", () => {
    const roomid = socketToRoom[client.id];
    if (roomid) {
      delete socketToRoom[client.id];
      delete rooms[roomid][client.id];
      client.broadcast.emit(USER_DISCONNECTED, client.id);
    }
  });
};

module.exports = rendersEvent;
