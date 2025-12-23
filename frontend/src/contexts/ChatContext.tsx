'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import type { Channel } from 'stream-chat';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

interface ChatContextType {
  client: StreamChat | null;
  loading: boolean;
  error: string | null;
  createDirectChat: (otherUserId: string) => Promise<Channel | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setClient(null);
      setLoading(false);
      return;
    }

    let chatClient: StreamChat | null = null;

    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get Stream token from backend
        const response = await api.post<{ 
          data: { 
            token: string; 
            apiKey: string; 
            userId: string;
          } 
        }>('/chat/token');

        const { token, apiKey, userId } = response.data;

        // Initialize Stream client
        chatClient = StreamChat.getInstance(apiKey);

        // Connect user
        await chatClient.connectUser(
          {
            id: userId,
            name: user.name,
            image: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
          },
          token
        );

        setClient(chatClient);
      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Không thể kết nối chat');
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup
    return () => {
      if (chatClient) {
        chatClient.disconnectUser().catch(console.error);
      }
    };
  }, [user]);

  const createDirectChat = async (otherUserId: string): Promise<Channel | null> => {
    if (!client || !user) return null;

    try {
      // Create channel ID from sorted user IDs to ensure consistency
      const members = [user.id, otherUserId].sort();
      
      // Hash the channel ID to keep it under 64 characters
      // Simple hash: take first 8 chars of each UUID and combine
      const hash1 = members[0].substring(0, 8);
      const hash2 = members[1].substring(0, 8);
      const channelId = `dm-${hash1}-${hash2}`; // dm-12345678-87654321 = 22 chars (well under 64)

      const channel = client.channel('messaging', channelId, {
        members
      });

      await channel.watch();
      return channel;
    } catch (err) {
      console.error('Failed to create direct chat:', err);
      return null;
    }
  };

  return (
    <ChatContext.Provider value={{ client, loading, error, createDirectChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
