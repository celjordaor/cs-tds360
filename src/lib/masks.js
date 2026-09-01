// Aplicador genérico de máscara — # = dígito, outros caracteres são literais
export function applyMask(raw = '', mask = '') {
  const digits = String(raw).replace(/\D/g, '')
  let idx = 0
  let out = ''
  for (const ch of mask) {
    if (idx >= digits.length) break
    out += ch === '#' ? digits[idx++] : ch
  }
  return out
}

export const MASKS = {
  phone:    '(##) #####-####',
  phoneShort: '(##) ####-####',
  cnpj:     '##.###.###/####-##',
  cpf:      '###.###.###-##',
  cep:      '#####-###',
  date:     '##/##/####',
}

export function maskPhone(v = '') {
  const d = v.replace(/\D/g, '')
  return d.length <= 10 ? applyMask(d, MASKS.phoneShort) : applyMask(d, MASKS.phone)
}
export const maskCNPJ  = (v) => applyMask(v, MASKS.cnpj)
export const maskCPF   = (v) => applyMask(v, MASKS.cpf)
export const maskCEP   = (v) => applyMask(v, MASKS.cep)
export const maskDate  = (v) => applyMask(v, MASKS.date)

// Moeda BRL — armazena em centavos no estado, exibe formatado
export function formatCurrency(cents = 0) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
export function parseCurrency(str = '') {
  const digits = str.replace(/\D/g, '')
  return parseInt(digits || '0', 10)
}
export function maskCurrency(str = '') {
  const cents = parseCurrency(str)
  return formatCurrency(cents)
}
