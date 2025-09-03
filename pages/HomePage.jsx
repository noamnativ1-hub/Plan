
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Plane, Hotel, MapPin, Calendar, Star } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage(); // Changed 'lang' to 'language'

  const heroImages = [
    "https://images.unsplash.com/photo-1682687982502-1529b3b33f85",
    "https://images.unsplash.com/photo-1682687220198-88e9bdea9931",
    "https://images.unsplash.com/photo-1682685796014-2f24761ea6c5"
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[90vh] md:h-[80vh] flex items-center overflow-hidden bg-gradient-to-r from-cyan-400 to-blue-500">
        <div className="absolute inset-0 z-0">
          <div className="relative h-full">
            {heroImages.map((image, index) => (
              <div
                key={index}
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${image}?auto=format&fit=crop&w=2000)`,
                  animation: `fade 15s infinite ${index * 5}s`
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        </div>

        {/* Curved shape decoration */}
        <div className="curved-shape w-[600px] h-[600px] bg-gradient-primary opacity-10 top-[-300px] right-[-100px] z-0"></div>
        <div className="curved-shape w-[400px] h-[400px] bg-blue-300 opacity-10 bottom-[-200px] left-[-200px] z-0"></div>

        <div className="container relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t('perfectTripWaiting')}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {t('smartPlatformDescription')}
            </p>
            
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl("PlanTrip"))}
              className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
            >
              {t('startPlanningTrip')}
              {language === 'he' ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fade {
          0%, 45%, 100% { opacity: 0; }
          15%, 30% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
