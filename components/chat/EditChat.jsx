
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { InvokeLLM } from '@/api/integrations';
import { Send, Loader2 } from 'lucide-react';

export default function EditChat({ item, tripDetails, onComplete, onCancel }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updatedItem, setUpdatedItem] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (item) {
      // Initialize chat with suggestion
      initChat();
    }
  }, [item]);

  useEffect(() => {
    // Scroll to bottom on new message
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initChat = async () => {
    try {
      setInitialLoading(true);
      
      // Create initial greeting based on item type
      let greeting = '';
      
      switch (item.type) {
        case 'flight':
          greeting = `אני רואה שאתה מעוניין לשנות את הטיסה "${item.title}".\n\nמה היית רוצה לשנות? אפשרויות כוללות:\n• חברת תעופה אחרת\n• זמני טיסה שונים\n• טיסה ישירה/עם עצירות\n\nאשמח לעזור לך למצוא אפשרות שתתאים יותר לצרכים שלך.`;
          break;
        case 'hotel':
          greeting = `אני רואה שאתה מעוניין לשנות את המלון "${item.title}".\n\nמה היית רוצה לשנות? אפשרויות כוללות:\n• מיקום (קרוב יותר למרכז/לים/לאטרקציות)\n• רמת המלון (יותר יוקרתי/חסכוני)\n• שירותים מיוחדים (בריכה/ספא/חדר כושר)\n\nאשמח לעזור לך למצוא אפשרות שתתאים יותר להעדפות שלך.`;
          break;
        case 'activity':
          greeting = `אני רואה שאתה מעוניין לשנות את האטרקציה "${item.title}".\n\nמה היית רוצה לשנות? אפשרויות כוללות:\n• סוג אחר של אטרקציה\n• יותר מתאים למשפחות/זוגות/יחידים\n• פחות עמוס תיירים\n• פעילות במחיר שונה\n\nאשמח להמליץ על אפשרויות חלופיות שיתאימו יותר להעדפות שלך.`;
          break;
        case 'restaurant':
          greeting = `אני רואה שאתה מעוניין לשנות את המסעדה "${item.title}".\n\nמה היית רוצה לשנות? אפשרויות כוללות:\n• סוג אחר של אוכל\n• מסעדה יותר יוקרתית/עממית\n• מיקום אחר\n• מסעדה עם אפשרויות דיאטטיות מיוחדות\n\nאשמח לעזור לך למצוא מסעדה שתתאים יותר לטעם שלך.`;
          break;
        case 'car':
          greeting = `אני רואה שאתה מעוניין לשנות את הרכב "${item.title}".\n\nמה היית רוצה לשנות? אפשרויות כוללות:\n• סוג אחר של רכב\n• חברת השכרה אחרת\n• מיקום איסוף/החזרה שונה\n• תוספות מיוחדות (GPS, כיסא תינוק, וכדומה)\n\nאשמח לעזור לך למצוא רכב שיתאים יותר לצרכים שלך.`;
          break;
        default:
          greeting = `אני רואה שאתה מעוניין לשנות את הפריט "${item.title}".\n\nמה בדיוק היית רוצה לשנות? אשמח לעזור לך למצוא אפשרות שתתאים יותר לצרכים והעדפות שלך.`;
      }
      
      setMessages([
        {
          role: 'assistant',
          content: greeting
        }
      ]);
      
      setInitialLoading(false);
    } catch (error) {
      console.error('Error initializing chat:', error);
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    
    try {
      setLoading(true);
      const userMessage = inputValue.trim();
      setInputValue('');
      
      // Add user message to chat
      const newMessages = [
        ...messages,
        { role: 'user', content: userMessage }
      ];
      setMessages(newMessages);
      
      // Get AI response
      const response = await InvokeLLM({
        prompt: `
אתה עוזר שינוי מרכיבי טיול חכם ומועיל, הדובר עברית טבעית וחמה.

יש למשתמש תכנון טיול ליעד: ${tripDetails?.destination || 'לא צוין'}.
המשתמש ביקש לשנות פריט בתוכנית הטיול מסוג: ${item.type}.

פרטי הפריט הנוכחי:
${JSON.stringify(item, null, 2)}

היסטוריית השיחה:
${newMessages.map(m => `${m.role === 'assistant' ? 'עוזר' : 'משתמש'}: ${m.content}`).join('\n')}

המטרה שלך היא לעזור למשתמש לשנות את הפריט בצורה שתענה על הצרכים שלו.

אם המשתמש נתן מספיק מידע, הצע אפשרות חלופית ספציפית וברורה. אחרת, שאל שאלות ממוקדות.

כשיש לך הצעה מלאה, כלול אותה במלואה ושאל אם המשתמש רוצה לשמור אותה.

אם המשתמש מאשר את ההצעה, סכם את השינויים שיתבצעו באופן ברור.

דבר בעברית טבעית וידידותית, השתמש ב-1-2 אימוג'ים מתאימים.
        `,
        add_context_from_internet: false
      });
      
      // Add AI response
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response }
      ]);
      
      // Check if the response contains a concrete suggestion and acceptance
      if (
        (response.includes('לשמור את השינוי') ||
         response.includes('לאשר את השינוי') ||
         response.includes('לעדכן את') ||
         response.includes('לשמור את ההצעה'))
        &&
        (userMessage.toLowerCase().includes('כן') ||
         userMessage.toLowerCase().includes('אשר') ||
         userMessage.toLowerCase().includes('מאשר') ||
         userMessage.toLowerCase().includes('בסדר') ||
         userMessage.toLowerCase().includes('מעולה') ||
         userMessage.toLowerCase().includes('מסכים'))
      ) {
        // Try to generate an updated item based on the conversation
        await createUpdatedItem();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUpdatedItem = async () => {
    try {
      setLoading(true);
      
      // Combine all messages for context
      const conversationContext = messages
        .map(m => `${m.role === 'assistant' ? 'עוזר' : 'משתמש'}: ${m.content}`)
        .join('\n');
      
      // Generate updated item based on conversation
      const response = await InvokeLLM({
        prompt: `
בהתבסס על השיחה הבאה, אנא צור גרסה מעודכנת של פריט הטיול.
המשתמש ביקש לשנות את הפריט ואישר את ההצעות שלך.

פריט מקורי:
${JSON.stringify(item, null, 2)}

השיחה:
${conversationContext}

אנא החזר JSON מלא של הפריט המעודכן, עם כל השדות מהמקור אבל עם השינויים שהוצעו.
השאר את ה-id ו-trip_id כמו במקור.
כלול תיאור משופר שמתאר את הפריט החדש.
הוסף שדה חדש: "updated: true" כדי לסמן שהפריט עודכן.
        `,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            ...Object.keys(item).reduce((obj, key) => {
              obj[key] = { type: typeof item[key] === 'object' ? 'object' : typeof item[key] };
              return obj;
            }, {}),
            updated: { type: "boolean" }
          }
        }
      });
      
      // Update the item
      setUpdatedItem(response);
      
      // Add final confirmation message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `מעולה! 🎉 עדכנתי את הפריט בהתאם להעדפות שלך.\n\nהשינויים העיקריים:\n• ${item.title} → ${response.title}\n\nלחץ על "שמור שינוי" כדי לעדכן את התכנון.`
        }
      ]);
      
    } catch (error) {
      console.error('Error creating updated item:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'אירעה שגיאה בעדכון הפריט. אנא נסה שוב או פנה לתמיכה.'
        }
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white">
      <div className="pb-4">
        <h2 className="text-xl font-bold text-gray-900">בקשת שינוי</h2>
        <p className="text-sm text-gray-600">
          פריט: <Badge variant="outline">{item.title}</Badge>
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
          disabled={loading || initialLoading || updatedItem !== null}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || loading || initialLoading || updatedItem !== null}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {updatedItem && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button onClick={() => onComplete(updatedItem)}>
            שמור שינוי
          </Button>
        </div>
      )}
    </div>
  );
}
