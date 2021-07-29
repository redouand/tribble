import React, { useEffect, useRef } from 'react'

const Audios = ({peer})=>{
  const audioEl = useRef()
  useEffect(()=>{
    peer.on('stream', (stream)=>{
      audioEl.current.srcObject = stream
    })
  }, [])
  return <audio controls autoPlay playsInline ref={audioEl} />
}

export default Audios