/**
 * WalletBrain icon generator
 * Requires: npm install canvas  (or yarn add canvas)
 * Run:      node scripts/generateIcon.js
 *
 * Generates 1024x1024 icon.png and 200x200 splash centre graphic.
 * If the 'canvas' package is unavailable just update app.json
 * backgroundColor to #0a0a0a — the dark background is what matters most.
 */

const fs = require('fs');
const path = require('path');

try {
  const { createCanvas } = require('canvas');

  // ── Icon (1024 x 1024) ────────────────────────────────────────────────
  const canvas = createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, 1024, 1024);

  // Purple circle
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.arc(512, 512, 400, 0, Math.PI * 2);
  ctx.fill();

  // Brain emoji
  ctx.font = '380px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('\uD83E\uDDE0', 512, 530);

  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  fs.writeFileSync(iconPath, canvas.toBuffer('image/png'));
  console.log('✅  icon.png generated →', iconPath);

  // ── Adaptive icon foreground (same design, transparent bg) ────────────
  const aCanvas = createCanvas(1024, 1024);
  const aC = aCanvas.getContext('2d');
  aC.clearRect(0, 0, 1024, 1024);
  aC.fillStyle = '#7c3aed';
  aC.beginPath();
  aC.arc(512, 512, 400, 0, Math.PI * 2);
  aC.fill();
  aC.font = '380px serif';
  aC.textAlign = 'center';
  aC.textBaseline = 'middle';
  aC.fillText('\uD83E\uDDE0', 512, 530);

  const adaptivePath = path.join(__dirname, '..', 'assets', 'adaptive-icon.png');
  fs.writeFileSync(adaptivePath, aCanvas.toBuffer('image/png'));
  console.log('✅  adaptive-icon.png generated →', adaptivePath);

} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('⚠️  canvas package not installed.');
    console.log('   Run: yarn add canvas');
    console.log('   Then: node scripts/generateIcon.js');
    console.log('');
    console.log('   app.json splash backgroundColor is already #0a0a0a — that\'s the most visible change.');
  } else {
    throw e;
  }
}
