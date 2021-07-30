import React, { useEffect, useRef, useState } from "react";
import { maleRandom } from "nicknames";
import { v1 } from "uuid";
import Room from "./COMPONENTS/room";
import { handleUpdateRoomEvent, socket, userDisconnectedEvent, receiveAnswerEvent, receiveOfferEvent, otherParticipantsEvent } from "./COMPONENTS/talk.helpers";
import Audios from "./COMPONENTS/audio";

function App() {
  const [myStream, setMyStream] = useState(null)
  const [rooms, setRooms] = useState([]);
  const [peersOnly, setPeersOnly] = useState([])
  const userRef = useRef({ name: maleRandom(), id: v1() });
  const peersRef = useRef([])
  const joinedState = useState({ joined: false, joinedRoom: null });

  useEffect(() => {
    socket.on("LOAD_ROOMS", (ROOMS) => setRooms(ROOMS));
    socket.on("UPDATE_ROOM", handleUpdateRoomEvent(setRooms));
    socket.on('OTHER_PARTICIPANTS', otherParticipantsEvent(setMyStream, peersRef, setPeersOnly))
    socket.on('RECEIVE_OFFER', receiveOfferEvent(setMyStream, peersRef, setPeersOnly))
    socket.on('RECEIVE_ANSWER', receiveAnswerEvent(peersRef))
    socket.on('USER_DISCONNECTED', userDisconnectedEvent(peersRef, setPeersOnly))
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
            propsObj={{
              joinedState,
              userInfo: userRef.current,
              roomid,
              socket,
              rooms,
              peersRef,
              setPeersOnly,
              myStream
            }}
          />
        ))}
      </div>
      
      <div>{peersOnly.map(peerOnly=><Audios peer={peerOnly} key={peerOnly.red} />)}</div>
    </div>
  );
}

export default App;
