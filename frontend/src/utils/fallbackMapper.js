
export function mapFallbackOdds(data){
  if(!data || !data.odds) return null;
  return data.odds.map(o=>({
    book:o.bookmaker,
    outcomes:o.markets?.[0]?.outcomes || []
  }));
}


// KL26 integrate spreads & totals
export function mapFallbackSpreads(sp){
  return { line: sp.line, home: sp.home, away: sp.away };
}
export function mapFallbackTotals(t){
  return { total: t.total, over: t.over, under: t.under };
}
