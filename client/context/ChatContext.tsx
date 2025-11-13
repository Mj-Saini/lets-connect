import { createContext, ReactNode, useState } from "react";
import { Gender } from "@shared/api";

export interface ChatContextType {
  username: string;
  setUsername: (username: string) => void;
  gender: Gender | null;
  setGender: (gender: Gender | null) => void;
  roomId: string | null;
  setRoomId: (roomId: string | null) => void;
  partner: {
    username: string;
    gender: Gender;
  } | null;
  setPartner: (partner: { username: string; gender: Gender } | null) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partner, setPartner] = useState<{ username: string; gender: Gender } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        username,
        setUsername,
        gender,
        setGender,
        roomId,
        setRoomId,
        partner,
        setPartner,
        isSearching,
        setIsSearching,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
