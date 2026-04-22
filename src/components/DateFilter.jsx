import { useApp } from '../context/AppContext';

export default function DateFilter() {
  const { period, setPeriod, rangeFrom, setRangeFrom, rangeTo, setRangeTo } = useApp();

  return (
    <div className="df">
      {['yesterday', 'today', 'week', 'month', 'range', 'all'].map(p => (
        <button
          key={p}
          className={`df-btn${period === p ? ' active' : ''}`}
          onClick={() => setPeriod(p)}
        >
          {p[0].toUpperCase() + p.slice(1)}
        </button>
      ))}
      <div className={`df-range${period === 'range' ? ' show' : ''}`}>
        <input
          type="date"
          value={rangeFrom}
          onChange={e => setRangeFrom(e.target.value)}
        />
        <span style={{ fontSize: 12, color: 'var(--t4)' }}>→</span>
        <input
          type="date"
          value={rangeTo}
          onChange={e => setRangeTo(e.target.value)}
        />
      </div>
    </div>
  );
}
