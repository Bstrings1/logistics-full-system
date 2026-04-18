export default function PriceInput({ value, onChange, placeholder, style, ...rest }) {
  const raw = String(value ?? '').replace(/\D/g, '');
  const formatted = raw ? Number(raw).toLocaleString() : '';

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits);
  }

  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--t3)', pointerEvents: 'none', fontSize: 14, fontWeight: 600, zIndex: 1,
      }}>₦</span>
      <input
        type="text" inputMode="numeric"
        className="inp"
        value={formatted}
        onChange={handleChange}
        placeholder={placeholder ?? '0'}
        style={{ paddingLeft: 28, ...style }}
        {...rest}
      />
    </div>
  );
}
