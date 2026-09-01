import MaskedInput from './MaskedInput'
import { forwardRef } from 'react'
const CPFInput = forwardRef((props, ref) => (
  <MaskedInput ref={ref} mask="###.###.###-##" inputMode="numeric" placeholder="000.000.000-00" {...props} />
))
export default CPFInput
