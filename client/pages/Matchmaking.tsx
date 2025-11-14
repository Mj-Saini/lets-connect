import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { AMeetraLogo } from "@/components/AMeetraLogo";

export default function Matchmaking() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { themeVariant, colors } = useDynamicTheme();
  const {
    username,
    setUsername,
    gender,
    setGender,
    setIsSearching,
    setRoomId,
    setPartner,
  } = useChat();
  const [localUsername, setLocalUsername] = useState(username);
  const [localGender, setLocalGender] = useState(gender);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!localUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    if (!localGender) {
      setError("Please select a gender");
      return;
    }

    if (!socket || !connected) {
      setError("Connecting to server... please wait");
      return;
    }

    setIsLoading(true);

    // Update context with username and gender
    setUsername(localUsername);
    setGender(localGender);
    setIsSearching(false);
    setRoomId(null);
    setPartner(null);

    // Navigate directly to chat room without searching
    setTimeout(() => {
      setIsLoading(false);
      navigate("/chat");
    }, 300);
  };

  const genderOptions = [
    { value: "male" as const, label: "Male" },
    { value: "female" as const, label: "Female" },
    { value: "other" as const, label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements - romantic theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Pink gradient circle */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-300 to-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

        {/* Orange gradient circle */}
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-300 to-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Purple accent circle */}
        <div
          className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-bl from-violet-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header with logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-5 drop-shadow-lg">
            <AMeetraLogo size={72} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-3">
            aMeetRa
          </h1>
          <p className="text-slate-700 text-base font-semibold mb-1">
            Find your perfect connection
          </p>
          <p className="text-slate-500 text-sm flex items-center justify-center gap-1">
            <Heart className="w-4 h-4 text-rose-500" />
            Random chats, real connections
            <Heart className="w-4 h-4 text-rose-500" />
          </p>
        </div>

        {/* Main card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 backdrop-blur-sm"
        >
          {/* Username Input */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent"
            >
              Your Name
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              disabled={isLoading}
              maxLength={30}
              className="text-base h-12 rounded-xl border-2 border-rose-200 focus:border-rose-500 focus:ring-rose-500 placeholder:text-slate-400 transition-all duration-200"
              autoFocus
              aria-label="Username"
            />
          </div>

          {/* Gender Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
              I am looking for
            </label>
            <div className="grid grid-cols-3 gap-3">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocalGender(option.value)}
                  disabled={isLoading}
                  aria-label={option.label}
                  aria-pressed={localGender === option.value}
                  className={cn(
                    "py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-sm transform",
                    "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500",
                    localGender === option.value
                      ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white border-rose-500 shadow-lg shadow-rose-200 scale-105"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-start gap-2">
              <span className="text-base">⚠️</span>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !connected}
            className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 hover:from-rose-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Getting ready...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Meeting
                <Sparkles className="w-5 h-5" />
              </span>
            )}
          </Button>

          {/* Connection status */}
          {!connected && (
            <div className="text-center text-xs text-slate-400 animate-pulse">
              Connecting to server...
            </div>
          )}
        </form>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Find genuine connections in a safe, anonymous way
        </p>
      </div>
    </div>
  );
}
