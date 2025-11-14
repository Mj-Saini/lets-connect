import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

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

      setMessages((prev) => [...prev, newMessage]);
    };

    const handlePartnerLeft = (data: {
      room_id: string;
      partner_username: string;
    }) => {
      if (roomId && data.room_id !== roomId) return;

      toast({
        title: "Partner left",
        description: `${data.partner_username} disconnected. Reconnecting...`,
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

    const optimisticMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      username: username,
      text,
      timestamp: Date.now(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

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
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Bar - Partner Info */}
      {partner && (
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-semibold text-xs">
              {partner.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {partner.username}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {genderLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 flex flex-col">
        {/* Placeholder when no messages */}
        {messages.length === 0 && !isSearching && partner && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Start the conversation!
            </p>
          </div>
        )}

        {/* Searching state */}
        {isSearching && (
          <div className="flex items-center justify-center h-full flex-col gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Loader className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              Looking for a match...
            </p>
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
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                {msg.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={cn(
                "max-w-xs rounded-lg px-3 py-2 text-sm break-words",
                msg.isOwn
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Bar - Input or Connect Button */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-3 py-3">
        {!partner || isSearching ? (
          // Connect Button State
          <Button
            onClick={handleConnect}
            disabled={isSearching || !connected}
            className="w-full h-12 text-base font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Searching...
              </span>
            ) : (
              "Search for Match"
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
              title={
                hasLeft ? "Click to reconnect" : "Click to leave this chat"
              }
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800",
                hasLeft
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600",
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
              className="rounded-lg h-10 border-slate-200 dark:border-slate-700"
              aria-label="Message input"
            />

            {/* Send Button */}
            <Button
              type="submit"
              disabled={
                !messageInput.trim() || isSending || !connected || hasLeft
              }
              className="flex-shrink-0 h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
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
