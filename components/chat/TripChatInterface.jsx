
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { Trip } from '@/api/entities';
import { TripChat } from '@/api/entities';
import { TripItinerary } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bot,
  Send,
  User as UserIcon,
  MessageSquare,
  ListPlus,
  Hotel,
  Plane,
  MapPin,
  Calendar,
  Clock,
  LogIn
} from 'lucide-react';
import { format } from 'date-fns';

export default function TripChatInterface({ tripId, onItineraryUpdate }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [promptSettings, setPromptSettings] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        try {
          const userData = await User.me();
          setUser(userData);
        } catch (error) {
          console.log("Not authenticated:", error);
          return; // Exit early if not authenticated
        }
        
        if (tripId) {
          const tripData = await Trip.get(tripId);
          setTrip(tripData);
          
          const itineraryData = await TripItinerary.filter({ trip_id: tripId }, 'day_number');
          setItinerary(itineraryData);
          
          const chatMessages = await TripChat.filter({ trip_id: tripId }, 'timestamp');
          setMessages(chatMessages);
          
          const settings = localStorage.getItem('planGo_adminPrompts');
          if (settings) {
            setPromptSettings(JSON.parse(settings));
          }
          
          if (chatMessages.length === 0) {
            sendSystemMessage();
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    
    loadData();
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendSystemMessage = async () => {
    try {
      const welcomeMessage = {
        trip_id: tripId,
        sender_id: 'system',
        sender_name: 'מערכת',
        message_type: 'system',
        content: `שלום${user ? ' ' + user.full_name : ''}! אני עוזר התכנון של PlanGo ואשמח לסייע לך בתכנון הטיול ל${trip?.destination || 'יעד שלך'}. אפשר לשאול אותי על המלצות למלונות, מסעדות, אטרקציות, או כל דבר אחר שקשור לטיול.`,
        timestamp: new Date().toISOString(),
        read_by: [user?.id]
      };
      
      const savedMessage = await TripChat.create(welcomeMessage);
      setMessages(prev => [...prev, savedMessage]);
      
      setTimeout(() => {
        const questionsMessage = {
          trip_id: tripId,
          sender_id: 'system',
          sender_name: 'מערכת',
          message_type: 'suggestion',
          content: 'כדי להציע לך המלצות מותאמות אישית, אשמח לדעת:',
          suggestion_data: {
            questions: [
              'האם אתה מעדיף מלון בקרבת חוף הים או במרכז העיר?',
              'האם אתה מחפש חוויות קולינריות מיוחדות או אטרקציות לכל המשפחה?',
              'האם ברצונך שאציע לך מסלול יומי לטיול?'
            ]
          },
          timestamp: new Date().toISOString(),
          read_by: [user?.id]
        };
        
        TripChat.create(questionsMessage).then(saved => {
          setMessages(prev => [...prev, saved]);
        });
      }, 1000);
    } catch (error) {
      console.error("Error sending system message:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      setLoading(true);
      
      const userMessage = {
        trip_id: tripId,
        sender_id: user.id,
        sender_name: user.full_name,
        message_type: 'text',
        content: newMessage,
        timestamp: new Date().toISOString(),
        read_by: [user.id]
      };
      
      const savedUserMessage = await TripChat.create(userMessage);
      setMessages(prev => [...prev, savedUserMessage]);
      setNewMessage('');
      
      const prompt = buildPrompt(newMessage);
      
      const aiResponse = await InvokeLLM({
        prompt,
        add_context_from_internet: true
      });
      
      const processedResponse = processAIResponse(aiResponse);
      
      const aiMessage = {
        trip_id: tripId,
        sender_id: 'ai',
        sender_name: 'PlanGo Assistant',
        message_type: processedResponse.type || 'text',
        content: processedResponse.content,
        suggestion_data: processedResponse.suggestionData,
        edit_data: processedResponse.editData,
        timestamp: new Date().toISOString(),
        read_by: [user.id]
      };
      
      const savedAIMessage = await TripChat.create(aiMessage);
      setMessages(prev => [...prev, savedAIMessage]);
      
      if (processedResponse.itineraryChanges && onItineraryUpdate) {
        onItineraryUpdate(processedResponse.itineraryChanges);
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage = {
        trip_id: tripId,
        sender_id: 'system',
        sender_name: 'מערכת',
        message_type: 'system',
        content: "אירעה שגיאה בעיבוד ההודעה. נסה שוב מאוחר יותר.",
        timestamp: new Date().toISOString(),
        read_by: [user?.id]
      };
      
      const savedError = await TripChat.create(errorMessage);
      setMessages(prev => [...prev, savedError]);
    } finally {
      setLoading(false);
    }
  };

  const buildPrompt = (userQuery) => {
    let basePrompt = promptSettings?.itineraryPlanner || 
      `You are a travel itinerary planner. Create a detailed day-by-day travel plan for the user based on their preferences, destination, and duration. Include recommended activities, attractions, restaurants, and practical tips.`;
      
    const tripContext = `
    Current Trip Information:
    - Destination: ${trip?.destination || 'Not specified'}
    - Dates: ${trip?.start_date ? format(new Date(trip?.start_date), 'dd/MM/yyyy') : 'Not specified'} to ${trip?.end_date ? format(new Date(trip?.end_date), 'dd/MM/yyyy') : 'Not specified'}
    - Travelers: ${trip?.num_adults || 1} adults, ${trip?.num_children || 0} children
    - Trip Type: ${trip?.trip_type || 'Not specified'}
    - Budget Range: $${trip?.budget_min || 0} - $${trip?.budget_max || 0}
    
    Current Itinerary Status:
    ${itinerary.length ? `The trip has ${itinerary.length} days planned` : 'No detailed itinerary has been created yet'}
    `;
    
    const conversationHistory = messages
      .slice(-5)
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');
      
    return `${basePrompt}
    
    ${tripContext}
    
    Recent Conversation:
    ${conversationHistory}
    
    User Query: ${userQuery}
    
    Respond in Hebrew. If the user is asking for recommendations or changes to the itinerary, provide specific suggestions.
    If suggesting changes to the itinerary (new activities, hotels, etc.), also include a structured section at the end in this format:
    
    ITINERARY_EDIT:
    {
      "day": [day number],
      "action": "add OR update OR delete",
      "activity": {
        "time": "HH:MM",
        "title": "Activity title",
        "description": "Description",
        "category": "flight OR hotel OR restaurant OR attraction OR transport OR other",
        "location": {
          "name": "Location name",
          "address": "Address"
        },
        "price": price in USD
      }
    }
    
    Keep your answer friendly, informative and to the point. Provide useful details that a traveler would need.`;
  };

  const processAIResponse = (response) => {
    const editMatch = response.match(/ITINERARY_EDIT:\s*(\{[\s\S]*\})/);
    
    if (editMatch) {
      try {
        const content = response.replace(/ITINERARY_EDIT:\s*(\{[\s\S]*\})/, '').trim();
        const editData = JSON.parse(editMatch[1]);
        
        return {
          type: 'edit',
          content: content,
          editData: editData,
          itineraryChanges: editData
        };
      } catch (error) {
        console.error("Error parsing itinerary edit data:", error);
      }
    }
    
    if (response.includes("אפשרות 1:") && (response.includes("אפשרות 2:") || response.includes("אפשרות 3:"))) {
      const options = [];
      const optionMatches = response.matchAll(/אפשרות (\d+):([\s\S]*?)(?=אפשרות \d+:|$)/g);
      
      for (const match of optionMatches) {
        options.push({
          number: match[1],
          text: match[2].trim()
        });
      }
      
      if (options.length > 0) {
        return {
          type: 'suggestion',
          content: "הנה כמה אפשרויות שעשויות להתאים לך:",
          suggestionData: { options }
        };
      }
    }
    
    return {
      type: 'text',
      content: response
    };
  };

  const handleSuggestionClick = (suggestion) => {
    setNewMessage(suggestion);
  };

  const renderMessage = (message) => {
    const isUser = message.sender_id === user?.id;
    const isAI = message.sender_id === 'ai';
    const isSystem = message.sender_id === 'system';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isUser && (
          <Avatar className="h-8 w-8 mr-2">
            {isAI && <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>}
            {isSystem && <AvatarFallback><MessageSquare className="h-4 w-4" /></AvatarFallback>}
            {!isAI && !isSystem && (
              <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
            )}
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground' : isSystem ? 'bg-muted' : 'bg-accent'} rounded-lg p-3`}>
          <div className="text-sm font-medium mb-1">{message.sender_name}</div>
          
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          
          {message.message_type === 'suggestion' && message.suggestion_data?.questions && (
            <div className="mt-3 space-y-2">
              {message.suggestion_data.questions.map((question, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleSuggestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}
          
          {message.message_type === 'suggestion' && message.suggestion_data?.options && (
            <div className="mt-3 space-y-2">
              {message.suggestion_data.options.map((option, i) => (
                <Card key={i} className="p-3 cursor-pointer hover:bg-accent/80 transition-colors">
                  <CardContent className="p-0">
                    <div className="font-medium mb-1">אפשרות {option.number}</div>
                    <div className="text-sm">{option.text}</div>
                    
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSuggestionClick(`אני בוחר באפשרות ${option.number}`)}
                      >
                        בחר אפשרות זו
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {message.message_type === 'edit' && message.edit_data && (
            <div className="mt-3 bg-background text-foreground p-2 rounded-md">
              <div className="font-medium mb-1 flex items-center">
                <ListPlus className="h-4 w-4 mr-1" />
                שינויים מוצעים למסלול
              </div>
              
              <div className="text-sm">
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">יום {message.edit_data.day}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {message.edit_data.action === 'add' ? 'הוספה' : 
                     message.edit_data.action === 'update' ? 'עדכון' : 'מחיקה'}
                  </span>
                </div>
                
                {message.edit_data.activity && (
                  <div className="mt-2 space-y-1">
                    <div className="font-medium">{message.edit_data.activity.title}</div>
                    <div className="text-xs text-muted-foreground">{message.edit_data.activity.description}</div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {message.edit_data.activity.time && (
                        <span className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {message.edit_data.activity.time}
                        </span>
                      )}
                      
                      {message.edit_data.activity.location?.name && (
                        <span className="flex items-center text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {message.edit_data.activity.location.name}
                        </span>
                      )}
                      
                      {message.edit_data.activity.price && (
                        <span className="flex items-center text-xs">
                          <span>${message.edit_data.activity.price}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      handleSuggestionClick('כן, עדכן את המסלול עם השינויים שהצעת');
                    }}
                  >
                    אשר שינויים
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isUser && (
          <Avatar className="h-8 w-8 ml-2">
            <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };
  const [inputMessage, setInputMessage] = useState('');


  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">יש להתחבר כדי להשתמש בצ'אט</h3>
          <p className="text-muted-foreground mb-4">
            התחבר כדי לקבל המלצות מותאמות אישיות ולשוחח עם העוזר שלנו
          </p>
          <Button onClick={() => User.login()} className="gap-2">
            <LogIn className="h-4 w-4" />
            התחבר
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh]">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  rounded-lg p-4 max-w-[80%] shadow-sm
                  ${message.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground ml-4'
                    : 'bg-muted'
                  }
                `}
              >
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="הקלד הודעה..."
            className="text-lg"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
