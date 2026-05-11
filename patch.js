const fs = require('fs');
let html = fs.readFileSync('pitch-deck.html', 'utf8');

// Replacements
html = html.replace('<title>SLIK – Pitch Deck</title>', '<title>Palm SLIK – Pitch Deck</title>');
html = html.replace('<div class="logo">SLIK</div>', '<div class="logo">Palm SLIK</div>');
html = html.replace('<div class="tag tag-purple">Blockchain Hack Warsaw</div>\n', '');
html = html.replace('SLIK brings the proven BLIK', 'Palm SLIK brings the proven BLIK');
html = html.replace('solana-blik.vercel.app', 'palm-slik.vercel.app');
html = html.replace('<h2>SLIK = BLIK + Solana</h2>', '<h2>Palm SLIK = BLIK + Solana</h2>');
html = html.replace('<th style="color:var(--sol-green)">SLIK ✦</th>', '<th style="color:var(--sol-green)">Palm SLIK ✦</th>');
html = html.replace('SLIK Pay Later', 'Palm SLIK Pay Later');
html = html.replace("think it's SLIK time.", "think it's Palm SLIK time.");
html = html.replace('https://solana-blik.vercel.app/', 'https://palm-slik.vercel.app/');
html = html.replace('Launch SLIK →', 'Launch Palm SLIK →');
html = html.replace('https://solana-blik.vercel.app/', 'https://palm-slik.vercel.app/'); // in case there's another

// Slide insertion
const newSlide = `
  <!-- SLIDE 5: PALM USD -->
  <section class="slide" id="palm-usd">
    <div class="slide-number">05 / 10</div>
    <div class="content">
      <div class="two-col">
        <div>
          <div class="tag tag-green">Exclusive Partner</div>
          <h2>Powered by <span class="gradient-text">Palm USD</span></h2>
          <p class="subtitle">A fully-backed stablecoin issued by a regulated financial institution in the UAE. 
          Zero volatility, deep liquidity, and 100% compliance.</p>
          <ul class="pill-list">
            <li>1:1 USD backing verified daily</li>
            <li>Regulated under the UAE Central Bank</li>
            <li>Zero FX risk for merchants</li>
            <li>Instant atomic settlement</li>
          </ul>
        </div>
        <div>
          <div class="card" style="text-align:center; padding: 40px;">
            <h3 style="margin-bottom:20px; font-size: 2rem;">Why Palm USD?</h3>
            <p style="color: var(--text-dim); margin-bottom: 20px;">
              Merchants hate volatility. By exclusively processing payments in Palm USD, 
              Palm SLIK guarantees that $25 charged is exactly $25 settled.
            </p>
            <div style="font-size: 4rem; margin-top: 30px;">🌴💵</div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

// Insert before Slide 5
html = html.replace('<!-- SLIDE 5: MARKET -->', newSlide + '\n  <!-- SLIDE 6: MARKET -->');

// Renumber slides
html = html.replace(/05 \/ 09/g, '06 / 10');
html = html.replace(/06 \/ 09/g, '07 / 10');
html = html.replace(/07 \/ 09/g, '08 / 10');
html = html.replace(/08 \/ 09/g, '09 / 10');
html = html.replace(/09 \/ 09/g, '10 / 10');
html = html.replace(/01 \/ 09/g, '01 / 10');
html = html.replace(/02 \/ 09/g, '02 / 10');
html = html.replace(/03 \/ 09/g, '03 / 10');
html = html.replace(/04 \/ 09/g, '04 / 10');

fs.writeFileSync('pitch-deck.html', html);
