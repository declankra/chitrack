// src/components/utilities/FeedbackDialog.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getSupabase } from "@/lib/supabase";
import { useUserData } from "@/lib/hooks/useUserData";

// Fixed device ID for the web app
const WEBAPP_DEVICE_ID = "webapp-main-user";

// Component for individual rating buttons
const RatingButton = ({ value, selected, onClick }: { 
  value: number;
  selected: boolean;
  onClick: (value: number) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`
      size-9 flex items-center justify-center border 
      transition-all duration-200 first:rounded-l-lg last:rounded-r-lg
      ${selected 
        ? 'bg-primary text-primary-foreground border-primary z-10' 
        : 'border-border hover:bg-accent'
      }
    `}
  >
    {value}
  </button>
);

export default function FeedbackDialog() {
  // Get user data (mainly for paid status)
  const { userData } = useUserData();

  // States for form inputs and dialogs
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [thankYouDialogOpen, setThankYouDialogOpen] = useState(false);

  // Handle feedback submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;

    // Use the fixed webapp device ID
    const deviceId = WEBAPP_DEVICE_ID;
    // Get current paid status from the potentially loaded user data
    const paidStatusAtSubmission = userData?.paidUserStatus ?? false;

    try {
      setIsSubmitting(true);
      const supabase = getSupabase();
      
      // Prepare data according to the schema, using the fixed ID
      const feedbackData = {
        device_id: deviceId, // Use fixed ID
        rating: rating,
        feedback: feedback || null,
        paid_user_status_at_submission: paidStatusAtSubmission,
      };

      await supabase
        .from('chitrack_feedback')
        .insert([feedbackData]);

      // Reset form and show thank you dialog
      setRating(null);
      setFeedback('');
      setFeedbackDialogOpen(false);
      setThankYouDialogOpen(true);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Main Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogTrigger asChild>
        <Button 
            variant="outline"
            className="w-full mt-8 text-muted-foreground hover:text-primary bg-background/80 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow duration-300"
          >            What do you think? Help improve ChiTrack
          </Button>
        </DialogTrigger>
        
        <DialogContent className="flex flex-col gap-0 p-0 [&>button:last-child]:top-3.5">
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="border-b border-border px-6 py-4 text-base">
              Help make the best transit app in Chicago
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Rating Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                How likely are you to recommend this app to a friend?
              </label>
              
              <div className="flex justify-center gap-0">
                {[...Array(11)].map((_, i) => (
                  <RatingButton
                    key={i}
                    value={i}
                    selected={rating === i}
                    onClick={setRating}
                  />
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </div>

            {/* Feedback Text Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                What do you wish this app could do?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="I wish..."
                className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-border bg-background
                         focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit"
              className="w-full"
              disabled={rating === null || isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send feedback'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Thank You Dialog */}
      <Dialog open={thankYouDialogOpen} onOpenChange={setThankYouDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thank you for your thoughts :)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              I read every message. Your feedback will make ChiTrack better for you and your friends.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setThankYouDialogOpen(false)}>
              Have a great day!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}