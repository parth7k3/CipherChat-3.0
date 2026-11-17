export type TrustStatus = 'verified' | 'unverified' | 'danger' | 'unknown';

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface UserDevice {
  deviceId: string;
  displayName: string;
  lastSeenIp?: string;
  lastSeenTs?: number;
  trustStatus: TrustStatus;
  algorithms: string[];
  keys: Record<string, string>;
}

export interface EncryptedMessage {
  id: string;
  roomId: string;
  sender: string;
  senderDisplayName?: string;
  senderAvatar?: string;
  body: string;
  timestamp: number;
  isEncrypted: boolean;
  trustStatus: TrustStatus;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  edited?: {
    isEdited: boolean;
    editedAt?: number;
  };
  reactions?: Record<string, { count: number; users: string[]; myReaction: boolean }>;
  replyTo?: {
    eventId: string;
    sender: string;
    body: string;
  };
  attachment?: EncryptedAttachmentMetadata;
}

export interface EncryptedAttachmentMetadata {
  url: string; // mxc:// URI or object URL
  mimetype: string;
  filename: string;
  size: number;
  encryption: {
    v: string;
    key: {
      alg: string;
      key_ops: string[];
      k: string;
      kty: string;
      ext: boolean;
    };
    iv: string;
    hashes: {
      sha256: string;
    };
  };
  decryptedBlobUrl?: string;
}

export interface RoomSummary {
  roomId: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  isDirect: boolean;
  isEncrypted: boolean;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: number;
    sender: string;
  };
  membersCount: number;
  allMembersVerified: boolean;
}

export interface VerificationRequestState {
  transactionId: string;
  otherUserId: string;
  otherDeviceId: string;
  methods: string[];
  phase: 'requested' | 'ready' | 'started' | 'sas_shown' | 'done' | 'cancelled';
  sas?: {
    emoji?: Array<[string, string]>; // [emoji, description]
    decimal?: [number, number, number];
  };
}

export interface CallSessionState {
  callId: string;
  roomId: string;
  opponentId: string;
  state: 'idle' | 'ringing_out' | 'ringing_in' | 'connecting' | 'connected' | 'ended';
  type: 'voice' | 'video';
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  durationSeconds: number;
}
