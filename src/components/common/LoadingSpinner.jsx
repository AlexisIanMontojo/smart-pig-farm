export default function LoadingSpinner({ label = 'Loading…', inline }) {
  if (inline) return <span className="spinner" aria-label={label} />;
  return (
    <div className="empty center-col">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
