import { useState } from 'react';
import ResultsList from './ResultsList';

// KL40 FE-side transform simulation
import transformOddsToEV from '../../../backend/services/transformOddsToEV';

export default function ScanController() {
  const [results, setResults] = useState([]);

  const onScan = async () => {
    const mock = [{ market:'ML', price:-110 }];
    const out = transformOddsToEV(mock);
    setResults(out);
  };

  return (
    <div>
      <button onClick={onScan}>Scan</button>
      <ResultsList results={results} />
    </div>
  );
}
