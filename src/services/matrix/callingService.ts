import { matrixClientManager } from './matrixClient';
import type { CallSessionState } from '../../types';

export type CallStateListener = (state: CallSessionState) => void;

export class CallingService {
  private static listeners: Set<CallStateListener> = new Set();
  private static activeCall: any = null;
  private static currentState: CallSessionState = {
    callId: '',
    roomId: '',
    opponentId: '',
    state: 'idle',
    type: 'video',
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    durationSeconds: 0,
  };
  private static timerInterval: any = null;

  public static subscribe(listener: CallStateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  private static updateState(partial: Partial<CallSessionState>) {
    this.currentState = { ...this.currentState, ...partial };
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }

  /**
   * Places an outgoing voice or video call in a Matrix room.
   */
  public static async placeCall(roomId: string, type: 'voice' | 'video'): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not ready');

    console.info(`[CipherChat VoIP] Placing ${type} call in room ${roomId}`);

    try {
      // Obtain local media stream
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });

      // Create Matrix Call instance using matrix-js-sdk
      const call = client.createCall(roomId);
      if (!call) {
        throw new Error('Unable to create Matrix call instance.');
      }
      this.activeCall = call;

      this.updateState({
        callId: call.callId,
        roomId,
        state: 'ringing_out',
        type,
        localStream,
        durationSeconds: 0,
      });

      this.attachCallListeners(call);

      // Place the call
      if (type === 'video') {
        await call.placeVideoCall();
      } else {
        await call.placeVoiceCall();
      }
    } catch (err) {
      console.error('[CipherChat VoIP] Call placement failed:', err);
      this.hangup();
      throw err;
    }
  }

  /**
   * Answers an incoming call.
   */
  public static async answerCall(): Promise<void> {
    if (!this.activeCall) return;

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: this.currentState.type === 'video',
      });

      this.updateState({
        state: 'connecting',
        localStream,
      });

      await this.activeCall.answer();
    } catch (err) {
      console.error('[CipherChat VoIP] Failed to answer call:', err);
      this.hangup();
    }
  }

  /**
   * Toggles microphone audio mute.
   */
  public static toggleMute(): boolean {
    if (this.currentState.localStream) {
      const audioTracks = this.currentState.localStream.getAudioTracks();
      const newMuted = !this.currentState.isMuted;
      for (const track of audioTracks) {
        track.enabled = !newMuted;
      }
      this.updateState({ isMuted: newMuted });
      return newMuted;
    }
    return false;
  }

  /**
   * Toggles video camera stream on/off.
   */
  public static toggleCamera(): boolean {
    if (this.currentState.localStream) {
      const videoTracks = this.currentState.localStream.getVideoTracks();
      const newCameraOff = !this.currentState.isCameraOff;
      for (const track of videoTracks) {
        track.enabled = !newCameraOff;
      }
      this.updateState({ isCameraOff: newCameraOff });
      return newCameraOff;
    }
    return false;
  }

  /**
   * Enables or disables screen sharing via getDisplayMedia.
   */
  public static async toggleScreenShare(): Promise<void> {
    if (this.currentState.isScreenSharing) {
      // Revert to camera
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = camStream.getVideoTracks()[0];
        if (this.activeCall?.peerConn) {
          const sender = this.activeCall.peerConn.getSenders().find((s: any) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        }
        this.updateState({ isScreenSharing: false });
      } catch (err) {
        console.error('[CipherChat VoIP] Failed to revert screen share:', err);
      }
    } else {
      // Start screen capture
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (this.activeCall?.peerConn) {
          const sender = this.activeCall.peerConn.getSenders().find((s: any) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          this.toggleScreenShare();
        };

        this.updateState({ isScreenSharing: true });
      } catch (err) {
        console.error('[CipherChat VoIP] Screen share denied or failed:', err);
      }
    }
  }

  /**
   * Terminates active call and releases media devices.
   */
  public static hangup(): void {
    if (this.activeCall) {
      try {
        this.activeCall.hangup('user_hangup', false);
      } catch {}
      this.activeCall = null;
    }

    if (this.currentState.localStream) {
      for (const track of this.currentState.localStream.getTracks()) {
        track.stop();
      }
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.updateState({
      callId: '',
      roomId: '',
      opponentId: '',
      state: 'ended',
      localStream: undefined,
      remoteStream: undefined,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      durationSeconds: 0,
    });

    setTimeout(() => {
      if (this.currentState.state === 'ended') {
        this.updateState({ state: 'idle' });
      }
    }, 1500);
  }

  private static attachCallListeners(call: any) {
    call.on('state', (state: string) => {
      console.info(`[CipherChat VoIP] Call state changed: ${state}`);
      if (state === 'connected') {
        this.updateState({ state: 'connected' });
        this.startTimer();
      } else if (state === 'ended') {
        this.hangup();
      }
    });

    call.on('feeds_changed', (feeds: any[]) => {
      const remoteFeed = feeds.find((f: any) => !f.isLocal());
      if (remoteFeed) {
        this.updateState({ remoteStream: remoteFeed.stream });
      }
    });
  }

  private static startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.updateState({ durationSeconds: this.currentState.durationSeconds + 1 });
    }, 1000);
  }
}
