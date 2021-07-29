import React from "react";
import { handleJoinRoom, handleLeaveRoom } from "./talk.helpers";

const Room = (props) => {
  const { roomid, rooms, userInfo, joinedState, peersRef, setPeersOnly } = props.propsObj;

  return (
    <div key={roomid} data-roomid={roomid} className="the-room">
      <ul>
        {Object.keys(rooms[roomid]).map((socketid) => (
          <li key={socketid}>{rooms[roomid][socketid].name}</li>
        ))}
      </ul>

      {joinedState[0].joinedRoom === roomid ? (
        <button onClick={(e) => handleLeaveRoom(e, joinedState, peersRef, setPeersOnly)}>
          Leave
        </button>
      ) : (
        <button onClick={(e) => handleJoinRoom(e, joinedState, userInfo)}>Join</button>
      )}
    </div>
  );
};

export default Room;
