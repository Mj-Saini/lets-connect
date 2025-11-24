import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader, RotateCcw, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { AMeetraLogo } from "@/components/AMeetraLogo";

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { username, gender, roomId, partner, setRoomId, setPartner } =
    useChat();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasLeft, setHasLeft] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const connectDebounceRef = useRef<NodeJS.Timeout>();

  // Redirect if not logged in
  useEffect(() => {
    if (!username || !gender) {
      navigate("/");
    }
  }, [username, gender, navigate]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: {
      room_id: string;
      username: string;
      text: string;
      timestamp: number;
    }) => {
      if (roomId && data.room_id !== roomId) return;

      const newMessage: Message = {
        id: `${data.timestamp}-${Math.random()}`,
        username: data.username,
        text: data.text,
        timestamp: data.timestamp,
        isOwn: data.username === username,
      };

      // Prevent duplicate messages: check if message already exists
      setMessages((prev) => {
        // Check if this message already exists (by text and username and approximate timestamp)
        const isDuplicate = prev.some(
          (msg) =>
            msg.username === newMessage.username &&
            msg.text === newMessage.text &&
            Math.abs(msg.timestamp - newMessage.timestamp) < 100, // Within 100ms
        );

        if (isDuplicate) {
          console.log("Duplicate message ignored:", newMessage.text);
          return prev;
        }

        return [...prev, newMessage];
      });
    };

    const handlePartnerLeft = (data: {
      room_id: string;
      partner_username: string;
    }) => {
      if (roomId && data.room_id !== roomId) return;

      toast({
        title: "Connection lost",
        description: `${data.partner_username} left the chat. Reconnecting...`,
      });

      // Auto-reconnect
      setMessages([]);
      setMessageInput("");
      setHasLeft(false);
      setPartner(null);
      setRoomId(null);

      // Auto-start search after a short delay
      setTimeout(() => {
        handleConnect();
      }, 500);
    };

    const handleMatched = (data: {
      room_id: string;
      partner: { username: string; gender: string };
    }) => {
      setRoomId(data.room_id);
      setPartner(
        data.partner as {
          username: string;
          gender: "male" | "female" | "other";
        },
      );
      setMessages([]);
      setMessageInput("");
      setIsSearching(false);
      setHasLeft(false);
    };

    socket.on("message", handleMessage);
    socket.on("partner_left", handlePartnerLeft);
    socket.on("matched", handleMatched);

    return () => {
      socket.off("message", handleMessage);
      socket.off("partner_left", handlePartnerLeft);
      socket.off("matched", handleMatched);
    };
  }, [socket, roomId, username, setRoomId, setPartner, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnect = () => {
    if (isSearching || !socket || !connected) return;

    if (connectDebounceRef.current) {
      clearTimeout(connectDebounceRef.current);
    }

    setIsSearching(true);
    setMessages([]);
    setMessageInput("");
    setHasLeft(false);

    const handleQueueAck = (data: { success: boolean; message?: string }) => {
      if (!data.success) {
        toast({
          title: "Error",
          description: data.message || "Failed to join queue",
          variant: "destructive",
        });
        setIsSearching(false);
      }
    };

    socket.once("queue_ack", handleQueueAck);

    socket.emit("join_queue", {
      username: username,
      gender: gender,
    });
  };

  const handleLeave = () => {
    if (!socket || !roomId) return;

    socket.emit("leave_room", { room_id: roomId });
    setRoomId(null);
    setPartner(null);
    setMessages([]);
    setMessageInput("");
    setHasLeft(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !roomId || !socket || !connected) return;

    const text = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    socket.emit("send_message", {
      room_id: roomId,
      text,
    });

    setIsSending(false);
  };

  if (!username || !gender) {
    return null;
  }

  const genderLabel =
    partner?.gender.charAt(0).toUpperCase() + partner?.gender.slice(1);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-white via-rose-50/30 to-white overflow-hidden">
      {/* Top Bar - Partner Info */}
      {partner && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-200 px-4 py-3 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center text-white font-semibold text-xs shadow-md">
              {partner.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
                {partner.username}
              </p>
              <p className="text-xs text-slate-500 capitalize">{genderLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 flex flex-col">
        {/* Placeholder when no messages */}
        {messages.length === 0 && !isSearching && partner && (
          <div className="flex items-center justify-center h-full flex-col gap-3">
            <Heart className="w-8 h-8 text-rose-300 animate-pulse" />
            <p className="text-slate-400 text-sm font-medium">
              Start the conversation!
            </p>
          </div>
        )}

        {/* Searching state */}
        {isSearching && (
          <div className="flex items-center justify-center h-full flex-col gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-rose-100 to-orange-100">
              <Loader className="w-6 h-6 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent animate-spin" />
            </div>
            <p className="text-slate-600 text-sm font-medium">
              Finding your perfect match...
            </p>
            <p className="text-slate-400 text-xs">This won't take long</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            {!msg.isOwn && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-orange-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold shadow-md">
                {msg.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={cn(
                "max-w-xs rounded-2xl px-4 py-2.5 text-sm break-words shadow-sm",
                msg.isOwn
                  ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-br-none"
                  : "bg-slate-100 text-slate-900 rounded-bl-none",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Bar - Input or Connect Button */}
      <div className="flex-shrink-0 bg-white border-t border-rose-200 px-3 py-3">
        {!partner || isSearching ? (
          // Connect Button State
          <Button
            onClick={handleConnect}
            disabled={isSearching || !connected}
            className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 hover:from-rose-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105 active:scale-95"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Finding someone...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                Find My Match
              </span>
            )}
          </Button>
        ) : (
          // Message Input State
          <form
            onSubmit={handleSendMessage}
            className="flex gap-2 items-center"
          >
            {/* Leave/Reconnect Button */}
            <button
              type="button"
              onClick={() => (hasLeft ? handleConnect() : handleLeave())}
              disabled={isSending || !connected}
              aria-label={hasLeft ? "Reconnect" : "Leave chat"}
              title={hasLeft ? "Reconnect" : "Leave this chat"}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 transform",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500",
                hasLeft
                  ? "bg-green-100 text-green-600 hover:bg-green-200 hover:scale-110"
                  : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600",
              )}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Message Input */}
            <Input
              type="text"
              placeholder={hasLeft ? "Reconnecting..." : "Type a message..."}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={isSending || !connected || hasLeft}
              className="rounded-lg h-10 border-rose-200 focus:border-rose-500 focus:ring-rose-500 placeholder:text-slate-400"
              aria-label="Message input"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={
                !messageInput.trim() || isSending || !connected || hasLeft
              }
              className="flex-shrink-0 h-10 px-3 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-semibold disabled:opacity-50 transition-all duration-200"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
