const sharp = require('sharp');

const svgCode = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='512' height='512' fill='none' stroke='#7C5CFF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>
  <!-- Background -->
  <rect x="0" y="0" width="24" height="24" fill="#12121A" stroke="none" />
  <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/>
  <polyline points='3.29 7.09 12 12.09 20.71 7.09'/>
  <line x1='12' y1='22.08' x2='12' y2='12'/>
</svg>
`;

sharp(Buffer.from(svgCode))
  .resize(512, 512)
  .jpeg({ quality: 95 })
  .toFile('qryptnote_logo.jpeg')
  .then(() => console.log('Successfully created qryptnote_logo.jpeg'))
  .catch(err => console.error('Error creating logo:', err));
