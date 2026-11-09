import BaseModal from './BaseModal';
import BaseButton from './BaseButton';

export default function ConfirmDialog({
  open, title = 'Please confirm', message, confirmLabel = 'Confirm',
  tone = 'danger', onConfirm, onCancel, busy,
}) {
  return (
    <BaseModal
      open={open}
      title={title}
      onClose={onCancel}
      width={430}
      footer={(
        <>
          <BaseButton variant="secondary" onClick={onCancel} disabled={busy}>Cancel</BaseButton>
          <BaseButton variant={tone} onClick={onConfirm} loading={busy}>{confirmLabel}</BaseButton>
        </>
      )}
    >
      <p style={{ margin: 0, color: 'var(--gray-700)' }}>{message}</p>
    </BaseModal>
  );
}
