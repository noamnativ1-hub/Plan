
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trip } from '@/api/entities';
import { SystemSettings } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, Loader2, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea

export default function PlanningChat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const { t, language } = useLanguage();

  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For sending messages
  const [initialLoading, setInitialLoading] = useState(true); // For initial component load
  const [error, setError] = useState(null); // For initial loading errors
  const [systemPrompt, setSystemPrompt] = useState(''); // This might still be useful for the LLM prompt construction
  const [user, setUser] = useState(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null); // Ref for auto-focus

  useEffect(() => {
    const initChat = async () => {
      setInitialLoading(true);
      setError(null);

      try {
        const userData = await User.me();
        setUser(userData);

        if (!tripId) {
          setError(t('missingTripId'));
          return;
        }

        const tripData = await Trip.get(tripId);
        setTrip(tripData);

        const systemSettings = await SystemSettings.list();
        const settings = Array.isArray(systemSettings) && systemSettings.length > 0 ? systemSettings[0] : null;

        // Set the system prompt for later use in handleSendMessage
        if (settings?.clarificationPrompt) {
          setSystemPrompt(settings.clarificationPrompt);
        } else {
          setSystemPrompt(''); // Clear if not found
        }

        // הודעת הסבר מקדימה
        const introMessage = {
          role: 'assistant',
          content: language === 'he'
            ? `👋 ברוכים הבאים לשלב הבא!\n\n🎯 **המטרה שלנו:** להפוך את החופשה שלכם למותאמת בדיוק לטעמכם האישי.\n\n💬 **איך זה עובד:** אני אשאל אתכם כמה שאלות קצרות כדי להכיר אתכם טוב יותר.\n\n⚡ **רוצים לדלג?** בכל שלב אתם יכולים לכתוב "תתחיל לתכנן" ואני אתחיל לבנות את המסלול שלכם מיד!\n\n---\n\nבואו נתחיל! 😊`
            : `👋 Welcome to the next step!\n\n🎯 **Our Goal:** To make your vacation perfectly tailored to your personal taste.\n\n💬 **How it works:** I'll ask you a few short questions to get to know you better.\n\n⚡ **Want to skip?** At any stage you can write "start planning" and I'll begin building your itinerary right away!\n\n---\n\nLet's begin! 😊`
        };

        let initialAiMessage;

        if (settings?.clarificationPrompt) {
          try {
            const promptContent = settings.clarificationPrompt
                                              .replace(/\{destination\}/g, tripData.destination || '')
                                              .replace(/\{tripType\}/g, tripData.trip_type || '')
                                              .replace(/\{numAdults\}/g, (tripData.num_adults || 0).toString());

            const response = await InvokeLLM({ prompt: promptContent });

            initialAiMessage = {
              role: 'assistant',
              content: response
            };
          } catch (err) {
            console.error('Error getting AI clarification for initial message:', err);
            initialAiMessage = {
              role: 'assistant',
              content: t('welcomeChatFallback')
                .replace('{destination}', tripData.destination || t('unknown'))
                .replace('{tripType}', tripData.trip_type || t('unknown'))
                .replace('{numAdults}', (tripData.num_adults || 0).toString())
            };
          }
        } else {
          initialAiMessage = {
            role: 'assistant',
            content: t('welcomeChatFallback')
              .replace('{destination}', tripData.destination || t('unknown'))
              .replace('{tripType}', tripData.trip_type || t('unknown'))
              .replace('{numAdults}', (tripData.num_adults || 0).toString())
          };
        }

        // הגדר הודעות עם ההודעה המקדימה והשאלה הראשונה
        setMessages([introMessage, initialAiMessage]);

      } catch (err) {
        console.error('Error initializing chat:', err);
        setError(t('failedToLoadData'));
      } finally {
        setInitialLoading(false);
      }
    };

    initChat();
  }, [tripId, navigate, t, language]); // Added 'language' to dependencies

  useEffect(() => {
    // Scroll to bottom only when new messages are added, not on initial load
    // The condition messages.length > 1 means after the initial two messages are set
    if (messages.length > 1 && scrollAreaRef.current) {
        // A small timeout helps ensure the DOM is updated before scrolling
        setTimeout(() => {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Auto-focus input when not loading (either initial or message sending)
    if (!isLoading && !initialLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, initialLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = newMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      // Use the systemPrompt state variable set during initial load
      const fullPrompt = `${systemPrompt}\n\nפרטי הטיול:\n${JSON.stringify(trip, null, 2)}\n\nהיסטוריית שיחה:\n${conversationHistory}\n\nהודעה נוכחית של המשתמש: "${currentInput}"`;

      const aiResponseContent = await InvokeLLM({ prompt: fullPrompt });

      if (aiResponseContent && aiResponseContent.includes('[START_PLANNING]')) {
        setMessages(prev => [...prev, { role: 'assistant', content: t('startingToPlan') }]);
        await Trip.update(trip.id, { status: 'planning' });
        navigate(createPageUrl(`TripDetails?id=${trip.id}`));
      } else {
        const botMessage = { role: 'assistant', content: aiResponseContent };
        setMessages(prev => [...prev, botMessage]);
      }

    } catch (err) {
      console.error("Error in planning chat:", err);
      const errorMessage = { role: 'assistant', content: t('errorOccurred') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <Button onClick={() => navigate(createPageUrl('Trips'))}>
          {t('backToTrips')}
        </Button>
      </div>
    );
  }

  // Fallback in case trip is null after initialLoading is false and no error was set
  if (!trip) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('tripDataUnavailable')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t('finalizeTrip')}</h1>
            <p className="text-sm text-gray-500">{t('tripTo')} {trip.destination}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          <ScrollArea className="flex-1 mb-4" ref={scrollAreaRef}>
            <div className="space-y-4 pr-2">
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`p-3 rounded-2xl max-w-lg ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                   {msg.role === 'user' && user && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback><UserIcon className="w-5 h-5" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                   <Avatar className="w-8 h-8">
                      <AvatarFallback><Bot className="w-5 h-5" /></AvatarFallback>
                    </Avatar>
                  <div className="p-3 rounded-2xl bg-white border rounded-bl-none">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="mt-auto">
            <div className="relative">
              <Textarea
                ref={inputRef}
                placeholder={t('chatPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                className="pr-12 py-3 text-base resize-none"
                rows={1}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                disabled={isLoading || initialLoading} // Disable input during initial load as well
              />
              <Button
                size="icon"
                className="absolute left-3 top-3 rounded-full"
                onClick={handleSendMessage}
                disabled={isLoading || initialLoading || !input.trim()} // Disable send button during initial load
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
