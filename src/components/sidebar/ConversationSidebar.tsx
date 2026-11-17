import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  LogOut,
  Users,
  MessageSquare,
  Lock,
  Unlock,
} from 'lucide-react';
import type { RoomSummary } from '../../types';

interface ConversationSidebarProps {
  rooms: RoomSummary[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  onOpenSecurityDashboard: () => void;
  onLogout: () => void;
  currentUserId: string;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onOpenCreateRoom,
  onOpenSecurityDashboard,
  onLogout,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.lastMessage?.body && room.lastMessage.body.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="w-80 h-screen bg-cipher-900 border-r border-cipher-800 flex flex-col flex-shrink-0 select-none">
      {/* Top Profile / Header */}
      <div className="p-4 border-b border-cipher-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cipher-800 border border-cipher-700 flex items-center justify-center text-emerald-400 font-bold">
            {currentUserId.charAt(1)?.toUpperCase() || 'C'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold text-white truncate">{currentUserId}</h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>E2EE Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSecurityDashboard}
            title="Security & Verified Devices Dashboard"
            className="p-2 text-cipher-400 hover:text-white hover:bg-cipher-800 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={onLogout}
            title="Secure Sign Out"
            className="p-2 text-cipher-400 hover:text-red-400 hover:bg-cipher-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action / Search Bar */}
      <div className="p-3 space-y-2 border-b border-cipher-800">
        <button
          onClick={onOpenCreateRoom}
          className="w-full py-2 px-3 bg-cipher-800 hover:bg-cipher-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide border border-cipher-700 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Encrypted Conversation</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-cipher-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-cipher-950 border border-cipher-800 rounded-md text-xs text-cipher-200 placeholder-cipher-500 focus:outline-none focus:border-cipher-600 transition-colors"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto divide-y divide-cipher-850">
        {filteredRooms.length === 0 ? (
          <div className="p-6 text-center text-xs text-cipher-500">
            {searchQuery ? 'No matching conversations' : 'No conversations yet. Create one above!'}
          </div>
        ) : (
          filteredRooms.map((room) => {
            const isSelected = room.roomId === selectedRoomId;
            return (
              <button
                key={room.roomId}
                onClick={() => onSelectRoom(room.roomId)}
                className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                  isSelected ? 'bg-cipher-800/80 border-l-2 border-emerald-500' : 'hover:bg-cipher-850/60'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-cipher-800 border border-cipher-700 flex items-center justify-center flex-shrink-0 text-cipher-300">
                  {room.membersCount > 2 ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                      {room.name}
                    </span>
                    {room.lastMessage && (
                      <span className="text-[10px] text-cipher-500">
                        {new Date(room.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <p className="text-cipher-400 truncate text-[11px] max-w-[150px]">
                      {room.lastMessage?.body || 'No messages yet'}
                    </p>

                    <div className="flex items-center gap-1.5">
                      {room.isEncrypted ? (
                        <span title="End-to-End Encrypted">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </span>
                      ) : (
                        <span title="Unencrypted">
                          <Unlock className="w-3 h-3 text-amber-500" />
                        </span>
                      )}

                      {room.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-500 text-cipher-950 font-bold rounded-full text-[10px]">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
