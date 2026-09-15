const sharp = require('sharp');
const fs = require('fs');

const svgCode = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='512' height='512' fill='none' stroke='#7C5CFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
  <!-- Background -->
  <rect width="100%" height="100%" fill="#12121A"/>
  <!-- Translate everything to center and scale slightly if needed -->
  <g transform="scale(13.5) translate(2.5, 2.5)">
    <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/>
    <polyline points='3.29 7.09 12 12.09 20.71 7.09'/>
    <line x1='12' y1='22.08' x2='12' y2='12'/>
  </g>
</svg>
`;

sharp(Buffer.from(svgCode))
  .jpeg({ quality: 95 })
  .toFile('qryptnote_logo.jpeg')
  .then(() => console.log('Successfully created qryptnote_logo.jpeg'))
  .catch(err => console.error('Error creating logo:', err));
