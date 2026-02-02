import { z } from 'zod';

export const profileSchema = z.object({
  address: z.string().optional(),
  nid_or_brid: z.string().optional(),
  profession: z.string().optional(),
  blood_group: z.string().optional(),
  gender: z.string().optional(),
  marital_status: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  working_place: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
