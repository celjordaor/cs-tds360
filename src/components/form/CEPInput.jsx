import { forwardRef, useState } from 'react'
import { maskCEP } from '@/lib/masks'
import Spinner from '@/components/ui/Spinner'

// onAddress({ logradouro, bairro, localidade, uf }) chamado quando CEP válido retorna
const CEPInput = forwardRef(function CEPInput({ value = '', onChange, onAddress, ...props }, ref) {
  const [loading, setLoading] = useState(false)

  async function lookup(cep) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) onAddress?.({ logradouro: data.logradouro, bairro: data.bairro, localidade: data.localidade, uf: data.uf })
    } catch { /* ignora falha de rede */ }
    finally { setLoading(false) }
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        {...props}
        inputMode="numeric"
        placeholder="00000-000"
        value={value}
        onChange={e => { const m = maskCEP(e.target.value); onChange?.(m) }}
        onBlur={e => lookup(e.target.value)}
        className="input pr-8"
      />
      {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2"><Spinner size="sm" /></span>}
    </div>
  )
})
export default CEPInput
