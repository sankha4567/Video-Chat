export interface ServerToClientEvents {
  'user:joined': (payload: userJoinedPayload) => void;
}
export interface ClientToServerEvents {
  'room:join': (payload: roomJoinPayload) => void;
}

type roomJoinPayload = {
  username: string;
  roomId: string;
};

type userJoinedPayload = {
  message: string;
};
