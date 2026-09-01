import MaskedInput from './MaskedInput'
import { forwardRef } from 'react'
const CNPJInput = forwardRef((props, ref) => (
  <MaskedInput ref={ref} mask="##.###.###/####-##" inputMode="numeric" placeholder="00.000.000/0000-00" {...props} />
))
export default CNPJInput
