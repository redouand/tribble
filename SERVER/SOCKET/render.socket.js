const { v1 } = require("uuid");
const {
  LOAD_ROOMS,
  CREATE_ROOM,
  ERROR,
  USER_JOINED,
  USER_LEFT,
  USER_JUMPED,
  UPDATE_ROOM,
} = require("../UTILS/events");

const rendersEvent = (io, client, rooms, userToRoom) => {
  client.emit(LOAD_ROOMS, rooms);

  client.on(CREATE_ROOM, ({ name, id }) => {
    const roomid = v1();
    if (!rooms[roomid]) {
      rooms[roomid] = {};
      io.emit(UPDATE_ROOM, { newRoom: { roomid } });
    } else client.emit(ERROR, { in: "create room", msg: "room already exists" });
  });

  client.on(USER_JOINED, ({ roomid, name, id }) => {
    if (rooms[roomid]) rooms[roomid][client.id] = { name, id };
    else rooms[roomid] = { [client.id]: { name, id } };
    io.emit(UPDATE_ROOM, { push: { roomid, name, id, socketid: client.id } });
  });

  client.on(USER_LEFT, ({ roomid }) => {
    delete rooms[roomid][client.id];
    io.emit(UPDATE_ROOM, { pop: { roomid, socketid: client.id } });
  });

  client.on(USER_JUMPED, ({ prevRoom, currentRoom, name, id }) => {
    delete rooms[prevRoom][client.id];
    rooms[currentRoom][client.id] = { name, id };
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
};

module.exports = rendersEvent;
