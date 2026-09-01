import { forwardRef } from 'react'
import { applyMask } from '@/lib/masks'

// Uso: <MaskedInput mask="##.###.###/####-##" value={v} onChange={set} />
const MaskedInput = forwardRef(function MaskedInput(
  { mask, value = '', onChange, onBlur, className = '', ...props }, ref
) {
  function handleChange(e) {
    const masked = applyMask(e.target.value, mask)
    onChange?.(masked)
  }
  return (
    <input
      ref={ref}
      {...props}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      className={`input ${className}`}
    />
  )
})
export default MaskedInput
