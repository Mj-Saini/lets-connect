import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/hooks/useSocket";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AMeetraLogo } from "@/components/AMeetraLogo";

export default function Matchmaking() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"></div>
        <div
          className="absolute bottom-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Chat Connect
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Find someone to talk to instantly
          </p>
        </div>

        {/* Main card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6"
        >
          {/* Username Input */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-300"
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
              className="text-base h-12 rounded-xl border-slate-200 dark:border-slate-700"
              autoFocus
              aria-label="Username"
            />
          </div>

          {/* Gender Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Gender
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
                    "py-3 px-4 rounded-xl font-medium transition-all duration-200 text-sm",
                    "border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900",
                    localGender === option.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !connected}
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Entering...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Enter Chat Room
              </span>
            )}
          </Button>

          {/* Connection status */}
          {!connected && (
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Connecting to server...
            </div>
          )}
        </form>

        {/* Footer text */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          By joining, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}
