import React from "react";
import { handleJoinRoom, handleLeaveRoom, handleMute } from "./talk.helpers";

const Room = (props) => {
  const { roomid, rooms, userInfo, joinedState, setMyStream } = props.propsObj;

  return (
    <div key={roomid} data-roomid={roomid} className="the-room">
      <ul>
        {Object.keys(rooms[roomid]).map((socketid) => (
          <li key={socketid}>{rooms[roomid][socketid].name}</li>
        ))}
      </ul>

      {joinedState[0].joinedRoom === roomid ? (
        <button id="btn" onClick={(e) => handleLeaveRoom(e, joinedState , setMyStream)}>
          Leave
        </button>
      ) : (
        <button id="btn" onClick={(e) => handleJoinRoom(e, joinedState, userInfo)}>Join</button>
      )}
      <button onClick={(e)=>handleMute(e, setMyStream)}>mute</button>
    </div>
  );
};

export default Room;
