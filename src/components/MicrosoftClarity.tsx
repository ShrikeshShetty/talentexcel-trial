'use client';

import { useEffect } from 'react';

export default function MicrosoftClarity() {
  useEffect(() => {
    // Skip Clarity in development unless explicitly enabled
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_ENABLE_CLARITY_IN_DEV !== 'true'
    ) {
      return;
    }

    // Get Clarity ID from environment variable
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    
    if (!clarityId) {
      console.warn('Microsoft Clarity ID is not defined in environment variables');
      return;
    }

    // Microsoft Clarity script
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", clarityId);
  }, []);

  return null;
}
