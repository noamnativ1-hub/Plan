import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Hotel, Utensils, Mountain, Sun, Star, Repeat } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const destinations = [
  { name: 'Paris', icon: <Star className="h-16 w-16" /> },
  { name: 'Tokyo', icon: <Mountain className="h-16 w-16" /> },
  { name: 'Santorini', icon: <Sun className="h-16 w-16" /> },
  { name: 'Rome', icon: <Utensils className="h-16 w-16" /> },
  { name: 'New York', icon: <Hotel className="h-16 w-16" /> },
];

export default function TripPlanningAnimation({ mode = 'initial', isActive, onComplete }) {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);

  const initialSteps = language === 'he' ? [
    `מנתח את העדפותיך...`,
    `מחפש את הטיסות הטובות ביותר...`,
    `מוצא מלונות מפנקים...`,
    `מגלה אטרקציות נסתרות...`,
    `מתכנן מסלול יומי...`,
    `מסיים את הנגיעות האחרונות...`
  ] : [
    `Analyzing your preferences...`,
    `Finding the best flights...`,
    `Discovering great hotels...`,
    `Exploring hidden attractions...`,
    `Creating daily itinerary...`,
    `Adding final touches...`
  ];

  const replanSteps = language === 'he' ? [
    `מבין את השינויים שביקשת...`,
    `מעדכן את פרטי הטיסה/מלון...`,
    `בונה מחדש את המסלול היומי...`,
    `מבצע התאמות לוגיסטיות...`,
    `מוודא שהכל עדיין מושלם...`,
    `כמעט סיימתי...`
  ] : [
    `Understanding your requested changes...`,
    `Updating flight/hotel details...`,
    `Rebuilding daily itinerary...`,
    `Making logistical adjustments...`,
    `Ensuring everything is perfect...`,
    `Almost finished...`
  ];

  const planningSteps = mode === 'replan' ? replanSteps : initialSteps;
  const title = mode === 'replan' 
    ? (language === 'he' ? "מתכנן עבורך את השינויים..." : "Planning your changes...")
    : (language === 'he' ? "אני מתכנן את הטיול המושלם עבורך..." : "Planning the perfect trip for you...");
  const mainIcon = mode === 'replan' ? <Repeat className="h-24 w-24 text-green-500" /> : <Plane className="h-24 w-24 text-blue-500" />;

  useEffect(() => {
    if (isActive) {
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % planningSteps.length);
      }, 2500);

      const destinationInterval = setInterval(() => {
        setCurrentDestinationIndex(prev => (prev + 1) % destinations.length);
      }, 3000);
      
      return () => {
        clearInterval(stepInterval);
        clearInterval(destinationInterval);
      };
    }
  }, [isActive, planningSteps.length]);

  if (!isActive) return null;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
      <div className="relative w-96 h-96">
        <motion.div
          className="absolute inset-0 border-8 border-blue-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 border-4 border-dashed border-teal-300 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-1/4 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDestinationIndex}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
                className="text-blue-500"
              >
                {destinations[currentDestinationIndex].icon}
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
      <div className="text-center mt-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {title}
        </h2>
        <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-gray-600"
            >
              {planningSteps[currentStep]}
            </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}