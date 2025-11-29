import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatSession {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessageType {
  id: string;
  chat_session: string | null;
  content: string | null;
  author: string | null; // 'user' or 'assistant'
  date: string | null;
}

// Fetch all chat sessions for the current user
export function useChatSessions() {
  return useQuery({
    queryKey: ["chat_sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ChatSession[];
    },
  });
}

// Fetch messages for a specific chat session
export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat_messages", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_session", sessionId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as ChatMessageType[];
    },
    enabled: !!sessionId,
  });
}

// Create a new chat session
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string = "New Chat") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert([{ user_id: user.id, title }])
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions"] });
    },
  });
}

// Add a message to a chat session
export function useAddChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      content,
      author,
    }: {
      sessionId: string;
      content: string;
      author: "user" | "assistant";
    }) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            chat_session: sessionId,
            content,
            author,
            date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as ChatMessageType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat_messages", variables.sessionId],
      });
    },
  });
}

// Update chat session title
export function useUpdateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
    }: {
      sessionId: string;
      title: string;
    }) => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions"] });
    },
  });
}

// Delete a chat session
export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_sessions"] });
    },
  });
}

