
import React, { useState, useEffect, useRef } from 'react';
import { SystemSettings } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { TripChat } from '@/api/entities';
import StyledChatInterface from './StyledChatInterface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export default function ChatContainer({ stage, tripData, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [maxQuestions] = useState(8); // Maximum AI questions is now 8
  const [planningStarted, setPlanningStarted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadPrompt();
  }, [stage]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const loadPrompt = async () => {
    try {
      const settings = await SystemSettings.list();
      const systemSettings = settings[0];
      
      let selectedPrompt;
      switch(stage) {
        case 'clarification':
          selectedPrompt = systemSettings?.clarificationPrompt || 
            "אתה עוזר תכנון נסיעות המסייע למשתמשים להבהיר את העדפות הטיול שלהם. שאל שאלות רלוונטיות כדי להבין טוב יותר איזה סוג טיול הם רוצים. היה שיחתי וידידותי. שאל שאלות פתוחות ומעמיקות, לא יותר מ-8 שאלות סך הכל. בדוק את המידע שכבר קיים בסקר ואל תשאל שוב על מידע שכבר יש ברשותך. כשתרגיש שיש לך מספיק מידע להתחיל בתכנון, סיים את השיחה באמירה: 'תודה ששיתפת אותי! עכשיו אני אתחיל לבנות לך את מסלול הטיול המושלם.'";
          break;
        case 'planning':
          selectedPrompt = systemSettings?.planningPrompt || 
            "אתה מומחה תכנון טיולים. עליך ליצור מסלול טיול מפורט על בסיס המידע שניתן. הכן תוכנית יום-אחר-יום עם אטרקציות, פעילויות, מסעדות והמלצות ספציפיות. ציין זמנים מומלצים לכל פעילות. התייחס לצרכים מיוחדים, העדפות והתאם את התוכנית לסוג הטיול המבוקש.";
          break;
        case 'post-planning':
          selectedPrompt = systemSettings?.postPlanningPrompt || 
            "אתה עוזר תכנון טיולים שמסייע למשתמשים לבצע שינויים ושיפורים בתוכנית הטיול שלהם. עזור למשתמשים לעדכן את המסלול, להחליף פעילויות או מקומות לינה, ולענות על שאלות נוספות. התייחס לכל המידע שנאסף בשלבים הקודמים. הצע אלטרנטיבות כשנדרש.";
          break;
      }
      
      setPrompt(selectedPrompt);
      
      // Load existing chat or start new conversation
      const existingChat = await TripChat.filter({ trip_id: tripData.id });
      if (existingChat && existingChat.length > 0) {
        const formattedMessages = existingChat.map(msg => ({
          id: msg.id,
          role: msg.sender_id === 'user' ? 'user' : 'assistant',
          content: msg.content,
          message_type: msg.message_type
        }));
        setMessages(formattedMessages);
        
        // Count how many AI questions have been asked (not just messages)
        const aiQuestions = formattedMessages.filter(msg => 
          msg.role === 'assistant' && 
          msg.content.includes('?')
        ).length;
        
        setQuestionCount(aiQuestions);
        
        if (aiQuestions >= maxQuestions || 
            existingChat.some(msg => msg.content.includes('תודה ששיתפת אותי!'))) {
          setPlanningStarted(true);
        }
      } else {
        // Start a new conversation
        startConversation(selectedPrompt);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (promptText) => {
    try {
      // Create a context object that will be available throughout the conversation
      const context = {
        destination: tripData.destination,
        dates: `${new Date(tripData.start_date).toLocaleDateString()} - ${new Date(tripData.end_date).toLocaleDateString()}`,
        travelers: `${tripData.num_adults} מבוגרים${tripData.num_children > 0 ? `, ${tripData.num_children} ילדים` : ''}`,
        budget: `$${tripData.budget_min} - $${tripData.budget_max}`,
        tripType: tripData.trip_type,
        preferences: Object.entries(tripData.preferences)
          .filter(([_, value]) => value)
          .map(([key]) => key.replace('include_', ''))
          .join(', '),
        notes: tripData.notes || ''
      };

      // Store context in localStorage for persistence
      localStorage.setItem(`trip_${tripData.id}_context`, JSON.stringify(context));

      const initialPrompt = `
      [CONTEXT]
      יעד: ${context.destination}
      תאריכים: ${context.dates}
      מטיילים: ${context.travelers}
      תקציב: ${context.budget}
      סוג טיול: ${context.tripType}
      העדפות: ${context.preferences}
      ${context.notes ? `הערות: ${context.notes}` : ''}
      [/CONTEXT]

      ${promptText}

      התייחס למידע בCONTEXT בתשובותיך ואל תשאל שאלות על מידע שכבר קיים שם.
      `;

      const response = await InvokeLLM({
        prompt: initialPrompt
      });
      
      // Add the initial AI message
      const aiMessage = {
        id: Date.now(),
        role: 'assistant',
        content: response
      };
      
      setMessages([aiMessage]);
      
      // Save the AI message to TripChat
      await TripChat.create({
        trip_id: tripData.id,
        sender_id: 'assistant',
        content: response,
        message_type: 'question',
        timestamp: new Date().toISOString()
      });

      // Check if the message contains a question and increment counter
      if (response.includes('?')) {
        setQuestionCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    // Add user message to UI
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: newMessage
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to TripChat
    await TripChat.create({
      trip_id: tripData.id,
      sender_id: 'user',
      content: newMessage,
      message_type: 'answer',
      timestamp: new Date().toISOString()
    });
    
    // Clear input
    setNewMessage('');
    
    try {
      setLoading(true);
      
      const context = JSON.parse(localStorage.getItem(`trip_${tripData.id}_context`));
      const contextPrompt = `
      [CONTEXT]
      יעד: ${context.destination}
      תאריכים: ${context.dates}
      מטיילים: ${context.travelers}
      תקציב: ${context.budget}
      סוג טיול: ${context.tripType}
      העדפות: ${context.preferences}
      ${context.notes ? `הערות: ${context.notes}` : ''}
      [/CONTEXT]

      שיחה עד כה:
      ${messages.map(m => `${m.role === 'assistant' ? 'AI' : 'משתמש'}: ${m.content}`).join('\n')}

      משתמש: ${newMessage}

      השתמש במידע מהCONTEXT בתשובתך. המשך את השיחה גם אם שאלת כבר 8 שאלות, אבל נסה להגיע למסקנות.
      `;

      const response = await InvokeLLM({
        prompt: contextPrompt
      });
      
      // Add AI message to UI
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI message to TripChat
      await TripChat.create({
        trip_id: tripData.id,
        sender_id: 'assistant',
        content: response,
        message_type: response.includes('?') ? 'question' : 'response',
        timestamp: new Date().toISOString()
      });
      
      // Check if this message contains a question
      if (response.includes('?')) {
        const newCount = questionCount + 1;
        setQuestionCount(newCount);
        
        // If reached max questions, trigger planning
        if (newCount >= maxQuestions && !planningStarted) {
          const finalMessage = {
            id: Date.now() + 2,
            role: 'assistant',
            content: 'תודה ששיתפת אותי! עכשיו אני אתחיל לבנות לך את מסלול הטיול המושלם.'
          };
          
          setTimeout(() => {
            setMessages(prev => [...prev, finalMessage]);
            
            // Save final message
            TripChat.create({
              trip_id: tripData.id,
              sender_id: 'assistant',
              content: finalMessage.content,
              message_type: 'system',
              timestamp: new Date().toISOString()
            });
            
            setPlanningStarted(true);
            
            // Notify parent component to move to planning phase
            if (onComplete) {
              setTimeout(() => onComplete(), 2000);
            }
          }, 1500);
        }
      }
      
      // Check if the response includes the closing statement
      if (response.includes('תודה ששיתפת אותי!') && !planningStarted) {
        setPlanningStarted(true);
        
        // Notify parent component to move to planning phase
        if (onComplete) {
          setTimeout(() => onComplete(), 2000);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'אירעה שגיאה בתקשורת. אנא נסה שוב.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        <StyledChatInterface 
          messages={messages} 
          onSendMessage={(msg) => {
            setNewMessage(msg);
            handleSendMessage();
          }}
          loading={loading} 
        />
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="הקלד הודעה..."
          disabled={loading || planningStarted}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || loading || planningStarted}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
