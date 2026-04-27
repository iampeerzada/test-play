const txt = `channel_name\tgroup_title\turl\ttvg_id\ttvg_logo\textinf_raw
&flix HD (1080p)\tNews\thttps://cdn-4.pishow.tv/live/1007/master.m3u8\t4TVNews.in@SD\thttps://jiotvimages.cdn.jio.com/dare_images/images/4_TV.png\t#EXTINF:-1 tvg-id="4TVNews.in@SD" tvg-logo="https://jiotvimages.cdn.jio.com/dare_images/images/4_TV.png" group-title="News",4TV News (576p)`;

const lines = txt.split('\n');
for(let i=1; i<lines.length; i++) {
  const line = lines[i].trim();
  const urlMatch = line.match(/(https?:\/\/[^,"\t]+)/);
  const urlMatch2 = line.match(/(https?:\/\/[^\s,"']+)/);
  console.log('URL Match 1:', urlMatch ? urlMatch[1] : 'none');
  console.log('URL Match 2:', urlMatch2 ? urlMatch2[1] : 'none');

  let name = 'Unknown';
  if (line.includes('\t')) {
     name = line.split('\t')[0];
  } else {
     name = line.split(',')[0];
  }
  console.log('Name:', name);
}
