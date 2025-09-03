import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { InvokeLLM } from '@/api/integrations';
import { Send, Loader2 } from 'lucide-react';

export default function GeneralTripChat({ tripDetails, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // שליחת הודעת פתיחה
    initChat();
  }, []);

  useEffect(() => {
    // גלילה לתחתית הצ'אט בכל הודעה חדשה
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initChat = async () => {
    const greeting = `
שלום! אני העוזר האישי שלך לתכנון הטיול ל${tripDetails.destination}.
אשמח לעזור לך בכל שאלה או בקשה לשינויים בתכנית הטיול.

למשל, אתה יכול לשאול:
• להוסיף יום לטיול
• לשנות את סדר הפעילויות
• להמליץ על מסעדות נוספות
• לקבל טיפים מקומיים
• ועוד...

במה אוכל לעזור?`;

    setMessages([
      { role: 'assistant', content: greeting }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    try {
      setLoading(true);
      const userMessage = inputValue.trim();
      setInputValue('');

      // הוספת הודעת המשתמש לצ'אט
      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage }
      ];
      setMessages(newMessages);

      // קבלת תשובה מה-AI
      const response = await InvokeLLM({
        prompt: `
אתה עוזר אישי לתכנון טיולים. המשתמש מתכנן טיול ל${tripDetails.destination}.

פרטי הטיול:
- יעד: ${tripDetails.destination}
- תאריכים: ${tripDetails.start_date} עד ${tripDetails.end_date}
- מספר נוסעים: ${tripDetails.num_adults} מבוגרים, ${tripDetails.num_children} ילדים
- תקציב: ${tripDetails.budget_min}-${tripDetails.budget_max}
- סגנון: ${tripDetails.trip_type}

היסטוריית השיחה:
${newMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

ענה בצורה מקצועית, ידידותית ומפורטת. התייחס לפרטי הטיול הספציפיים ותן תשובות מותאמות אישית.
השתמש ב-1-2 אימוג'ים מתאימים.
`,
        add_context_from_internet: true
      });

      // הוספת תשובת ה-AI לצ'אט
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response }
      ]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'מצטער, אירעה שגיאה. אנא נסה שוב.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white">
      <div className="pb-4">
        <h2 className="text-xl font-bold text-gray-900">עוזר אישי לתכנון הטיול</h2>
        <p className="text-sm text-gray-600">
          טיול ל: <Badge variant="outline">{tripDetails.destination}</Badge>
        </p>
      </div>

      <ScrollArea className="flex-1 p-4 border rounded-md mb-4 bg-gray-50">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'assistant'
                    ? 'bg-white border border-gray-200 text-gray-900'
                    : 'bg-blue-500 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="הקלד הודעה..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}