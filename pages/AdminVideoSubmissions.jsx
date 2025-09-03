import React, { useState, useEffect } from 'react';
import { VideoSubmission } from '@/api/entities';
import { BloggerTrip } from '@/api/entities';
import { InvokeLLM, SendEmail } from '@/api/integrations';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, FileText, Link } from 'lucide-react';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function AdminVideoSubmissionsPage() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcripts, setTranscripts] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const data = await VideoSubmission.list('-created_date');
      setSubmissions(data.filter(s => s.status === 'pending'));
    } catch (err) {
      setError(t('errorFetchingSubmissions'));
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptChange = (id, value) => {
    setTranscripts(prev => ({ ...prev, [id]: value }));
  };

  const handleProcessSubmission = async (submission) => {
    const transcript = transcripts[submission.id];
    if (!transcript || !transcript.trim()) {
      alert(t('transcriptRequired'));
      return;
    }

    setProcessing(prev => ({ ...prev, [submission.id]: true }));

    try {
      const extractedData = await extractTripDataFromTranscript(transcript);
      
      const newTripData = {
        blogger_id: submission.blogger_id,
        status: 'draft',
        cover_image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80',
        video_sources: submission.video_urls,
        title: extractedData.title || '',
        destination: extractedData.destination || '',
        destinations: extractedData.destinations || [],
        trip_type: extractedData.trip_type || [],
        duration: extractedData.duration || 1,
        description: extractedData.description || '',
        short_description: extractedData.short_description || '',
        price_from: extractedData.price_from || 0,
        itinerary: extractedData.itinerary || [{ day: 1, title: 'Day 1', description: '', activities: [] }]
      };

      const newTrip = await BloggerTrip.create(newTripData);

      await VideoSubmission.update(submission.id, {
        transcript: transcript,
        status: 'processed'
      });

      await SendEmail({
        to: submission.blogger_email,
        subject: t('videoConvertedToTrip'),
        body: `${t('yourVideoConverted')} <a href="${window.location.origin}${createPageUrl('BloggerCreateTrip')}?id=${newTrip.id}">${t('viewYourTrip')}</a>`
      });

      fetchSubmissions(); // Refresh list to remove the processed item

    } catch (err) {
      console.error("Processing failed:", err);
      alert(`${t('errorProcessingSubmission')}: ${err.message}`);
    } finally {
      setProcessing(prev => ({ ...prev, [submission.id]: false }));
    }
  };

  const extractTripDataFromTranscript = async (transcript) => {
    const prompt = `
      You are an information extraction expert for travel content. Your task is to analyze the following transcript from a travel video.
      **Your Goal:** Extract key details and populate a JSON structure.
      **CRITICAL RULE:** DO NOT invent, add, or infer any information that is not explicitly mentioned in the transcript. If a detail is missing, use a default value (empty string "", empty array [], or 0 for numbers). Your purpose is to fill a form for the blogger, not to create a complete trip.

      **Transcript:**
      ---
      ${transcript}
      ---

      **JSON Structure to fill (Respond with ONLY this valid JSON object):**
      {
        "title": "Trip Title or empty string",
        "destination": "Main Destination or empty string",
        "destinations": ["List", "of", "destinations"],
        "trip_type": ["cultural", "food"],
        "duration": 3,
        "description": "Detailed trip description or empty string",
        "short_description": "A brief summary or empty string",
        "price_from": 1200,
        "itinerary": [
          {
            "day": 1,
            "title": "Day 1 Title or empty",
            "description": "Day 1 summary or empty",
            "activities": [
              {"time": "09:00", "title": "Activity Name", "description": "Activity details", "location": "Location Name"}
            ]
          }
        ]
      }
    `;

    return await InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          destination: { type: 'string' },
          destinations: { type: 'array', items: { type: 'string' } },
          trip_type: { type: 'array', items: { type: 'string' } },
          duration: { type: 'integer' },
          description: { type: 'string' },
          short_description: { type: 'string' },
          price_from: { type: 'number' },
          itinerary: { type: 'array', items: { type: 'object' } }
        }
      }
    });
  };
  
  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <Alert variant="destructive">{error}</Alert>;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">{t('bloggerVideoSubmissions')}</h1>
      <div className="space-y-6">
        {submissions.map(sub => (
          <Card key={sub.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{sub.blogger_name}</CardTitle>
                  <CardDescription>{sub.blogger_email} - Submitted on {new Date(sub.created_date).toLocaleDateString()}</CardDescription>
                  <div className="mt-2 space-y-1">
                    {sub.video_urls.map((url, index) => (
                         <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                             <Link className="h-4 w-4" />
                             {url}
                         </a>
                    ))}
                  </div>
                </div>
                <Badge variant='secondary'>{t(sub.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder={t('pasteTranscriptHere')}
                  rows={8}
                  value={transcripts[sub.id] || ''}
                  onChange={(e) => handleTranscriptChange(sub.id, e.target.value)}
                />
                <Button
                  onClick={() => handleProcessSubmission(sub)}
                  disabled={processing[sub.id]}
                  className="w-full"
                >
                  {processing[sub.id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  {t('saveTranscriptAndCreateTrip')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noSubmissionsFound')}</p>}
      </div>
    </div>
  );
}