import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

  // Auto-select first session if none is selected
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
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

    // Create a new session if none exists
    if (!currentSessionId) {
      const session = await createSession.mutateAsync("New Chat");
      setCurrentSessionId(session.id);
      
      // Add initial assistant message
      await addMessage.mutateAsync({
        sessionId: session.id,
        content: "Hello! I'm your AI regulatory assistant. What would you like to know about EU regulations?",
        author: "assistant",
      });

      // Now send the user message
      await addMessage.mutateAsync({
        sessionId: session.id,
        content: messageText,
        author: "user",
      });
    } else {
      // Add user message to existing session
      await addMessage.mutateAsync({
        sessionId: currentSessionId,
        content: messageText,
        author: "user",
      });

      // Update session title if it's the first user message
      if (messages.length <= 1) {
        const title = messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
        await updateSession.mutateAsync({ sessionId: currentSessionId, title });
      }
    }

    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(async () => {
      const responses: Record<string, string> = {
        "ai act": "The AI Act is the EU's regulation on artificial intelligence. For healthcare AI, your system is likely classified as high-risk. Key requirements: risk management system, data quality documentation, human oversight capabilities, and EU database registration. Deadline: August 2026.",
        "health data": "The European Health Data Space (EHDS) regulation affects how health data is accessed and shared. Key points: patients get easier cross-border data access, new framework for research use of health data, and standard data formats (HL7 FHIR) will be required.",
        "prioritize": "This week's priorities:\n\n1. AI Act Implementation Guidelines - Review the new guidelines for high-risk AI systems\n2. Health Data Vote (Feb 20) - Monitor the outcome\n3. AI Liability Directive - Background monitoring only",
      };

      let response = "I can help you understand EU regulations. Could you be more specific about which regulation or topic you'd like to explore?";

      for (const [key, value] of Object.entries(responses)) {
        if (messageText.toLowerCase().includes(key)) {
          response = value;
          break;
        }
      }

      if (currentSessionId) {
        await addMessage.mutateAsync({
          sessionId: currentSessionId,
          content: response,
          author: "assistant",
        });
      }

      setIsLoading(false);
    }, 1000);
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
                    {message.content?.split('\n').map((line, i) => (
                      <p key={i} className="mb-1 last:mb-0">
                        {line}
                      </p>
                    ))}
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
