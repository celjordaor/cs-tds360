import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/form/FormField'
import CNPJInput from '@/components/form/CNPJInput'
import CEPInput from '@/components/form/CEPInput'
import MultiSelect from '@/components/form/MultiSelect'
import SearchSelect from '@/components/form/SearchSelect'
import { useCreateClient } from '@/hooks/useClients'
import { useConfigOptionsActive } from '@/hooks/useConfigOptions'
import { useProfilesCS } from '@/hooks/useProfiles'
import { useToast } from '@/components/shared/ToastContext'
import Spinner from '@/components/ui/Spinner'


const schema = z.object({
  razao_social: z.string().min(2, 'Obrigatório'),
  fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  cep: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  segmentos: z.array(z.string()).optional(),
  sistemas_contratados: z.array(z.string()).min(1, 'Selecione ao menos um sistema'),
  responsavel_cs_id: z.string().min(1, 'Selecione o analista responsável'),
})

export default function NewClientModal({ open, onClose, onCreated }) {
  const { data: sistemas = [] } = useConfigOptionsActive('sistema')
  const { data: segmentosOpts = [] } = useConfigOptionsActive('segmento')
  const { data: profiles = [] } = useProfilesCS()
  const create = useCreateClient()
  const { toast } = useToast()

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { segmentos: [], sistemas_contratados: [] },
  })

  async function onSubmit(values) {
    try {
      const { segmentos, sistemas_contratados, responsavel_cs_id, ...clientData } = values
      const cleanClient = Object.fromEntries(
        Object.entries({ ...clientData, segmentos })
          .filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
      )
      const result = await create.mutateAsync({
        client: { ...cleanClient, status: 'ativo' },
        project: { sistemas_contratados, responsavel_cs_id },
      })
      toast({ type: 'success', message: 'Cliente criado com sucesso!' })
      onCreated?.(result)
      onClose()
    } catch (e) {
      toast({ type: 'error', message: 'Erro ao criar cliente. Tente novamente.' })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Cliente" size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={create.isPending}>Cancelar</button>
          <button form="new-client-form" type="submit" disabled={create.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {create.isPending && <Spinner size="sm" />}
            Criar Cliente
          </button>
        </>
      }
    >
      <form id="new-client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Razão Social" required error={errors.razao_social?.message} className="col-span-2">
            <input className="input" {...register('razao_social')} placeholder="Nome da empresa" />
          </FormField>
          <FormField label="Nome Fantasia" error={errors.fantasia?.message}>
            <input className="input" {...register('fantasia')} placeholder="Nome fantasia" />
          </FormField>
          <FormField label="CNPJ" error={errors.cnpj?.message}>
            <Controller name="cnpj" control={control}
              render={({ field }) => <CNPJInput value={field.value ?? ''} onChange={field.onChange} />} />
          </FormField>
          <FormField label="CEP" error={errors.cep?.message}>
            <Controller name="cep" control={control}
              render={({ field }) => (
                <CEPInput value={field.value ?? ''} onChange={field.onChange}
                  onAddress={({ localidade, uf }) => { setValue('cidade', localidade); setValue('estado', uf) }} />
              )} />
          </FormField>
          <FormField label="Cidade / UF" error={errors.cidade?.message}>
            <div className="flex gap-2">
              <input className="input flex-1" {...register('cidade')} placeholder="Cidade" />
              <input className="input w-16 uppercase" {...register('estado')} placeholder="UF" maxLength={2} />
            </div>
          </FormField>
          <FormField label="Segmento" error={errors.segmentos?.message} className="col-span-2">
            <Controller name="segmentos" control={control}
              render={({ field }) => <MultiSelect options={segmentosOpts} value={field.value ?? []} onChange={field.onChange} placeholder="Selecionar segmentos…" />} />
          </FormField>
          <FormField label="Sistemas Contratados" required error={errors.sistemas_contratados?.message} className="col-span-2">
            <Controller name="sistemas_contratados" control={control}
              render={({ field }) => <MultiSelect options={sistemas} value={field.value ?? []} onChange={field.onChange} placeholder="Selecionar sistemas…" />} />
          </FormField>
          <FormField label="Analista CS Responsável" required error={errors.responsavel_cs_id?.message} className="col-span-2">
            <Controller name="responsavel_cs_id" control={control}
              render={({ field }) => <SearchSelect options={profiles} value={field.value ?? null} onChange={field.onChange} placeholder="Selecionar analista…" />} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
