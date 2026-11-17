import React, { useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { CallingService } from '../../services/matrix/callingService';
import type { CallSessionState } from '../../types';

interface CallModalProps {
  callState: CallSessionState;
}

export const CallModal: React.FC<CallModalProps> = ({ callState }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  if (callState.state === 'idle') return null;

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-6 select-none">
      {/* Top Bar: Security & Duration */}
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-2 bg-cipher-900/80 px-4 py-2 rounded-xl border border-cipher-800 backdrop-blur-md">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-xs font-bold block">Encrypted WebRTC Session</span>
            <span className="text-[10px] text-emerald-400">DTLS-SRTP Transport Encryption</span>
          </div>
        </div>

        <div className="bg-cipher-900/80 px-4 py-2 rounded-xl border border-cipher-800 backdrop-blur-md text-sm font-mono font-semibold">
          {callState.state === 'connected' ? (
            formatDuration(callState.durationSeconds)
          ) : callState.state === 'ringing_out' ? (
            <span className="text-amber-400 animate-pulse">Calling peer...</span>
          ) : callState.state === 'ringing_in' ? (
            <span className="text-emerald-400 animate-pulse">Incoming call...</span>
          ) : (
            <span className="text-cipher-400">Connecting media...</span>
          )}
        </div>
      </div>

      {/* Main Video Stage */}
      <div className="relative flex-1 my-6 rounded-2xl overflow-hidden bg-cipher-950 border border-cipher-800 flex items-center justify-center">
        {/* Remote Video Stream */}
        {callState.remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-cipher-400">
            <div className="w-20 h-20 rounded-full bg-cipher-900 border border-cipher-800 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
              {callState.type === 'video' ? <Video className="w-8 h-8 text-emerald-400" /> : <Lock className="w-8 h-8 text-emerald-400" />}
            </div>
            <p className="text-sm font-medium">Waiting for video stream...</p>
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {callState.localStream && callState.type === 'video' && (
          <div className="absolute bottom-4 right-4 w-48 h-32 rounded-xl overflow-hidden border-2 border-cipher-700 shadow-2xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}
      </div>

      {/* Bottom Calling Controls Bar */}
      <div className="flex items-center justify-center gap-4">
        {callState.state === 'ringing_in' ? (
          <>
            <button
              onClick={() => CallingService.answerCall()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-colors"
            >
              <Video className="w-5 h-5" />
              <span>Answer Call</span>
            </button>
            <button
              onClick={() => CallingService.hangup()}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-full flex items-center gap-2 shadow-lg shadow-red-950/50 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Decline</span>
            </button>
          </>
        ) : (
          <>
            {/* Mute Toggle */}
            <button
              onClick={() => CallingService.toggleMute()}
              className={`p-4 rounded-full border transition-colors ${
                callState.isMuted
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-cipher-800 text-white hover:bg-cipher-700 border-cipher-700'
              }`}
              title={callState.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {callState.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Camera Toggle */}
            {callState.type === 'video' && (
              <button
                onClick={() => CallingService.toggleCamera()}
                className={`p-4 rounded-full border transition-colors ${
                  callState.isCameraOff
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-cipher-800 text-white hover:bg-cipher-700 border-cipher-700'
                }`}
                title={callState.isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {callState.isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            {/* Screen Share Toggle */}
            <button
              onClick={() => CallingService.toggleScreenShare()}
              className={`p-4 rounded-full border transition-colors ${
                callState.isScreenSharing
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-cipher-800 text-white hover:bg-cipher-700 border-cipher-700'
              }`}
              title="Share Screen"
            >
              <ScreenShare className="w-6 h-6" />
            </button>

            {/* Hangup Button */}
            <button
              onClick={() => CallingService.hangup()}
              className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-950/50 transition-colors"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
