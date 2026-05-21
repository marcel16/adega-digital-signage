'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tv, Campanha, Playlist } from '@/types';

const agendamentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tvId: z.string().min(1, 'TV é obrigatória'),
  diasSemana: z.array(z.string()).min(1, 'Selecione ao menos um dia'),
  horarioInicio: z.string().min(1, 'Horário início é obrigatório'),
  horarioFim: z.string().optional(),
  dataInicio: z.string().min(1, 'Data início é obrigatória'),
  dataFim: z.string().optional(),
  recorrente: z.boolean().default(false),
  campanhaId: z.string().optional(),
  playlistId: z.string().optional(),
});

export type AgendamentoFormValues = z.infer<typeof agendamentoSchema>;

const DIAS_SEMANA_OPTIONS = [
  { value: 'dom', label: 'Dom' },
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
];

interface AgendamentoFormProps {
  defaultValues?: Partial<AgendamentoFormValues>;
  tvs: Tv[];
  campanhas: Campanha[];
  playlists: Playlist[];
  onSubmit: (data: AgendamentoFormValues) => void;
  loading?: boolean;
}

export function AgendamentoForm({
  defaultValues,
  tvs,
  campanhas,
  playlists,
  onSubmit,
  loading,
}: AgendamentoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AgendamentoFormValues>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tvId: '',
      diasSemana: [],
      horarioInicio: '',
      horarioFim: '',
      dataInicio: '',
      dataFim: '',
      recorrente: false,
      campanhaId: '',
      playlistId: '',
      ...defaultValues,
    },
  });

  const recorrente = watch('recorrente');
  const diasSemana = watch('diasSemana');
  const campanhaId = watch('campanhaId');
  const playlistId = watch('playlistId');

  const toggleDia = (value: string) => {
    const current = diasSemana ?? [];
    const next = current.includes(value)
      ? current.filter((d) => d !== value)
      : [...current, value];
    setValue('diasSemana', next, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('descricao')}
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="tvId">TV</Label>
          <Select
            onValueChange={(value) => setValue('tvId', value)}
            defaultValue={defaultValues?.tvId || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma TV" />
            </SelectTrigger>
            <SelectContent>
              {tvs.map((tv) => (
                <SelectItem key={tv.id} value={tv.id}>
                  {tv.nome} ({tv.identificador})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tvId && <p className="text-xs text-destructive">{errors.tvId.message}</p>}
        </div>

        <div className="col-span-2 space-y-1">
          <Label>Dias da Semana</Label>
          <div className="flex flex-wrap gap-3 pt-1">
            {DIAS_SEMANA_OPTIONS.map((dia) => (
              <Checkbox
                key={dia.value}
                id={`dia-${dia.value}`}
                label={dia.label}
                checked={diasSemana?.includes(dia.value) ?? false}
                onChange={() => toggleDia(dia.value)}
              />
            ))}
          </div>
          {errors.diasSemana && (
            <p className="text-xs text-destructive">{errors.diasSemana.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="horarioInicio">Horário Início</Label>
          <Input id="horarioInicio" type="time" {...register('horarioInicio')} />
          {errors.horarioInicio && (
            <p className="text-xs text-destructive">{errors.horarioInicio.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="horarioFim">Horário Fim</Label>
          <Input id="horarioFim" type="time" {...register('horarioFim')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="dataInicio">Data Início</Label>
          <Input id="dataInicio" type="date" {...register('dataInicio')} />
          {errors.dataInicio && (
            <p className="text-xs text-destructive">{errors.dataInicio.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="dataFim">Data Fim</Label>
          <Input id="dataFim" type="date" {...register('dataFim')} />
        </div>

        <div className="col-span-2 flex items-center gap-2 pt-2">
          <Switch
            id="recorrente"
            checked={recorrente}
            onCheckedChange={(checked) => setValue('recorrente', checked)}
          />
          <Label htmlFor="recorrente">Recorrente</Label>
        </div>

        <div className="col-span-2 border-t pt-3">
          <p className="text-sm font-medium mb-2">Vincular conteúdo (opcional)</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="campanhaId">Campanha</Label>
          <Select
            onValueChange={(value) => {
              setValue('campanhaId', value === '_none' ? '' : value);
              if (value !== '_none') setValue('playlistId', '');
            }}
            defaultValue={defaultValues?.campanhaId || '_none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhuma</SelectItem>
              {campanhas.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="playlistId">Playlist</Label>
          <Select
            onValueChange={(value) => {
              setValue('playlistId', value === '_none' ? '' : value);
              if (value !== '_none') setValue('campanhaId', '');
            }}
            defaultValue={defaultValues?.playlistId || '_none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhuma</SelectItem>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
