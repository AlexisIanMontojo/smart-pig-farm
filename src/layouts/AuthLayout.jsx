import { Outlet } from 'react-router-dom';
import { Sprout, Cpu, Camera, LineChart } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="auth-wrap">
      <section className="auth-art">
        <div className="row" style={{ gap: 11 }}>
          <div className="mark" style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center' }}>
            <Sprout size={21} />
          </div>
          <div>
            <strong style={{ fontSize: 14 }}>Erwin&apos;s Piggery</strong>
            <div className="tag">MONITOR • AUTOMATE • MANAGE</div>
          </div>
        </div>
        <h1>Smart Pig Farm Management System</h1>
        <p>
          A capstone prototype integrating planned IoT monitoring and machine-learning
          image screening into one farm management interface. All data shown in this build
          is sample data.
        </p>
        <div className="row" style={{ gap: 18, marginTop: 10, color: '#cfe6d5', fontSize: 12.5 }}>
          <span className="row" style={{ gap: 6 }}><Cpu size={15} /> ESP32 &amp; DHT22 (planned)</span>
          <span className="row" style={{ gap: 6 }}><Camera size={15} /> Smartphone screening</span>
          <span className="row" style={{ gap: 6 }}><LineChart size={15} /> Growth analytics</span>
        </div>
      </section>
      <section className="auth-form-side"><Outlet /></section>
    </div>
  );
}
