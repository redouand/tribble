const { SEND_OFFER, RECEIVE_OFFER, SEND_ANSWER, RECEIVE_ANSWER } = require('../UTILS/events')

const RtcHandlers = (io, client, rooms, userToRoom )=>{
  client.on(SEND_OFFER, ({receiver, ...senderAndOffer})=>{
    io.to(receiver).emit(RECEIVE_OFFER, senderAndOffer)
  })
  
  client.on(SEND_ANSWER, ({ sender, ...replierAndAnswer })=>{
    io.to(sender).emit(RECEIVE_ANSWER, replierAndAnswer)
  })
}

module.exports = RtcHandlers