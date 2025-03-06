// src/components/marketing/RequestAccessDialog.tsx
"use client";

import { useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storeSignup } from "@/lib/hooks/storeSignup";
import { toast } from "sonner";

export function RequestAccessDialog({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Basic validation
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        setError("Please enter a valid email address");
        setIsSubmitting(false);
        return;
      }
      
      // Use storeSignup function instead of fetch
      const result = await storeSignup(email);
      
      if (!result.success) {
        setError(result.message || "Failed to submit request. Please try again.");
        toast.error(result.message);
      } else {
        setSuccess(true);
        setEmail("");
        toast.success(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Request access error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSuccess(false);
      setError(null);
      setEmail("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Early Access</DialogTitle>
          <DialogDescription>
            Enter your email to join our waitlist and get early access to ChiTrack.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-green-600 font-medium mb-4">
              Thank you for your interest!
            </p>
            <p className="text-muted-foreground">
              We've added you to our waitlist and will notify you when ChiTrack is on the App Store.
            </p>
            <Button 
              onClick={handleClose} 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Request Access"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}