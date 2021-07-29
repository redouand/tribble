import io from "socket.io-client";
import joinSoundEffect from "../MEDIA/join-sound.mp3";
import leaveSoundEffect from "../MEDIA/left-sound.mp3";

export const socket = io("http://localhost:8080");

export const handleUpdateRoomEvent = (setRooms) => (UPDATES) => {
  if (UPDATES.push) {
    const { roomid, id, socketid, name } = UPDATES.push;
    setRooms((rooms) => {
      return { ...rooms, [roomid]: { ...rooms[roomid], [socketid]: { name, id } } };
    });
  }
  if (UPDATES.pop) {
    const { roomid, socketid } = UPDATES.pop;
    setRooms((rooms) => {
      const { [socketid]: omit, ...restUsers } = rooms[roomid];
      return { ...rooms, [roomid]: restUsers };
    });
  }
  if (UPDATES.newRoom) {
    const { roomid } = UPDATES.newRoom;
    setRooms((rooms) => {
      return { ...rooms, [roomid]: {} };
    });
  }
};

export const handleJoinRoom = (e, joinedState, userInfo) => {
  new Audio(joinSoundEffect).play();
  const [joinedInfo, setJoinedInfo] = joinedState;
  const { id, name } = userInfo;
  const roomid = e.target.parentNode.getAttribute("data-roomid");
  if (joinedInfo.joined) {
    socket.emit("USER_JUMPED", {
      prevRoom: joinedInfo.joinedRoom,
      currentRoom: roomid,
      name,
      id,
    });
  } else socket.emit("USER_JOINED", { roomid, name, id });
  setJoinedInfo({ joinedRoom: roomid, joined: true });
};

export const handleLeaveRoom = (e, joinedState) => {
  new Audio(leaveSoundEffect).play();
  const [joinedInfo, setJoinedInfo] = joinedState;
  const roomid = e.target.parentNode.getAttribute("data-roomid");
  setJoinedInfo({ joinedRoom: null, joined: false });
  socket.emit("USER_LEFT", { roomid });
};
