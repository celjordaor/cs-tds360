import Badge from '@/components/ui/Badge'

const MAP = {
  prospecto:    { label: 'Prospecto',    variant: 'slate'  },
  implantacao:  { label: 'Implantação',  variant: 'blue'   },
  ativo:        { label: 'Ativo',        variant: 'green'  },
  pausado:      { label: 'Pausado',      variant: 'yellow' },
  cancelado:    { label: 'Cancelado',    variant: 'red'    },
  // project status
  em_andamento: { label: 'Em andamento', variant: 'blue'   },
  concluido:    { label: 'Concluído',    variant: 'green'  },
  cancelado_proj: { label: 'Cancelado', variant: 'red'    },
}

export default function StatusBadge({ status }) {
  const cfg = MAP[status] ?? { label: status, variant: 'slate' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
