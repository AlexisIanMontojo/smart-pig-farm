export default function StatCard({ icon: Icon, label, value, sub, tone = 'green', onClick }) {
  const palette = {
    green: ['var(--green-100)', 'var(--green-700)'],
    info: ['var(--info-bg)', 'var(--info)'],
    warn: ['var(--warn-bg)', 'var(--warn)'],
    danger: ['var(--danger-bg)', 'var(--danger)'],
  }[tone] || ['var(--gray-100)', 'var(--gray-700)'];

  return (
    <div className="stat" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="ico" style={{ background: palette[0], color: palette[1] }}>
        {Icon && <Icon size={19} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="val">{value}</div>
        <div className="lbl">{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}
