import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPage: number;
  perPage: number;
  totalData: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function TablePagination({
  page,
  totalPage,
  perPage,
  totalData,
  onPageChange,
  onPerPageChange,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
      {/* Left info */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Tampilkan</span>

        <Select
          value={String(perPage)}
          onValueChange={(val) => onPerPageChange(Number(val))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>

        <span>Item dari total</span>
        <strong>{totalData}</strong>
      </div>

      {/* Right pagination */}
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span>Halaman</span>

          <Select
            value={String(page)}
            onValueChange={(val) => onPageChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: totalPage }).map((_, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span>dari</span>
          <strong>{totalPage}</strong>
        </div>

        <Button
          size="icon"
          variant="outline"
          disabled={page === totalPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
