import { z } from "zod";

export const createStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the staff member's name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().default(""),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
