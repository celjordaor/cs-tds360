import { Construction } from 'lucide-react'
import PageWrapper from '@/components/layout/PageWrapper'

export default function ComingSoon({ title }) {
  return (
    <PageWrapper title={title}>
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Construction className="w-10 h-10 text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">Em construção</p>
        <p className="text-slate-400 text-sm mt-1">Esta seção será implementada em breve.</p>
      </div>
    </PageWrapper>
  )
}
