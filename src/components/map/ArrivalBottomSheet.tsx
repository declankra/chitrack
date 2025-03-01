// src/components/map/ArrivalBottomSheet.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import ArrivalBoard from '@/components/search/ArrivalBoard';
import { useStationArrivals } from '@/lib/hooks/useStationArrivals';
import type { Station } from '@/lib/types/cta';

interface ArrivalBottomSheetProps {
  isOpen: boolean;
  station: Station | null;
  onClose: () => void;
}

const ArrivalBottomSheet: React.FC<ArrivalBottomSheetProps> = ({ 
  isOpen, 
  station, 
  onClose 
}) => {
  const [sheetHeight, setSheetHeight] = useState('40%');
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Fetch arrivals data for the selected station
  const {
    data: arrivalsData = [],
    isLoading: arrivalsLoading,
    error: arrivalsError,
    refetch: refetchArrivals,
    lastUpdated
  } = useStationArrivals(station?.stationId || '', {
    enabled: isOpen && !!station?.stationId,
    forceRefresh: true,
  });
  
  // Reset when station changes
  useEffect(() => {
    if (isOpen && station) {
      setSheetHeight('40%');
    }
  }, [isOpen, station]);
  
  // Handle drag to expand/collapse
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset } = info;
    
    // Expand sheet on drag up
    if (offset.y < -50 && sheetHeight === '40%') {
      setSheetHeight('80%');
    }
    
    // Collapse sheet on drag down
    if (offset.y > 50) {
      if (sheetHeight === '80%') {
        setSheetHeight('40%');
      } else {
        onClose();
      }
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (station?.stationId) {
      refetchArrivals();
    }
  };
  
  // Format error message from potential error
  const errorMessage = arrivalsError 
    ? (arrivalsError instanceof Error ? arrivalsError.message : 'Error fetching arrivals')
    : null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for clicking away */}
          <motion.div
            className="fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            className="fixed left-0 right-0 bottom-0 z-50 bg-background rounded-t-xl shadow-lg overflow-hidden"
            initial={{ height: 0 }}
            animate={{ height: sheetHeight }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDrag}
          >
            {/* Drag handle */}
            <div className="w-full flex justify-center py-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {/* Arrival content */}
            <div className="h-full overflow-hidden">
              {station && (
                <ArrivalBoard
                  arrivals={arrivalsData}
                  loading={arrivalsLoading}
                  error={errorMessage}
                  lastUpdated={lastUpdated}
                  onRefresh={handleRefresh}
                  stationName={station.stationName}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ArrivalBottomSheet;