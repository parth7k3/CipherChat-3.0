import React, { useState } from 'react';
import { X, Shield, Lock, Plus, Loader2 } from 'lucide-react';
import { SyncService } from '../../services/matrix/syncService';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const invites = inviteUserId.trim() ? [inviteUserId.trim()] : [];
      const newRoomId = await SyncService.createEncryptedRoom(name.trim(), topic.trim(), invites);
      onRoomCreated(newRoomId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create room. Please verify the homeserver connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cipher-900 border border-cipher-800 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-cipher-800">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">New Encrypted Room</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-cipher-400 hover:text-white rounded-lg hover:bg-cipher-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
              Room Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Project Orion / Alice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
              Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief description or purpose"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cipher-300 mb-1">
              Invite User (Matrix ID)
            </label>
            <input
              type="text"
              placeholder="@bob:cipherchat.local"
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              className="w-full px-3 py-2 bg-cipher-950 border border-cipher-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Cryptographic Guarantee notice */}
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-start gap-2.5 text-xs text-emerald-400">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold block">Megolm Group Ratchet Active</span>
              <span className="text-[11px] text-emerald-500/90 leading-tight">
                This room will be initialized with m.megolm.v1.aes-sha2 encryption. The server will store zero plaintext message bodies.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-cipher-300 hover:bg-cipher-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating & Keying...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Encrypted Room</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
