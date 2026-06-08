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

    // Save calculation outputs globally to G state namespaces
    G.sidLons = data.sidLons;
    G.ayan = data.ayan;
    G.jde = data.jde;
    G.lagna = lagna;
    G.lagnaSign = lagnaSign;
    G.yr = data.yr;
    G.mo = data.mo;
    G.dy = data.dy;

    // Fire Interface Builders
    renderCoreInfo(name);
    renderPlanetGrid();
    drawRashiChart();
    renderRemedies();

    // Reveal calculated sections container
    document.getElementById('kundli-results').style.display = 'block';
    
    // Toggle hidden alerts across placeholder states
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
    
    let html = `
        <div class="info-item"><div class="lbl">Name</div><div class="val">${name}</div></div>
        <div class="info-item"><div class="lbl">Lagna (Ascendant)</div><div class="val highlight">${RASHIS[G.lagnaSign - 1]} (${G.lagna.toFixed(2)}°)</div></div>
        <div class="info-item"><div class="lbl">Ayanamsa Value</div><div class="val">${G.ayan.toFixed(4)}°</div></div>
    `;
    infoContainer.innerHTML = html;
}

function renderPlanetGrid() {
    const grid = document.getElementById('planet-grid');
    if (!grid) return;

    let html = '';
    PLANETS.forEach((p, idx) => {
        let lon = G.sidLons[idx];
        let signIdx = Math.floor(lon / 30);
        let deg = lon % 30;
        html += `
            <div class="planet-card">
                <div class="p-name">${p}</div>
                <div class="p-sign">${RASHIS[signIdx]}</div>
                <div class="p-deg">${deg.toFixed(2)}°</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function drawRashiChart() {
    const svg = document.getElementById('rashi-svg');
    if (!svg) return;
    svg.innerHTML = ''; // Reset frame layout

    // Draw external box boundary lines
    let box = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    box.setAttribute("x", "0"); box.setAttribute("y", "0");
    box.setAttribute("width", "280"); box.setAttribute("height", "280");
    box.setAttribute("stroke", "#3A3228"); box.setAttribute("fill", "none"); box.setAttribute("stroke-width", "2");
    svg.appendChild(box);

    // Draw traditional North Indian cross diagonals lines
    let d1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    d1.setAttribute("x1", "0"); d1.setAttribute("y1", "0"); d1.setAttribute("x2", "280"); d1.setAttribute("y2", "280");
    d1.setAttribute("stroke", "#3A3228"); d1.setAttribute("stroke-width", "1");
    svg.appendChild(d1);

    let d2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    d2.setAttribute("x1", "280"); d2.setAttribute("y1", "0"); d2.setAttribute("x2", "0"); d2.setAttribute("y2", "280");
    d2.setAttribute("stroke", "#3A3228"); d2.setAttribute("stroke-width", "1");
    svg.appendChild(d2);
    
    // Add central diamond borders
    let innerDiamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    innerDiamond.setAttribute("points", "140,0 280,140 140,280 0,140");
    innerDiamond.setAttribute("stroke", "#3A3228"); innerDiamond.setAttribute("fill", "none");
    svg.appendChild(innerDiamond);
}

function renderRemedies() {
    const grid = document.getElementById('gem-grid');
    if (!grid) return;
    
    // SAFE PARSING: Read Lagna lord cleanly using fixed context array rules
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