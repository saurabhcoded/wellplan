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