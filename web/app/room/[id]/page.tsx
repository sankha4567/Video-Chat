'use client';

import { FC, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Socket, io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, CameraOff } from 'lucide-react';

type pageProps = {
  params: {
    id: string;
  };
};

const Page: FC<pageProps> = ({ params: { id } }) => {
  const router = useRouter();
  const [mic, setMic] = useState<boolean>(true);
  const [cam, setCam] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const hostRef = useRef<boolean>(false);

  const getUserMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        height: 200,
        width: 300
      },
      audio: true
    });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    localStreamRef.current = stream;

    localStreamRef.current.getTracks().forEach((track) => {
      if (track.kind === 'video') {
        track.enabled = false;
      }
    });
  }, []);

  const handleRoomCreated = useCallback(async () => {
    hostRef.current = true;
    await getUserMedia();
  }, [getUserMedia]);

  const handleRoomJoined = useCallback(async () => {
    await getUserMedia();
    if (socketRef.current) {
      socketRef.current.emit('ready', id);
    }
  }, [getUserMedia, id]);

  const handleUserDisconnected = useCallback(() => {
    hostRef.current = true;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const handleICECandidateEvent = useCallback(
    (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', event.candidate, id);
      }
    },
    [id]
  );

  const handleTrackEvent = useCallback((event: RTCTrackEvent) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  }, []);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    });

    pc.onicecandidate = handleICECandidateEvent;
    pc.ontrack = handleTrackEvent;
    return pc;
  }, [handleICECandidateEvent, handleTrackEvent]);

  const initiatePeerConnection = useCallback(async () => {
    if (hostRef.current) {
      const pc = createPeer();
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit('offer', offer, id);
      }

      peerConnectionRef.current = pc;
    }
  }, [createPeer, id]);

  const handleReceiveOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!hostRef.current) {
        const pc = createPeer();
        localStreamRef.current?.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });

        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socketRef.current) {
          socketRef.current.emit('answer', answer, id);
        }

        peerConnectionRef.current = pc;
      }
    },
    [createPeer, id]
  );

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  }, []);

  const handleNewICECandidateMsg = useCallback(async (candidate: RTCIceCandidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:8080');

    socket.emit('room-join', id);

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('ready', initiatePeerConnection);
    socket.on('room-full', () => {
      router.push('/');
    });
    socket.on('user-disconnected', handleUserDisconnected);

    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [
    handleAnswer,
    handleNewICECandidateMsg,
    handleReceiveOffer,
    handleRoomCreated,
    handleRoomJoined,
    handleUserDisconnected,
    id,
    initiatePeerConnection,
    router
  ]);

  const toggleMediaStream = useCallback((type: string, state: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        if (t.kind === type) {
          t.enabled = !state;
        }
      });
    }
  }, []);

  const toggleMic = () => {
    toggleMediaStream('audio', mic);
    setMic((mic) => !mic);
  };

  const toggleCam = () => {
    toggleMediaStream('video', cam);
    setCam((cam) => !cam);
  };

  return (
    <main className="flex flex-col mt-5 gap-3 m-2">
      <h1 className="text-xl font-bold text-center">
        Share the <span className="text-blue-500">link</span> with your friend to start the call
      </h1>
      <section className="flex flex-col gap-5 grow">
        <video
          autoPlay
          ref={localVideoRef}
          height="225"
          width="300"
          muted
          className="rounded-lg border"></video>
        <video
          autoPlay
          ref={remoteVideoRef}
          height="225"
          width="300"
          className="rounded-lg border"></video>
      </section>
      <div className="flex gap-2 mx-auto">
        <Button variant="outline" onClick={toggleMic}>
          {' '}
          {mic ? <Mic /> : <MicOff />}{' '}
        </Button>
        <Button variant="outline" onClick={toggleCam}>
          {' '}
          {cam ? <Camera /> : <CameraOff />}{' '}
        </Button>
      </div>
    </main>
  );
};

export default Page;
