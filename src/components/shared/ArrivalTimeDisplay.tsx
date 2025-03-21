// src/components/shared/ArrivalTimeDisplay.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Arrival } from '@/lib/types/cta';
import { parseCtaDate, formatTimeDisplay } from '@/lib/utilities/timeUtils';

/**
 * Renders arrival time with status indicators for a train
 * Shared component to be used across different parts of the app
 */
const ArrivalTimeDisplay: React.FC<{
  arrival: Arrival;
  currentTime: Date;
}> = ({ arrival, currentTime }) => {
  const isApproaching = arrival.isApp === '1';
  const isDelayed = arrival.isDly === '1';
  const arrTime = parseCtaDate(arrival.arrT);
  
  if (!arrTime) return <div>N/A</div>;
  
  // If the train is approaching
  if (isApproaching) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-bold text-destructive">Due</span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
        </span>
      </div>
    );
  }
  
  // If the train is delayed
  if (isDelayed) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-amber-500 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3" /> Delayed
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
        </span>
      </div>
    );
  }
  
  // Calculate minutes until arrival
  const diffMs = arrTime.getTime() - currentTime.getTime();
  const diffMin = Math.round(diffMs / 60000);
  
  if (diffMin <= 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-bold text-destructive">Due</span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
        </span>
      </div>
    );
  }
  
  // Special case for 1 minute - display with finger emoji
  if (diffMin === 1) {
    return (
      <div className="flex flex-col items-end">
        <span className="flex items-baseline gap-1">
          <span className="text-lg font-bold">1 ☝️</span>
          <span className="text-sm font-normal text-muted-foreground">min</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {formatTimeDisplay(arrTime)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-end">
      <span className="flex items-baseline gap-1">
        <span className="text-lg font-bold">{diffMin}</span>
        <span className="text-sm font-normal text-muted-foreground">min</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {formatTimeDisplay(arrTime)}
      </span>
    </div>
  );
};

export default ArrivalTimeDisplay; 