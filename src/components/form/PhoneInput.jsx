import { forwardRef } from 'react'
import { maskPhone } from '@/lib/masks'

const PhoneInput = forwardRef(function PhoneInput({ value = '', onChange, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      value={value}
      inputMode="numeric"
      placeholder="(00) 00000-0000"
      onChange={e => onChange?.(maskPhone(e.target.value))}
      className="input"
    />
  )
})
export default PhoneInput
