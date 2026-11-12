/** Chave AAAA-MM-DD no fuso local. */
export function chaveDia(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mm}-${dd}`;
}

export function somaDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function ultimosDias(n: number, hoje = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(chaveDia(somaDias(hoje, -i)));
  return out;
}

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export function diaSemana(chave: string): string {
  const [y, m, d] = chave.split('-').map(Number);
  return SEMANA[new Date(y, m - 1, d).getDay()];
}
