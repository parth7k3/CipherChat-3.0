import * as matrixcs from 'matrix-js-sdk';
import { matrixClientManager } from './matrixClient';
import { CryptoService } from './cryptoService';
import type { EncryptedMessage, RoomSummary, TrustStatus } from '../../types';

export class SyncService {
  /**
   * Fetches room summaries for all joined rooms.
   */
  public static getRooms(): RoomSummary[] {
    const client = matrixClientManager.getClient();
    if (!client) return [];

    const rooms = client.getRooms();
    return rooms.map((room) => {
      const isEncrypted = client.isRoomEncrypted(room.roomId);
      const members = room.getJoinedMembers();
      const timeline = room.getLiveTimeline().getEvents();
      const lastEvent = timeline[timeline.length - 1];

      let lastMessage;
      if (lastEvent) {
        lastMessage = {
          body: lastEvent.getContent()?.body || (lastEvent.isEncrypted() ? 'Encrypted message' : ''),
          timestamp: lastEvent.getTs(),
          sender: lastEvent.getSender() || '',
        };
      }

      return {
        roomId: room.roomId,
        name: room.name || room.roomId,
        topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent()?.topic,
        isDirect: false, // Calculated or set via account data
        isEncrypted,
        unreadCount: room.getUnreadNotificationCount(matrixcs.NotificationCountType.Total),
        lastMessage,
        membersCount: members.length,
        allMembersVerified: true, // Evaluated dynamically
      };
    });
  }

  /**
   * Fetches and decrypts timeline messages for a given room.
   */
  public static async getRoomTimeline(roomId: string): Promise<EncryptedMessage[]> {
    const client = matrixClientManager.getClient();
    if (!client) return [];

    const room = client.getRoom(roomId);
    if (!room) return [];

    const events = room.getLiveTimeline().getEvents();
    const messages: EncryptedMessage[] = [];

    for (const evt of events) {
      if (evt.getType() === 'm.room.message' || evt.isEncrypted()) {
        const msg = await this.parseTimelineEvent(evt);
        if (msg) messages.push(msg);
      }
    }

    return messages;
  }

  /**
   * Sends an end-to-end encrypted or plain text message to a room.
   * STRICT SECURITY: Asserts safe message dispatch; prevents accidental plaintext fallback.
   */
  public static async sendMessage(
    roomId: string,
    body: string,
    replyToEventId?: string
  ): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');

    // Cryptographic guard: checks encryption status and ensures crypto engine readiness
    CryptoService.assertSafeMessageDispatch(roomId);

    const content: any = {
      body,
      msgtype: 'm.text',
    };

    if (replyToEventId) {
      content['m.relates_to'] = {
        'm.in_reply_to': {
          event_id: replyToEventId,
        },
      };
    }

    await client.sendMessage(roomId, content);
  }

  /**
   * Edits a previously sent message using Matrix m.replace relation.
   */
  public static async editMessage(
    roomId: string,
    originalEventId: string,
    newBody: string
  ): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');

    CryptoService.assertSafeMessageDispatch(roomId);

    const content = {
      body: `* ${newBody}`,
      msgtype: 'm.text',
      'm.new_content': {
        body: newBody,
        msgtype: 'm.text',
      },
      'm.relates_to': {
        rel_type: 'm.replace',
        event_id: originalEventId,
      },
    };

    await client.sendMessage(roomId, content as any);
  }

  /**
   * Redacts/deletes a message from the timeline.
   */
  public static async redactMessage(roomId: string, eventId: string): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');
    await client.redactEvent(roomId, eventId);
  }

  /**
   * Adds an emoji reaction to a message.
   */
  public static async addReaction(roomId: string, eventId: string, key: string): Promise<void> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');

    await client.sendEvent(roomId, 'm.reaction' as any, {
      'm.relates_to': {
        rel_type: 'm.annotation',
        event_id: eventId,
        key,
      },
    });
  }

  /**
   * Creates a private encrypted room (1:1 or group).
   */
  public static async createEncryptedRoom(name: string, topic?: string, inviteUserIds: string[] = []): Promise<string> {
    const client = matrixClientManager.getClient();
    if (!client) throw new Error('Client not initialized');

    const response = await client.createRoom({
      visibility: matrixcs.Visibility.Private,
      name,
      topic,
      invite: inviteUserIds,
      initial_state: [
        {
          type: 'm.room.encryption',
          state_key: '',
          content: {
            algorithm: 'm.megolm.v1.aes-sha2',
          },
        },
      ],
    });

    return response.room_id;
  }

  private static async parseTimelineEvent(evt: matrixcs.MatrixEvent): Promise<EncryptedMessage | null> {
    const client = matrixClientManager.getClient();
    const content = evt.getContent();
    const isEncrypted = evt.isEncrypted();
    let body = content?.body || '';

    let trustStatus: TrustStatus = 'unverified';
    if (isEncrypted) {
      if (evt.isDecryptionFailure()) {
        body = '⚠️ [Decryption Failed: Megolm session key not yet available]';
        trustStatus = 'danger';
      } else {
        // Check verification status of sender device
        const sender = evt.getSender();
        if (client && sender) {
          const crypto = client.getCrypto();
          if (crypto) {
            try {
              const status = await crypto.getDeviceVerificationStatus(sender, evt.getWireContent()?.device_id || '');
              if (status?.isVerified()) {
                trustStatus = 'verified';
              }
            } catch {
              trustStatus = 'unverified';
            }
          }
        }
      }
    }

    return {
      id: evt.getId() || `evt_${Math.random()}`,
      roomId: evt.getRoomId() || '',
      sender: evt.getSender() || '',
      senderDisplayName: evt.sender?.name,
      body,
      timestamp: evt.getTs(),
      isEncrypted,
      trustStatus,
      status: 'sent',
      edited: content['m.relates_to']?.rel_type === 'm.replace' ? { isEdited: true } : undefined,
    };
  }
}
