const CHECKPOINTS = [
  { id:'chop', name:'Тиса – Захонь', country:'HU', flag:'🇭🇺', cargo:true, dist:20, url:'https://nakordoni.com.ua/chergy/ugorshhyna/chop-zahon/' },
  { id:'uz', name:'Ужгород – Вишнє Немецьке', country:'SK', flag:'🇸🇰', cargo:true, dist:5, url:'https://nakordoni.com.ua/chergy/slovachchyna/uzhgorod-vyshne-nyemeczke/' },
  { id:'dya', name:'Дяково – Халмеу', country:'RO', flag:'🇷🇴', cargo:true, dist:110, url:'https://nakordoni.com.ua/chergy/rumuniya/dyakovo-halmeu/' },
  { id:'luz', name:'Лужанка – Берегшурань', country:'HU', flag:'🇭🇺', cargo:false, dist:80, url:'https://nakordoni.com.ua/chergy/ugorshhyna/luzhanka-beregshuran/' },
  { id:'mb', name:'Малий Березний – Убля', country:'SK', flag:'🇸🇰', cargo:false, dist:40, url:'https://nakordoni.com.ua/chergy/slovachchyna/malyj-bereznyj-ublya/' },
  { id:'vyl', name:'Вилок – Тісабеч', country:'HU', flag:'🇭🇺', cargo:false, dist:100, url:'https://nakordoni.com.ua/chergy/ugorshhyna/vylok-tisabech/' },
  { id:'sol', name:'Солотвино – Сігету Мармацієй', country:'RO', flag:'🇷🇴', cargo:false, dist:130, url:'https://nakordoni.com.ua/chergy/rumuniya/solotvyno-sigetu-marmacziyej/' },
  { id:'dzv', name:'Дзвінкове – Лонья', country:'HU', flag:'🇭🇺', cargo:false, dist:70, url:'https://nakordoni.com.ua/chergy/ugorshhyna/dzvinkove-lonya/' },
];

function parseQueue(html) {
  const patterns = [
    /вантажівк[иі][^<]*<[^>]+>[\s]*(\d+)/i,
    /truck[s]?[^<]*<[^>]+>[\s]*(\d+)/i,
    /<span[^>]*class="[^"]*count[^"]*"[^>]*>(\d+)/i,
    /черг[аиіу][^<]{0,100}(\d+)/i,
    /(\d+)\s*(?:авто|тс)\s*(?:у черзі|перед)/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) { const n = parseInt(m[1],10); if (n>=0 && n<2000) return n; }
  }
  return null;
}

async function fetchCheckpoint(cp) {
  try {
    const res = await fetch(cp.url, {
      headers: { 'User-Agent':'Mozilla/5.0 (compatible; CargoCross/1.0)', 'Accept':'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const trucks = parseQueue(html);
    return { ...cp, trucks, ok: trucks !== null };
  } catch (err) {
    return { ...cp, trucks: null, ok: false, error: err.message };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const results = await Promise.all(CHECKPOINTS.map(fetchCheckpoint));
    return res.status(200).json({ checkpoints: results, updated: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message, checkpoints: [], updated: new Date().toISOString() });
  }
}
