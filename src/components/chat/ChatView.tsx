import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Video,
  Lock,
  Paperclip,
  Send,
  X,
  Users,
  Loader2,
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { SyncService } from '../../services/matrix/syncService';
import { CallingService } from '../../services/matrix/callingService';
import { MediaEncryptionService } from '../../services/matrix/mediaEncryption';
import type { EncryptedMessage, RoomSummary } from '../../types';

interface ChatViewProps {
  room: RoomSummary;
  currentUserId: string;
}

export const ChatView: React.FC<ChatViewProps> = ({ room, currentUserId }) => {
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<EncryptedMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<EncryptedMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadTimeline = async () => {
    const timeline = await SyncService.getRoomTimeline(room.roomId);
    setMessages(timeline);
  };

  useEffect(() => {
    loadTimeline();
    const interval = setInterval(loadTimeline, 2000);
    return () => clearInterval(interval);
  }, [room.roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    try {
      if (editingMessage) {
        await SyncService.editMessage(room.roomId, editingMessage.id, text);
        setEditingMessage(null);
      } else {
        await SyncService.sendMessage(room.roomId, text, replyingTo?.id);
        setReplyingTo(null);
      }
      await loadTimeline();
    } catch (err: any) {
      alert(`Message dispatch error: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      await MediaEncryptionService.uploadAndSendEncryptedFile(
        room.roomId,
        file,
        (progress) => setUploadProgress(progress)
      );
      await loadTimeline();
    } catch (err: any) {
      alert(`Encrypted file upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    try {
      await CallingService.placeCall(room.roomId, type);
    } catch (err: any) {
      alert(`Call failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-cipher-950 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-6 border-b border-cipher-800 bg-cipher-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cipher-800 border border-cipher-700 flex items-center justify-center text-emerald-400 font-bold">
            {room.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{room.name}</h2>
              {room.isEncrypted && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Megolm Encrypted</span>
                </span>
              )}
            </div>
            <p className="text-xs text-cipher-400 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>{room.membersCount} participants</span>
              {room.topic && <span>• {room.topic}</span>}
            </p>
          </div>
        </div>

        {/* VoIP Call Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartCall('voice')}
            title="Start Encrypted Voice Call"
            className="p-2.5 text-cipher-300 hover:text-white bg-cipher-800 hover:bg-cipher-700 rounded-lg border border-cipher-700 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            title="Start Encrypted Video Call"
            className="p-2.5 text-cipher-300 hover:text-white bg-cipher-800 hover:bg-cipher-700 rounded-lg border border-cipher-700 transition-colors"
          >
            <Video className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Message Timeline */}
      <main className="flex-1 overflow-y-auto p-6 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-cipher-500">
            <Lock className="w-10 h-10 mb-3 text-cipher-700" />
            <p className="text-sm font-semibold text-cipher-300">End-to-End Encrypted Room</p>
            <p className="text-xs text-cipher-500 max-w-sm mt-1">
              Messages and files sent here are cryptographically protected. Only members of this room possess the decryption keys.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender === currentUserId}
              onReply={(m) => setReplyingTo(m)}
              onEdit={(m) => {
                setEditingMessage(m);
                setInputText(m.body);
              }}
              onRedact={(id) => SyncService.redactMessage(room.roomId, id)}
              onReact={(id, emoji) => SyncService.addReaction(room.roomId, id, emoji)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="px-6 py-2 bg-cipher-900 border-t border-cipher-800 flex items-center justify-between text-xs text-emerald-400">
          <span className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Encrypting and uploading attachment ({uploadProgress}%)...</span>
          </span>
          <span className="font-mono">{uploadProgress}%</span>
        </div>
      )}

      {/* Reply / Edit Banner */}
      {(replyingTo || editingMessage) && (
        <div className="px-6 py-2 bg-cipher-900 border-t border-cipher-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cipher-300 truncate">
            <span className="font-semibold text-emerald-400">
              {editingMessage ? 'Editing message:' : `Replying to ${replyingTo?.sender}:`}
            </span>
            <span className="truncate italic">"{editingMessage ? editingMessage.body : replyingTo?.body}"</span>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setInputText('');
            }}
            className="p-1 text-cipher-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Composer */}
      <footer className="p-4 bg-cipher-900 border-t border-cipher-800 flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach & Encrypt File (AES-CTR Client-Side)"
          className="p-2.5 text-cipher-400 hover:text-emerald-400 hover:bg-cipher-800 rounded-lg border border-cipher-800 transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              room.isEncrypted
                ? 'Send an end-to-end encrypted message...'
                : 'Send message...'
            }
            className="flex-1 px-4 py-2.5 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white placeholder-cipher-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors shadow-md shadow-emerald-950/40"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};
