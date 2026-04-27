/**
 * Cleans the streaming URL based on specific rules.
 * 
 * Logic 1: Remove `:8080` from the URL if it exists.
 * Logic 2: Replace `/watch/` with `/dl/` in the URL.
 * 
 * Example:
 * Input: "https://iptv.ifastx.in:8080/watch/12345"
 * Output: "https://iptv.ifastx.in/dl/12345"
 */
export function cleanStreamUrl(url: string): string {
  if (!url) return '';
  
  // Only apply these cleaning rules if the url contains /watch/
  // because Live TV (M3U channels) use varying ports which are required for them to play.
  if (url.includes('/watch/')) {
    let cleanedUrl = url;
    
    // Rule 1: Remove :8080
    cleanedUrl = cleanedUrl.replace(':8080', '');
    
    // Rule 2: Replace /watch/ with /dl/
    cleanedUrl = cleanedUrl.replace('/watch/', '/dl/');
    
    return cleanedUrl;
  }
  
  return url;
}
