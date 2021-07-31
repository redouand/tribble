import React, { useEffect, useRef } from 'react'


const calculatesAndReturnCallback = (stream, element)=>{
  const audioContext = new AudioContext();
  const audioSource = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.minDecibels = -127;
  analyser.maxDecibels = 0;
  analyser.smoothingTimeConstant = 0.4;
  audioSource.connect(analyser);
  const volumes = new Uint8Array(analyser.frequencyBinCount);
  return () => {
    const elemento = element
    analyser.getByteFrequencyData(volumes);
    let volumeSum = 0;
    for (const volume of volumes) volumeSum += volume;
    const averageVolume = volumeSum / volumes.length;
    const precent = (averageVolume * 100) / 127
    // console.log(precent)
    if(precent > 43) elemento.style.backgroundColor = 'red'
    else elemento.style.backgroundColor = 'green'
  };
}


const MembersComponent = ({memberInfo, memberId})=>{
  const audioRef = useRef(new Audio())
  const freq = useRef(null)
  useEffect(()=>{
    let myInterval;
    if(memberInfo.stream){
      console.log('got stream')
      audioRef.current.srcObject = memberInfo.stream
      audioRef.current.play()
      const callback = calculatesAndReturnCallback(memberInfo.stream, freq.current)
      myInterval = setInterval(callback, 100)
    }
    return ()=> (memberInfo.stream && myInterval) && clearInterval(myInterval)
  }, [memberInfo.stream])
  return (
    <div>
      {memberId}
      <h1 ref={freq}>Speaking</h1>
    </div>
  )
}

export default MembersComponent