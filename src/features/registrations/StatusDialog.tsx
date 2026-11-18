import { useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { EyeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { useSetRegistrationStatus } from '@/api/queries';
import { statusLabels } from '@/content/options';
import {
  registrationStatus,
  REGISTRATION_FLOW,
  suggestedNotes,
  type ActiveRegistrationStatus,
} from '@/content/staff';

/**
 * Change a registration's status, with an optional note the student sees on their dashboard.
 * A preview shows exactly how it will appear to the student.
 */
export function StatusDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  current,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId: string;
  studentName: string;
  current: ActiveRegistrationStatus;
  initial: ActiveRegistrationStatus;
}) {
  const [status, setStatus] = useState(initial);
  const [note, setNote] = useState(suggestedNotes[initial] ?? '');
  const [error, setError] = useState('');
  const mutation = useSetRegistrationStatus(studentId);
  const noteId = useId();
  const firstName = studentName.split(' ')[0];

  // Reset each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStatus(initial);
    setNote(suggestedNotes[initial] ?? '');
    setError('');
  }, [open, initial]);

  const choose = (s: ActiveRegistrationStatus) => {
    // Swap in the suggested note unless the officer has written their own.
    if (note === (suggestedNotes[status] ?? '')) setNote(suggestedNotes[s] ?? '');
    setStatus(s);
  };

  const save = () => {
    setError('');
    mutation.mutate(
      { status, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${firstName}'s registration is now “${registrationStatus[status].label}”`, {
            description: note.trim() ? 'Your note is on their dashboard.' : undefined,
          });
          onOpenChange(false);
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Update {firstName}'s registration</DialogTitle>
          <DialogDescription>The student sees the new status, and your note if you add one.</DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldLegend variant="label">New status</FieldLegend>
          <RadioGroup
            value={status}
            onValueChange={(v) => choose(v as ActiveRegistrationStatus)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {REGISTRATION_FLOW.map((s) => (
              <FieldLabel key={s} htmlFor={`${noteId}-${s}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle id={`${noteId}-${s}-title`}>
                      {registrationStatus[s].label}
                      {s === current && <span className="text-xs font-normal text-muted-foreground">(current)</span>}
                    </FieldTitle>
                    <FieldDescription id={`${noteId}-${s}-desc`}>{registrationStatus[s].description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    value={s}
                    id={`${noteId}-${s}`}
                    aria-labelledby={`${noteId}-${s}-title`}
                    aria-describedby={`${noteId}-${s}-desc`}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>

        <div className="grid gap-2">
          <Label htmlFor={noteId}>
            Note to {firstName} <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            aria-describedby={`${noteId}-hint`}
          />
          <p id={`${noteId}-hint`} className="text-sm text-muted-foreground">
            Write to the student. Don't include anything you wouldn't want them to read.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4" aria-label="Preview of what the student sees">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <EyeIcon aria-hidden className="size-3.5" /> What {firstName} will see
          </p>
          <p className="font-semibold">{statusLabels[status].label}</p>
          <p className="text-sm text-muted-foreground">{statusLabels[status].description}</p>
          {note.trim() && <p className="mt-2 rounded-md bg-background p-3 text-sm">{note.trim()}</p>}
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={mutation.isPending || (status === current && !note.trim())}>
            {mutation.isPending && <Spinner aria-hidden />}
            {status === current ? 'Send note' : `Set to “${registrationStatus[status].label}”`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
