#!/usr/bin/env node
/**
 * Servidor local para ver las webs generadas.
 *   node servir.js            -> http://localhost:8080/ejemplo/
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') {
    const list = fs.existsSync(DIST) ? fs.readdirSync(DIST) : [];
    res.writeHead(200, { 'Content-Type': TYPES['.html'] });
    return res.end('<h1>Clientes</h1><ul>' + list.map(n => `<li><a href="/${n}/">${n}</a></li>`).join('') + '</ul>');
  }
  let file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Sirviendo dist/ en http://localhost:${PORT}/`));
