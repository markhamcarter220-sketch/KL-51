// KL42 Market Mapping
function mapMarket(raw){
  return {
    sport: raw.sport || 'unknown',
    market: raw.market || 'ML',
    book: raw.book || 'mock',
    price: raw.price ?? null
  };
}
module.exports={mapMarket};
