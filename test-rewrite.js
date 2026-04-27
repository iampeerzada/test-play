const lines = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=3412000,AVERAGE-BANDWIDTH=3096000',
  'http://103.229.254.25:7001/play/a0a1/48500276.m3u8'
]

const finalTargetUrl = 'http://103.229.254.25:7001/play/a0a1/index.m3u8';

const newLines = lines.map(line => {
   line = line.trim();
   if (!line || line.startsWith('#')) return line;
   
   let absoluteUrl = line;
   try {
      absoluteUrl = new URL(line, finalTargetUrl).href;
   } catch (e) {
      // Ignore parsing errors, keep as is
   }
   return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
});

const rewrittenText = newLines.map(line => {
   if (line.startsWith('#') && line.includes('URI=')) {
      return line.replace(/URI="([^"]+)"/g, (match, uri) => {
         if (uri.startsWith('/proxy?')) return match; // Already proxied
         let absoluteUri = uri;
         try {
            absoluteUri = new URL(uri, finalTargetUrl).href;
         } catch (e) {}
         return `URI="/proxy?url=${encodeURIComponent(absoluteUri)}"`;
      });
   }
   return line;
}).join('\n');

console.log(rewrittenText);
