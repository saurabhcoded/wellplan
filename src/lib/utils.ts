export const getYouTubeEmbedUrl = (url: string) => {
  // If it's already an embed URL, return as-is
  if (url.includes('/embed/')) {
    return url;
  }

  let videoId = '';

  // Handle different YouTube URL formats
  if (url.includes('youtube.com/watch?v=')) {
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    videoId = url.split('v=')[1];
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) {
      videoId = videoId.substring(0, ampersandPosition);
    }
  } else if (url.includes('youtu.be/')) {
    // Format: https://youtu.be/VIDEO_ID
    videoId = url.split('youtu.be/')[1];
    const queryPosition = videoId.indexOf('?');
    if (queryPosition !== -1) {
      videoId = videoId.substring(0, queryPosition);
    }
  } else if (url.includes('youtube.com/shorts/')) {
    // Format: https://www.youtube.com/shorts/VIDEO_ID
    videoId = url.split('shorts/')[1];
    const queryPosition = videoId.indexOf('?');
    if (queryPosition !== -1) {
      videoId = videoId.substring(0, queryPosition);
    }
  }

  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Detects if the current device is a mobile device
 * @returns true if mobile, false if desktop
 */
export const isMobileDevice = (): boolean => {
  // Check for touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check user agent for mobile keywords
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile'
  ];
  const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen width (mobile typically < 768px)
  const hasSmallScreen = window.innerWidth < 768;
  
  // Device is considered mobile if it has touch AND (mobile keyword OR small screen)
  return hasTouch && (hasMobileKeyword || hasSmallScreen);
};