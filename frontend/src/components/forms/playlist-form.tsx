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

const playlistSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
});

export type PlaylistFormValues = z.infer<typeof playlistSchema>;

export const TIPO_OPTIONS = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'informativo', label: 'Informativo' },
  { value: 'social', label: 'Social' },
  { value: 'entretenimento', label: 'Entretenimento' },
  { value: 'outros', label: 'Outros' },
];

interface PlaylistFormProps {
  defaultValues?: Partial<PlaylistFormValues>;
  onSubmit: (data: PlaylistFormValues) => void;
  loading?: boolean;
}

export function PlaylistForm({ defaultValues, onSubmit, loading }: PlaylistFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo: '',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
      </div>

      <div className="space-y-1">
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
