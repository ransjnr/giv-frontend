import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/** A row of status filters with counts. One is always selected. */
export function StatusFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; count?: number }[];
  onChange: (v: string) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={1}
      aria-label={label}
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className="w-full flex-wrap"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="h-9 gap-2 px-3 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-foreground"
        >
          {o.label}
          {o.count !== undefined && (
            <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums text-foreground">
              {o.count}
              <span className="sr-only"> {o.count === 1 ? 'item' : 'items'}</span>
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
