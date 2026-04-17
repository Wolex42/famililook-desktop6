/**
 * Generate PWA icons and OG image from brand SVG.
 * Run: node scripts/generate-icons.mjs
 * Requires: sharp (npx sharp)
 */
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0a84ff"/>
    <stop offset="100%" stop-color="#5e5ce6"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="102" fill="url(#g)"/>
  <text x="256" y="380" font-size="320" text-anchor="middle" font-family="sans-serif">✨</text>
</svg>`;

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0D0F1A"/>
      <stop offset="100%" stop-color="#1a1d2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a84ff"/>
      <stop offset="100%" stop-color="#5e5ce6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="580" width="1200" height="50" fill="url(#accent)" opacity="0.15"/>
  <rect x="80" y="260" width="200" height="6" rx="3" fill="url(#accent)" opacity="0.6"/>
  <text x="600" y="240" font-size="72" font-weight="900" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif">FamiliMatch</text>
  <text x="600" y="320" font-size="36" text-anchor="middle" fill="#9ca3af" font-family="system-ui, -apple-system, sans-serif">How Alike Are You, Really?</text>
  <text x="600" y="400" font-size="24" text-anchor="middle" fill="#6b7280" font-family="system-ui, -apple-system, sans-serif">AI compares 8 facial features — free and instant</text>
  <rect x="440" y="440" width="320" height="56" rx="28" fill="url(#accent)"/>
  <text x="600" y="476" font-size="22" font-weight="700" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif">Compare Now — Free</text>
  <text x="600" y="608" font-size="16" text-anchor="middle" fill="#4b5563" font-family="system-ui, -apple-system, sans-serif">familimatch.com</text>
</svg>`;

// Write SVGs to temp files
writeFileSync('_icon.svg', ICON_SVG);
writeFileSync('_og.svg', OG_SVG);

// Convert using sharp-cli
execSync('npx sharp-cli -i _icon.svg -o public/icon-192.png resize 192 192', { stdio: 'inherit' });
execSync('npx sharp-cli -i _icon.svg -o public/icon-512.png resize 512 512', { stdio: 'inherit' });
execSync('npx sharp-cli -i _og.svg -o public/og-familimatch.png resize 1200 630', { stdio: 'inherit' });

// Cleanup
execSync('rm _icon.svg _og.svg');

console.log('Generated: icon-192.png, icon-512.png, og-familimatch.png');
