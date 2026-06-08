function norm(v) { 
    let a = v % 360; 
    if (a < 0) a += 360; 
    return a; 
}

function jdn(year, month, day) {
    let y = year, m = month;
    if (m <= 2) { y--; m += 12; }
    let A = Math.floor(y / 100);
    let B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function ayanamsa(jde, type) {
    let t = (jde - 2451545.0) / 36525;
    let lahiri = 23.85 + 1.396 * t; // Linear Sidereal Approximation
    if (type === 'raman') return lahiri - 1.44;
    if (type === 'krishnamurti') return lahiri - 0.08;
    return lahiri;
}

function tropLons(jde) {
    let t = (jde - 2451545.0) / 36525;
    // Approximated orbital offsets 
    let su = 280.46 + 36000.77 * t;
    let mo = 218.31 + 481267.88 * t;
    let ma = 332.16 + 19140.30 * t;
    let me = 102.27 + 149472.67 * t;
    let ju = 34.40 + 3034.74 * t;
    let ve = 272.30 + 58517.81 * t;
    let sa = 135.04 + 1222.11 * t;
    let ra = 125.04 - 1934.13 * t; // Mean Node
    let ke = norm(ra + 180);
    return [su, mo, ma, me, ju, ve, sa, ra, ke].map(norm);
}

function getSidLons(dob, tob, utc, ayanType) {
    const [yr, mo, dy] = dob.split('-').map(Number);
    const [hr, mn] = tob.split(':').map(Number);
    let utHr = hr + mn / 60 - utc;
    let jde = jdn(yr, mo, dy) + utHr / 24;
    let ayan = ayanamsa(jde, ayanType);
    let tl = tropLons(jde);
    let sidLons = tl.map(l => norm(l - ayan));
    return { sidLons, ayan, jde, utHr, yr, mo, dy };
}

function getLagna(jde, lat, lon, ayan) {
    let t = (jde - 2451545.0) / 36525;
    let siderealTime = norm(280.46 + 360.9856 * (jde - 2451545.0) + lon);
    let obliq = 23.439 - 0.013 * t;
    let num = Math.sin(siderealTime * rad);
    let den = Math.cos(siderealTime * rad) * Math.cos(obliq * rad) - Math.tan(lat * rad) * Math.sin(obliq * rad);
    let ascendant = norm(Math.atan2(num, den) / rad - ayan);
    return ascendant;
}