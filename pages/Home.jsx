
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Plane, Hotel, MapPin, Calendar, Star } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

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

      {/* Destination Highlights */}
      <section className="py-8 bg-white relative card-overlap mx-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <Card className="overflow-hidden shadow-lg border-none hover:shadow-xl transition-all">
              <div className="h-40 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1596392927852-2a18c336fb78?auto=format&fit=crop&w=800&q=80" 
                  alt="Desert Safari"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{t('enjoyDesertSafari')}</h3>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-lg border-none hover:shadow-xl transition-all">
              <div className="h-40 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80" 
                  alt="Beach" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{t('enjoySeaBeauty')}</h3>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden shadow-lg border-none hover:shadow-xl transition-all">
              <div className="h-40 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80" 
                  alt="Paris Tower" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{t('enjoyParisTower')}</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Blogger Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              🌟 {t('discoverTravelWorldWithBloggers')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('ourExperiencedBloggersCreatePersonalizedRoutes')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">🧳</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('exclusiveRoutes')}</h3>
              <p className="text-gray-600">{t('uniqueTravelRoutesDescription')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('provenExpertise')}</h3>
              <p className="text-gray-600">{t('experiencedBloggersDescription')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-purple-700 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{t('personalCustomization')}</h3>
              <p className="text-gray-600">{t('tailoredItineraryDescription')}</p>
            </div>
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="rounded-full px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg"
              onClick={() => navigate(createPageUrl("Bloggers"))}
            >
              {t('discoverOurBloggers')}
              {language === 'he' ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-indigo-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">{t('testimonialsTitle')}</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-4 right-4 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="inline-block h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 mt-6">{t('testimonial1Text')}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" 
                      alt={t('userAltText')} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{t('testimonial1Name')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonial1Role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-4 right-4 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="inline-block h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 mt-6">{t('testimonial2Text')}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" 
                      alt={t('userAltText')} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{t('testimonial2Name')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonial2Role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-8 relative">
                <div className="absolute top-4 right-4 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="inline-block h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 mt-6">{t('testimonial3Text')}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" 
                      alt={t('userAltText')} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{t('testimonial3Name')}</h4>
                    <p className="text-sm text-gray-500">{t('testimonial3Role')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* "Prepare yourself to explore" Section */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h2 className="text-4xl font-bold mb-4">{t('prepareToExplore')}</h2>
              <p className="text-lg text-gray-600 mb-6">{t('manyOffersWaiting')}</p>
              <Button 
                size="lg" 
                className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={() => navigate(createPageUrl("PlanTrip"))}
              >
                {t('getStarted')}
                {language === 'he' ? <ArrowLeft className="mr-2 h-5 w-5" /> : <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </div>
            <div className="md:w-1/2 relative">
              <img 
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80" 
                alt="World exploration" 
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -top-4 -left-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{t('destinationsCount')}</p>
                  <p className="text-xs text-gray-500">{t('destinationsCollabText')}</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-lg shadow-lg flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Plane className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{t('flightsCount')}</p>
                  <p className="text-xs text-gray-500">{t('flightDestinationText')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">{t('howPlanGoWorks')}</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('chooseDates')}</h3>
              <p className="text-muted-foreground">{t('chooseDatesDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('chooseDestination')}</h3>
              <p className="text-muted-foreground">{t('chooseDestinationDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Plane className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('chooseComponents')}</h3>
              <p className="text-muted-foreground">{t('chooseComponentsDesc')}</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <Hotel className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('bookAndEnjoy')}</h3>
              <p className="text-muted-foreground">{t('bookAndEnjoyDesc')}</p>
            </div>
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
