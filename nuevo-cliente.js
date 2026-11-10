#!/usr/bin/env node
/**
 * Crea la carpeta de un cliente nuevo copiando el ejemplo.
 *
 *   node nuevo-cliente.js bar-pepe "Bar Pepe"
 */
'use strict';

const fs = require('fs');
const path = require('path');

const [slug, nombre] = process.argv.slice(2);

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.log('Uso: node nuevo-cliente.js <carpeta-en-minusculas> ["Nombre del negocio"]');
  console.log('Ejemplo: node nuevo-cliente.js bar-pepe "Bar Pepe"');
  process.exit(1);
}

const dest = path.join(__dirname, 'clientes', slug);
if (fs.existsSync(dest)) {
  console.error(`Ya existe clientes/${slug}`);
  process.exit(1);
}

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'clientes', 'ejemplo', 'config.json'), 'utf8'));
if (nombre) cfg.nombre = nombre;

fs.mkdirSync(path.join(dest, 'imagenes'), { recursive: true });
fs.writeFileSync(path.join(dest, 'config.json'), JSON.stringify(cfg, null, 2) + '\n');
fs.writeFileSync(path.join(dest, 'imagenes', 'LEEME.txt'),
  'Pon aquí las fotos del cliente.\n' +
  'Si una foto se llama igual que una de assets/images (p. ej. hero-slider-1.jpg) la sustituye.\n' +
  'Si usas otro nombre, escríbelo en config.json.\n');

console.log(`✔ Creado clientes/${slug}/`);
console.log(`  1. Edita clientes/${slug}/config.json`);
console.log(`  2. Copia sus fotos en clientes/${slug}/imagenes/`);
console.log(`  3. node build.js ${slug}`);
