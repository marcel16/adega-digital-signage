'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

interface MidiaUploadFormProps {
  onSuccess?: () => void;
}

export function MidiaUploadForm({ onSuccess }: MidiaUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tags, setTags] = useState('');
  const [pasta, setPasta] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    if (selected) {
      const nameWithoutExt = selected.name.replace(/\.[^/.]+$/, '');
      setNome(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nome', nome || file.name.replace(/\.[^/.]+$/, ''));
      if (descricao) formData.append('descricao', descricao);
      if (tags) formData.append('tags', tags);
      if (pasta) formData.append('pasta', pasta);

      await api.post('/midias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Mídia enviada com sucesso!');
      setFile(null);
      setNome('');
      setDescricao('');
      setTags('');
      setPasta('');
      onSuccess?.();
    } catch {
      toast.error('Erro ao enviar mídia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.html,.htm"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="space-y-3">
            {file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="h-24 w-24 object-cover rounded mx-auto"
              />
            ) : (
              <Upload className="h-10 w-10 mx-auto text-primary" />
            )}
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
            >
              <X className="h-4 w-4 mr-1" /> Remover
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Arraste um arquivo aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">Imagens, vídeos, áudios ou HTML</p>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="midNome">Nome</Label>
          <Input id="midNome" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="midDescricao">Descrição</Label>
          <textarea
            id="midDescricao"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="midTags">Tags (separadas por vírgula)</Label>
          <Input id="midTags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2, tag3" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="midPasta">Pasta</Label>
          <Input id="midPasta" value={pasta} onChange={(e) => setPasta(e.target.value)} placeholder="Ex: Promoções, Logos..." />
        </div>
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={loading || !file}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar'
        )}
      </Button>
    </div>
  );
}
