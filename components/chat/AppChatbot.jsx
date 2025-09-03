
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { ChatMessage } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Bot, Send, X, Maximize2, Minimize2, MessageCircle, AlertTriangle, Loader2 } from 'lucide-react';

const SESSION_STORAGE_KEY = 'app-chat-session-id';
const MAX_MESSAGES_PER_10_SECONDS = 3; // מקטין את הגבלת הקצב
const MAX_MESSAGES_PER_DAY = 50; // מקטין את המגבלה היומית
const WARNING_THRESHOLD = 40;

// פונקציה פשוטה ליצירת מזהה ייחודי במקום להשתמש בספריית uuid
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export default function AppChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // שינוי מ-true ל-false כדי להקטין טעינות
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [assistantIdentity, setAssistantIdentity] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [dailyMessageCount, setDailyMessageCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const recentMessageTimestamps = useRef([]);

  // Default assistant personality if not configured
  const defaultAssistantIdentity = "אתם העוזר האישי שלנו – חכם, אדיב, ויודע לשאול בדיוק את השאלות הנכונות 😊 אתם מדברים עברית כברירת מחדל, אלא אם המשתמש ביקש אחרת.";

  useEffect(() => {
    // דחיית אתחול הצ'אט עד שהמשתמש לוחץ עליו
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Check if user has reached warning threshold
    if (dailyMessageCount >= WARNING_THRESHOLD && dailyMessageCount < MAX_MESSAGES_PER_DAY && !showWarning) {
      setShowWarning(true);
      addAssistantMessage(`וואו, הגעתם כבר ל-${dailyMessageCount} הודעות להיום 🎯 אני טיפה מתעייף — נמשיך מחר?`);
    }
  }, [dailyMessageCount]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Initialize or retrieve session ID
      let currentSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!currentSessionId) {
        currentSessionId = generateUniqueId();
        sessionStorage.setItem(SESSION_STORAGE_KEY, currentSessionId);
      }
      setSessionId(currentSessionId);

      // בדיקה פשוטה יותר של המשתמש
      let userData = null;
      try {
        userData = await User.me();
        setUser(userData);
      } catch (err) {
        console.log('User not authenticated - continuing as anonymous');
        // Continue as anonymous user
      }

      // טעינת הגדרות רק אם נדרש
      try {
        const cachedSettings = localStorage.getItem('assistantSettings');
        if (cachedSettings) {
          const settings = JSON.parse(cachedSettings);
          setAssistantIdentity(settings.assistant_identity || defaultAssistantIdentity);
        } else {
          const settingsList = await SystemSettings.list();
          if (settingsList && settingsList.length > 0) {
            const settings = settingsList[0];
            setAssistantIdentity(settings.assistant_identity || defaultAssistantIdentity);
            localStorage.setItem('assistantSettings', JSON.stringify(settings));
          } else {
            setAssistantIdentity(defaultAssistantIdentity);
          }
        }
      } catch (err) {
        console.log('Using default assistant identity'); // Changed from console.error
        setAssistantIdentity(defaultAssistantIdentity);
      }

      // טעינת הודעות רק אם המשתמש מאומת
      if (userData) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const startOfDay = new Date(`${today}T00:00:00`).toISOString();
          const endOfDay = new Date(`${today}T23:59:59`).toISOString();
          
          // Get today's messages to count them
          const todayMessages = await ChatMessage.filter({
            user_id: userData.id,
            created_date: { $gte: startOfDay, $lte: endOfDay },
            role: 'user'
          });
          
          setDailyMessageCount(todayMessages.length);

          // Get recent conversation history (last 20 messages)
          const chatHistory = await ChatMessage.filter(
            { user_id: userData.id },
            '-created_date',
            20 // מקטין את כמות ההודעות שנטענות
          );

          if (chatHistory && chatHistory.length > 0) {
            // Sort messages by timestamp
            const sortedMessages = chatHistory
              .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
              .map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.created_date)
              }));
            
            setMessages(sortedMessages);
          } else {
            addWelcomeMessage();
          }
        } catch (err) {
          console.log('Error loading chat history, using default welcome');
          addWelcomeMessage();
        }
      } else {
        addWelcomeMessage();
      }
    } catch (err) {
      console.error('Error initializing chat:', err);
      setError("שגיאה באתחול הצ'אט");
      addWelcomeMessage();
    } finally {
      setLoading(false);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: "שלום! 👋 אני העוזר האישי שלך באפליקציה. איך אוכל לעזור לך היום?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const addAssistantMessage = async (content) => {
    const newMessage = {
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Save message to database if user is authenticated
    if (user) {
      try {
        await ChatMessage.create({
          user_id: user.id,
          session_id: sessionId,
          role: 'assistant',
          content
        });
      } catch (err) {
        console.error('Error saving assistant message:', err);
      }
    }
  };

  const checkRateLimit = () => {
    const now = Date.now();
    
    // Add current timestamp
    recentMessageTimestamps.current.push(now);
    
    // Only keep timestamps from last 10 seconds
    recentMessageTimestamps.current = recentMessageTimestamps.current.filter(
      timestamp => now - timestamp < 10000
    );
    
    // Check if too many messages in last 10 seconds
    if (recentMessageTimestamps.current.length > MAX_MESSAGES_PER_10_SECONDS) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 10000);
      return true;
    }
    
    // Check daily limit
    if (dailyMessageCount >= MAX_MESSAGES_PER_DAY) {
      setError(`הגעת למכסת ההודעות היומית (${MAX_MESSAGES_PER_DAY}). נסה שוב מחר.`);
      return true;
    }
    
    return false;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;
    
    // Check rate limits
    if (checkRateLimit()) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Add user message to UI
      const userMessage = {
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      
      // Increment daily message count
      setDailyMessageCount(prev => prev + 1);
      
      // Save message to database if user is authenticated
      if (user) {
        try {
          await ChatMessage.create({
            user_id: user.id,
            session_id: sessionId,
            role: 'user',
            content: inputValue
          });
        } catch (err) {
          console.error('Error saving user message:', err);
        }
      }

      // Prepare context for assistant
      let conversationHistory = '';
      // Only include last 5 messages for context
      const recentMessages = messages.slice(-5); // רק 5 הודעות אחרונות
      
      recentMessages.forEach(msg => {
        conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });

      // Add current message
      conversationHistory += `User: ${inputValue}\n`;

      // Generate AI response
      const userInfo = user ? 
        `המשתמש הנוכחי: ${user.full_name || 'משתמש'} (${user.email || 'אנונימי'})` : 
        'משתמש אנונימי';
      
      const aiResponse = await InvokeLLM({
        prompt: `
${assistantIdentity}

הנה השיחה הקודמת עם המשתמש:
${conversationHistory}

${userInfo}

ענה בצורה קצרה, חברותית ומקצועית. דבר עברית אלא אם המשתמש פנה אליך בשפה אחרת.
        `,
        add_context_from_internet: false // מכבה חיפוש באינטרנט לחסוך זמן
      });

      // Add assistant response
      if (aiResponse) {
        await addAssistantMessage(aiResponse);
      }
    } catch (err) {
      console.error('Error in conversation:', err);
      setError('אירעה שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // The resetError function was removed as per the outline, and setError(null) is handled directly.

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleChat}
            className="h-14 w-14 rounded-full shadow-lg"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {isOpen && (
        <div 
          className={`fixed z-50 bg-background/80 backdrop-blur-sm ${
            isExpanded ? 'inset-0' : 'bottom-6 right-6 w-96 rounded-lg shadow-lg'
          }`}
        >
          <Card className={`border h-full flex flex-col ${isExpanded ? 'rounded-none' : ''}`}>
            <CardHeader className="px-4 py-2 flex flex-row items-center justify-between space-y-0 border-b">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <Bot className="h-4 w-4" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="font-semibold">עוזר אישי</div>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChatExpansion}
                  className="h-8 w-8"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className={`h-full ${isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[360px]'}`}>
                <div className="flex flex-col gap-3 p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs opacity-70 mt-1 text-left">
                            {format(message.timestamp, 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            
            <CardFooter className="p-4 pt-2 border-t">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2 w-full">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="הקלד הודעה..."
                  disabled={sending || isRateLimited || dailyMessageCount >= MAX_MESSAGES_PER_DAY}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || sending || isRateLimited || dailyMessageCount >= MAX_MESSAGES_PER_DAY}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isRateLimited && (
                <p className="text-xs text-muted-foreground mt-2">
                  שלחת יותר מדי הודעות בזמן קצר. אנא המתן מספר שניות...
                </p>
              )}
              
              {dailyMessageCount > 0 && (
                <div className="w-full mt-2">
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        dailyMessageCount >= WARNING_THRESHOLD ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${(dailyMessageCount / MAX_MESSAGES_PER_DAY) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {dailyMessageCount}/{MAX_MESSAGES_PER_DAY} הודעות היום
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}
