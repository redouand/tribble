import io from "socket.io-client";
import joinSoundEffect from "../MEDIA/join-sound.mp3";
import leaveSoundEffect from "../MEDIA/left-sound.mp3";
import Peer from "simple-peer";
import React from "react";

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
  const a = new Audio()
  peer.on('stream', (stream)=>{
    a.srcObject = stream
    a.play()
    setMembers(members=>{
      console.log(members[participant].elementRef.current)
      return members
    })
  })
  peer.on('close', ()=>a.pause())
  return peer;
};

export const otherParticipantsEvent =
  (setMyStream, peersRef, setMembers) => async (PARTICIPANTS) => {
    const tem = {}
    PARTICIPANTS.forEach(one => tem[one] = { elementRef: React.createRef() })
    setMembers(tem)
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
  const a = new Audio()
  peer.on('stream', (stream)=>{
    a.srcObject = stream
    a.play()
    setMembers(members=>{
      const element = members[sender].elementRef.current
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -127;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.4;
      audioSource.connect(analyser);
      const volumes = new Uint8Array(analyser.frequencyBinCount);
      const volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;
        for (const volume of volumes) volumeSum += volume;
        const averageVolume = volumeSum / volumes.length;
        const precent = (averageVolume * 100) / 127
        if(precent > 55) element.style.backgroundColor = 'red'
        else element.style.backgroundColor = 'green'
      };
      setInterval(volumeCallback, 100)
      return members
    })
  })
  peer.on('close', ()=>a.pause())
  return peer;
};


export const receiveOfferEvent =
  (setMyStream, peersRef, setMembers) =>
  ({ sender, offer }) =>
    setMyStream((myStream) => {
      setMembers(members=>({...members, [sender]: { elementRef: React.createRef() }}))
      const newPeer2 = appendPeer(offer, sender, myStream, setMembers);
      peersRef.current.push({ partnerId: sender, hisDedicatedPeer: newPeer2 });
      return myStream;
    });

export const receiveAnswerEvent = (peersRef) => ({ replier, answer })=>{
  const hisObjPeer = peersRef.current.find(obj=>obj.partnerId === replier)
  hisObjPeer.hisDedicatedPeer.signal(answer)
}

export const userDisconnectedEvent = (peersRef, setMembers) => (userWhoLeft)=>{
  if(userWhoLeft === socket.id){
    peersRef.current.map(peersObj=>peersObj.hisDedicatedPeer.destroy())
    peersRef.current = []
    setMembers([])
  }
  else{
    const hisPeerObj = peersRef.current.find(obj=>obj.partnerId === userWhoLeft)
    if(hisPeerObj) hisPeerObj.hisDedicatedPeer.destroy()
    const tempPeersRef = peersRef.current.filter(p=>p.partnerId !== userWhoLeft)
    peersRef.current = tempPeersRef
    setMembers(tempPeersRef.map(peerObj=>peerObj.partnerId))
  }
}

export const handleMute = (e, setMyStream)=>
  setMyStream(stream=> stream.getTracks()[0].enabled = !stream.getTracks()[0].enabled)
