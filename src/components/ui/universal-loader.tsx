"use client"
import React from 'react';

interface UniversalLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export function UniversalLoader({ 
  fullScreen = true, 
  message = "Loading..." 
}: UniversalLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo with bounce and scale animation */}
      <div className="relative w-20 h-20">
        <div className="w-20 h-20 animate-bounce-scale">
          <img 
            src="/Images/loader.png" 
            alt="Loading" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-scale {
          0% {
            transform: translateY(0) scale(0.8);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
          100% {
            transform: translateY(0) scale(0.8);
          }
        }

        .animate-bounce-scale {
          animation: bounce-scale 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px] w-full">
      {content}
    </div>
  );
}

export default UniversalLoader;