import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Props {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export function ProjectPagination({ total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}>
          <SelectTrigger className="h-8 w-[80px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-3">
          {total === 0 ? 0 : start + 1}–{Math.min(start + pageSize, total)} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8" disabled={safePage <= 1} onClick={() => onPageChange(1)}>« First</Button>
        <Button variant="outline" size="sm" className="h-8" disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)}>‹ Prev</Button>
        <span className="px-3 font-medium text-foreground">Page {safePage} / {totalPages}</span>
        <Button variant="outline" size="sm" className="h-8" disabled={safePage >= totalPages} onClick={() => onPageChange(safePage + 1)}>Next ›</Button>
        <Button variant="outline" size="sm" className="h-8" disabled={safePage >= totalPages} onClick={() => onPageChange(totalPages)}>Last »</Button>
      </div>
    </div>
  );
}
