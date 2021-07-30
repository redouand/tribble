import React, { useEffect, useRef } from 'react'

const Audios = ({peer})=>{
  const audioEl = useRef()
  useEffect(()=>{
    peer.on('stream', (stream)=>{
      stream.getTracks()[0].onmute = (e)=>{
        console.log('muted')
      }
      audioEl.current.srcObject = stream
      console.log(stream.getTracks()[0])
    })
  }, [])
  return <audio controls autoPlay playsInline ref={audioEl} />
}

export default Audios