import io from "socket.io-client";
import joinSoundEffect from "../MEDIA/join-sound.mp3";
import leaveSoundEffect from "../MEDIA/left-sound.mp3";
import Peer from "simple-peer";

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

export const handleLeaveRoom = (e, joinedState, peersRef, setPeersOnly) => {
  new Audio(leaveSoundEffect).play();
  const [joinedInfo, setJoinedInfo] = joinedState;
  const roomid = e.target.parentNode.getAttribute("data-roomid");
  setJoinedInfo({ joinedRoom: null, joined: false });
  socket.emit("USER_LEFT", { roomid });
  peersRef.current.map(peersObj=>peersObj.hisDedicatedPeer.destroy())
  peersRef.current = []
  setPeersOnly([])
};

export const createPeer = (participant, stream) => {
  const peer = new Peer({
    initiator: true,
    trickle: false,
    stream: stream,
  });
  peer.on("signal", (offer) => {
    socket.emit("SEND_OFFER", { offer, sender: socket.id, receiver: participant });
  });
  peer.red = participant
  return peer;
};

export const otherParticipantsEvent =
  (setMyStream, peersRef, setPeersOnly) => async (PARTICIPANTS) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    setMyStream(stream);
    const tempPeersOnly = [];
    PARTICIPANTS.forEach((participant) => {
      const newPeer = createPeer(participant, stream);
      peersRef.current.push({
        partnerId: participant,
        hisDedicatedPeer: newPeer,
      });
      tempPeersOnly.push(newPeer);
    });
    setPeersOnly(tempPeersOnly);
  };

export const appendPeer = (offer, sender, myStream) => {
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
  return peer;
};


export const receiveOfferEvent =
  (setMyStream, peersRef, setPeersOnly) =>
  ({ sender, offer }) =>
    setMyStream((myStream) => {
      const newPeer2 = appendPeer(offer, sender, myStream);
      peersRef.current.push({ partnerId: sender, hisDedicatedPeer: newPeer2 });
      setPeersOnly((peers) => [...peers, newPeer2]);
      return myStream;
    });

export const receiveAnswerEvent = (peersRef) => ({ replier, answer })=>{
  const hisObjPeer = peersRef.current.find(obj=>obj.partnerId === replier)
  hisObjPeer.hisDedicatedPeer.signal(answer)
}

export const userDisconnectedEvent = (peersRef, setPeersOnly) => (userWhoLeft)=>{
  const hisPeerObj = peersRef.current.find(obj=>obj.partnerId === userWhoLeft)
  if(hisPeerObj) hisPeerObj.hisDedicatedPeer.destroy()
  const tempPeersRef = peersRef.current.filter(p=>p.partnerId !== userWhoLeft)
  peersRef.current = tempPeersRef
  setPeersOnly(tempPeersRef.map(obj=>obj.hisDedicatedPeer))
}