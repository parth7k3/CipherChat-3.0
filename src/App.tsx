import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ConversationSidebar } from './components/sidebar/ConversationSidebar';
import { ChatView } from './components/chat/ChatView';
import { CreateRoomModal } from './components/sidebar/CreateRoomModal';
import { SecurityDashboard } from './components/security/SecurityDashboard';
import { CallModal } from './components/calling/CallModal';
import { VerificationModal } from './components/security/VerificationModal';
import { AuthService, StoredSession } from './services/matrix/authService';
import { SyncService } from './services/matrix/syncService';
import { CallingService } from './services/matrix/callingService';
import { VerificationService } from './services/matrix/verificationService';
import type { RoomSummary, CallSessionState, VerificationRequestState } from './types';
import { Shield } from 'lucide-react';

export const App: React.FC = () => {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Navigation & Modal states
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

  // Global Call & Verification states
  const [callState, setCallState] = useState<CallSessionState>({
    callId: '',
    roomId: '',
    opponentId: '',
    state: 'idle',
    type: 'video',
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    durationSeconds: 0,
  });
  const [verificationState, setVerificationState] = useState<VerificationRequestState | null>(null);

  // Restore session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const restored = await AuthService.restoreSession();
        if (restored) {
          setSession(restored);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Subscribe to call state & verification requests
  useEffect(() => {
    const unsubscribeCall = CallingService.subscribe((state) => {
      setCallState(state);
    });
    const unsubscribeVerification = VerificationService.subscribe((state) => {
      setVerificationState(state);
    });

    return () => {
      unsubscribeCall();
      unsubscribeVerification();
    };
  }, []);

  // Poll / refresh rooms when session is active
  useEffect(() => {
    if (!session) return;

    const refreshRooms = () => {
      const roomList = SyncService.getRooms();
      setRooms(roomList);
      if (!selectedRoomId && roomList.length > 0) {
        setSelectedRoomId(roomList[0].roomId);
      }
    };

    refreshRooms();
    const interval = setInterval(refreshRooms, 3000);
    return () => clearInterval(interval);
  }, [session, selectedRoomId]);

  const handleLogout = async () => {
    await AuthService.logout();
    setSession(null);
    setSelectedRoomId(null);
    setRooms([]);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-cipher-950 flex flex-col items-center justify-center text-white">
        <Shield className="w-12 h-12 text-emerald-400 animate-pulse mb-4" />
        <h2 className="text-base font-semibold">CipherChat 3.0</h2>
        <p className="text-xs text-cipher-400 mt-1">Initializing Cryptographic Runtime...</p>
      </div>
    );
  }

  // Unauthenticated screen
  if (!session) {
    return (
      <div className="h-screen w-screen bg-cipher-950 flex items-center justify-center p-4">
        {authView === 'login' ? (
          <LoginForm
            onSuccess={() => {
              const active = AuthService.restoreSession();
              active.then((s) => s && setSession(s));
            }}
            onSwitchToRegister={() => setAuthView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={() => {
              const active = AuthService.restoreSession();
              active.then((s) => s && setSession(s));
            }}
            onSwitchToLogin={() => setAuthView('login')}
          />
        )}
      </div>
    );
  }

  const selectedRoom = rooms.find((r) => r.roomId === selectedRoomId);

  // Authenticated application screen
  return (
    <div className="h-screen w-screen flex bg-cipher-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <ConversationSidebar
        rooms={rooms}
        selectedRoomId={selectedRoomId}
        onSelectRoom={(roomId) => {
          setSelectedRoomId(roomId);
          setIsSecurityOpen(false);
        }}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
        onOpenSecurityDashboard={() => setIsSecurityOpen(true)}
        onLogout={handleLogout}
        currentUserId={session.userId}
      />

      {/* Main Panel: Chat or Security Dashboard */}
      {isSecurityOpen ? (
        <SecurityDashboard
          onBack={() => setIsSecurityOpen(false)}
          currentUserId={session.userId}
        />
      ) : selectedRoom ? (
        <ChatView room={selectedRoom} currentUserId={session.userId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-cipher-500">
          <Shield className="w-12 h-12 text-cipher-700 mb-3" />
          <h3 className="text-base font-semibold text-white">Select a Conversation</h3>
          <p className="text-xs text-cipher-500 max-w-sm text-center mt-1">
            Choose an existing end-to-end encrypted room from the sidebar or create a new one to begin messaging.
          </p>
        </div>
      )}

      {/* Modals & Overlays */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onRoomCreated={(roomId) => {
          setSelectedRoomId(roomId);
          setIsCreateRoomOpen(false);
        }}
      />

      <CallModal callState={callState} />

      <VerificationModal
        state={verificationState}
        onClose={() => setVerificationState(null)}
      />
    </div>
  );
};
