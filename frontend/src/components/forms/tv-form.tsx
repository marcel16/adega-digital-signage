'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Estabelecimento } from '@/types';

const tvSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  modelo: z.string().optional(),
  resolucao: z.string().optional(),
  estabelecimentoId: z.string().min(1, 'Estabelecimento é obrigatório'),
  volume: z.coerce.number().min(0).max(100),
  rotacaoAutomatica: z.boolean(),
  intervaloRotacao: z.coerce.number().min(5).max(300),
});

export type TvFormValues = z.infer<typeof tvSchema>;

interface TvFormProps {
  defaultValues?: Partial<TvFormValues>;
  estabelecimentos: Estabelecimento[];
  onSubmit: (data: TvFormValues) => void;
  loading?: boolean;
}

export function TvForm({ defaultValues, estabelecimentos, onSubmit, loading }: TvFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TvFormValues>({
    resolver: zodResolver(tvSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      modelo: '',
      resolucao: '',
      estabelecimentoId: '',
      volume: 50,
      rotacaoAutomatica: false,
      intervaloRotacao: 30,
      ...defaultValues,
    },
  });

  const volume = watch('volume');
  const rotacaoAutomatica = watch('rotacaoAutomatica');

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
          <Input id="descricao" {...register('descricao')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" {...register('modelo')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="resolucao">Resolução</Label>
          <Input id="resolucao" {...register('resolucao')} placeholder="1920x1080" />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="estabelecimentoId">Estabelecimento</Label>
          <Select
            onValueChange={(value) => setValue('estabelecimentoId', value)}
            defaultValue={defaultValues?.estabelecimentoId || ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um estabelecimento" />
            </SelectTrigger>
            <SelectContent>
              {estabelecimentos.map((est) => (
                <SelectItem key={est.id} value={est.id}>
                  {est.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.estabelecimentoId && (
            <p className="text-xs text-destructive">{errors.estabelecimentoId.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="volume">Volume ({volume}%)</Label>
          <Input
            id="volume"
            type="range"
            min={0}
            max={100}
            {...register('volume', { valueAsNumber: true })}
          />
          {errors.volume && <p className="text-xs text-destructive">{errors.volume.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="intervaloRotacao">Intervalo de Rotação (s)</Label>
          <Input
            id="intervaloRotacao"
            type="number"
            min={5}
            max={300}
            {...register('intervaloRotacao', { valueAsNumber: true })}
          />
          {errors.intervaloRotacao && (
            <p className="text-xs text-destructive">{errors.intervaloRotacao.message}</p>
          )}
        </div>

        <div className="col-span-2 flex items-center gap-2 pt-2">
          <Switch
            id="rotacaoAutomatica"
            checked={rotacaoAutomatica}
            onCheckedChange={(checked) => setValue('rotacaoAutomatica', checked)}
          />
          <Label htmlFor="rotacaoAutomatica">Rotação Automática</Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
