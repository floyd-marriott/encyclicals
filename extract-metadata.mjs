import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MARKDOWN_DIR = path.join(__dirname, 'encyclicals', 'markdown');
const META_DIR = path.join(__dirname, 'encyclicals', 'meta');
const HTML_DIR = path.join(__dirname, 'encyclicals', 'html');

// ─── Pope Metadata ───────────────────────────────────────────────────────────

const POPE_INFO = {
  alex04:    { regnalName: 'Alexander',  number: 4,  fullName: 'Alexander IV',  pontificateStart: 1254, pontificateEnd: 1261 },
  alex06:    { regnalName: 'Alexander',  number: 6,  fullName: 'Alexander VI',  pontificateStart: 1492, pontificateEnd: 1503 },
  alex07:    { regnalName: 'Alexander',  number: 7,  fullName: 'Alexander VII', pontificateStart: 1655, pontificateEnd: 1667 },
  ben12:     { regnalName: 'Benedict',   number: 12, fullName: 'Benedict XII',  pontificateStart: 1334, pontificateEnd: 1342 },
  ben14:     { regnalName: 'Benedict',   number: 14, fullName: 'Benedict XIV',  pontificateStart: 1740, pontificateEnd: 1758 },
  ben15:     { regnalName: 'Benedict',   number: 15, fullName: 'Benedict XV',   pontificateStart: 1914, pontificateEnd: 1922 },
  ben16:     { regnalName: 'Benedict',   number: 16, fullName: 'Benedict XVI',  pontificateStart: 2005, pontificateEnd: 2013 },
  bon08:     { regnalName: 'Boniface',   number: 8,  fullName: 'Boniface VIII', pontificateStart: 1294, pontificateEnd: 1303 },
  clem05:    { regnalName: 'Clement',    number: 5,  fullName: 'Clement V',     pontificateStart: 1305, pontificateEnd: 1314 },
  clem08:    { regnalName: 'Clement',    number: 8,  fullName: 'Clement VIII',  pontificateStart: 1592, pontificateEnd: 1605 },
  clem11:    { regnalName: 'Clement',    number: 11, fullName: 'Clement XI',    pontificateStart: 1700, pontificateEnd: 1721 },
  clem12:    { regnalName: 'Clement',    number: 12, fullName: 'Clement XII',   pontificateStart: 1730, pontificateEnd: 1740 },
  clem13:    { regnalName: 'Clement',    number: 13, fullName: 'Clement XIII',  pontificateStart: 1758, pontificateEnd: 1769 },
  clem14:    { regnalName: 'Clement',    number: 14, fullName: 'Clement XIV',   pontificateStart: 1769, pontificateEnd: 1774 },
  eugene04:  { regnalName: 'Eugene',     number: 4,  fullName: 'Eugene IV',     pontificateStart: 1431, pontificateEnd: 1447 },
  franc:     { regnalName: 'Francis',    number: 1,  fullName: 'Francis',       pontificateStart: 2013, pontificateEnd: null },
  greg09:    { regnalName: 'Gregory',    number: 9,  fullName: 'Gregory IX',    pontificateStart: 1227, pontificateEnd: 1241 },
  greg10:    { regnalName: 'Gregory',    number: 10, fullName: 'Gregory X',     pontificateStart: 1271, pontificateEnd: 1276 },
  greg16:    { regnalName: 'Gregory',    number: 16, fullName: 'Gregory XVI',   pontificateStart: 1831, pontificateEnd: 1846 },
  hon03:     { regnalName: 'Honorius',   number: 3,  fullName: 'Honorius III',  pontificateStart: 1216, pontificateEnd: 1227 },
  innoc04:   { regnalName: 'Innocent',   number: 4,  fullName: 'Innocent IV',   pontificateStart: 1243, pontificateEnd: 1254 },
  innoc11:   { regnalName: 'Innocent',   number: 11, fullName: 'Innocent XI',   pontificateStart: 1676, pontificateEnd: 1689 },
  john22:    { regnalName: 'John',       number: 22, fullName: 'John XXII',     pontificateStart: 1316, pontificateEnd: 1334 },
  john23:    { regnalName: 'John',       number: 23, fullName: 'John XXIII',    pontificateStart: 1958, pontificateEnd: 1963 },
  jp02:      { regnalName: 'John Paul',  number: 2,  fullName: 'John Paul II',  pontificateStart: 1978, pontificateEnd: 2005 },
  leo10:     { regnalName: 'Leo',        number: 10, fullName: 'Leo X',         pontificateStart: 1513, pontificateEnd: 1521 },
  leo12:     { regnalName: 'Leo',        number: 12, fullName: 'Leo XII',       pontificateStart: 1823, pontificateEnd: 1829 },
  leo13:     { regnalName: 'Leo',        number: 13, fullName: 'Leo XIII',      pontificateStart: 1878, pontificateEnd: 1903 },
  leo14:     { regnalName: 'Leo',        number: 14, fullName: 'Leo XIV',       pontificateStart: 2025, pontificateEnd: null },
  nichol03:  { regnalName: 'Nicholas',   number: 3,  fullName: 'Nicholas III',  pontificateStart: 1277, pontificateEnd: 1280 },
  nichol05:  { regnalName: 'Nicholas',   number: 5,  fullName: 'Nicholas V',    pontificateStart: 1447, pontificateEnd: 1455 },
  paul03:    { regnalName: 'Paul',       number: 3,  fullName: 'Paul III',      pontificateStart: 1534, pontificateEnd: 1549 },
  paul06:    { regnalName: 'Paul',       number: 6,  fullName: 'Paul VI',       pontificateStart: 1963, pontificateEnd: 1978 },
  pius05:    { regnalName: 'Pius',       number: 5,  fullName: 'Pius V',        pontificateStart: 1566, pontificateEnd: 1572 },
  pius06:    { regnalName: 'Pius',       number: 6,  fullName: 'Pius VI',       pontificateStart: 1775, pontificateEnd: 1799 },
  pius07:    { regnalName: 'Pius',       number: 7,  fullName: 'Pius VII',      pontificateStart: 1800, pontificateEnd: 1823 },
  pius08:    { regnalName: 'Pius',       number: 8,  fullName: 'Pius VIII',     pontificateStart: 1829, pontificateEnd: 1830 },
  pius09:    { regnalName: 'Pius',       number: 9,  fullName: 'Pius IX',       pontificateStart: 1846, pontificateEnd: 1878 },
  pius10:    { regnalName: 'Pius',       number: 10, fullName: 'Pius X',        pontificateStart: 1903, pontificateEnd: 1914 },
  pius11:    { regnalName: 'Pius',       number: 11, fullName: 'Pius XI',       pontificateStart: 1922, pontificateEnd: 1939 },
  pius12:    { regnalName: 'Pius',       number: 12, fullName: 'Pius XII',      pontificateStart: 1939, pontificateEnd: 1958 },
  sixtus04:  { regnalName: 'Sixtus',     number: 4,  fullName: 'Sixtus IV',     pontificateStart: 1471, pontificateEnd: 1484 },
  sixtus05:  { regnalName: 'Sixtus',     number: 5,  fullName: 'Sixtus V',      pontificateStart: 1585, pontificateEnd: 1590 },
};

// ─── Tag Rules ───────────────────────────────────────────────────────────────

const TAG_RULES = [
  { tag: 'social-doctrine',    keywords: ['social', 'capital', 'labor', 'worker', 'economic', 'rerum novarum', 'quadragesimo anno'] },
  { tag: 'marian',             keywords: ['mary', 'marian', 'virgin', 'immaculate', 'assumption', 'queenship', 'mother of god', 'blessed virgin', 'mater'] },
  { tag: 'rosary',             keywords: ['rosary', 'rosario'] },
  { tag: 'peace',              keywords: ['peace', 'pacem', 'world war', 'reconciliation', 'christmas message'] },
  { tag: 'sacred-heart',       keywords: ['sacred heart', 'heart of jesus', 'dilexit nos', 'haurietis aquas'] },
  { tag: 'education',          keywords: ['education', 'school', 'teaching', 'seminary', 'students'] },
  { tag: 'clergy',             keywords: ['clergy', 'priest', 'sacerdotal', 'ordination', 'seminary', 'bishop'] },
  { tag: 'marriage',           keywords: ['marriage', 'matrimony', 'wedlock', 'married', 'conjugal', 'mixed marriage'] },
  { tag: 'family',             keywords: ['family', 'children', 'parent', 'household'] },
  { tag: 'freemasonry',        keywords: ['freemasonry', 'masonic', 'humanum genus'] },
  { tag: 'modernism',          keywords: ['modernism', 'modernist', 'pascendi', 'sillon'] },
  { tag: 'communism',          keywords: ['communism', 'communist', 'atheistic', 'divini redemptoris'] },
  { tag: 'missions',           keywords: ['mission', 'missionary', 'evangelization', 'propagation', 'evangelii'] },
  { tag: 'eucharist',          keywords: ['eucharist', 'communion', 'sacrament', 'mass'] },
  { tag: 'scripture',          keywords: ['scripture', 'bible', 'biblical', 'divino afflante', 'sacred page'] },
  { tag: 'christology',        keywords: ['christ', 'redeemer', 'savior', 'jesus', 'lord', 'mystici corporis'] },
  { tag: 'ecclesiology',       keywords: ['church', 'mystical body', 'ecclesia', 'unity of the church'] },
  { tag: 'human-dignity',      keywords: ['human dignity', 'human liberty', 'human person', 'human rights', 'freedom'] },
  { tag: 'saints',             keywords: ['saint', 'canonization', 'st.', 'blessed'] },
  { tag: 'st-francis',         keywords: ['francis of assisi', 'st. francis assisi', 'poor man'] },
  { tag: 'dante',              keywords: ['dante'] },
  { tag: 'slavery',            keywords: ['slavery', 'slave', 'abolition', 'enslave'] },
  { tag: 'colonialism',        keywords: ['colony', 'colonial', 'portugal', 'spain', 'patronage', 'indies'] },
  { tag: 'science',            keywords: ['science', 'scientific', 'evolution', 'technology', 'research'] },
  { tag: 'christ-the-king',    keywords: ['christ the king', 'quas primas'] },
  { tag: 'prayer',             keywords: ['prayer', 'devotion', 'pious', 'spiritual'] },
  { tag: 'liturgy',            keywords: ['liturgy', 'liturgical', 'worship', 'sacred music', 'chant'] },
  { tag: 'ecumenism',          keywords: ['ecumenical', 'eastern churches', 'unity of christians', 'oriental'] },
  { tag: 'interfaith',         keywords: ['non-christian', 'jewish', 'islam', 'semitic'] },
  { tag: 'justice',            keywords: ['justice', 'right'] },
  { tag: 'charity',            keywords: ['charity', 'caritas', 'love of neighbor'] },
  { tag: 'persecution',        keywords: ['persecution', 'martyr', 'mexico', 'russia'] },
  { tag: 'immaculate-conception', keywords: ['immaculate conception', 'ineffabilis deus'] },
  { tag: 'assumption',         keywords: ['assumption', 'munificentissimus deus'] },
  { tag: 'religious-life',     keywords: ['religious life', 'monastic', 'consecrated', 'vows', 'virginity', 'nun'] },
  { tag: 'usury',              keywords: ['usury', 'interest', 'loan', 'vix pervenit'] },
  { tag: 'socialism',          keywords: ['socialism', 'socialist'] },
  { tag: 'liberalism',         keywords: ['liberalism', 'liberal', 'liberalist'] },
  { tag: 'secularism',         keywords: ['secularism', 'secular', 'laic', 'laicity'] },
  { tag: 'catholic-action',    keywords: ['catholic action', 'lay apostolate'] },
  { tag: 'holy-spirit',        keywords: ['holy spirit', 'divinum illud'] },
  { tag: 'angels',             keywords: ['angel'] },
  { tag: 'papacy',             keywords: ['papal', 'pontiff', 'apostolic see', 'peter', 'roman pontiff'] },
  { tag: 'moral-theology',     keywords: ['moral', 'conscience', 'sin', 'virtue'] },
  { tag: 'socialism',          keywords: ['socialism', 'socialist'] },
  { tag: 'nazism',             keywords: ['nazi', 'nazism', 'hitler', 'totalitarian'] },
  { tag: 'democracy',          keywords: ['democracy', 'democratic'] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

const ORDINAL_MAP = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20, twentyfirst: 21, twentysecond: 22, twentythird: 23,
  twentyfourth: 24, twentyfifth: 25, twentysixth: 26, twentyseventh: 27, twentyeighth: 28, twentyninth: 29,
  thirtieth: 30, thirtyfirst: 31,
};

function slugToTitle(slug) {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripItalic(s) {
  return s.replace(/[*_]/g, '').trim();
}

function numericOrdinal(s) {
  const m = s.match(/^(\d+)(?:st|nd|rd|th)?$/);
  if (m) return parseInt(m[1]);
  const clean = s.toLowerCase().replace(/\s+/g, '');
  return ORDINAL_MAP[clean] || null;
}

function parseMonth(s) {
  const clean = s.replace(/[,.]/g, '').trim().toLowerCase();
  return MONTHS[clean] || null;
}

// ─── Extraction Functions ────────────────────────────────────────────────────

const TYPE_PREFIXES = ['Enciclica ', 'Bolla ', 'Breve ', 'Lettera ', 'Costituzione '];

function stripTypePrefix(s) {
  for (const prefix of TYPE_PREFIXES) {
    if (s.toLowerCase().startsWith(prefix.toLowerCase())) {
      return s.slice(prefix.length).trim();
    }
  }
  return s;
}

function extractIncipit(content, slug) {
  const lines = content.split('\n');
  const firstLine = lines.find(l => l.trim().length > 0);
  if (!firstLine) return slugToTitle(slug);

  const trimmed = firstLine.trim();
  let incipit;

  if (trimmed.startsWith('# ')) {
    incipit = stripTypePrefix(trimmed.slice(2).trim());
  } else {
    incipit = trimmed;
  }

  return incipit;
}

function extractEnglishTitle(content) {
  const lines = content.split('\n');
  // Only scan the first half of the file for title info
  const scanLimit = Math.min(lines.length, Math.floor(lines.length / 2));

  // First pass: look for H2 headings in first half of document
  for (let i = 0; i < scanLimit; i++) {
    const t = lines[i].trim();
    if (t.startsWith('## ')) {
      const h2 = t.slice(3).trim();
      if (
        h2.length > 2 &&
        !h2.startsWith('ENCYCLICAL OF POPE') &&
        !h2.startsWith('ENCYCLICAL LETTER') &&
        !h2.startsWith('ENCYCLICAL ') &&
        !h2.match(/^[A-Z][A-Z\s]+$/) && // skip all-caps structural lines
        !h2.match(/^_The_\s+\*\*Holy See\*\*/) // skip Vatican footer
      ) {
        return h2;
      }
    }
  }

  // Second pass: Francis-style "ON...OF..." pattern after the pope name
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const t = lines[i].trim();
    const cleanName = t.replace(/[*_]/g, '').trim();
    if (cleanName === 'FRANCIS' || cleanName === 'POPE FRANCIS') {
      const subjectLines = [];
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const sj = lines[j].trim();
        const cleanSj = sj.replace(/[*_]/g, '').trim();
        if (cleanSj.startsWith('ON ') || cleanSj.startsWith('ON_')) {
          subjectLines.push(cleanSj.replace(/^ON[_ ]+/, '').trim());
        } else if (sj.length === 0 && subjectLines.length > 0) {
          break;
        } else if (subjectLines.length > 0) {
          subjectLines.push(cleanSj);
        }
      }
      if (subjectLines.length > 0) {
        return subjectLines.join(' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  // Third pass: look for "ON [SUBJECT]" lines within first 50 lines (multi-line support)
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const t = lines[i].trim().replace(/[*_\[\]]/g, '').trim();
    if (t.startsWith('ON ') && t.length > 5) {
      const subjectParts = [t.replace(/^ON\s+/, '').trim()];
      // Collect continuation lines (they should be short title fragments)
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const next = lines[j].trim().replace(/[*_\[\]]/g, '').trim();
        if (next.length === 0) break;
        if (next.match(/^(?:Blessing|Venerable|Beloved|Health|Greetings|INTRODUCTION|CHAPTER|1\.|1\s|\[)/i)) break;
        if (subjectParts.includes(next)) break;
        subjectParts.push(next);
      }
      return subjectParts.join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  return null;
}

function extractPopeAndYear(content, popeSlug) {
  const lines = content.split('\n');
  const info = POPE_INFO[popeSlug];

  let bestMatch = null;
  const scanLimit = Math.min(lines.length, 60);

  for (let i = 0; i < scanLimit; i++) {
    const line = lines[i];
    const t = stripItalic(line).replace(/\s+/g, ' ').trim();

    if (t === 'POPE FRANCIS') {
      bestMatch = { popeName: 'Francis', year: null, yearApproximate: false };
      continue;
    }

    // Match "Pope NAME NUMBER [— YEAR]"
    const m = t.match(/^Pope\s+(?:(BI|St)\.\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*([IVXL]+)?\s*(?:[—–-]\s*(\d{4}))?/);
    if (m) {
      const regnalName = m[2];
      const number = m[3] || '';
      const yearStr = m[4];
      const fullName = regnalName + (number ? ' ' + number : '');
      const year = yearStr ? parseInt(yearStr) : null;

      // Prefer matches WITH a year
      if (year) {
        return { popeName: fullName, year, yearApproximate: false };
      }
      if (!bestMatch) {
        bestMatch = { popeName: fullName, year: null, yearApproximate: false };
      }
    }
  }

  // Fallback: use info from slug
  if (bestMatch) return bestMatch;
  return { popeName: info ? info.fullName : slugToTitle(popeSlug), year: null, yearApproximate: true };
}

function extractDocumentType(content, slug) {
  const firstPart = content.slice(0, 8000);

  // Check file prefixes (used in ben14 translated files)
  const slugLower = slug.toLowerCase();
  if (slugLower.startsWith('enciclica-')) return 'encyclical-letter';
  if (slugLower.startsWith('bolla-')) return 'bull';
  if (slugLower.startsWith('breve-')) return 'brief';
  if (slugLower.startsWith('apostolica-constitutio')) return 'apostolic-constitution';

  // Explicit type markers in content
  if (firstPart.includes('ENCYCLICAL LETTER') || firstPart.includes('ENCYCLICAL OF POPE') || firstPart.includes('ENCYCLICAL  OF  THE  SUPREME  PONTIFF')) {
    return 'encyclical-letter';
  }
  if (firstPart.match(/##\s*ENCYCLICAL\s+OF\s+POPE/)) return 'encyclical-letter';
  // Match "ENCYCLICAL [TITLE] OF THE SUPREME PONTIFF" (ben14 format)
  if (firstPart.match(/^ENCYCLICAL\s+\w+/im)) return 'encyclical-letter';
  // Match "Encyclical Letter" or "Encyclical of" (mixed case, in body text)
  if (firstPart.match(/Encyclical\s+(?:Letter|of|On)/i)) return 'encyclical-letter';

  if (firstPart.includes('Apostolic Constitution')) return 'apostolic-constitution';
  if (firstPart.includes('Apostolic Letter') || firstPart.includes('APOSTOLIC LETTER')) return 'apostolic-letter';
  if (firstPart.includes('Motu Proprio')) return 'motu-proprio';

  // Body text type mentions
  if (firstPart.match(/\.\s*Bull\s+of\s+Pope/i) || firstPart.match(/^\s*Bull\s+of\s+Pope/i)) return 'bull';
  if (firstPart.match(/^\s*Bull\s+[A-Z]/i) && !firstPart.match(/^\s*Bull\s+Run/i)) return 'bull';
  if (firstPart.match(/^BULL OF OUR MOST HOLY LORD/i)) return 'bull';

  if (firstPart.match(/\.\s*Brief\s+of\s+our/i)) return 'brief';
  if (firstPart.match(/Brief of Pope/i)) return 'brief';

  // H2-based detection
  const h2Match = firstPart.match(/##\s+(.+?)(?:\n|$)/);
  if (h2Match) {
    const h2 = h2Match[1];
    if (/^Address\b/i.test(h2) && !/addressee/i.test(h2)) return 'address';
    if (/^Christmas Message/i.test(h2)) return 'christmas-message';
    if (/^Allocution\b/i.test(h2)) return 'allocution';
    if (/^Constitution\b/i.test(h2)) return 'constitution';
    if (/^Motu Proprio/i.test(h2)) return 'motu-proprio';
  }

  // Check for "[Christmas Message]" pattern (Pius XII)
  if (firstPart.includes('[Christmas Message]')) return 'christmas-message';

  return null;
}

function classifyAddresseeScope(addressee) {
  if (!addressee) return null;

  const countryPatterns = [
    'France', 'Italy', 'Germany', 'Poland', 'Austria', 'Hungary', 'Spain',
    'Portugal', 'Mexico', 'Brazil', 'Ireland', 'Switzerland', 'Bavaria',
    'United States', 'America', 'Latin America', 'South America',
    'Ruthenian', 'Eastern Churches', 'Armenia',
  ];

  for (const country of countryPatterns) {
    if (addressee.includes(country)) return country.toLowerCase().replace(/\s+/g, '-');
  }

  if (/Patriarchs|Primates|Archbishops|Bishops|Ordinaries/i.test(addressee) &&
      !/France|Italy|Germany/i.test(addressee)) {
    return 'universal';
  }

  return null;
}

function extractAddressee(content) {
  const lines = content.split('\n');

  // Line-based extraction (works for most files)
  let inAddressee = false;
  let addresseeLines = [];
  let addresseeStarted = false;

  for (const line of lines) {
    const t = line.trim();

    if (!inAddressee) {
      if (/^To\s+(?:\w+\s+)?(?:Venerable\s+)?(?:Brethren|Brothers)/i.test(t)) {
        inAddressee = true;
        addresseeLines.push(t);
        continue;
      }
      // Also match start of addressee in body (ben14 translated files with single-line body)
      if (/^To\s+(?:\w+\s+)?(?:Venerable\s+)?(?:Brethren|Brothers)/i.test(t.slice(0, 60))) {
        const startIdx = t.search(/To\s+(?:\w+\s+)?(?:Venerable\s+)?(?:Brethren|Brothers)/i);
        if (startIdx >= 0 && startIdx < 200) {
          inAddressee = true;
          addresseeLines.push(t.slice(startIdx));
          break;
        }
      }
      // Also match lines like "To His Venerable Brothers" (JP2 format with line breaks)
      if (/^To\s+(?:His|Our|the)\s+Venerable\s+(?:Brethren|Brothers)/i.test(t)) {
        inAddressee = true;
        addresseeLines.push(t);
        continue;
      }
    } else {
      if (t.length === 0) {
        if (addresseeLines.length > 0 && !addresseeStarted) break;
        if (addresseeStarted) break;
        continue;
      }
      if (/^(?:Venerable\s+)?(?:Brethren|Brothers)[,:]\s*(?:Health|Greetings|We\s+Give|and\s+Apostolic)/i.test(t)) break;
      if (/^We\s+(?:are|give|have|beseech|pray|impart|grant|send|address|greet|desire)/i.test(t)) break;
      if (/^It\s+(?:is|was|has)/i.test(t)) break;
      if (/^That\s+/i.test(t)) break;
      if (/^The\s+(?:spirit|condition|great|most)/i.test(t) && t.length < 100) break;
      if (/^1\.|^\d+\./.test(t)) break;
      if (t.startsWith('#')) break;
      // If we see what looks like the document's first paragraph, stop
      if (/^[A-Z][A-Z\s]{20,}/.test(t) && t.length > 30 && addresseeLines.length > 3) break;
      addresseeLines.push(t);
      addresseeStarted = true;
    }
  }

  if (addresseeLines.length > 0) {
    return addresseeLines.join(' ').replace(/\s+/g, ' ').trim();
  }

  // Full-text regex fallback for ben14 translated files (addressee embedded in body)
  const bodyAddressee = content.match(/To\s+(?:the\s+)?(?:Venerable\s+)?(?:Brothers?|Brethren)[^.]*?(?:Bishops?|Ordinaries|Clergy)[^.]*?\./i);
  if (bodyAddressee) return bodyAddressee[0].trim();

  return null;
}

function extractRawClosingDate(content) {
  // Find "Given at/in..." — search the full content (closing can be far from EOF due to footnotes)
  const givenIdx = content.search(/Given\s+(?:at|in)\s+(?:Rome|St\.\s*Peter|Saint\s+Mary|the\s+Vatican)/i);
  if (givenIdx === -1) return null;

  const fromGiven = content.slice(givenIdx);

  // Capture up to: double newline, footnote marker [n], end of string, or ---/***
  const endMatch = fromGiven.match(/^(.+?)(?:\n\s*\n|\n\s*\[|\n\s*\*{3,}|\n\s*\-{3,}|\n\s*\*{1,2}\s+\d|$)/s);
  if (endMatch) {
    let closing = endMatch[1].trim();
    // Remove trailing italic markers
    closing = closing.replace(/[_*]+$/, '').trim();
    return closing;
  }

  return null;
}

function hasClosingDate(content) {
  return extractRawClosingDate(content) !== null;
}

function parseYearFromClosing(closing) {
  if (!closing) return null;

  // Numeric year
  const m = closing.match(/(?:in\s+the\s+year\s+)?(\d{4})/);
  if (m) return parseInt(m[1]);

  // Word-form year: "one thousand nine hundred and fourteen"
  const wordYearMap = {
    'one thousand': 1000, 'two thousand': 2000, 'three thousand': 3000,
  };
  const wordMatch = closing.match(/(one|two|three)\s+thousand\s+(nine|eight|seven|six|five|four|three|two|one)\s+hundred\s+(and\s+)?(\w+)?/i);
  if (wordMatch) {
    const thousands = { one: 1, two: 2, three: 3 }[wordMatch[1].toLowerCase()] * 1000;
    const hundreds = { nine: 9, eight: 8, seven: 7, six: 6, five: 5, four: 4, three: 3, two: 2, one: 1 }[wordMatch[2].toLowerCase()] * 100;
    const tensMap = {
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
      twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
    };
    const onesMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };

    let tens = 0;
    if (wordMatch[4]) {
      const w = wordMatch[4].toLowerCase().replace(/^and\s+/, '');
      if (tensMap[w]) tens = tensMap[w];
      else if (onesMap[w]) tens = onesMap[w];
    }
    return thousands + hundreds + tens;
  }

  const romanMatch = closing.match(/\b(M{0,4}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3}))\b/);
  if (romanMatch) {
    const roman = romanMatch[1].toUpperCase();
    const num = romanToInt(roman);
    if (num && num > 1000) return num;
  }

  return null;
}

function romanToInt(s) {
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]];
    if (next && cur < next) {
      total -= cur;
    } else {
      total += cur;
    }
  }
  return total;
}

function parseFullDate(closing) {
  if (!closing) return null;

  const text = closing;

  // Pattern: "Month Day, Year" e.g. "December 3, 1740" or "August 12, 1950"
  let m = text.match(/([A-Z][a-z]+)\s+(\d+),?\s*(\d{4})/);
  if (m) {
    const month = parseMonth(m[1]);
    const day = parseInt(m[2]);
    const year = parseInt(m[3]);
    if (month && day && year) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "the 25th August 1910" or "the 1st of March 1756"
  m = text.match(/the\s+(\d+)(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Z][a-z]+),?\s*(?:in\s+the\s+year\s+)?(\d{4})/);
  if (m) {
    const day = parseInt(m[1]);
    const month = parseMonth(m[2]);
    const year = parseInt(m[3]);
    if (month && day && year) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "the [ordinal-word] day of [month], in the year [year]"
  m = text.match(/the\s+(\w+)\s+day\s+of\s+([A-Z][a-z]+),?\s*(?:in\s+)?(?:the\s+)?(?:year\s+)?(\d{4})/i);
  if (m) {
    const day = numericOrdinal(m[1]);
    const month = parseMonth(m[2]);
    const year = parseInt(m[3]);
    if (day && month && year && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "the [ordinal-word] day of [month], [word-year]"  
  m = text.match(/the\s+(\w+)\s+day\s+of\s+([A-Z][a-z]+),?\s*(?:one|two|three)\s+thousand\s+\w+\s+hundred\s+(?:and\s+)?\w+/i);
  if (m) {
    const day = numericOrdinal(m[1]);
    const month = parseMonth(m[2]);
    const year = parseYearFromClosing(text);
    if (day && month && year) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Pattern: "[month] [ordinal], [year]" e.g. "November 1, 1745"
  m = text.match(/([A-Z][a-z]+)\s+(\d+)(?:st|nd|rd|th)?,?\s*(\d{4})/);
  if (m) {
    const month = parseMonth(m[1]);
    const day = parseInt(m[2]);
    const year = parseInt(m[3]);
    if (month && day && year) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Just the year
  const yearMatch = text.match(/(\d{4})/);
  if (yearMatch) return yearMatch[1];

  return null;
}

function checkTranslated(content) {
  const note = content.match(/translated from the original Italian/i);
  if (note) {
    return {
      translated: true,
      source: content.includes('DeepL') ? 'deepl' : 'unknown',
      note: note[0],
    };
  }
  return { translated: false, source: null, note: null };
}

function extractLanguage(content, translated) {
  if (translated.translated) return 'en';

  // Strip URLs before checking for Italian indicators
  const stripped = content.replace(/\[.*?\]\(.*?\)/g, '').replace(/https?:\/\/\S+/g, '').toLowerCase();
  const firstWords = stripped.slice(0, 500);

  const italianIndicators = ['la santa sede', 'la santa madre', 'del papa', 'della chiesa'];
  for (const ind of italianIndicators) {
    if (firstWords.includes(ind)) {
      // Check if body is actually English
      const bodyStart = content.indexOf('\n\n', content.indexOf('#') + 1);
      if (bodyStart > 0) {
        const bodyPreview = content.slice(bodyStart, bodyStart + 500).toLowerCase();
        const enWords = [' the ', ' and ', ' that ', ' with ', ' from ', ' which ', ' their ', ' have ', ' was '];
        const enCount = enWords.filter(w => bodyPreview.includes(w)).length;
        if (enCount < 3) return 'it';
      }
    }
  }

  return 'en';
}

function extractWordCount(content) {
  const body = content
    .replace(/^#+ .+/gm, '')
    .replace(/^\[.+\]/gm, '')
    .replace(/>.+/g, '')
    .replace(/\*.*?\*/g, '')
    .replace(/[#*_\[\]()<>]/g, '')
    .trim();

  return body.split(/\s+/).filter(w => w.length > 0).length;
}

function extractTags(content, englishTitle, incipit) {
  const searchText = [
    englishTitle || '',
    incipit || '',
    content.slice(0, 3000),
  ].join(' ').toLowerCase();

  const tags = new Set();

  for (const rule of TAG_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        tags.add(rule.tag);
        break;
      }
    }
  }

  return [...tags].sort();
}

function extractFileSize(bytes) {
  return bytes;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const issues = {
    noYear: [],
    noType: [],
    noTitle: [],
    noAddressee: [],
    addresseeScopeCountry: [],
    translatedFiles: [],
    yearMismatch: [],
    unusual: [],
  };

  if (!fs.existsSync(META_DIR)) {
    fs.mkdirSync(META_DIR, { recursive: true });
  }

  const popeSlugs = fs.readdirSync(MARKDOWN_DIR).filter(d => {
    return fs.statSync(path.join(MARKDOWN_DIR, d)).isDirectory();
  }).sort();

  const allDocs = [];
  const popeDocCounts = {};
  const popeDocList = {};

  for (const popeSlug of popeSlugs) {
    const popeDocDir = path.join(MARKDOWN_DIR, popeSlug);
    const metaPopeDir = path.join(META_DIR, popeSlug);

    if (!fs.existsSync(metaPopeDir)) {
      fs.mkdirSync(metaPopeDir, { recursive: true });
    }

    const files = fs.readdirSync(popeDocDir)
      .filter(f => f.endsWith('.md'))
      .sort();

    popeDocCounts[popeSlug] = files.length;
    popeDocList[popeSlug] = [];

    for (const file of files) {
      const docSlug = file.replace(/\.md$/, '');
      const filePath = path.join(popeDocDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileSize = fs.statSync(filePath).size;

      const incipit = extractIncipit(content, docSlug);
      const englishTitle = extractEnglishTitle(content);
      const { popeName, year: yearFromAuthor, yearApproximate: yearApprox } = extractPopeAndYear(content, popeSlug);
      const type = extractDocumentType(content, docSlug);
      const addressee = extractAddressee(content);
      const addresseeScope = classifyAddresseeScope(addressee);
      const rawClosingDate = extractRawClosingDate(content);
      const hasClosing = hasClosingDate(content);
      const translated = checkTranslated(content);
      const language = extractLanguage(content, translated);
      const wordCount = extractWordCount(content);
      const tags = extractTags(content, englishTitle, incipit);

      // Extract year from closing if not in author line
      let year = yearFromAuthor;
      let date = null;
      let dateApproximate = yearApprox || false;

      if (!year && rawClosingDate) {
        year = parseYearFromClosing(rawClosingDate);
        if (year) dateApproximate = false;
      }

      // Fallback: extract year from Vatican URLs in lang links (e.g. "20201003" → 2020)
      if (!year) {
        const vaticanDate = content.match(/(?:papa-francesco|papa-giovanni|enciclica)[_-](\d{4})(\d{2})(\d{2})/);
        if (!vaticanDate) {
          // Also try standalone date pattern in URLs
          const urlDate = content.match(/[/_](\d{4})(\d{2})(\d{2})[_.]/);
          if (urlDate) {
            const y = parseInt(urlDate[1]);
            const m = parseInt(urlDate[2]);
            const d = parseInt(urlDate[3]);
            if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              year = y;
              date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            }
          }
        } else {
          year = parseInt(vaticanDate[1]);
          const m = parseInt(vaticanDate[2]);
          const d = parseInt(vaticanDate[3]);
          if (m && d) date = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }

      // Fallback: extract year from filename (e.g. "longinqua-january-6-1895")
      if (!year) {
        const yearInName = docSlug.match(/(\d{4})/);
        if (yearInName) {
          year = parseInt(yearInName[1]);
          dateApproximate = true;
        }
      }

      // Last resort: known document lookup for modern popes without dates
      if (!year) {
        const knownYears = {
          'franc/fratelli-tutti': { year: 2020, date: '2020-10-03' },
          'franc/laudato-si': { year: 2015, date: '2015-05-24' },
          'franc/lumen-fidei': { year: 2013, date: '2013-06-29' },
          'jp02/laborem-exercens': { year: 1981, date: '1981-09-14' },
          'ben16/deus-caritas-est': { year: 2005, date: '2005-12-25' },
          'ben16/spe-salvi': { year: 2007, date: '2007-11-30' },
          'ben16/caritas-in-veritate': { year: 2009, date: '2009-06-29' },
        };
        const key = `${popeSlug}/${docSlug}`;
        if (knownYears[key]) {
          year = knownYears[key].year;
          date = knownYears[key].date;
          dateApproximate = false;
        }
      }

      if (rawClosingDate) {
        date = parseFullDate(rawClosingDate);
        if (date) dateApproximate = false;
      } else if (year && !date) {
        date = String(year);
        dateApproximate = true;
      }

      // Track issues
      if (!year) issues.noYear.push(`${popeSlug}/${docSlug}`);
      if (!type) issues.noType.push(`${popeSlug}/${docSlug}`);
      if (!englishTitle) issues.noTitle.push(`${popeSlug}/${docSlug}`);
      if (!addressee) issues.noAddressee.push(`${popeSlug}/${docSlug}`);
      if (translated.translated) issues.translatedFiles.push(`${popeSlug}/${docSlug}`);
      if (addresseeScope && addresseeScope !== 'universal') {
        issues.addresseeScopeCountry.push(`${popeSlug}/${docSlug} → ${addresseeScope}`);
      }

      const meta = {
        slug: docSlug,
        incipit,
        englishTitle,
        pope: {
          slug: popeSlug,
          name: popeName,
          ...(POPE_INFO[popeSlug] ? {
            regnalName: POPE_INFO[popeSlug].regnalName,
            number: POPE_INFO[popeSlug].number,
            fullName: POPE_INFO[popeSlug].fullName,
          } : {}),
        },
        type,
        year,
        date,
        dateApproximate,
        addressee,
        addresseeScope,
        language,
        translated: translated.translated,
        translationSource: translated.source,
        tags,
        wordCount,
        fileSize,
        hasClosingDate: hasClosing,
        rawClosingDate,
      };

      const metaPath = path.join(metaPopeDir, docSlug + '.json');
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

      allDocs.push({
        slug: docSlug,
        incipit,
        englishTitle,
        popeSlug,
        popeName,
        type,
        year,
        date,
        tags,
        translated: translated.translated,
      });

      popeDocList[popeSlug].push(docSlug);

      process.stdout.write('.');
    }
  }

  // ─── Write index.json ──────────────────────────────────────────────────────

  const index = {
    generatedAt: new Date().toISOString(),
    totalDocuments: allDocs.length,
    totalPopes: popeSlugs.length,
    documents: allDocs,
  };

  fs.writeFileSync(
    path.join(META_DIR, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8',
  );

  // ─── Write popes.json ──────────────────────────────────────────────────────

  const popesArray = popeSlugs.map(slug => {
    const info = POPE_INFO[slug] || {};
    return {
      slug,
      regnalName: info.regnalName || null,
      number: info.number || null,
      fullName: info.fullName || slugToTitle(slug),
      pontificateStart: info.pontificateStart || null,
      pontificateEnd: info.pontificateEnd || null,
      documentCount: popeDocCounts[slug] || 0,
      documents: popeDocList[slug] || [],
    };
  });

  fs.writeFileSync(
    path.join(META_DIR, 'popes.json'),
    JSON.stringify({ popes: popesArray }, null, 2),
    'utf-8',
  );

  // ─── Report ────────────────────────────────────────────────────────────────

  console.log('\n\n─── Metadata Extraction Complete ───');
  console.log(`Total files processed: ${allDocs.length}`);
  console.log(`Total popes: ${popeSlugs.length}`);

  const summary = {
    totalFiles: allDocs.length,
    totalPopes: popeSlugs.length,
    issues,
    counts: {
      withYear: allDocs.filter(d => d.year).length,
      withType: allDocs.filter(d => d.type).length,
      withEnglishTitle: allDocs.filter(d => d.englishTitle).length,
      translated: issues.translatedFiles.length,
      withClosingDate: allDocs.filter(d => {
        const dir = d.popeSlug;
        const file = d.slug;
        const metaPath = path.join(META_DIR, dir, file + '.json');
        if (fs.existsSync(metaPath)) {
          const m = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          return m.hasClosingDate;
        }
        return false;
      }).length,
    },
  };

  fs.writeFileSync(
    path.join(META_DIR, 'extraction-summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8',
  );

  console.log('\n─── Issues Report ───');
  for (const [key, list] of Object.entries(issues)) {
    if (list.length > 0) {
      console.log(`\n${key} (${list.length}):`);
      list.slice(0, 20).forEach(item => console.log(`  ${item}`));
      if (list.length > 20) console.log(`  ... and ${list.length - 20} more`);
    }
  }

  console.log('\n─── Counts ───');
  for (const [key, val] of Object.entries(summary.counts)) {
    console.log(`  ${key}: ${val}/${allDocs.length}`);
  }

  console.log('\nDone. Metadata written to encyclicals/meta/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
