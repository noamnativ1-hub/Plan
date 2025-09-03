
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { TripChat } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Send, ArrowRight, Loader2 } from 'lucide-react';

export default function PlanningChat({ tripData }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [userResponseCount, setUserResponseCount] = useState(0);
  const MAX_USER_RESPONSES = 8;
  const [sending, setSending] = useState(false);
  const tripId = tripData?.id;

  useEffect(() => {
    initChat();
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initChat = async () => {
    try {
      // Get current user
      const userData = await User.me();
      setUser(userData);

      // Create initial greeting using trip data
      const initialGreeting = `היי${userData ? ' ' + userData.full_name : ''}! 👋

ראיתי את הפרטים שמילאת על הטיול ${tripData ? 'ל' + tripData.destination : ''}.

הנה סיכום קצר של מה שבחרת:
${formatTripSummary(tripData)}

בוא/י נדייק את הפרטים כדי להתאים את הטיול בדיוק בשבילך! 🎯

מה הכי חשוב לך בטיול הזה?`;

      setMessages([{
        role: 'assistant',
        content: initialGreeting,
        id: Date.now()
      }]);
    } catch (err) {
      console.error('Error initializing chat:', err);
      setError('אירעה שגיאה בטעינת הצ\'אט');
    }
  };

  const formatTripSummary = (tripData) => {
    if (!tripData) return '';
    
    const summary = [
      `📍 יעד: ${tripData.destination}`,
      `📅 תאריכים: ${format(new Date(tripData.start_date), 'dd/MM/yyyy')} - ${format(new Date(tripData.end_date), 'dd/MM/yyyy')}`,
      `👥 נוסעים: ${tripData.num_adults} מבוגרים${tripData.num_children > 0 ? `, ${tripData.num_children} ילדים` : ''}`,
      `💰 תקציב: $${tripData.budget_min.toLocaleString()} - $${tripData.budget_max.toLocaleString()}`,
      `✨ סגנון: ${tripData.trip_type}`,
    ];

    // הוספת העדפות אם קיימות
    const preferences = [];
    if (tripData.preferences) {
      if (tripData.preferences.include_flights) preferences.push('טיסות');
      if (tripData.preferences.include_hotels) preferences.push('מלונות');
      if (tripData.preferences.include_cars) preferences.push('השכרת רכב');
      if (tripData.preferences.include_activities) preferences.push('אטרקציות');
      if (tripData.preferences.include_restaurants) preferences.push('מסעדות');
    }
    if (preferences.length > 0) {
      summary.push(`🎯 העדפות: ${preferences.join(', ')}`);
    }

    return summary.join('\n');
  };

  const navigateToTripDetails = () => {
    // FIX: ensure we use the right URL format for trip details
    navigate(createPageUrl('TripDetails') + `?id=${tripId}`);
    
    // Log details for debugging
    console.log('Navigating to TripDetails with tripId:', tripId);
    console.log('Navigation URL:', createPageUrl('TripDetails') + `?id=${tripId}`);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    try {
      setSending(true);
      const userMessage = inputValue.trim();
      setInputValue('');

      // Add user message to chat
      const newUserMessage = {
        role: 'user',
        content: userMessage,
        id: Date.now()
      };
      
      setMessages(prev => [...prev, newUserMessage]);

      // Increment response counter only if responding to AI question
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant' && lastMessage.content.includes('?')) {
        setUserResponseCount(prev => prev + 1);
      }

      // Save to database
      await TripChat.create({
        trip_id: tripId,
        sender_id: user?.id || 'anonymous',
        sender_name: user?.full_name || 'אורח',
        message_type: 'text',
        content: userMessage,
        timestamp: new Date().toISOString()
      });

      // Check if we reached max responses
      if (userResponseCount >= MAX_USER_RESPONSES - 1) {
        // Send final message and redirect
        const finalMessage = {
          role: 'assistant',
          content: 'תודה רבה! קיבלתי את כל המידע שהייתי צריך. 🎯\n\nאני מעביר אותך כעת לדף התכנון המפורט של הטיול שלך! ✨',
          id: Date.now() + 1
        };
        
        setMessages(prev => [...prev, finalMessage]);
        
        await TripChat.create({
          trip_id: tripId,
          sender_id: 'system',
          sender_name: 'מערכת',
          message_type: 'text',
          content: finalMessage.content,
          timestamp: new Date().toISOString()
        });

        // Wait 2 seconds then navigate to trip details
        setTimeout(() => {
          navigate(createPageUrl('TripDetails') + `?id=${tripId}`);
        }, 2000);
        
        return;
      }

      // Check if user wants to proceed to planning
      if (userMessage.includes('לתכנון') || 
          userMessage.includes('לסיים') ||
          userMessage.includes('לעבור') ||
          userMessage.includes('לראות את התוכנית')) {
        
        // Save message before navigation
        await TripChat.create({
          trip_id: tripId,
          sender_id: user?.id || 'anonymous',
          sender_name: user?.full_name || 'אורח',
          message_type: 'text',
          content: userMessage,
          timestamp: new Date().toISOString()
        });
        
        // FIX: Add final message
        const finalMessage = {
          role: 'assistant',
          content: 'מעולה! אני מעביר אותך כעת לדף התכנון המפורט של הטיול שלך! ✨',
          id: Date.now()
        };
        
        setMessages(prev => [...prev, newUserMessage, finalMessage]);
        
        // Save final message
        await TripChat.create({
          trip_id: tripId,
          sender_id: 'system',
          sender_name: 'מערכת',
          message_type: 'text',
          content: finalMessage.content,
          timestamp: new Date().toISOString()
        });
        
        // Small delay for user to see the message
        setTimeout(() => {
          navigateToTripDetails();
        }, 1500);
        
        return;
      }

      // Get AI response
      const response = await InvokeLLM({
        prompt: `
[מערכת] אתה עוזר תכנון טיולים מקצועי ואדיב. עליך:
1. לדבר בעברית טבעית
2. להתייחס לפרטי הטיול שכבר ידועים
3. לשאול שאלה אחת בכל פעם
4. להשתמש ב-1-2 אימוג'ים מתאימים
5. לסכם ולאשר פרטים חשובים

פרטי הטיול הנוכחי:
${formatTripSummary(tripData)}

היסטוריית השיחה:
${messages.map(m => `${m.role === 'assistant' ? 'עוזר' : 'משתמש'}: ${m.content}`).join('\n')}

ההודעה החדשה מהמשתמש: ${userMessage}

השב בקצרה (2-3 משפטים) והמשך לשאול שאלות עד שיש לך את כל המידע הדרוש לתכנון.`,
        add_context_from_internet: false
      });

      // Add AI response to chat
      const newAssistantMessage = {
        role: 'assistant',
        content: response,
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, newAssistantMessage]);

      // Save AI response to database
      await TripChat.create({
        trip_id: tripData.id,
        sender_id: 'system',
        sender_name: 'מערכת',
        content: response,
        message_type: 'text',
        timestamp: new Date().toISOString()
      });

      // Check if planning is complete
      if (response.toLowerCase().includes('מוכן לתכנון') || 
          response.toLowerCase().includes('אפשר להתחיל בתכנון') ||
          response.toLowerCase().includes('יש לי את כל הפרטים')) {
        // Navigate to trip details page
        navigate(createPageUrl('TripDetails') + `?id=${tripData.id}`);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setError('אירעה שגיאה בשליחת ההודעה');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[80vh] flex flex-col bg-white rounded-lg shadow-lg p-4">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'assistant'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t pt-4 mt-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="כתוב את תשובתך כאן..."
            disabled={loading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || !inputValue.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
