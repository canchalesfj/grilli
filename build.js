#!/usr/bin/env node
/**
 * Genera la web de un cliente a partir de su config.json.
 *
 *   node build.js <cliente>     -> dist/<cliente>/
 *   node build.js --todos       -> genera todos los clientes
 *
 * Sin dependencias: solo Node.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CLIENTES = path.join(ROOT, 'clientes');
const DIST = path.join(ROOT, 'dist');

/* ---------------- motor de plantillas mínimo ----------------
 * {{ruta.a.dato}}     texto escapado (los saltos de línea pasan a <br>)
 * {{{ruta}}}          HTML sin escapar
 * {{#each lista}}…{{/each}}   dentro: campos del elemento, {{.}}, @first, @index
 * {{#if x}}…{{else}}…{{/if}}   {{#unless x}}…{{/unless}}
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parse(src) {
  const re = /\{\{(\{?)\s*(#each|#if|#unless|\/each|\/if|\/unless|else)?\s*([^}]*?)\s*\}?\}\}/g;
  const root = { children: [] };
  const stack = [root];
  let last = 0, m;
  const top = () => stack[stack.length - 1];
  const target = () => { const t = top(); return t.inElse ? t.elseChildren : t.children; };

  while ((m = re.exec(src))) {
    if (m.index > last) target().push({ type: 'text', value: src.slice(last, m.index) });
    last = re.lastIndex;
    const [, raw, kw, expr] = m;
    if (kw === '#each' || kw === '#if' || kw === '#unless') {
      const node = { type: kw.slice(1), expr, children: [], elseChildren: [] };
      target().push(node);
      stack.push(node);
    } else if (kw === 'else') {
      top().inElse = true;
    } else if (kw && kw[0] === '/') {
      const node = stack.pop();
      if (!node || node.type !== kw.slice(1)) throw new Error(`Plantilla: {{${kw}}} sin abrir`);
      delete node.inElse;
    } else {
      target().push({ type: 'var', expr, raw: raw === '{' });
    }
  }
  if (stack.length > 1) throw new Error(`Plantilla: falta {{/${top().type}}}`);
  if (last < src.length) target().push({ type: 'text', value: src.slice(last) });
  return root.children;
}

function lookup(scopes, expr) {
  if (expr === '.' || expr === 'this') return scopes[scopes.length - 1];
  const parts = expr.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (s !== null && typeof s === 'object' && parts[0] in s) {
      let v = s;
      for (const p of parts) v = v == null ? undefined : v[p];
      return v;
    }
  }
  return undefined;
}

function truthy(v) {
  return Array.isArray(v) ? v.length > 0 : Boolean(v);
}

function render(nodes, scopes) {
  let out = '';
  for (const n of nodes) {
    if (n.type === 'text') out += n.value;
    else if (n.type === 'var') {
      const v = lookup(scopes, n.expr);
      if (v == null) continue;
      out += n.raw ? String(v) : escapeHtml(v).replace(/\r?\n/g, '<br>');
    } else if (n.type === 'if' || n.type === 'unless') {
      let ok = truthy(lookup(scopes, n.expr));
      if (n.type === 'unless') ok = !ok;
      out += render(ok ? n.children : n.elseChildren, scopes);
    } else if (n.type === 'each') {
      const list = lookup(scopes, n.expr) || [];
      list.forEach((item, i) => {
        const meta = { '@index': i, '@first': i === 0, '@last': i === list.length - 1 };
        out += render(n.children, [...scopes, meta, item]);
      });
    }
  }
  return out;
}

/* ---------------- datos derivados ---------------- */

function digits(phone) {
  return String(phone || '').replace(/[^\d+]/g, '');
}

function prepare(cfg) {
  const c = structuredClone(cfg);
  const contacto = c.contacto || {};
  c.telLink = digits(contacto.telefono);
  c.whatsappNum = digits(contacto.whatsapp).replace(/^\+/, '');
  c.anio = new Date().getFullYear();
  c.colores = Object.assign({ principal: '#e4c590' }, c.colores);
  c.reservas = c.reservas || { mostrar: false };
  c.reservaHref = c.reservas.mostrar ? '#reservation' : `tel:${c.telLink}`;

  const max = Number(c.reservas.maxPersonas) || 8;
  c.personas = Array.from({ length: max }, (_, i) => ({ n: i + 1, uno: i === 0, selected: i === 1 }));

  if (c.eventos && Array.isArray(c.eventos.items)) {
    c.eventos.items.forEach(ev => {
      ev.fechaTexto = ev.fecha ? ev.fecha.split('-').reverse().join('/') : '';
    });
  }

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: c.nombre,
    description: c.descripcion,
    telephone: contacto.telefono,
    email: contacto.email || undefined,
    address: contacto.direccion,
    url: c.url || undefined,
    hasMap: contacto.mapa || undefined,
    sameAs: (c.redes || []).map(r => r.url),
  };
  // evita cerrar el <script> desde el contenido
  c.jsonld = JSON.stringify(jsonld).replace(/</g, '\\u003c');
  return c;
}

function validate(cfg, name) {
  const errors = [];
  const need = ['nombre', 'descripcion', 'contacto.telefono', 'contacto.direccion'];
  for (const key of need) {
    if (!key.split('.').reduce((o, k) => (o ? o[k] : undefined), cfg)) errors.push(`falta "${key}"`);
  }
  if (!Array.isArray(cfg.hero) || cfg.hero.length === 0) errors.push('"hero" necesita al menos una diapositiva');
  if (errors.length) throw new Error(`clientes/${name}/config.json: ${errors.join(', ')}`);
}

/* ---------------- copia de ficheros ---------------- */

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'Thumbs.db' || entry.name.startsWith('.')) continue;
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

function checkImages(html, outDir, name) {
  const missing = new Set();
  for (const m of html.matchAll(/\.\/assets\/images\/([^"')\s]+)/g)) {
    if (!fs.existsSync(path.join(outDir, 'assets', 'images', m[1]))) missing.add(m[1]);
  }
  if (missing.size) console.warn(`  ⚠ ${name}: faltan imágenes: ${[...missing].join(', ')}`);
}

/* ---------------- build ---------------- */

const templateNodes = parse(fs.readFileSync(path.join(ROOT, 'template', 'index.html'), 'utf8'));

function build(name) {
  const dir = path.join(CLIENTES, name);
  const cfgPath = path.join(dir, 'config.json');
  if (!fs.existsSync(cfgPath)) throw new Error(`No existe clientes/${name}/config.json`);

  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  validate(cfg, name);

  const out = path.join(DIST, name);
  fs.rmSync(out, { recursive: true, force: true });

  // 1) recursos base de la plantilla  2) imágenes propias del cliente (sobrescriben)
  copyDir(path.join(ROOT, 'assets'), path.join(out, 'assets'));
  copyDir(path.join(dir, 'imagenes'), path.join(out, 'assets', 'images'));
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(out, 'LICENSE'));
  const favicon = fs.existsSync(path.join(dir, 'favicon.svg')) ? path.join(dir, 'favicon.svg') : path.join(ROOT, 'favicon.svg');
  fs.copyFileSync(favicon, path.join(out, 'favicon.svg'));
  fs.writeFileSync(path.join(out, '.nojekyll'), '');

  const html = render(templateNodes, [prepare(cfg)]);
  fs.writeFileSync(path.join(out, 'index.html'), html);
  checkImages(html, out, name);
  console.log(`✔ ${name} -> dist/${name}/index.html`);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Uso: node build.js <cliente>   |   node build.js --todos');
  process.exit(1);
}
const names = args[0] === '--todos'
  ? fs.readdirSync(CLIENTES).filter(n => fs.existsSync(path.join(CLIENTES, n, 'config.json')))
  : args;

let failed = false;
for (const n of names) {
  try { build(n); } catch (e) { failed = true; console.error(`✖ ${e.message}`); }
}
process.exit(failed ? 1 : 0);
