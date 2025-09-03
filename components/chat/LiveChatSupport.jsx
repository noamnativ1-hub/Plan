import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InvokeLLM } from '@/api/integrations';
import { MessageSquare, Send, X, Loader2, Bot, User, MessageCircle, PhoneCall } from 'lucide-react';

const UserMessage = ({ message }) => (
  <div className="flex justify-end mb-4">
    <div className="bg-blue-600 text-white rounded-lg py-2 px-4 max-w-[80%]">
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

const AIMessage = ({ message, loading }) => (
  <div className="flex mb-4">
    <div className="flex items-start gap-2">
      <div className="bg-gray-100 rounded-full p-1.5 flex-shrink-0">
        <Bot className="h-3.5 w-3.5 text-blue-600" />
      </div>
      <div className="bg-muted rounded-lg py-2 px-4 max-w-[80%]">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        )}
      </div>
    </div>
  </div>
);

const AgentMessage = ({ message, agent }) => (
  <div className="flex mb-4">
    <div className="flex items-start gap-2">
      <div className="bg-blue-100 rounded-full p-1.5 flex-shrink-0">
        <User className="h-3.5 w-3.5 text-blue-600" />
      </div>
      <div>
        <div className="bg-muted rounded-lg py-2 px-4">
          <p className="text-xs font-semibold mb-1 text-blue-600">{agent}</p>
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  </div>
);

const commonQuestions = [
  "איך אני מזמין טיול?",
  "האם ניתן לבטל הזמנה?",
  "האם יש המלצות למשפחות עם ילדים?",
  "האם אפשר לשלם בתשלומים?",
  "מה החבילה כוללת?"
];

export default function LiveChatSupport({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bot');
  const [agentStatus, setAgentStatus] = useState('connecting');
  const [availableAgents, setAvailableAgents] = useState([
    { id: 1, name: "מיכל", status: "online", expertise: "טיולי משפחות" },
    { id: 2, name: "יוסי", status: "online", expertise: "יעדים אקזוטיים" },
    { id: 3, name: "דנה", status: "busy", expertise: "טיולי אירופה" }
  ]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize with a welcome message
      setMessages([
        { 
          sender: 'ai', 
          content: `שלום! אני העוזר הדיגיטלי של PlanGo. כיצד אוכל לעזור לך היום?
          
אתה יכול לשאול אותי על:
• תכנון הטיול שלך
• יעדים מומלצים
• טיפים לחופשה מוצלחת
• מידע על הזמנות

או לבחור אחת מהשאלות הנפוצות למטה.` 
        }
      ]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate agent connection after a few seconds in agent tab
  useEffect(() => {
    if (activeTab === 'agent' && agentStatus === 'connecting') {
      const timer = setTimeout(() => {
        setAgentStatus('searching');
        
        setTimeout(() => {
          const agent = availableAgents.find(a => a.status === 'online');
          setSelectedAgent(agent);
          setAgentStatus('connected');
          
          // Add agent greeting
          setMessages(prev => [
            ...prev,
            { 
              sender: 'agent', 
              content: `שלום, אני ${agent.name}. אני מומחה ל${agent.expertise}. איך אוכל לעזור לך היום?`,
              agent: agent.name
            }
          ]);
        }, 2000);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, agentStatus]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    const userMessage = currentMessage;
    setMessages(prev => [...prev, { sender: 'user', content: userMessage }]);
    setCurrentMessage('');
    setIsLoading(true);
    
    try {
      if (activeTab === 'bot') {
        // Bot response using AI
        const response = await InvokeLLM({
          prompt: `
You are a helpful travel assistant for PlanGo, a travel planning platform. The user has asked:

"${userMessage}"

Respond helpfully and briefly in Hebrew. Focus on providing practical travel information and assistance.
If you don't know the answer, suggest the user to contact a human agent.
Keep your response under 150 words.
          `,
        });
        
        setMessages(prev => [...prev, { sender: 'ai', content: response }]);
      } else if (activeTab === 'agent' && agentStatus === 'connected') {
        // Simulate agent response
        setTimeout(() => {
          let agentResponse = "";
          
          if (userMessage.includes("מחיר") || userMessage.includes("עלות") || userMessage.includes("כמה")) {
            agentResponse = "המחירים משתנים לפי תאריכים ומספר הנוסעים. אשמח לעזור לך לקבל הצעה מותאמת אישית. האם יש לך תאריכים ספציפיים בהם אתה מעוניין לטייל?";
          } else if (userMessage.includes("ביטול") || userMessage.includes("לבטל")) {
            agentResponse = "ניתן לבטל הזמנות עד 30 יום לפני מועד היציאה ולקבל החזר מלא. ביטולים מאוחרים יותר כפופים לתנאי הביטול המפורטים. האם אתה מעוניין לבטל הזמנה קיימת?";
          } else if (userMessage.includes("המלצה") || userMessage.includes("כדאי")) {
            agentResponse = "אשמח להמליץ! בתקופה זו, יוון ואיטליה הם יעדים מצוינים למשפחות. יש לנו גם חבילות אטרקטיביות לתאילנד. איזה סוג של חופשה תעדיפו?";
          } else {
            agentResponse = "תודה על השאלה. אשמח לעזור לך בנושא זה. האם תוכל לספק עוד פרטים כדי שאוכל לתת לך מענה מדויק יותר?";
          }
          
          setMessages(prev => [
            ...prev, 
            { 
              sender: 'agent', 
              content: agentResponse,
              agent: selectedAgent.name
            }
          ]);
          setIsLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        content: 'מצטער, נתקלתי בבעיה. האם תוכל לנסות שוב?' 
      }]);
    } finally {
      if (activeTab === 'bot') {
        setIsLoading(false);
      }
    }
  };

  const handleQuickQuestion = (question) => {
    setMessages(prev => [...prev, { sender: 'user', content: question }]);
    setIsLoading(true);
    
    // Simulate response for quick questions
    setTimeout(() => {
      let answer = "";
      
      switch (question) {
        case "איך אני מזמין טיול?":
          answer = "להזמנת טיול, עליך לבחור יעד, תאריכים ומספר נוסעים. אחרי שתבחר את החבילה המתאימה, תוכל לבצע את ההזמנה והתשלום באתר. אם יש לך שאלות נוספות או זקוק לעזרה במהלך התהליך, צוות השירות שלנו זמין לעזור.";
          break;
        case "האם ניתן לבטל הזמנה?":
          answer = "כן, ניתן לבטל הזמנות. הביטול כפוף למדיניות הביטול שלנו: עד 30 יום לפני היציאה - החזר מלא, 15-29 יום - החזר של 75%, 7-14 יום - החזר של 50%, פחות מ-7 ימים - ללא החזר. אם רכשת ביטוח ביטול, ייתכן שתהיה זכאי להחזר גדול יותר.";
          break;
        case "האם יש המלצות למשפחות עם ילדים?":
          answer = "בהחלט! אנו ממליצים על יעדים כמו אילת, יוון, ואיטליה למשפחות. חבילות המשפחה שלנו כוללות מלונות ידידותיים לילדים, פעילויות מותאמות לגילאים שונים והנחות לילדים. אשמח להמליץ על חבילה ספציפית בהתאם לגיל הילדים והעדפות המשפחה.";
          break;
        case "האם אפשר לשלם בתשלומים?":
          answer = "כן, אנו מציעים אפשרות לתשלום בעד 12 תשלומים ללא ריבית בכרטיסי אשראי נבחרים. לחבילות יקרות יותר, ניתן לשלם 30% מקדמה ואת היתרה עד 30 יום לפני מועד היציאה. דבר עם נציג שירות לפרטים נוספים.";
          break;
        case "מה החבילה כוללת?":
          answer = "החבילות שלנו משתנות, אך בדרך כלל הן כוללות טיסות הלוך ושוב, העברות משדה התעופה, לינה במלון, וארוחות בוקר. חבילות מסוימות כוללות גם סיורים מודרכים, פעילויות, וארוחות נוספות. פרטים מדויקים מופיעים בתיאור כל חבילה באתר.";
          break;
        default:
          answer = "אני מצטער, לא הצלחתי למצוא תשובה לשאלה זו. האם תרצה לשוחח עם נציג שירות לקוחות?";
      }
      
      setMessages(prev => [...prev, { sender: 'ai', content: answer }]);
      setIsLoading(false);
    }, 1500);
  };

  const switchToAgent = () => {
    setActiveTab('agent');
    setAgentStatus('connecting');
    
    // Add system message about connecting to agent
    setMessages(prev => [
      ...prev,
      { sender: 'system', content: 'מחבר אותך לנציג, אנא המתן...' }
    ]);
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 md:w-[400px] bg-background border-l z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b bg-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {activeTab === 'bot' ? 'עוזר דיגיטלי' : 'צ׳אט עם נציג'}
              {activeTab === 'agent' && agentStatus === 'connected' && (
                <Badge variant="outline" className="bg-green-500 text-white border-none ml-2">
                  פעיל
                </Badge>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-blue-700">
                  <TabsTrigger value="bot" className="data-[state=active]:bg-blue-500 text-white data-[state=active]:text-white">
                    בוט
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="data-[state=active]:bg-blue-500 text-white data-[state=active]:text-white">
                    נציג
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-blue-700">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <Tabs value={activeTab}>
            <TabsContent value="bot" className="mt-0">
              {messages.filter(m => m.sender !== 'agent').map((message, index) => (
                message.sender === 'user' ? (
                  <UserMessage key={index} message={message.content} />
                ) : message.sender === 'ai' ? (
                  <AIMessage key={index} message={message.content} loading={false} />
                ) : null
              ))}
              {isLoading && activeTab === 'bot' && <AIMessage loading={true} />}
            </TabsContent>
            
            <TabsContent value="agent" className="mt-0">
              {/* Agent status messages */}
              {agentStatus === 'connecting' && (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-muted-foreground">מתחבר למערכת הצ'אט...</p>
                </div>
              )}
              
              {agentStatus === 'searching' && (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-muted-foreground">מחפש נציג זמין...</p>
                </div>
              )}
              
              {/* Agent chat messages */}
              {messages.map((message, index) => (
                message.sender === 'user' ? (
                  <UserMessage key={index} message={message.content} />
                ) : message.sender === 'agent' ? (
                  <AgentMessage key={index} message={message.content} agent={message.agent} />
                ) : message.sender === 'system' ? (
                  <div key={index} className="text-center my-4">
                    <p className="text-xs bg-muted inline-block py-1 px-3 rounded-full text-muted-foreground">
                      {message.content}
                    </p>
                  </div>
                ) : null
              ))}
              {isLoading && activeTab === 'agent' && agentStatus === 'connected' && (
                <div className="flex mb-4">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-100 rounded-full p-1.5 flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="bg-muted rounded-lg py-2 px-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        {/* Quick questions (bot tab only) */}
        {activeTab === 'bot' && (
          <div className="p-4 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">שאלות נפוצות</p>
            <div className="flex flex-wrap gap-2">
              {commonQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact options (agent tab only) */}
        {activeTab === 'agent' && agentStatus !== 'connected' && (
          <div className="p-4 border-t">
            <p className="text-sm font-medium mb-3">נציגי שירות זמינים:</p>
            {availableAgents.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg mb-2 border">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-xs text-muted-foreground">({agent.expertise})</span>
                </div>
                {agent.status === 'online' ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex gap-1 items-center text-xs"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setAgentStatus('connected');
                      setMessages(prev => [
                        ...prev,
                        { 
                          sender: 'agent', 
                          content: `שלום, אני ${agent.name}. אני מומחה ל${agent.expertise}. איך אוכל לעזור לך היום?`,
                          agent: agent.name
                        }
                      ]);
                    }}
                  >
                    <MessageCircle className="h-3 w-3" />
                    שוחח
                  </Button>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                    עסוק
                  </Badge>
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <h4 className="font-medium text-sm">רוצה לדבר בטלפון?</h4>
                <p className="text-xs text-muted-foreground">צוות התמיכה שלנו זמין 24/7</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <PhoneCall className="h-3.5 w-3.5" />
                התקשר
              </Button>
            </div>
          </div>
        )}
        
        {/* Input form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          {(activeTab === 'bot' || (activeTab === 'agent' && agentStatus === 'connected')) && (
            <div className="flex gap-2">
              <Input
                placeholder={activeTab === 'bot' ? "שאל את הבוט..." : "שלח הודעה לנציג..."}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                disabled={isLoading || (activeTab === 'agent' && agentStatus !== 'connected')}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !currentMessage.trim() || (activeTab === 'agent' && agentStatus !== 'connected')}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {activeTab === 'bot' && (
            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs text-muted-foreground"
                onClick={switchToAgent}
              >
                רוצה לדבר עם נציג אנושי?
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}