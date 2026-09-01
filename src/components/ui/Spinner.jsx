export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' }[size]
  return <span className={`inline-block ${s} border-orange-500 border-t-transparent rounded-full animate-spin ${className}`} />
}
