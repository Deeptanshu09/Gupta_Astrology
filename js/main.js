function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById('page-' + id);
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-tab[data-page="${id}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function calculateAll() {
    const dob = document.getElementById('k-dob').value;
    const tob = document.getElementById('k-tob').value;
    if (!dob || !tob) {
        alert('Please enter Date of Birth and Time of Birth.');
        return;
    }

    const lat = parseFloat(document.getElementById('k-lat').value) || 19.08;
    const lon = parseFloat(document.getElementById('k-lon').value) || 72.88;
    const utc = parseFloat(document.getElementById('k-utc').value) || 5.5;
    const ayanType = document.getElementById('k-ayan').value;
    const name = document.getElementById('k-name').value || 'Native';

    // Calculate positions using engine
    const data = getSidLons(dob, tob, utc, ayanType);
    const lagna = getLagna(data.jde, lat, lon, data.ayan);
    const lagnaSign = Math.floor(lagna / 30) + 1;

    // Save calculation outputs globally to G state namespace
    G.sidLons = data.sidLons;
    G.ayan = data.ayan;
    G.jde = data.jde;
    G.lagna = lagna;
    G.lagnaSign = lagnaSign;
    G.yr = data.yr;
    G.mo = data.mo;
    G.dy = data.dy;

    // Fire interface builders
    renderCoreInfo(name);
    renderPlanetGrid();
    drawRashiChart();          // FIX: now actually draws houses + signs + planets
    renderHouseTable();        // was referenced in HTML but never populated
    renderRemedies();

    // Reveal calculated sections container
    document.getElementById('kundli-results').style.display = 'block';

    // Toggle hidden placeholder states across all pages
    ['navamsa', 'doshas', 'dasha', 'transit', 'remedies'].forEach(p => {
        let ph = document.getElementById(p + '-placeholder');
        let res = document.getElementById(p + '-results');
        if (ph) ph.style.display = 'none';
        if (res) res.style.display = 'block';
    });
}

function renderCoreInfo(name) {
    const infoContainer = document.getElementById('core-info');
    if (!infoContainer) return;

    const moonLon = G.sidLons[1];
    const moonSign = Math.floor(moonLon / 30) + 1;
    const sunSign = Math.floor(G.sidLons[0] / 30) + 1;
    const moonNak = Math.floor(moonLon / (360 / 27));
    const nakPad = Math.floor((moonLon % (360 / 27)) / (360 / 27 / 4)) + 1;
    const lagnaDeg = (G.lagna % 30).toFixed(2);

    infoContainer.innerHTML = `
        <div class="info-item"><div class="lbl">Name</div><div class="val">${name}</div></div>
        <div class="info-item"><div class="lbl">Lagna (Ascendant)</div><div class="val highlight">${RASHIS[G.lagnaSign - 1]} ${lagnaDeg}°</div></div>
        <div class="info-item"><div class="lbl">Moon Rashi</div><div class="val">${RASHIS[moonSign - 1]}</div></div>
        <div class="info-item"><div class="lbl">Sun Sign (Vedic)</div><div class="val">${RASHIS[sunSign - 1]}</div></div>
        <div class="info-item"><div class="lbl">Nakshatra</div><div class="val">${NAKSHATRAS[moonNak]} (Pada ${nakPad})</div></div>
        <div class="info-item"><div class="lbl">Ayanamsa Value</div><div class="val">${G.ayan.toFixed(4)}°</div></div>
    `;
}

function renderPlanetGrid() {
    const grid = document.getElementById('planet-grid');
    if (!grid) return;

    let html = '';
    PLANETS.forEach((p, idx) => {
        let lon = G.sidLons[idx];
        let signIdx = Math.floor(lon / 30);
        let deg = lon % 30;
        let house = ((signIdx + 1 - G.lagnaSign + 12) % 12) + 1;
        html += `
            <div class="planet-card">
                <div class="p-name">${PLANET_SK ? PLANET_SK[idx] : p} (${p})</div>
                <div class="p-sign">${RASHIS[signIdx]}</div>
                <div class="p-deg">${deg.toFixed(2)}°</div>
                <div class="p-house">House ${house} · ${RASHIS_EN[signIdx]}</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

// FIX: this is the function responsible for the bug in your screenshot.
// The old version only drew the outer box + one X diagonal + one inner
// diamond -- it never drew the 4 lines that split the chart into 12 houses,
// never labeled which Rashi sits in which house, and never placed planet
// abbreviations. Below is a complete North-Indian style renderer.
function drawRashiChart() {
    const svg = document.getElementById('rashi-svg');
    if (!svg) return;
    svg.innerHTML = '';

    const NS = "http://www.w3.org/2000/svg";
    const W = 280, H = 280, cx = 140, cy = 140, U = W / 4;
    const borderColor = '#4A4038';
    const textColor = '#9A9080';
    const goldColor = '#B8924A';

    function el(tag, attrs, text) {
        const e = document.createElementNS(NS, tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (text !== undefined) e.textContent = text;
        return e;
    }

    // Background + outer border
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#181511' }));
    svg.appendChild(el('rect', { x: 1, y: 1, width: W - 2, height: H - 2, stroke: borderColor, fill: 'none', 'stroke-width': 1 }));

    // 4x4 grid lines (this is what was missing -- creates the 12 house cells)
    [U, U * 2, U * 3].forEach(x => svg.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: H, stroke: borderColor, 'stroke-width': 0.5 })));
    [U, U * 2, U * 3].forEach(y => svg.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y, stroke: borderColor, 'stroke-width': 0.5 })));

    // House center positions in standard North Indian diamond layout, H1 = top-center
    const housePositions = [
        { cx: cx,            cy: U / 2 },
        { cx: cx + U * 1.25, cy: U / 2 },
        { cx: cx + U * 1.5,  cy: cy - U / 4 },
        { cx: cx + U * 1.5,  cy: cy },
        { cx: cx + U * 1.5,  cy: cy + U / 4 },
        { cx: cx + U * 1.25, cy: H - U / 2 },
        { cx: cx,            cy: H - U / 2 },
        { cx: cx - U * 1.25, cy: H - U / 2 },
        { cx: cx - U * 1.5,  cy: cy + U / 4 },
        { cx: cx - U * 1.5,  cy: cy },
        { cx: cx - U * 1.5,  cy: cy - U / 4 },
        { cx: cx - U * 1.25, cy: U / 2 },
    ];

    // Group planets by house so multiple grahas in one house stack correctly
    const houseOccupants = {};
    G.sidLons.forEach((lon, pIdx) => {
        const signNum = Math.floor(lon / 30) + 1;
        const house = ((signNum - G.lagnaSign + 12) % 12) + 1;
        if (!houseOccupants[house]) houseOccupants[house] = [];
        houseOccupants[house].push(PLANET_ABBR[pIdx]);
    });

    housePositions.forEach((pos, i) => {
        const houseNum = i + 1;
        const signNum = ((G.lagnaSign - 1 + i) % 12) + 1;

        // Rashi label (was completely absent before)
        const signLabel = el('text', {
            x: pos.cx, y: pos.cy - 6, 'text-anchor': 'middle',
            'font-size': 9.5, fill: textColor, 'font-family': 'DM Sans, sans-serif'
        }, RASHIS[signNum - 1].slice(0, 3));
        svg.appendChild(signLabel);

        if (i === 0) {
            svg.appendChild(el('text', {
                x: pos.cx, y: pos.cy - 18, 'text-anchor': 'middle',
                'font-size': 8, fill: goldColor, 'font-family': 'DM Sans, sans-serif'
            }, 'Lagna'));
        }

        svg.appendChild(el('text', {
            x: pos.cx, y: pos.cy + 5, 'text-anchor': 'middle',
            'font-size': 7, fill: '#6A6058', 'font-family': 'DM Sans, sans-serif'
        }, 'H' + houseNum));

        // Planet abbreviations (was completely absent before -- root cause of the bug)
        const occupants = houseOccupants[houseNum] || [];
        if (occupants.length) {
            svg.appendChild(el('text', {
                x: pos.cx, y: pos.cy + 18, 'text-anchor': 'middle',
                'font-size': 8.5, fill: goldColor, 'font-weight': 500, 'font-family': 'DM Sans, sans-serif'
            }, occupants.join(' ')));
        }
    });
}

// New: this table existed in index.html (#house-table) but nothing ever filled it in.
function renderHouseTable() {
    const container = document.getElementById('house-table');
    if (!container) return;

    let html = `<table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr>
            <th style="padding:7px 10px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">House</th>
            <th style="padding:7px 10px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">Sign</th>
            <th style="padding:7px 10px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">Planets</th>
            <th style="padding:7px 10px;text-align:left;border-bottom:1px solid var(--border);font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:.06em">Signification</th>
        </tr></thead><tbody>`;

    for (let h = 1; h <= 12; h++) {
        const signIdx = ((G.lagnaSign - 1) + (h - 1)) % 12;
        const occupants = [];
        G.sidLons.forEach((lon, pIdx) => {
            const pSignNum = Math.floor(lon / 30) + 1;
            const pHouse = ((pSignNum - G.lagnaSign + 12) % 12) + 1;
            if (pHouse === h) occupants.push(PLANET_ABBR[pIdx]);
        });
        html += `<tr>
            <td style="padding:7px 10px;border-bottom:1px solid var(--border);color:var(--gold);font-weight:500">H${h}</td>
            <td style="padding:7px 10px;border-bottom:1px solid var(--border)">${RASHIS[signIdx]}</td>
            <td style="padding:7px 10px;border-bottom:1px solid var(--border);color:var(--gold)">${occupants.join(', ') || '—'}</td>
            <td style="padding:7px 10px;border-bottom:1px solid var(--border);color:var(--text2);font-size:12px">${HOUSE_SIGNIFICATIONS[h - 1]}</td>
        </tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderRemedies() {
    const grid = document.getElementById('gem-grid');
    if (!grid) return;

    const lagnaLordIdx = SIGN_LORDS[G.lagnaSign - 1];

    let html = PLANET_GEMS.map((g, i) => {
        const isRec = (i === lagnaLordIdx);
        return `
            <div class="gem-card">
                <div class="g-name">${g[0]} ${isRec ? '⭐' : ''}</div>
                <div class="g-planet">${PLANETS[i]}</div>
                <div class="g-benefit">${PLANET_BENEFITS[i]}</div>
                ${isRec ? '<div style="font-size:11px; color:var(--gold); margin-top:6px; border:1px solid rgba(184,146,74,0.3); padding:3px;">Recommended (Lagna Lord)</div>' : ''}
            </div>
        `;
    }).join('');
    grid.innerHTML = html;
}
