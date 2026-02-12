"use client";

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  text?: string;
}

export function LoadingSpinner({
  size = 'lg',
  fullScreen = false,
  text = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          <div className="absolute inset-0 rounded-full border-4 border-cyan-100"></div>

          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>

          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin-slow"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${dotSizeClasses[size]} bg-cyan-500 rounded-full animate-pulse`}></div>
          </div>
        </div>

        <div className="absolute -inset-4 bg-cyan-400/20 rounded-full blur-xl animate-pulse-slow"></div>
      </div>

      {text && (
        <div className="flex flex-col items-center gap-2">
          <p className={`${textSizeClasses[size]} font-semibold text-gray-700 animate-pulse`}>
            {text}
          </p>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export function LoadingSpinnerFullPage({ text }: { text?: string }) {
  return <LoadingSpinner size="xl" fullScreen text={text} />;
}

export function LoadingSpinnerInline({ size, text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size={size} text={text} />
    </div>
  );
}
