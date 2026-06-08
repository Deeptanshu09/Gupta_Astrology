// Global Runtime Data Namespace
const G = {
    sidLons: [],
    ayan: 0,
    jde: 0,
    lagna: 0,
    lagnaSign: 1,
    yr: 2026,
    mo: 1,
    dy: 1
};

const rad = Math.PI / 180;
const RASHIS = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const RASHIS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PLANET_ABBR = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'];
const PLANET_COLORS = ['#E8C547','#B8C8E0','#E07040','#6FD8A0','#F5C842','#E891A0','#8888CC','#888888','#888888'];

// CRITICAL FIX: Explicit Sign Lord mapping array (0=Sun, 1=Moon, 2=Mars, 3=Mercury, 4=Jupiter, 5=Venus, 6=Saturn)
const SIGN_LORDS = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]; 

const NAKSHATRAS = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha',
    'Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'
];
const NAK_LORDS_VIM = [8,1,2,3,4,5,6,7,0,8,1,2,3,4,5,6,7,0,8,1,2,3,4,5,6,7,0];
const DASHA_YEARS = [7,20,6,10,16,19,17,18,7];
const DASHA_LORDS_VIM = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];

const PLANET_GEMS = [
    ['Ruby','Red'],['Pearl','White'],['Red Coral','Orange-Red'],['Emerald','Green'],
    ['Yellow Sapphire','Yellow'],['Diamond','Clear/White'],['Blue Sapphire','Blue'],
    ['Gomed','Honey'],['Cat\'s Eye','Gray-Green']
];
const PLANET_BENEFITS = [
    'Leadership, father, vitality','Mind, mother, emotions','Energy, courage, property',
    'Intellect, communication','Wisdom, wealth, children','Marriage, luxury, arts',
    'Discipline, longevity, career','Foreign travel, expansion','Spiritual liberation'
];