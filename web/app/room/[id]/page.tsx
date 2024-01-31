'use client';

import { FC, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Socket, io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, CameraOff, ScreenShare } from 'lucide-react';

type pageProps = {
  params: {
    id: string;
  };
};

type Message = {
  description: RTCSessionDescription;
  candidate: RTCIceCandidate;
};

const Page: FC<pageProps> = ({ params: { id } }) => {
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const id2ContentRef = useRef(new Map<string, string>());

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const makingOfferRef = useRef<boolean>(false);
  const ignoreOfferRef = useRef<boolean>(false);
  const politeRef = useRef<boolean>(false);

  const [mic, setMic] = useState<boolean>(true);
  const [camera, setCamera] = useState<boolean>(false);

  const config: RTCConfiguration = useMemo(() => {
    return {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
  }, []);

  const handleNegotiationNeeded = useCallback(async () => {
    try {
      makingOfferRef.current = true;
      await pcRef.current?.setLocalDescription();

      const msids = pcRef.current?.localDescription?.sdp
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('a=msid:'));
      console.log(msids);

      socketRef.current?.emit('message', { description: pcRef.current?.localDescription }, id);
    } catch (e) {
      // toast notification ?
    } finally {
      makingOfferRef.current = false;
    }
  }, [id]);

  const handleTrack = useCallback(({ track, streams: [stream] }: RTCTrackEvent) => {
    const content = id2ContentRef.current.get(stream.id);

    if (content === 'screen') {
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
    } else if (content === 'webcam') {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const handleICECandidate = useCallback(
    (e: RTCPeerConnectionIceEvent) => {
      if (e.candidate) {
        socketRef.current?.emit('message', { candidate: e.candidate }, id);
      }
    },
    [id]
  );

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection(config);

    pc.onnegotiationneeded = handleNegotiationNeeded;
    pc.ontrack = handleTrack;
    pc.onicecandidate = handleICECandidate;

    return pc;
  }, [config, handleNegotiationNeeded, handleTrack, handleICECandidate]);

  const getUserMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    id2ContentRef.current.set(stream.id, 'webcam');

    // stream.getTracks().forEach((track) => {
    //   if (track.kind === 'video') {
    //     track.enabled = false;
    //   }
    // });

    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    localStreamRef.current = stream;
  }, []);

  const handlePeerMessage = useCallback(
    async ({ description, candidate }: Message) => {
      try {
        if (description) {
          const offerCollision =
            description.type == 'offer' &&
            (makingOfferRef.current || pcRef.current?.signalingState !== 'stable');

          ignoreOfferRef.current = !politeRef.current && offerCollision;
          if (ignoreOfferRef.current) {
            return;
          }

          pcRef.current?.setRemoteDescription(description);

          if (description.type === 'offer') {
            await pcRef.current?.setLocalDescription();
            socketRef.current?.emit(
              'message',
              { description: pcRef.current?.localDescription },
              id
            );
          }
        } else if (candidate) {
          try {
            await pcRef.current?.addIceCandidate(candidate);
          } catch (err) {
            if (!ignoreOfferRef) {
              throw err;
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
    },
    [id]
  );

  const addTracksToPC = useCallback((pc: RTCPeerConnection) => {
    localStreamRef.current
      ?.getTracks()
      .forEach((track) => pc.addTrack(track, localStreamRef.current!));
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:8080');
    socket.emit('room-join', id);

    socket.on('room-created', async () => {
      await getUserMedia();
    });
    socket.on('room-joined', async () => {
      politeRef.current = true;

      const pc = createPeer();
      await getUserMedia();
      addTracksToPC(pc);

      socket.emit('ready', id);
      socket.emit('id2Content', Array.from(id2ContentRef.current), id);
      pcRef.current = pc;
    });
    socket.on('room-full', () => {
      router.push('/');
    });

    socket.on('ready', () => {
      const pc = createPeer();
      addTracksToPC(pc);

      socket.emit('id2Content', Array.from(id2ContentRef.current), id);
      pcRef.current = pc;
    });

    socket.on('id2Content', (data: Array<[string, string]>) => {
      const map = new Map(data);
      map.forEach((value, key) => {
        id2ContentRef.current.set(key, value);
      });
    });

    socket.on('message', handlePeerMessage);

    socket.on('user-disconnected', () => {
      politeRef.current = false;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      pcRef.current?.close();
      socketRef.current = null;
      pcRef.current = null;
    };
  }, [id, router, createPeer, getUserMedia, handlePeerMessage, addTracksToPC]);

  const toggleMediaStream = useCallback((type: string, state: boolean) => {
    localStreamRef.current?.getTracks().forEach((track) => {
      if (track.kind === type) {
        track.enabled = !state;
      }
    });
  }, []);

  const toggleMic = useCallback(() => {
    toggleMediaStream('mic', mic);
    setMic((mic) => !mic);
  }, [toggleMediaStream, mic]);

  const toggleCam = useCallback(() => {
    toggleMediaStream('video', camera);
    setCamera((camera) => !camera);
  }, [toggleMediaStream, camera]);

  const handleScreenShare = useCallback(async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia();
    id2ContentRef.current.set(stream.id, 'screen');
    socketRef.current?.emit('id2Content', Array.from(id2ContentRef.current), id);

    stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));
    if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
  }, [id]);

  return (
    <main className="flex flex-col mt-5 gap-3 m-2">
      <h1 className="text-xl font-bold text-center">
        Share the <span className="text-blue-500">link</span> with your friend to start the call
      </h1>
      <section className="grid grid-cols-10 gap-4 w-full">
        <div className="flex flex-col justify-center gap-2 col-span-2">
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
        </div>
        <video ref={screenVideoRef} autoPlay className="col-span-8" controls></video>
      </section>
      <div className="flex gap-2 mx-auto">
        <Button variant="outline" onClick={toggleMic}>
          {mic ? <Mic /> : <MicOff />}
        </Button>
        <Button variant="outline" onClick={toggleCam}>
          {camera ? <Camera /> : <CameraOff />}
        </Button>
        <Button variant="outline" onClick={handleScreenShare}>
          <ScreenShare />
        </Button>
      </div>
    </main>
  );
};

export default Page;
