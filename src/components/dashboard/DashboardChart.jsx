import { Line, Bar, Doughnut } from 'react-chartjs-2';

const BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: { y: { beginAtZero: true, grid: { color: '#eef2ef' } }, x: { grid: { display: false } } },
};

export default function DashboardChart({ type = 'line', data, options, height = 240 }) {
  const Cmp = { line: Line, bar: Bar, doughnut: Doughnut }[type] || Line;
  const opts = type === 'doughnut'
    ? { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom' } }, ...options }
    : { ...BASE, ...options };
  return <div style={{ height }}><Cmp data={data} options={opts} /></div>;
}
