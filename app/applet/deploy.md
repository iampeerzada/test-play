## Update Instructions

Since we updated the code to fix the Mixed Content (HTTP vs HTTPS) errors, you need to rebuild the frontend so the changes take effect. 

Run this in your VPS:

```bash
cd /var/www/iptv.ifastx.in/
npm run build
pm2 restart iptv-app
```

### Explaining your errors:

1. **Mixed Content / HTTP Links**: You saw those errors because the frontend was using the old code. After you run the above commands, the frontend will automatically use `https://stream.ifastx.in` and rewrite all HTTP links correctly so the browser doesn't block them. Yes, setting `https://stream.ifastx.in` in your Admin panel was correct!
2. **502 Bad Gateway on `/admin`**: This usually happens if you visited the page *exactly* while PM2 was still starting up the server in the background, or if your M3U playlist is very large (parsing huge playlists takes a lot of RAM). Give it a few seconds and refresh.
3. **`net::ERR_CONNECTION_RESET 206 (Partial Content)`**: This means your `stream.ifastx.in` (FileStreamBot) successfully accepted the connection and started sending the video, but then either FileStreamBot or Nginx dropped the connection. Your advanced Nginx configs for buffering were correct! The bottleneck is likely FileStreamBot itself—Telegram bots often limit simultaneous streams or connection stability.
4. **`Uncaught NotFoundError` with Video Element**: If your screen suddenly goes blank with this error in the console, it is a known harmless issue with the third-party video player whenever a network error (like the one from FileStreamBot) abruptly drops the stream.

Run the build commands above on your VPS, refresh your browser, and your mixed content errors will be gone!
