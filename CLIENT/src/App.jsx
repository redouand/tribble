import React, { useEffect, useRef, useState } from "react";
import { maleRandom } from "nicknames";
import { v1 } from "uuid";
import Room from "./COMPONENTS/room";
import { handleUpdateRoomEvent, socket, userDisconnectedEvent, receiveAnswerEvent, receiveOfferEvent, otherParticipantsEvent } from "./COMPONENTS/talk.helpers";

function App() {
  const [myStream, setMyStream] = useState(null)
  const [rooms, setRooms] = useState([]);
  const [members, setMembers] = useState({})
  const userRef = useRef({ name: maleRandom(), id: v1() });
  const peersRef = useRef([])
  const joinedState = useState({ joined: false, joinedRoom: null });

  useEffect(() => {
    socket.on("LOAD_ROOMS", (ROOMS) => setRooms(ROOMS));
    socket.on("UPDATE_ROOM", handleUpdateRoomEvent(setRooms));
    socket.on('OTHER_PARTICIPANTS', otherParticipantsEvent(setMyStream, peersRef, setMembers))
    socket.on('RECEIVE_OFFER', receiveOfferEvent(setMyStream, peersRef, setMembers))
    socket.on('RECEIVE_ANSWER', receiveAnswerEvent(peersRef))
    socket.on('USER_DISCONNECTED', userDisconnectedEvent(peersRef, setMembers))
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
              setMyStream
            }}
          />
        ))}
      </div>
      <div>
        {
          Object.keys(members).map((member)=>(
            <h1 ref={members[member].elementRef} key={member}>{member}</h1>
          ))
        }
      </div>
    </div>
  );
}

export default App;


/*
  on other participants, set members to somethinglike: 
  members = {
    userID_1: { muted: null, stream: null },
    userID_2: { muted: null, stream: null },
  }
  
  And then INSIDE other participants event, when you create the peer, you set 
  peer.on('stream', stream=>setMembers(members=>(
    {...members, [participant]: { muted: null, stream: stream }}
  ))

  And knowing that the on stream event will fire later and not instantly, before it does, we'll render
  the members in the UI in the App.js like so: 
  Object.keys(members).map((memberId)=>(
    <MemberCompnent key={memberId} memberObj={members[memberId]} />
  ))

  And inside the <MemberComponent /> in the UseEffect we check if stream and we do:
  let myInterval;
  if(stream) {
    const membersAudio = new Audio()
    membersAudio.srcObject = stream
    membersAudio.play()
    *SOME FREQUENCY LOGIC HERE*
    myInterval = setInterval(frequencyCallback, 100)
  } else clearInerval(myInterval)

  And we also check for if the the member is muted in the JSX like so:
  { muted && <i className="mic-muted-icon" /> }

  And in the App.jsx we handle the USER_MUTED event and we pass down to it the setMembers
  socket.on('USER_MUTED', handleUserMutedEvent(setMembers))

  And in the hander callback it goes like so: 
  const handleUserMutedEvent(userWhoIsMuted)=>(setMembers)=>{
    setMembers(members=>(
      {...members, [userWhoIsMuted]: { ...members[userWhoIsMuted], muted: true }}
    ))
  }
*/