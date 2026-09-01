import { forwardRef } from 'react'
import { maskCurrency, parseCurrency } from '@/lib/masks'

// value: centavos (inteiro). onChange(centavos)
const CurrencyInput = forwardRef(function CurrencyInput({ value = 0, onChange, ...props }, ref) {
  const display = value ? maskCurrency(String(value * 100)) : ''
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">R$</span>
      <input
        ref={ref}
        {...props}
        inputMode="numeric"
        placeholder="0,00"
        value={display.replace('R$ ', '').replace('R$ ', '')}
        onChange={e => {
          const cents = parseCurrency(e.target.value)
          onChange?.(Math.round(cents / 100) * 100 === 0 ? parseCurrency(e.target.value) : cents)
        }}
        onFocus={e => { e.target.select() }}
        className="input pl-9"
      />
    </div>
  )
})
export default CurrencyInput
