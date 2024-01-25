'use client';

import { FC, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Socket, io } from 'socket.io-client';

type pageProps = {
  params: {
    id: string;
  };
};

const Page: FC<pageProps> = ({ params: { id } }) => {
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream>();
  const peerConnectionRef = useRef<RTCPeerConnection>();
  const socketRef = useRef<Socket>();
  const hostRef = useRef(false);

  const getUserMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    localStreamRef.current = stream;
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

  const handleICECandidateEvent = useCallback((event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && socketRef.current) {
      socketRef.current.emit('ice-candidate', event.candidate, id);
    }
  }, [id]);

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

  const handleReceiveOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
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
  }, [createPeer, id]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(answer);
    }
  }, []);

  const handleNewICECandidateMsg = useCallback(async (candidate: RTCIceCandidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(candidate);
    }
  },[]);

  useEffect(() => {
    const socket = io('http://localhost:8080');

    socket.emit('room-join', id);

    socket.on('room-created', handleRoomCreated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('ready', initiatePeerConnection);
    socket.on('room-full', () => {
      router.push('/');
    });

    socket.on('offer', handleReceiveOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleNewICECandidateMsg);

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [handleAnswer, handleNewICECandidateMsg, handleReceiveOffer, handleRoomCreated, handleRoomJoined, id, initiatePeerConnection, router]);

  return (
    <main className="flex flex-col mt-5 gap-3 m-2">
      <h1 className="text-xl font-bold text-center">
        Share the <span className="text-blue-500">URL</span> to invite people
      </h1>
      <section className="flex flex-col gap-10">
        <video
          autoPlay
          ref={localVideoRef}
          height="300"
          width="300"
          muted
          className="rounded-lg border"></video>
        <video
          autoPlay
          ref={remoteVideoRef}
          height="300"
          width="300"
          className="rounded-lg border"></video>
      </section>
    </main>
  );
};

export default Page;
