import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { caseSchema, type CaseFormValues } from '../schemas/caseSchema';
import type { LegalCase } from '../types/case';

interface CaseFormDialogProps {
  open: boolean;
  title: string;
  initialValue?: LegalCase;
  onClose: () => void;
  onSubmit: (values: CaseFormValues) => void;
}

const defaultValues: CaseFormValues = {
  number: '',
  registrationDate: new Date().toISOString().slice(0, 10),
  court: '',
  object: '',
  reclamant: '',
  parat: '',
  stage: 'Fond',
  status: 'Activ'
};

export function CaseFormDialog({ open, title, initialValue, onClose, onSubmit }: CaseFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: initialValue
      ? {
          number: initialValue.number,
          registrationDate: initialValue.registrationDate.slice(0, 10),
          court: initialValue.court,
          object: initialValue.object,
          reclamant: initialValue.reclamant,
          parat: initialValue.parat,
          stage: initialValue.stage,
          status: initialValue.status
        }
      : defaultValues
  });

  useEffect(() => {
    if (open) {
      reset(
        initialValue
          ? {
              number: initialValue.number,
              registrationDate: initialValue.registrationDate.slice(0, 10),
              court: initialValue.court,
              object: initialValue.object,
              reclamant: initialValue.reclamant,
              parat: initialValue.parat,
              stage: initialValue.stage,
              status: initialValue.status
            }
          : defaultValues
      );
    }
  }, [initialValue, open, reset]);

  const handleClose = () => {
    reset(initialValue ? {
      number: initialValue.number,
      registrationDate: initialValue.registrationDate.slice(0, 10),
      court: initialValue.court,
      object: initialValue.object,
      reclamant: initialValue.reclamant,
      parat: initialValue.parat,
      stage: initialValue.stage,
      status: initialValue.status
    } : defaultValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.25} sx={{ mt: 1 }}>
          <Controller
            name="number"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Număr dosar"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="registrationDate"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="date"
                label="Data înregistrare"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true
                  }
                }}
              />
            )}
          />
          <Controller
            name="court"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Instanță"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="object"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Obiect"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="reclamant"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Reclamant"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="parat"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Pârât"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="stage"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Stadiu procesual"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              >
                <MenuItem value="Fond">Fond</MenuItem>
                <MenuItem value="Apel">Apel</MenuItem>
                <MenuItem value="Recurs">Recurs</MenuItem>
                <MenuItem value="Executare">Executare</MenuItem>
                <MenuItem value="Contestație">Contestație</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label="Status"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              >
                <MenuItem value="Activ">Activ</MenuItem>
                <MenuItem value="Amânat">Amânat</MenuItem>
                <MenuItem value="Suspendat">Suspendat</MenuItem>
                <MenuItem value="Finalizat">Finalizat</MenuItem>
              </TextField>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={handleClose}>
          Anulează
        </Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          Salvează
        </Button>
      </DialogActions>
    </Dialog>
  );
}
