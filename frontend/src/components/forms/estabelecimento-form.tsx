'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const estabelecimentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  documento: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Máximo 2 caracteres').optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  horarioAbertura: z.string().optional(),
  horarioFechamento: z.string().optional(),
});

export type EstabelecimentoFormValues = z.infer<typeof estabelecimentoSchema>;

interface EstabelecimentoFormProps {
  defaultValues?: Partial<EstabelecimentoFormValues>;
  onSubmit: (data: EstabelecimentoFormValues) => void;
  loading?: boolean;
}

export function EstabelecimentoForm({ defaultValues, onSubmit, loading }: EstabelecimentoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EstabelecimentoFormValues>({
    resolver: zodResolver(estabelecimentoSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" {...register('nome')} />
          {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
          <Input id="documento" {...register('documento')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" {...register('telefone')} />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" {...register('endereco')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cidade">Cidade</Label>
          <Input id="cidade" {...register('cidade')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="estado">Estado (UF)</Label>
          <Input id="estado" maxLength={2} {...register('estado')} />
          {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" {...register('cep')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="horarioAbertura">Horário Abertura</Label>
          <Input id="horarioAbertura" placeholder="08:00" {...register('horarioAbertura')} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="horarioFechamento">Horário Fechamento</Label>
          <Input id="horarioFechamento" placeholder="18:00" {...register('horarioFechamento')} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
