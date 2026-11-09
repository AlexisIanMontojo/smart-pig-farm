export default function BaseButton({
  variant = 'primary', size, type = 'button', loading = false,
  icon: Icon, block, children, className = '', disabled, ...rest
}) {
  const classes = [
    'btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', block ? 'btn-block' : '', className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
               : Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
}
