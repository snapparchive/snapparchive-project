// In your lib/analytics.ts file
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    console.log('🔍 GA Event Tracked:', eventName, eventParams); // Debug log
    (window as any).gtag('event', eventName, eventParams);
  } else {
    console.warn('⚠️ Google Analytics not loaded yet');
  }
};