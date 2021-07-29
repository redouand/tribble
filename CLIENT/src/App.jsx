import React, { useEffect, useRef, useState } from "react";
import { maleRandom } from "nicknames";
import { v1 } from "uuid";
import Room from "./COMPONENTS/room";
import { handleUpdateRoomEvent, socket } from './COMPONENTS/talk.helpers'
import Audios from "./COMPONENTS/audio";

function App() {
  const [rooms, setRooms] = useState([]);
  const userRef = useRef({ name: maleRandom(), id: v1() });
  const joinedState = useState({ joined: false, joinedRoom: null });

  useEffect(() => {
    socket.on("LOAD_ROOMS", (ROOMS) => setRooms(ROOMS));
    socket.on('UPDATE_ROOM', handleUpdateRoomEvent(setRooms))
  }, []);

  const handleCreateRoom = () => socket.emit("CREATE_ROOM", userRef.current);

  return (
    <div id="talk-page">
      <h1>{userRef.current.name}</h1>
      <button onClick={handleCreateRoom}>CREATE ROOM</button>
      <div className="all-rooms">
        {Object.keys(rooms).map((roomid) => (
          <Room
            key={roomid}
            propsObj={{ joinedState, userInfo: userRef.current, roomid, socket, rooms }}
          />
        ))}
      </div>
      <Audios />
    </div>
  );
}

export default App;
