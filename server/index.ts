import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { type QueueJoinPayload, type Gender, type SendMessagePayload, type LeaveRoomPayload } from "@shared/api";

interface QueuedUser {
  socketId: string;
  username: string;
  gender: Gender;
  joinedAt: number;
}

interface ActiveRoom {
  room_id: string;
  users: {
    socketId: string;
    username: string;
    gender: Gender;
  }[];
}

const waitingQueue: Map<string, QueuedUser> = new Map();
const activeRooms: Map<string, ActiveRoom> = new Map();
const userToRoom: Map<string, string> = new Map();

const MATCHMAKING_TIMEOUT = 8000; // 8 seconds to find opposite gender
const DEBOUNCE_WINDOW = 800; // ms

let roomIdCounter = 0;

function generateRoomId(): string {
  return `room_${++roomIdCounter}_${Date.now()}`;
}

function findMatch(userId: string, queuedUser: QueuedUser, io: SocketIOServer): boolean {
  const oppositeGender = queuedUser.gender === 'male' ? 'female' : queuedUser.gender === 'female' ? 'male' : null;

  // Try to find opposite gender match
  if (oppositeGender) {
    for (const [otherUserId, otherUser] of waitingQueue.entries()) {
      if (otherUserId === userId) continue;
      if (otherUser.gender === oppositeGender) {
        createChatRoom(io, userId, otherUserId, queuedUser, otherUser);
        waitingQueue.delete(userId);
        waitingQueue.delete(otherUserId);
        return true;
      }
    }
  }

  // Fallback to same gender
  for (const [otherUserId, otherUser] of waitingQueue.entries()) {
    if (otherUserId === userId) continue;
    if (otherUser.gender === queuedUser.gender) {
      createChatRoom(io, userId, otherUserId, queuedUser, otherUser);
      waitingQueue.delete(userId);
      waitingQueue.delete(otherUserId);
      return true;
    }
  }

  return false;
}

function createChatRoom(io: SocketIOServer, userId1: string, userId2: string, user1: QueuedUser, user2: QueuedUser): void {
  const roomId = generateRoomId();

  const room: ActiveRoom = {
    room_id: roomId,
    users: [
      { socketId: userId1, username: user1.username, gender: user1.gender },
      { socketId: userId2, username: user2.username, gender: user2.gender },
    ],
  };

  activeRooms.set(roomId, room);
  userToRoom.set(userId1, roomId);
  userToRoom.set(userId2, roomId);

  // Get the other user's info for each user
  const user1OtherInfo = room.users[1];
  const user2OtherInfo = room.users[0];

  io.to(userId1).emit("matched", {
    room_id: roomId,
    partner: { username: user1OtherInfo.username, gender: user1OtherInfo.gender },
  });

  io.to(userId2).emit("matched", {
    room_id: roomId,
    partner: { username: user2OtherInfo.username, gender: user2OtherInfo.gender },
  });

  // Notify both users they've been matched
  io.to(roomId).emit("searching", { status: "matched" });
}

export function createServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Socket.IO events
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_queue", (payload: QueueJoinPayload) => {
      const { username, gender } = payload;

      // Check if socket is already in queue
      if (waitingQueue.has(socket.id)) {
        socket.emit("queue_ack", { success: false, message: "Already in queue" });
        return;
      }

      const queuedUser: QueuedUser = {
        socketId: socket.id,
        username,
        gender,
        joinedAt: Date.now(),
      };

      waitingQueue.set(socket.id, queuedUser);
      socket.emit("queue_ack", { success: true });
      socket.emit("searching", { status: "waiting" });

      // Try immediate match
      if (!findMatch(socket.id, queuedUser, io)) {
        // Set timeout to try same gender fallback
        setTimeout(() => {
          if (waitingQueue.has(socket.id)) {
            const user = waitingQueue.get(socket.id)!;
            if (!findMatch(socket.id, user, io)) {
              // Keep waiting
              io.to(socket.id).emit("searching", { status: "searching" });
            }
          }
        }, MATCHMAKING_TIMEOUT);
      }
    });

    socket.on("send_message", (payload: SendMessagePayload) => {
      const { room_id, text } = payload;
      const room = activeRooms.get(room_id);

      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // Check if socket is in this room
      const user = room.users.find((u) => u.socketId === socket.id);
      if (!user) {
        socket.emit("error", { message: "Not in this room" });
        return;
      }

      // Emit message to room (including sender)
      io.to(room_id).emit("message", {
        room_id,
        username: user.username,
        text,
        timestamp: Date.now(),
      });
    });

    socket.on("leave_room", (payload: LeaveRoomPayload) => {
      const { room_id } = payload;
      const room = activeRooms.get(room_id);

      if (!room) return;

      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
      if (userIndex === -1) return;

      const leavingUser = room.users[userIndex];
      const otherUser = room.users[1 - userIndex];

      // Notify the other user
      if (otherUser) {
        io.to(otherUser.socketId).emit("partner_left", {
          room_id,
          partner_username: leavingUser.username,
        });
      }

      // Clean up
      activeRooms.delete(room_id);
      userToRoom.delete(socket.id);
      if (otherUser) {
        userToRoom.delete(otherUser.socketId);
      }

      socket.leave(room_id);
    });

    socket.on("leave_queue", () => {
      waitingQueue.delete(socket.id);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove from queue
      waitingQueue.delete(socket.id);

      // Remove from active room and notify partner
      const roomId = userToRoom.get(socket.id);
      if (roomId) {
        const room = activeRooms.get(roomId);
        if (room) {
          const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
          if (userIndex !== -1) {
            const leavingUser = room.users[userIndex];
            const otherUser = room.users[1 - userIndex];

            if (otherUser) {
              io.to(otherUser.socketId).emit("partner_left", {
                room_id: roomId,
                partner_username: leavingUser.username,
              });
            }

            activeRooms.delete(roomId);
            userToRoom.delete(socket.id);
            if (otherUser) {
              userToRoom.delete(otherUser.socketId);
            }
          }
        }
      }
    });
  });

  return { app, httpServer, io };
}
