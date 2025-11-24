export default function BetCard({ bet }) {
  return (
    <div>
      <p>Market: {bet?.market}</p>
      <p>Price: {bet?.price}</p>
      <p>Fair Odds: {bet?.fairOdds ?? '-'}</p>
      <p>Edge: {bet?.edge ?? '-'}</p>
      <p>EV$: {bet?.evDollar ?? '-'}</p>
    </div>
  );
}