import React from 'react';
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Star, Info } from 'lucide-react';

export default function StyledChatInterface({ messages, onSendMessage, loading }) {
  const renderMessage = (message) => {
    const isAI = message.role === 'assistant';
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 mb-4",
          isAI ? "justify-start" : "justify-end"
        )}
      >
        {isAI && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>AI</AvatarFallback>
            <Bot className="h-5 w-5" />
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-lg p-4 max-w-[80%]",
            isAI ? "bg-[#F9F9F9] border border-[#E1E1E1]" : "bg-[#D3E4FF] text-right"
          )}
        >
          <p className="text-[14px] leading-[1.5] text-[#333333]">
            {message.content}
          </p>
          
          {message.options && (
            <div className="mt-3 space-y-2">
              {message.options.map((option, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  className="w-full justify-start text-left bg-white hover:bg-gray-50"
                  onClick={() => onSendMessage(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
          
          {message.suggestions && (
            <div className="mt-4 space-y-4">
              {message.suggestions.map((suggestion, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <img 
                    src={suggestion.image} 
                    alt={suggestion.title}
                    className="w-full h-[200px] object-cover"
                  />
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm">{suggestion.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>
                    <Button 
                      className="w-full bg-[#007BFF] hover:bg-blue-600 text-white"
                      onClick={() => onSendMessage(`בחרתי ב${suggestion.title}`)}
                    >
                      בחר אפשרות זו
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {message.type === 'info' && (
            <div className="mt-2 bg-[#E9F7FF] p-3 rounded-md flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
              <p className="text-sm">{message.info}</p>
            </div>
          )}
        </div>
        
        {!isAI && (
          <Avatar className="h-8 w-8">
            <AvatarFallback>ME</AvatarFallback>
            <AvatarImage src={message.userImage} />
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map(renderMessage)}
      </ScrollArea>
    </div>
  );
}