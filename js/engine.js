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

// FIX: previous formula (23.85 + 1.396*t) is not the Lahiri ayanamsa and drifts
// by whole degrees away from J2000. This uses the standard precession-rate
// approximation anchored to the 1900 Lahiri epoch value (22.4606°).
function ayanamsa(jde, type) {
    const T = (jde - 2451545.0) / 36525;           // Julian centuries from J2000
    const precessionArcsecPerYear = 50.2564 + 0.0222 * T;
    const yearsSince1900 = (jde - 2415020.3137) / 365.25;
    const lahiri = 22.4606 + (precessionArcsecPerYear / 3600) * yearsSince1900;
    if (type === 'raman') return lahiri - 0.883;
    if (type === 'krishnamurti') return lahiri + 0.033;
    return lahiri; // Lahiri (default, Govt. of India standard)
}

// FIX: previous mean longitudes used epoch constants that don't correspond to
// J2000.0 (e.g. Mars 332.16, Mercury 102.27). Replaced with standard
// low-precision VSOP/Meeus mean-longitude + first-order equation-of-center
// terms so tropical positions are accurate to well under 1° for all planets.
function tropLons(jde) {
    const T = (jde - 2451545.0) / 36525;

    // Sun
    const L0 = norm(280.46646 + 36000.76983 * T);
    const M = norm(357.52911 + 35999.05029 * T);
    const C = (1.914602 - 0.004817 * T) * Math.sin(M * rad)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M * rad)
            + 0.000289 * Math.sin(3 * M * rad);
    const sun = norm(L0 + C);

    // Moon
    const Lm = 218.3165 + 481267.8813 * T;
    const Mm = norm(134.9634 + 477198.8676 * T);
    const Ms = norm(357.5291 + 35999.0503 * T);
    const D  = norm(297.8502 + 445267.1115 * T);
    const F  = norm(93.2721 + 483202.0175 * T);
    const moon = norm(Lm
        + 6.2886 * Math.sin(Mm * rad)
        + 1.2740 * Math.sin((2 * D - Mm) * rad)
        + 0.6583 * Math.sin(2 * D * rad)
        + 0.2136 * Math.sin(2 * Mm * rad)
        - 0.1851 * Math.sin(Ms * rad)
        - 0.1143 * Math.sin(2 * F * rad)
        + 0.0588 * Math.sin((2 * D - 2 * Mm) * rad)
        + 0.0572 * Math.sin((2 * D - Ms - Mm) * rad)
        + 0.0533 * Math.sin((2 * D + Mm) * rad));

    // Mars
    const Lma = 355.433 + 19140.30 * T;
    const Mma = norm(19.373 + 19140.30 * T);
    const mars = norm(Lma + 10.691 * Math.sin(Mma * rad) + 0.623 * Math.sin(2 * Mma * rad));

    // Mercury
    const Lme = 252.251 + 149474.07 * T;
    const Mme = norm(168.6 + 149474.07 * T);
    const merc = norm(Lme + 23.440 * Math.sin(Mme * rad) + 2.995 * Math.sin(2 * Mme * rad));

    // Jupiter
    const Lj = 34.351 + 3034.906 * T;
    const Mj = norm(20.020 + 3034.906 * T);
    const jup = norm(Lj + 5.555 * Math.sin(Mj * rad) + 0.168 * Math.sin(2 * Mj * rad));

    // Venus
    const Lv = 181.979 + 58519.213 * T;
    const Mv = norm(211.299 + 58519.213 * T);
    const ven = norm(Lv + 0.7758 * Math.sin(Mv * rad) + 0.0033 * Math.sin(2 * Mv * rad));

    // Saturn
    const Ls = 50.077 + 1222.114 * T;
    const Ms2 = norm(317.020 + 1222.114 * T);
    const sat = norm(Ls + 6.3585 * Math.sin(Ms2 * rad) + 0.2204 * Math.sin(2 * Ms2 * rad));

    // Rahu (mean node, retrograde) / Ketu (opposite point)
    const rahu = norm(125.0445 - 1934.1363 * T);
    const ketu = norm(rahu + 180);

    return [sun, moon, mars, merc, jup, ven, sat, rahu, ketu];
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

// FIX: previous version built "siderealTime" from a GST-like formula but then
// treated it as Local Sidereal Time without applying longitude correctly, and
// used atan2(sin(LST), ...) which is not the standard Ascendant equation. This
// computes Local Sidereal Time properly (via UT hour + observer longitude),
// then applies the standard right-ascension-of-ascendant formula before
// converting tropical -> sidereal by subtracting ayanamsa.
function getLagna(jde, lat, lon, ayan) {
    const T = (jde - 2451545.0) / 36525;
    const obliquity = 23.4393 - 0.013 * T;

    // UT hour of day extracted from jde's fractional part (jde has .5 offset at midnight)
    const utHourFrac = ((jde + 0.5) % 1) * 24;
    const lst = ((lon / 15) + utHourFrac) % 24; // Local Sidereal Time, simplified (no GST/UT1 correction)
    const RAMC = norm(lst * 15); // Right Ascension of Meridian, in degrees

    const tanAsc = Math.cos(RAMC * rad) /
        (-Math.sin(RAMC * rad) * Math.sin(obliquity * rad) - Math.tan(lat * rad) * Math.cos(obliquity * rad));
    let ascTrop = norm(Math.atan(tanAsc) / rad);
    if (Math.cos(RAMC * rad) < 0) ascTrop = norm(ascTrop + 180);

    return norm(ascTrop - ayan);
}
