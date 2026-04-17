import { avColors, statusBadgeType } from '../utils/helpers';

export function Av({ name, size = 30 }) {
  const [bg, color] = avColors(name);
  return (
    <div
      className="av"
      style={{ width: size, height: size, background: bg, color, fontSize: Math.round(size * 0.36) }}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

export function Badge({ text, type = 'gray' }) {
  return <span className={`badge badge-${type}`}>{text}</span>;
}

export function SBadge({ status }) {
  return <Badge text={status} type={statusBadgeType(status)} />;
}

export function NavyHero({ children, className = '' }) {
  return <div className={`navy-hero ${className}`}>{children}</div>;
}
