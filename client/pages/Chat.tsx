import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader, UserX, RotateCcw, Users, MessageSquare } from "lucide-react";
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
  const { username, gender, roomId, partner, setIsSearching, setRoomId, setPartner, setUsername, setGender } = useChat();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSearching, setLocalIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isNewChatDebouncing, setIsNewChatDebouncing] = useState(false);
  const [isConnectDebouncing, setIsConnectDebouncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const newChatDebounceRef = useRef<NodeJS.Timeout>();
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

    const handleMessage = (data: { room_id: string; username: string; text: string; timestamp: number }) => {
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

    const handlePartnerLeft = (data: { room_id: string; partner_username: string }) => {
      if (roomId && data.room_id !== roomId) return;

      toast({
        title: "Partner disconnected",
        description: `${data.partner_username} has left the chat`,
        variant: "destructive",
      });

      // Clear partner and show find new match button
      setPartner(null);
      setRoomId(null);
      setLocalIsSearching(false);
    };

    const handleMatched = (data: { room_id: string; partner: { username: string; gender: string } }) => {
      setRoomId(data.room_id);
      setPartner(data.partner as { username: string; gender: "male" | "female" | "other" });
      setMessages([]);
      setMessageInput("");
      setLocalIsSearching(false);
    };

    const handleSearching = (data: { status: string }) => {
      if (data.status === "searching" || data.status === "waiting") {
        setLocalIsSearching(true);
      }
    };

    socket.on("message", handleMessage);
    socket.on("partner_left", handlePartnerLeft);
    socket.on("matched", handleMatched);
    socket.on("searching", handleSearching);

    return () => {
      socket.off("message", handleMessage);
      socket.off("partner_left", handlePartnerLeft);
      socket.off("matched", handleMatched);
      socket.off("searching", handleSearching);
    };
  }, [socket, roomId, username, setRoomId, setPartner, toast]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !roomId || !socket || !connected) return;

    const text = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    // Optimistic update
    const optimisticMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      username: username,
      text,
      timestamp: Date.now(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send message
    socket.emit("send_message", {
      room_id: roomId,
      text,
    });

    setIsSending(false);
  };

  const handleNewChat = () => {
    if (isNewChatDebouncing || !socket || !roomId) return;

    setIsNewChatDebouncing(true);

    // Clear debounce timeout if exists
    if (newChatDebounceRef.current) {
      clearTimeout(newChatDebounceRef.current);
    }

    // Emit leave_room
    socket.emit("leave_room", { room_id: roomId });

    // Update UI
    setLocalIsSearching(true);
    setMessages([]);
    setMessageInput("");

    // Re-join queue
    socket.emit("join_queue", {
      username: username,
      gender: gender,
    });

    // Set debounce
    newChatDebounceRef.current = setTimeout(() => {
      setIsNewChatDebouncing(false);
    }, DEBOUNCE_DELAY);
  };

  const DEBOUNCE_DELAY = 800;

  const handleConnect = () => {
    if (isConnectDebouncing || !socket || !connected) return;

    setIsConnectDebouncing(true);

    // Clear debounce timeout if exists
    if (connectDebounceRef.current) {
      clearTimeout(connectDebounceRef.current);
    }

    // Update UI
    setLocalIsSearching(true);
    setMessages([]);
    setMessageInput("");

    // Listen for matched event
    const handleMatched = (data: { room_id: string; partner: { username: string; gender: string } }) => {
      console.log("Matched!", data);
      setRoomId(data.room_id);
      setPartner(data.partner as { username: string; gender: "male" | "female" | "other" });
      setLocalIsSearching(false);
    };

    const handleQueueAck = (data: { success: boolean; message?: string }) => {
      if (!data.success) {
        toast({
          title: "Error",
          description: data.message || "Failed to join queue",
          variant: "destructive",
        });
        setLocalIsSearching(false);
      }
    };

    socket.once("queue_ack", handleQueueAck);
    socket.once("matched", handleMatched);

    // Emit join_queue event
    socket.emit("join_queue", {
      username: username,
      gender: gender,
    });

    // Set debounce
    connectDebounceRef.current = setTimeout(() => {
      setIsConnectDebouncing(false);
    }, DEBOUNCE_DELAY);
  };

  const genderLabel = partner?.gender.charAt(0).toUpperCase() + partner?.gender.slice(1);

  // If no partner yet, show connect screen
  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Ready to chat?</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Click below to find your chat partner</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleConnect(); }} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                Connected as <span className="font-bold text-indigo-600 dark:text-indigo-400">{username}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm capitalize mt-1">
                Gender: {gender}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isConnectDebouncing || !connected || isSearching}
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching for match...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Search for Match
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden">
      {/* Top Bar - Partner Info */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            {partner?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{partner?.username}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{genderLabel}</p>
          </div>
        </div>
        {isSearching && (
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-xs font-medium">
            <UserX className="w-4 h-4" />
            <span>Searching...</span>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isSearching && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Start a conversation!</p>
            </div>
          </div>
        )}

        {isSearching && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-3">
                <Loader className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Searching for new match...</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.isOwn ? "flex-row-reverse" : "flex-row"
            )}
          >
            {!msg.isOwn && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold">
                {msg.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={cn(
                "max-w-xs rounded-2xl px-4 py-2.5 text-sm",
                msg.isOwn
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Bar */}
      {!isSearching && (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-3 py-3 flex-shrink-0 shadow-lg">
          <div className="flex gap-2 items-center">
            {/* New Chat / Naya Chat Button */}
            <button
              onClick={handleNewChat}
              disabled={isNewChatDebouncing || !connected}
              aria-label="Find new chat partner - New Chat / Naya Chat (800ms cooldown)"
              aria-disabled={isNewChatDebouncing || !connected}
              title="Find new chat partner (800ms cooldown)"
              className={cn(
                "flex-shrink-0 px-3 h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800",
                isNewChatDebouncing || !connected
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg active:scale-95"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New Chat</span>
              <span className="sm:hidden text-xs">New</span>
            </button>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={isSending || !connected}
                className="rounded-xl h-12 border-slate-200 dark:border-slate-700"
                aria-label="Message input"
              />
              <Button
                type="submit"
                disabled={!messageInput.trim() || isSending || !connected}
                className="flex-shrink-0 h-12 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Searching UI - Full screen overlay */}
      {isSearching && (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-end justify-center">
          <div className="pb-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
              <Loader className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Searching for new match...</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">You'll be connected shortly</p>
          </div>
        </div>
      )}
    </div>
  );
}
