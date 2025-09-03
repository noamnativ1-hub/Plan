import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Plus, Trash2, Link } from 'lucide-react';
import { VideoSubmission } from '@/api/entities';
import { User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { useLanguage } from '../contexts/LanguageContext';

export default function VideoSubmissionDialog({ open, onOpenChange }) {
  const { t } = useLanguage();
  const [urls, setUrls] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    if (open) {
      fetchUser();
      setUrls(['']);
      setLoading(false);
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlInput = () => {
    setUrls([...urls, '']);
  };

  const removeUrlInput = (index) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  const handleSubmit = async () => {
    const validUrls = urls.filter(url => url.trim() !== '');
    if (validUrls.length === 0) {
      setError(t('urlRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bloggerId = sessionStorage.getItem('bloggerSession') ? JSON.parse(sessionStorage.getItem('bloggerSession')).bloggerId : null;
      if (!user || !bloggerId) {
          throw new Error("Blogger session not found.");
      }

      await VideoSubmission.create({
        blogger_id: bloggerId,
        blogger_name: user.full_name,
        blogger_email: user.email,
        video_urls: validUrls
      });

      await SendEmail({
        to: 'noamnativ1@gmail.com',
        subject: `New Video Submission from ${user.full_name}`,
        body: `A new submission with ${validUrls.length} video(s) has been submitted by ${user.full_name} (${user.email}).\n\nURLs:\n${validUrls.join('\n')}\n\nPlease go to the admin panel to process it.`
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || t('submissionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('submitVideoLink')}</DialogTitle>
          <DialogDescription>{t('submitVideoLinkDescription')}</DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">{t('submissionReceived')}</h3>
            <p className="text-sm text-muted-foreground">{t('emailNotificationOnReady')}</p>
            <Button onClick={() => onOpenChange(false)} className="mt-6">{t('close')}</Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-muted-foreground" />
                  <Input
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeUrlInput(index)} disabled={urls.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addUrlInput} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              הוסף קישור נוסף
            </Button>
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
              <Button type="submit" onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('submit')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}