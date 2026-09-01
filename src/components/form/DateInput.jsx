import MaskedInput from './MaskedInput'
import { forwardRef } from 'react'
// value: string DD/MM/YYYY. onChange(string)
const DateInput = forwardRef((props, ref) => (
  <MaskedInput ref={ref} mask="##/##/####" inputMode="numeric" placeholder="DD/MM/AAAA" {...props} />
))
export default DateInput
