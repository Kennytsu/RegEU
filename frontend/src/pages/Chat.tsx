import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageSquare, 
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Edit2
} from "lucide-react";
import {
  useChatSessions,
  useChatMessages,
  useCreateChatSession,
  useAddChatMessage,
  useUpdateChatSession,
  useDeleteChatSession,
} from "@/hooks/useChatSessions";
import { useRagQuery } from "@/hooks/use-rag-query";
import { ScrollArea } from "@/components/ui/scroll-area";

const suggestedPrompts = [
  "What is the AI Act?",
  "Explain health data regulation",
  "What should we prioritize?",
];

export default function Chat() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: sessions = [] } = useChatSessions();
  const { data: messages = [] } = useChatMessages(currentSessionId);
  const createSession = useCreateChatSession();
  const addMessage = useAddChatMessage();
  const updateSession = useUpdateChatSession();
  const deleteSession = useDeleteChatSession();
  const ragQuery = useRagQuery();

  // Auto-select first session if none is selected
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      const firstSession = sessions[0];
      setCurrentSessionId(firstSession.id);
      
      // Check if session has the greeting message
      if (messages.length === 0) {
        addMessage.mutate({
          sessionId: firstSession.id,
          content: "Hello! I'm your AI regulatory assistant. What would you like to know about EU regulations?",
          author: "assistant",
        });
      }
    }
  }, [sessions, currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateNewChat = async () => {
    const session = await createSession.mutateAsync("New Chat");
    setCurrentSessionId(session.id);
    
    // Add initial assistant message
    await addMessage.mutateAsync({
      sessionId: session.id,
      content: "Hello! I'm your AI regulatory assistant. What would you like to know about EU regulations?",
      author: "assistant",
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession.mutateAsync(sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0]?.id || null);
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (editTitle.trim()) {
      await updateSession.mutateAsync({ sessionId, title: editTitle });
      setEditingSessionId(null);
      setEditTitle("");
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    // Add user message to current session
    if (currentSessionId) {
      await addMessage.mutateAsync({
        sessionId: currentSessionId,
        content: messageText,
        author: "user",
      });

      // Update session title if it's the first user message
      if (messages.length === 1) {
        const title = messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        await updateSession.mutateAsync({ sessionId: currentSessionId, title });
      }
    }

    setInput("");
    setIsLoading(true);

    // Call RAG endpoint to get AI response
    try {
      const result = await ragQuery.mutateAsync({ 
        query: messageText,
        top_k: 10 
      });

      if (result.success && currentSessionId) {
        // Use only the LLM answer without similarity scores or emojis
        const formattedResponse = result.llm_answer;

        await addMessage.mutateAsync({
          sessionId: currentSessionId,
          content: formattedResponse,
          author: "assistant",
        });
      } else if (currentSessionId) {
        await addMessage.mutateAsync({
          sessionId: currentSessionId,
          content: "I encountered an issue retrieving regulatory information. Please try again.",
          author: "assistant",
        });
      }
    } catch (error) {
      console.error("RAG query error:", error);
      if (currentSessionId) {
        await addMessage.mutateAsync({
          sessionId: currentSessionId,
          content: "I encountered an error while processing your query. Please try again later.",
          author: "assistant",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-3.5rem)] flex">
        {/* Sidebar */}
        <div
          className={cn(
            "border-r border-border bg-muted/30 flex flex-col transition-all duration-300",
            sidebarOpen ? "w-64" : "w-0"
          )}
        >
          {sidebarOpen && (
            <>
              {/* New Chat Button */}
              <div className="p-3 border-b border-border">
                <Button
                  onClick={handleCreateNewChat}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Chat History */}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                        currentSessionId === session.id && "bg-muted"
                      )}
                    >
                      {editingSessionId === session.id ? (
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSession(session.id)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSession(session.id);
                            }
                          }}
                          className="h-7 text-xs"
                          autoFocus
                        />
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span
                            onClick={() => setCurrentSessionId(session.id)}
                            className="flex-1 text-xs truncate"
                          >
                            {session.title || "New Chat"}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(session.id);
                                setEditTitle(session.title || "");
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-border flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Ask about EU regulations</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.author === 'user' && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.author === 'assistant' ? "bg-secondary" : "bg-primary"
                    )}
                  >
                    {message.author === 'assistant' ? (
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <User className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "max-w-[80%] px-3 py-2 rounded-lg text-sm",
                      message.author === 'assistant'
                        ? "bg-secondary text-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-2" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props} />,
                      }}
                    >
                      {message.content || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="bg-secondary px-3 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse" />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length === 0 && (
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-3 py-1.5 rounded-md bg-secondary text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-border">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about EU regulations..."
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
