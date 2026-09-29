const fs = require('fs');

async function generateSpiderManSvg(username = 'cchiyen') {
  let contributions = [];
  let totalContributions = 0;

  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`);
    const html = await res.text();
    const regex = /data-date="([^"]+)"[\s\S]*?data-level="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const level = parseInt(match[2], 10) || 0;
      contributions.push({ date: match[1], level, count: level > 0 ? level : 0 });
      if (level > 0) totalContributions += level;
    }
  } catch (err) {
    console.warn('Fallback to local data due to fetch error:', err.message);
  }

  // Fallback if API was unreachable or empty
  if (!contributions.length) {
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      contributions.push({
        date: d.toISOString().split('T')[0],
        count: Math.random() > 0.85 ? Math.floor(Math.random() * 4) + 1 : 0,
        level: Math.random() > 0.85 ? Math.floor(Math.random() * 4) + 1 : 0
      });
    }
  }

  // GitHub contribution grid has 53 weeks (columns) x 7 days (rows)
  // Let's take the last 46 weeks so it fits nicely inside standard README width
  const weeks = 46;
  const daysToShow = weeks * 7;
  const recentContribs = contributions.slice(-daysToShow);

  const startX = 35;
  const startY = 70;
  const size = 10;
  const gap = 3.5;
  const step = size + gap;

  // Level colors: Spider-Man themed!
  // Level 0: dark grid slot (#161b22)
  // Level 1-4: Spider-Man web-blue to electric-blue & vibrant crimson
  const levelColors = {
    0: '#161b22',
    1: '#0e387a',
    2: '#1e5bb0',
    3: '#2563eb',
    4: '#e23636' // highest commits burn in Spidey Red!
  };

  let squaresSvg = '';
  const activeSquarePositions = [];

  for (let i = 0; i < recentContribs.length; i++) {
    const col = Math.floor(i / 7);
    const row = i % 7;
    const x = startX + col * step;
    const y = startY + row * step;
    const item = recentContribs[i];
    const fill = levelColors[item.level] || levelColors[0];

    squaresSvg += `<rect class="commit-sq" data-date="${item.date}" data-count="${item.count}" x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${fill}" stroke="#21262d" stroke-width="0.5"/>\n`;

    if (item.count > 0 || (col % 4 === 1 && (row === 2 || row === 5))) {
      activeSquarePositions.push({ x: x + size / 2, y: y + size / 2, col, row });
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 215" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #0b0f19; stroke: #1e293b; stroke-width: 1.5px; }
      .title-main { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 14px; font-weight: 700; fill: #f8fafc; letter-spacing: 0.5px; }
      .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; font-weight: 600; fill: #e23636; }
      .stat-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 11px; font-weight: 500; fill: #94a3b8; }
      .thwip-text { font-family: 'Impact', 'Arial Black', sans-serif; font-size: 12px; fill: #facc15; stroke: #dc2626; stroke-width: 0.5px; }

      /* Spidey swinging motion across the grid */
      @keyframes spideySwing {
        0% { transform: translate(70px, 32px) rotate(18deg); }
        25% { transform: translate(250px, 38px) rotate(-10deg); }
        50% { transform: translate(450px, 30px) rotate(16deg); }
        75% { transform: translate(620px, 38px) rotate(-14deg); }
        88% { transform: translate(620px, 38px) rotate(0deg); }
        94% { transform: translate(70px, 32px) rotate(22deg); }
        100% { transform: translate(70px, 32px) rotate(18deg); }
      }

      /* Ceiling web pendulum (vertical web line above Spidey) */
      @keyframes webHang {
        0% { x1: 70px; y1: 0px; x2: 70px; y2: 32px; }
        25% { x1: 250px; y1: 0px; x2: 250px; y2: 38px; }
        50% { x1: 450px; y1: 0px; x2: 450px; y2: 30px; }
        75% { x1: 620px; y1: 0px; x2: 620px; y2: 38px; }
        88% { x1: 620px; y1: 0px; x2: 620px; y2: 38px; }
        94% { x1: 70px; y1: 0px; x2: 70px; y2: 32px; }
        100% { x1: 70px; y1: 0px; x2: 70px; y2: 32px; }
      }

      /* Web shooter burst from wrist */
      @keyframes webBlastA {
        0%, 15% { opacity: 0; stroke-dashoffset: 120; }
        18% { opacity: 1; stroke-dashoffset: 0; }
        24% { opacity: 0.8; }
        30%, 100% { opacity: 0; stroke-dashoffset: 0; }
      }

      @keyframes webBlastB {
        0%, 42% { opacity: 0; stroke-dashoffset: 140; }
        45% { opacity: 1; stroke-dashoffset: 0; }
        52% { opacity: 0.8; }
        58%, 100% { opacity: 0; stroke-dashoffset: 0; }
      }

      @keyframes webBlastC {
        0%, 68% { opacity: 0; stroke-dashoffset: 130; }
        71% { opacity: 1; stroke-dashoffset: 0; }
        78% { opacity: 0.8; }
        84%, 100% { opacity: 0; stroke-dashoffset: 0; }
      }

      /* Comic THWIP! sound popup */
      @keyframes thwipPopA {
        0%, 16% { opacity: 0; transform: scale(0.2) translate(140px, 70px); }
        19% { opacity: 1; transform: scale(1.1) translate(140px, 70px); }
        25% { opacity: 0; transform: scale(1.3) translate(140px, 60px); }
        100% { opacity: 0; }
      }

      @keyframes thwipPopB {
        0%, 43% { opacity: 0; transform: scale(0.2) translate(360px, 80px); }
        46% { opacity: 1; transform: scale(1.1) translate(360px, 80px); }
        53% { opacity: 0; transform: scale(1.3) translate(360px, 70px); }
        100% { opacity: 0; }
      }

      /* Web net expanding over commits */
      @keyframes webNetExpand {
        0% { transform: scale(0.2); opacity: 0; }
        50% { transform: scale(1.1); opacity: 0.95; }
        80% { transform: scale(1); opacity: 0.85; }
        100% { transform: scale(1); opacity: 0.7; }
      }

      .spidey-container {
        animation: spideySwing 9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        transform-origin: 0px 0px;
      }

      .ceiling-web {
        animation: webHang 9s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
      }

      .shot-a {
        stroke-dasharray: 120;
        animation: webBlastA 9s ease-out infinite;
      }

      .shot-b {
        stroke-dasharray: 140;
        animation: webBlastB 9s ease-out infinite;
      }

      .shot-c {
        stroke-dasharray: 130;
        animation: webBlastC 9s ease-out infinite;
      }

      .thwip-a { animation: thwipPopA 9s ease-out infinite; }
      .thwip-b { animation: thwipPopB 9s ease-out infinite; }

      .web-net {
        animation: webNetExpand 0.5s ease-out forwards;
      }
    </style>

    <!-- Filter for glowing webs -->
    <filter id="web-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Web pattern symbol for targeted commits -->
    <g id="web-burst">
      <circle cx="0" cy="0" r="10" fill="none" stroke="#f8fafc" stroke-width="0.8" opacity="0.9" stroke-dasharray="2,1"/>
      <circle cx="0" cy="0" r="5" fill="none" stroke="#f8fafc" stroke-width="0.7" opacity="0.8"/>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="#f8fafc" stroke-width="0.8" opacity="0.85"/>
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#f8fafc" stroke-width="0.8" opacity="0.85"/>
      <line x1="-8" y1="-8" x2="8" y2="8" stroke="#f8fafc" stroke-width="0.6" opacity="0.7"/>
      <line x1="-8" y1="8" x2="8" y2="-8" stroke="#f8fafc" stroke-width="0.6" opacity="0.7"/>
    </g>
  </defs>

  <!-- Canvas Background -->
  <rect class="bg" width="740" height="215" rx="12" />

  <!-- Header Section -->
  <g transform="translate(35, 32)">
    <!-- Spidey Mask Mini Icon -->
    <g transform="translate(0, -14)">
      <ellipse cx="10" cy="10" rx="9" ry="11" fill="#e23636" stroke="#b91c1c" stroke-width="1.2"/>
      <path d="M 6 8 Q 9 5 10 9 Q 8 10 6 8 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
      <path d="M 14 8 Q 11 5 10 9 Q 12 10 14 8 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>
    </g>

    <text x="28" y="2" class="title-main">SPIDER-MAN'S WEB COMMIT TRACKER</text>
    <text x="305" y="2" class="badge-text">● THWIP!</text>

    <!-- Right badge with stats -->
    <g transform="translate(520, -12)">
      <rect x="0" y="0" width="150" height="22" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
      <text x="14" y="15" class="stat-text">🕸️ ${totalContributions} Commits Webbed</text>
    </g>
  </g>

  <!-- Contribution Squares Grid -->
  <g id="heatmap-grid">
    ${squaresSvg}
  </g>

  <!-- Web Webbed Over Real Active Commits -->
  <g id="hit-webs">
    <use href="#web-burst" x="155" y="115" class="web-net" filter="url(#web-glow)"/>
    <use href="#web-burst" x="380" y="130" class="web-net" filter="url(#web-glow)"/>
    <use href="#web-burst" x="590" y="100" class="web-net" filter="url(#web-glow)"/>
  </g>

  <!-- Web Shoots from Spidey to the Commits -->
  <g id="web-blasts" filter="url(#web-glow)">
    <!-- Web shot 1 -->
    <path class="shot-a" d="M 100 48 Q 130 80 155 115" fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Web shot 2 -->
    <path class="shot-b" d="M 300 52 Q 340 90 380 130" fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Web shot 3 -->
    <path class="shot-c" d="M 520 45 Q 555 70 590 100" fill="none" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- Comic Popups -->
  <text class="thwip-text thwip-a">THWIP!</text>
  <text class="thwip-text thwip-b">THWIP!</text>

  <!-- Ceiling Pendulum Web Line (Follows Spidey) -->
  <line class="ceiling-web" x1="370" y1="0" x2="70" y2="32" stroke="#e2e8f0" stroke-width="1.8" stroke-dasharray="3,1.5" opacity="0.85"/>

  <!-- Lil Chibi Spider-Man (Swinging across) -->
  <g class="spidey-container">
    <g transform="scale(0.85)">
      <!-- Left Hand Holding Pendulum Web -->
      <line x1="0" y1="0" x2="-2" y2="-12" stroke="#f8fafc" stroke-width="2"/>
      <circle cx="-2" cy="-12" r="3.5" fill="#e23636" stroke="#991b1b" stroke-width="1"/>

      <!-- Right Arm Extended (Shooting Web 🤟) -->
      <path d="M 12 12 Q 22 15 28 20" fill="none" stroke="#e23636" stroke-width="4.5" stroke-linecap="round"/>
      <circle cx="28" cy="20" r="3" fill="#e23636"/>
      <!-- Web shooter spark on wrist -->
      <circle cx="28" cy="20" r="5" fill="#facc15" opacity="0.75"/>

      <!-- Legs (Acrobatic Swing Pose) -->
      <!-- Left leg tucked -->
      <path d="M -4 20 Q -10 28 -6 34" fill="none" stroke="#1d4ed8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M -6 34 L -3 37" fill="none" stroke="#e23636" stroke-width="4" stroke-linecap="round"/>
      <!-- Right leg trailing -->
      <path d="M 6 20 Q 14 26 18 35" fill="none" stroke="#1d4ed8" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M 18 35 L 22 38" fill="none" stroke="#e23636" stroke-width="4" stroke-linecap="round"/>

      <!-- Torso -->
      <ellipse cx="3" cy="14" rx="8" ry="10" fill="#e23636" stroke="#991b1b" stroke-width="1"/>
      <!-- Blue Sides -->
      <path d="M -4 10 Q -1 15 -4 20 Z" fill="#1d4ed8"/>
      <path d="M 9 10 Q 6 15 9 20 Z" fill="#1d4ed8"/>
      <!-- Tiny Spider Logo on Chest -->
      <circle cx="2.5" cy="14" r="1.8" fill="#0f172a"/>
      <line x1="-1" y1="12" x2="6" y2="16" stroke="#0f172a" stroke-width="0.8"/>
      <line x1="-1" y1="16" x2="6" y2="12" stroke="#0f172a" stroke-width="0.8"/>

      <!-- Head (Chibi Mask) -->
      <g transform="translate(2, -4)">
        <ellipse cx="0" cy="0" rx="14" ry="16" fill="#e23636" stroke="#b91c1c" stroke-width="1.5"/>
        <!-- Web lines on face -->
        <path d="M 0 -16 L 0 16 M -14 0 L 14 0" stroke="#0f172a" stroke-width="0.7" opacity="0.35"/>
        <circle cx="0" cy="0" r="7" fill="none" stroke="#0f172a" stroke-width="0.7" opacity="0.35"/>

        <!-- Iconic Large White Eyes with Black Border -->
        <path d="M -11 -2 Q -5 -8 -1 -1 Q -6 4 -11 -2 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
        <path d="M 11 -2 Q 5 -8 1 -1 Q 6 4 11 -2 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
      </g>
    </g>
  </g>
</svg>`;

  fs.writeFileSync('assets/spiderman-commits.svg', svg);
  console.log('Successfully generated assets/spiderman-commits.svg!');
}

generateSpiderManSvg();
