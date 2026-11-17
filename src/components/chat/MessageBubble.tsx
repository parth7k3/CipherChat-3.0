import React, { useState } from 'react';
import {
  Lock,
  Edit2,
  Trash2,
  Reply,
  Smile,
  FileText,
  Download,
  Loader2,
} from 'lucide-react';
import { TrustBadge } from '../common/TrustBadge';
import { MediaEncryptionService } from '../../services/matrix/mediaEncryption';
import type { EncryptedMessage } from '../../types';

interface MessageBubbleProps {
  message: EncryptedMessage;
  isOwn: boolean;
  onReply: (message: EncryptedMessage) => void;
  onEdit: (message: EncryptedMessage) => void;
  onRedact: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onReply,
  onEdit,
  onRedact,
  onReact,
}) => {
  const [isDecryptingMedia, setIsDecryptingMedia] = useState(false);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState<string | null>(null);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownloadAttachment = async () => {
    if (!message.attachment) return;
    setIsDecryptingMedia(true);

    try {
      // In real Matrix environment, fetch ciphertext from media repo
      const response = await fetch(message.attachment.url);
      const ciphertextBuffer = await response.arrayBuffer();

      // Decrypt using Web Crypto API and verify SHA-256 integrity
      const plaintextBuffer = await MediaEncryptionService.decryptAttachment(
        message.attachment.encryption,
        ciphertextBuffer
      );

      const blob = new Blob([plaintextBuffer], { type: message.attachment.mimetype });
      const blobUrl = URL.createObjectURL(blob);
      setDecryptedBlobUrl(blobUrl);

      // Trigger browser download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = message.attachment.filename;
      a.click();
    } catch (err: any) {
      alert(`Attachment decryption failed: ${err.message}`);
    } finally {
      setIsDecryptingMedia(false);
    }
  };

  return (
    <div className={`flex flex-col mb-3 group ${isOwn ? 'items-end' : 'items-start'}`}>
      {/* Sender and Trust Badge */}
      {!isOwn && (
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <span className="text-xs font-semibold text-cipher-300">
            {message.senderDisplayName || message.sender}
          </span>
          <TrustBadge status={message.trustStatus} size="sm" />
        </div>
      )}

      {/* Message Content Container */}
      <div className="relative max-w-[75%] flex items-start gap-1">
        <div
          className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isOwn
              ? 'bg-cipher-700/80 text-white rounded-tr-none border border-cipher-600/50 shadow-md'
              : 'bg-cipher-850 text-cipher-100 rounded-tl-none border border-cipher-800 shadow-md'
          }`}
        >
          {/* Reply Context */}
          {message.replyTo && (
            <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-emerald-500 text-xs text-cipher-300">
              <span className="font-semibold block text-[11px] text-emerald-400">
                Replying to {message.replyTo.sender}:
              </span>
              <p className="truncate line-clamp-1">{message.replyTo.body}</p>
            </div>
          )}

          {/* Attachment Preview / Download */}
          {message.attachment && (
            <div className="mb-2 p-2.5 bg-cipher-950/60 rounded-xl border border-cipher-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="overflow-hidden">
                  <p className="font-medium text-xs text-white truncate max-w-[160px]">
                    {message.attachment.filename}
                  </p>
                  <span className="text-[10px] text-cipher-400">
                    {(message.attachment.size / 1024).toFixed(1)} KB • Encrypted (AES-CTR)
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownloadAttachment}
                disabled={isDecryptingMedia}
                className="p-1.5 bg-cipher-800 hover:bg-cipher-700 text-emerald-400 rounded-lg transition-colors"
                title="Verify SHA-256 and Decrypt Attachment"
              >
                {isDecryptingMedia ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {decryptedBlobUrl && message.attachment?.mimetype.startsWith('image/') && (
            <div className="mb-2 rounded-lg overflow-hidden border border-cipher-700 max-h-48">
              <img
                src={decryptedBlobUrl}
                alt={message.attachment.filename}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Text Body */}
          <div className="break-words whitespace-pre-wrap">{message.body}</div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-cipher-400 select-none">
            {message.edited?.isEdited && <span className="italic">(edited)</span>}
            <span>{formattedTime}</span>
            {message.isEncrypted && (
              <span title="End-to-End Encrypted">
                <Lock className="w-2.5 h-2.5 text-emerald-400/80" />
              </span>
            )}
            {isOwn && <TrustBadge status={message.trustStatus} size="sm" />}
          </div>
        </div>

        {/* Action Menu Trigger */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 pt-1">
          <button
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1 text-cipher-400 hover:text-white rounded hover:bg-cipher-800 transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReact(message.id, '👍')}
            title="React"
            className="p-1 text-cipher-400 hover:text-white rounded hover:bg-cipher-800 transition-colors"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => onEdit(message)}
                title="Edit Message"
                className="p-1 text-cipher-400 hover:text-white rounded hover:bg-cipher-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRedact(message.id)}
                title="Redact / Delete"
                className="p-1 text-cipher-400 hover:text-red-400 rounded hover:bg-cipher-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
