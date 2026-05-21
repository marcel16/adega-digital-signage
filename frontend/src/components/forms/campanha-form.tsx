'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Estabelecimento } from '@/types';

const campanhaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  prioridade: z.coerce.number().min(0).default(0),
  estabelecimentoId: z.string().optional(),
});

export type CampanhaFormValues = z.infer<typeof campanhaSchema>;

export const TIPO_OPTIONS = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'informativo', label: 'Informativo' },
  { value: 'social', label: 'Social' },
  { value: 'evento', label: 'Evento' },
  { value: 'promocao', label: 'Promoção' },
  { value: 'outros', label: 'Outros' },
];

interface CampanhaFormProps {
  defaultValues?: Partial<CampanhaFormValues>;
  estabelecimentos: Estabelecimento[];
  onSubmit: (data: CampanhaFormValues) => void;
  loading?: boolean;
}

export function CampanhaForm({ defaultValues, estabelecimentos, onSubmit, loading }: CampanhaFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CampanhaFormValues>({
    resolver: zodResolver(campanhaSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo: '',
      dataInicio: '',
      dataFim: '',
      prioridade: 0,
      estabelecimentoId: '',
      ...defaultValues,
    },
  });

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
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('descricao')}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="tipo">Tipo</Label>
          <Select
            onValueChange={(value) => setValue('tipo', value)}
            defaultValue={defaultValues?.tipo || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-xs text-destructive">{errors.tipo.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="prioridade">Prioridade</Label>
          <Input id="prioridade" type="number" min={0} {...register('prioridade')} />
          {errors.prioridade && <p className="text-xs text-destructive">{errors.prioridade.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="dataInicio">Data Início</Label>
          <Input id="dataInicio" type="date" {...register('dataInicio')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="dataFim">Data Fim</Label>
          <Input id="dataFim" type="date" {...register('dataFim')} />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="estabelecimentoId">Estabelecimento (opcional)</Label>
          <Select
            onValueChange={(value) => setValue('estabelecimentoId', value === '_none' ? '' : value)}
            defaultValue={defaultValues?.estabelecimentoId || '_none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um estabelecimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Nenhum</SelectItem>
              {estabelecimentos.map((est) => (
                <SelectItem key={est.id} value={est.id}>
                  {est.nome}
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
