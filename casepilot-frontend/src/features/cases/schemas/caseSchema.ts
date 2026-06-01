import { z } from 'zod';

// Frontend validation schema for case form
// This ZOD validator is used before sending data to the backend-> before HTTP request
// The FluentValidation backend is still necessary for server-side validation and business rules enforcement, 
// but this schema provides immediate feedback to users and reduces unnecessary API calls with invalid data.
export const caseSchema = z.object({
  number: z
    .string()
    .min(1, 'Numărul dosarului este obligatoriu.')
    .max(50, 'Numărul dosarului nu poate depăși 50 de caractere.')
    .regex(/^\d+\/\d{4}$/, 'Format recomandat: 1234/2024.'),
  registrationDate: z
  .string()
  .min(1, 'Data înregistrării este obligatorie.')
  .refine((value) => {
    const selectedDate = new Date(value);
    const today = new Date();

    // ignorăm ora
    today.setHours(12,59,59,999);

    return selectedDate <= today;
  }, 'Data înregistrării nu poate fi ulterioară datei curente.'),
 court: z
    .string()
    .min(1, 'Instanța este obligatorie.')
    .max(100, 'Instanța nu poate depăși 100 de caractere.'),
  object: z
    .string()
    .min(1, 'Obiectul dosarului este obligatoriu.')
    .max(200, 'Obiectul dosarului nu poate depăși 200 de caractere.'),
  reclamant: z
    .string()
    .min(1, 'Reclamantul este obligatoriu.')
    .max(100, 'Numele reclamantului nu poate depăși 100 de caractere.'),
  parat: z
    .string()
    .min(1, 'Pârâtul este obligatoriu.')
    .max(100, 'Numele pârâtului nu poate depăși 100 de caractere.'),
  stage: z.enum(['Fond', 'Apel', 'Recurs', 'Executare', 'Contestație']),
  status: z.enum(['Activ', 'Amânat', 'Suspendat', 'Finalizat'])
});

export type CaseFormValues = z.infer<typeof caseSchema>;

/*
User input
   ↓
Zod (frontend)
   ↓ (dacă trece)
API call
   ↓
FluentValidation (backend)
   ↓
Response (success / error)
 */