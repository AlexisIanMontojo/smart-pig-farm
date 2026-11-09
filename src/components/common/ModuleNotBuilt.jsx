import { Hammer } from 'lucide-react';

/**
 * Honest placeholder for modules not yet implemented in this build phase.
 * It is clearly labelled rather than pretending to be a working screen.
 */
export default function ModuleNotBuilt({ name, phase, includes = [] }) {
  return (
    <div className="card">
      <div className="card-body center-col" style={{ padding: 40, textAlign: 'center' }}>
        <Hammer size={30} color="var(--gray-300)" />
        <h3>{name} is not implemented in this build</h3>
        <p style={{ color: 'var(--gray-500)', maxWidth: 520 }}>
          This route exists so navigation never reaches a blank screen, but the module itself
          is scheduled for {phase}. Nothing on this page is functional and no data is being
          displayed from it.
        </p>
        {includes.length > 0 && (
          <p style={{ color: 'var(--gray-500)', maxWidth: 520, fontSize: 12.5 }}>
            Planned contents: {includes.join(', ')}.
          </p>
        )}
      </div>
    </div>
  );
}
