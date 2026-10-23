const net = require('net');

const LISTEN_PORT = 5173;
const VITE_HTTPS_PORT = 5174;

const server = net.createServer((socket) => {
  socket.once('data', (buf) => {
    // 0x16 is TLS ClientHello record type
    if (buf[0] === 0x16) {
      // Pause client socket to prevent dropped data while internal proxy connects
      socket.pause();
      const proxy = net.connect(VITE_HTTPS_PORT, '127.0.0.1', () => {
        proxy.write(buf);
        socket.pipe(proxy);
        proxy.pipe(socket);
        socket.resume();
      });

      proxy.on('error', (err) => {
        socket.destroy();
      });

      socket.on('error', () => {
        proxy.destroy();
      });
    } else {
      // Plain HTTP request - Redirect to HTTPS on the same port!
      const requestText = buf.toString('utf-8');
      const hostMatch = requestText.match(/Host:\s*([^\r\n]+)/i);
      let host = hostMatch ? hostMatch[1].trim() : `localhost:${LISTEN_PORT}`;
      // Remove any port from host header if present
      const hostname = host.split(':')[0];

      const pathMatch = requestText.match(/(?:GET|POST|HEAD)\s+([^\s]+)/);
      const path = pathMatch ? pathMatch[1] : '/';

      const httpsUrl = `https://${hostname}:${LISTEN_PORT}${path}`;
      const response = [
        'HTTP/1.1 302 Found',
        `Location: ${httpsUrl}`,
        'Content-Length: 0',
        'Connection: close',
        '',
        ''
      ].join('\r\n');

      socket.write(response);
      socket.end();
    }
  });

  socket.on('error', (err) => {
    // Suppress connection reset noise
    if (err.code !== 'ECONNRESET') {
      console.warn('[DualProxy Socket Error]', err.message);
    }
  });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[DualProxy] Listening on 0.0.0.0:${LISTEN_PORT}`);
  console.log(`[DualProxy] Auto-redirecting HTTP -> HTTPS on port ${LISTEN_PORT}`);
  console.log(`[DualProxy] Forwarding HTTPS -> Vite on 127.0.0.1:${VITE_HTTPS_PORT}`);
});
