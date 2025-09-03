import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { BadgeCheck } from 'lucide-react';

export default function FeaturedBloggers() {
  const navigate = useNavigate();

  const bloggers = [
    {
      id: 1,
      name: "תמר לוינסון",
      image: "https://images.unsplash.com/photo-1616002411355-49593fd89721?auto=format&fit=crop&w=250&q=80",
      trips: 12,
      followers: 5300,
      featured: true,
      specialty: "אסיה ואפריקה"
    },
    {
      id: 2,
      name: "יובל כהן",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
      trips: 8,
      followers: 3200,
      specialty: "קולינריה ויין"
    },
    {
      id: 3,
      name: "מיכל ברק",
      image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=250&q=80",
      trips: 15,
      followers: 7800,
      featured: true,
      specialty: "טיולי משפחות"
    },
    {
      id: 4,
      name: "עומר אדלר",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80",
      trips: 21,
      followers: 9400,
      featured: true,
      specialty: "הרפתקאות ותרמילאות"
    },
    {
      id: 5,
      name: "נועה שמיר",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80",
      trips: 10,
      followers: 4200,
      specialty: "אירופה ויעדים לזוגות"
    }
  ];

  const handleViewBlogger = (bloggerId) => {
    navigate(createPageUrl("TripDetailsSample") + "?id=" + (100 + bloggerId) + "&blogger=true");
  };

  return (
    <div className="grid grid-cols-5 gap-6">
      {bloggers.map((blogger, index) => (
        <div key={blogger.id} className="transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer" onClick={() => handleViewBlogger(blogger.id)}>
          <div className={`
            relative rounded-2xl overflow-hidden border shadow-sm mb-3 
            ${index === 0 ? "col-span-2 row-span-2" : ""}
          `}>
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img 
                src={blogger.image} 
                alt={blogger.name}
                className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-1.5 mb-1">
                  {blogger.featured && (
                    <BadgeCheck className="h-4 w-4 text-blue-400" />
                  )}
                  <h3 className="font-semibold">{blogger.name}</h3>
                </div>
                <p className="text-sm text-white/80">{blogger.specialty}</p>
                <p className="text-xs mt-0.5 text-white/60">{blogger.followers.toLocaleString()} עוקבים</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}