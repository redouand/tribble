import io from "socket.io-client";
import joinSoundEffect from "../MEDIA/join-sound.mp3";
import leaveSoundEffect from "../MEDIA/left-sound.mp3";
import Peer from "simple-peer";
import React from "react";

// export const socket = io("http://34.71.61.240/");
export const socket = io("http://localhost:8080")

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

export const handleJoinRoom = async (e, joinedState, userInfo) => {
  const roomid = e.target.parentNode.getAttribute("data-roomid");
  new Audio(joinSoundEffect).play();
  const [joinedInfo, setJoinedInfo] = joinedState;
  const { id, name } = userInfo;
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

export const handleLeaveRoom = (e, joinedState, setMyStream) => {
  new Audio(leaveSoundEffect).play();
  setMyStream(stream=>{
    stream.getTracks()[0].stop()
    return null
  })
  const [joinedInfo, setJoinedInfo] = joinedState;
  const roomid = e.target.parentNode.getAttribute("data-roomid");
  setJoinedInfo({ joinedRoom: null, joined: false });
  socket.emit("USER_LEFT", { roomid });
};

export const createPeer = (participant, stream, setMembers) => {
  const peer = new Peer({
    initiator: true,
    trickle: false,
    stream: stream,
  });
  peer.on("signal", (offer) => {
    socket.emit("SEND_OFFER", { offer, sender: socket.id, receiver: participant });
  });

  peer.on('stream', (stream)=>{
    setMembers(members=>({...members, [participant]: { ...members[participant], stream: stream } }))
  })
  return peer;
};

export const otherParticipantsEvent =
  (setMyStream, peersRef, setMembers) => async (PARTICIPANTS) => {
    const temp = {}
    PARTICIPANTS.forEach(one=>temp[one]= { muted: null, stream: null })
    setMembers(temp)
    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: {
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 44100
  } });

    setMyStream(stream);
    PARTICIPANTS.forEach((participant) => {
      const newPeer = createPeer(participant, stream, setMembers);
      peersRef.current.push({
        partnerId: participant,
        hisDedicatedPeer: newPeer,
      });
    });
  };

export const appendPeer = (offer, sender, myStream, setMembers) => {
  const peer = new Peer({
    initiator: false,
    trickle: false,
    stream: myStream,
  });
  peer.red = sender
  peer.on("signal", (answer) => {
    socket.emit("SEND_ANSWER", { answer, replier: socket.id, sender });
  });
  peer.signal(offer);
  peer.on('stream', (stream)=>{
    setMembers(members=>({...members, [sender]: {...members[sender], stream: stream }}))
  })
  return peer;
};


export const receiveOfferEvent =
  (setMyStream, peersRef, setMembers) =>
  ({ sender, offer }) =>
    setMyStream((myStream) => {
      setMembers(members=>({...members, [sender]: { muted: null, stream: null }}))
      const newPeer2 = appendPeer(offer, sender, myStream, setMembers);
      peersRef.current.push({ partnerId: sender, hisDedicatedPeer: newPeer2 });
      return myStream;
    });

export const receiveAnswerEvent = (peersRef) => ({ replier, answer })=>{
  const hisObjPeer = peersRef.current.find(obj=>obj.partnerId === replier)
  hisObjPeer.hisDedicatedPeer.signal(answer)
}

export const userDisconnectedEvent = (peersRef, setMembers) => (userWhoLeft)=>{
  console.log(userWhoLeft, socket.id)
  if(userWhoLeft === socket.id){
    peersRef.current.map(peersObj=>peersObj.hisDedicatedPeer.destroy())
    peersRef.current = []
    setMembers({})
  }
  else{
    const hisPeerObj = peersRef.current.find(obj=>obj.partnerId === userWhoLeft)
    if(hisPeerObj) hisPeerObj.hisDedicatedPeer.destroy()
    const tempPeersRef = peersRef.current.filter(p=>p.partnerId !== userWhoLeft)
    peersRef.current = tempPeersRef
    setMembers(members=>{
      const { [userWhoLeft]: omit, ...otherMembers } = members
      return otherMembers;
    })
  }
}

export const handleMute = (e, setMyStream)=>
  setMyStream(stream=>{
    stream.getTracks()[0].enabled = !stream.getTracks()[0].enabled
    return stream
  })
