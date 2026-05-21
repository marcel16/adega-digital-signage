import { generateToken } from './token';

interface M3UItem {
  id: string;
  name: string;
  duration?: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

interface GenerateM3UParams {
  storeName: string;
  tvName: string;
  items: M3UItem[];
  baseUrl: string;
  iptvSecret: string;
}

function typeToGroupTitle(type: string): string {
  const map: Record<string, string> = {
    video: 'Vídeos',
    image: 'Imagens',
    audio: 'Áudio',
    playlist: 'Playlists',
  };
  return map[type] || type;
}

export function generateM3U(params: GenerateM3UParams): string {
  const { storeName, tvName, items, baseUrl } = params;

  const lines: string[] = [];
  lines.push('#EXTM3U');

  const grouped = new Map<string, M3UItem[]>();
  for (const item of items) {
    const group = typeToGroupTitle(item.type);
    if (!grouped.has(group)) {
      grouped.set(group, []);
    }
    grouped.get(group)!.push(item);
  }

  for (const [groupTitle, groupItems] of grouped) {
    for (const item of groupItems) {
      const token = generateToken(
        { storeCode: storeName, tvCode: tvName, mediaId: item.id },
        3600
      );
      const duration = item.duration ?? -1;
      const tvgLogo = item.thumbnailUrl ? ` tvg-logo="${item.thumbnailUrl}"` : '';
      const tvgId = item.id;
      const tvgName = item.name;

      lines.push(
        `#EXTINF:${duration} tvg-id="${tvgId}" tvg-name="${tvgName}"${tvgLogo} group-title="${groupTitle}",${item.name}`
      );
      lines.push(`${baseUrl}/stream/${token}`);
    }
  }

  return lines.join('\n') + '\n';
}
