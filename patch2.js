const fs = require('fs');
let html = fs.readFileSync('src/app/page.tsx', 'utf8');

html = html.replace(/Pay with SLIK/g, 'Pay with Palm SLIK');
html = html.replace(/Build with SLIK/g, 'Build with Palm SLIK');
html = html.replace(/Opens the SLIK terminal/g, 'Opens the Palm SLIK terminal');
html = html.replace(/Opens the SLIK app/g, 'Opens the Palm SLIK app');
html = html.replace(/alt="SLIK"/g, 'alt="Palm SLIK"');

fs.writeFileSync('src/app/page.tsx', html);
