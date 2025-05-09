// src/components/marketing/iphone.tsx
"use client"

import { useState, useEffect } from "react"
import { Battery, Signal, Wifi } from "lucide-react"
import type React from "react" // Added import for React
import Image from "next/image"

interface IPhoneFrameProps {
  children?: React.ReactNode
  className?: string
  image?: string
  imageAlt?: string
}

export function IPhoneFrame({ children, className = "", image, imageAlt = "App screenshot" }: IPhoneFrameProps) {
  const [time, setTime] = useState("")

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative aspect-[9/19.5] w-full max-w-[320px] mx-auto">
        {/* Main frame */}
        <div className="absolute inset-0 rounded-[3rem] bg-[#1B1B1F] shadow-xl">
          {/* Side buttons */}
          <div className="absolute left-[-2px] top-[100px] h-8 w-[3px] rounded-l-lg bg-[#2A2A2E]" /> {/* Volume up */}
          <div className="absolute left-[-2px] top-[140px] h-8 w-[3px] rounded-l-lg bg-[#2A2A2E]" /> {/* Volume down */}
          <div className="absolute right-[-2px] top-[120px] h-12 w-[3px] rounded-r-lg bg-[#2A2A2E]" /> {/* Power */}
          {/* Inner screen container */}
          <div className="absolute inset-[4px] rounded-[2.85rem] overflow-hidden bg-black">
            {/* Dynamic Island */}
            {/* <div className="absolute left-1/2 -translate-x-1/2 top-2 h-[35px] w-[120px] bg-black rounded-full z-20" /> */}

            {/* Status Bar */}
            {/*
            <div className="relative h-12 px-6 flex items-center justify-between text-white text-sm z-10">
              <div>{time}</div>
              <div className="flex items-center gap-1.5">
                <Signal className="h-4 w-4" />
                <Wifi className="h-4 w-4" />
                <Battery className="h-4 w-4" />
              </div>
            </div>
            */}

            {/* Screen Content */}
            <div className="absolute inset-0 overflow-hidden">
              {image ? (
                <div className="relative w-full h-full">
                  <Image 
                    src={image} 
                    alt={imageAlt} 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                children
              )}
            </div>

            {/* Screen Overlay Effects */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Subtle inner shadow */}
              <div className="absolute inset-0 shadow-inner" />
              {/* Screen glare effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

