/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Socket event types for 1-on-1 chat
 */

export type Gender = 'male' | 'female' | 'other';

export interface QueueJoinPayload {
  username: string;
  gender: Gender;
}

export interface QueueAckPayload {
  success: boolean;
  message?: string;
}

export interface MatchedPayload {
  room_id: string;
  partner: {
    username: string;
    gender: Gender;
  };
}

export interface SendMessagePayload {
  room_id: string;
  text: string;
}

export interface MessagePayload {
  room_id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface LeaveRoomPayload {
  room_id: string;
}

export interface PartnerLeftPayload {
  room_id: string;
  partner_username: string;
}
