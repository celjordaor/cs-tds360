/**
 * Formata data para exibição pt-BR
 */
export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(value) {
  if (!value) return ''
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

/**
 * Retorna as iniciais de um nome (máx 2 letras)
 */
export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Classnames condicional simples
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Labels legíveis para status de projeto
 */
export const STATUS_LABELS = {
  em_andamento: 'Em andamento',
  aguardando_cliente: 'Aguardando cliente',
  concluido: 'Concluído',
  suspenso: 'Suspenso',
}

export const STATUS_COLORS = {
  em_andamento: 'bg-blue-100 text-blue-700',
  aguardando_cliente: 'bg-amber-100 text-amber-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  suspenso: 'bg-slate-100 text-slate-500',
}
