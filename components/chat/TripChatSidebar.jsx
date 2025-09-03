
import React, { useState, useEffect, useRef } from 'react';
import { TripChat } from '@/api/entities';
import { User } from '@/api/entities';
import { Trip } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Send, X, Bot, User as UserIcon, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function TripChatSidebar({ tripId, onClose, onItineraryUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [isBookedTrip, setIsBookedTrip] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    loadUser();
    loadTrip();
    loadMessages();
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadTrip = async () => {
    try {
      if (tripId) {
        const tripData = await Trip.get(tripId);
        setTrip(tripData);
        
        // Check if trip is booked
        setIsBookedTrip(tripData.status === 'booked' || tripData.status === 'completed');
        
        // If trip is booked, show a message
        if (tripData.status === 'booked' || tripData.status === 'completed') {
          const bookingMsg = {
            id: 'system-booking-msg',
            trip_id: tripId,
            sender_id: 'system',
            sender_name: 'מערכת',
            message_type: 'system',
            content: 'החופשה הוזמנה וכבר לא ניתן לשנות את הפרטים. אנו זמינים לענות על שאלות בלבד.',
            timestamp: new Date().toISOString()
          };
          
          // Check if this message already exists
          const existingMsg = messages.find(m => m.id === 'system-booking-msg');
          if (!existingMsg) {
            setMessages(prev => [bookingMsg, ...prev]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading trip data:", error);
    }
  };

  const loadMessages = async () => {
    try {
      if (tripId) {
        const chatMessages = await TripChat.filter({ trip_id: tripId }, 'timestamp');
        if (chatMessages.length > 0) {
          setMessages(chatMessages);
        } else {
          // Add welcome message if no messages exist
          const welcomeMsg = {
            id: 'welcome-msg',
            trip_id: tripId,
            sender_id: 'ai',
            sender_name: 'מערכת ה-AI',
            message_type: 'text',
            content: 'שלום וברוכים הבאים! אני כאן לעזור לכם בתכנון הטיול. אני יכול לענות על שאלות, להמליץ על אטרקציות, מסעדות ומלונות, או לעזור בשינוי המסלול. במה אוכל לעזור?',
            timestamp: new Date().toISOString()
          };
          await TripChat.create(welcomeMsg);
          setMessages([welcomeMsg]);
        }
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
      // For demo purposes, add sample message
      setMessages([
        {
          id: 'welcome-msg',
          trip_id: tripId,
          sender_id: 'ai',
          sender_name: 'מערכת ה-AI',
          message_type: 'text',
          content: 'שלום וברוכים הבאים! אני כאן לעזור לכם בתכנון הטיול. אני יכול לענות על שאלות, להמליץ על אטרקציות, מסעדות ומלונות, או לעזור בשינוי המסלול. במה אוכל לעזור?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    setError(null);
    
    try {
      // Add user message to state and database
      const userMessage = {
        trip_id: tripId,
        sender_id: user?.id || 'user',
        sender_name: user?.full_name || 'משתמש',
        message_type: 'text',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      const savedUserMsg = await TripChat.create(userMessage);
      setMessages(prev => [...prev, savedUserMsg]);
      setNewMessage('');
      setLoading(true);
      
      // Get AI response using InvokeLLM
      try {
        // Build context prompt
        const tripContext = trip ? 
          `Trip details: Destination: ${trip.destination}, Dates: from ${trip.start_date} to ${trip.end_date}, 
          Number of travelers: ${trip.num_adults} adults and ${trip.num_children} children.
          Trip type: ${trip.trip_type || 'not specified'}` : '';

        // Call AI
        const aiResponse = await InvokeLLM({
          prompt: `You are a helpful travel assistant for the PlanGo platform. 
          
          ${tripContext}
          
          The user has asked: "${newMessage}"
          
          Respond helpfully, concisely and in Hebrew. Provide specific, personalized travel advice.`,
          add_context_from_internet: true
        });
        
        // Save AI response
        const aiMessage = {
          trip_id: tripId,
          sender_id: 'ai',
          sender_name: 'מערכת ה-AI',
          message_type: 'text',
          content: aiResponse,
          timestamp: new Date().toISOString()
        };
        
        const savedAiMsg = await TripChat.create(aiMessage);
        setMessages(prev => [...prev, savedAiMsg]);
      } catch (aiError) {
        console.error("Error getting AI response:", aiError);
        
        // Fallback response if AI fails
        const fallbackMessage = {
          trip_id: tripId,
          sender_id: 'ai',
          sender_name: 'מערכת ה-AI',
          message_type: 'text',
          content: "אני מתנצל, אני מתקשה לענות כרגע. אנא נסה שוב מאוחר יותר או פנה לתמיכה אם תצטרך עזרה דחופה.",
          timestamp: new Date().toISOString()
        };
        
        const savedFallbackMsg = await TripChat.create(fallbackMessage);
        setMessages(prev => [...prev, savedFallbackMsg]);
        
        setError("לא הצלחנו לקבל תשובה מה-AI. אנא נסה שוב.");
      }
      
    } catch (error) {
      console.error("Error in chat flow:", error);
      setError("אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-16rem)] flex flex-col">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">צ'אט עם מערכת ה-AI</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div 
          ref={chatContainerRef}
          className="h-full overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === 'ai' ? 'flex-row' : 'flex-row-reverse'} items-start gap-3 max-w-full`}
            >
              <Avatar className="h-8 w-8">
                {message.sender_id === 'ai' ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
                <AvatarFallback>
                  {message.sender_id === 'ai' ? 'AI' : 'Me'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {message.sender_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), 'HH:mm')}
                  </span>
                </div>
                <div className={`p-3 rounded-lg text-sm ${
                  message.sender_id === 'ai' 
                    ? 'bg-muted text-foreground ml-auto' 
                    : 'bg-blue-600 text-white mr-auto'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      
      {error && (
        <Alert variant="destructive" className="mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isBookedTrip && (
        <Alert className="mx-4 mb-2 bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            החופשה הוזמנה. ניתן לשאול שאלות אך לא לבצע שינויים.
          </AlertDescription>
        </Alert>
      )}
      
      <CardFooter className="p-4 pt-2">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder={isBookedTrip ? "שאל שאלה בנוגע לחופשה..." : "שאל את ה-AI..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
