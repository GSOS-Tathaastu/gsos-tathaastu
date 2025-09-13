import { z } from "zod";

export const Onboarding = z.object({
  role: z.enum(["retailer","manufacturer","logistics","financier","government"]),
  companySize: z.string().min(1),
  geography: z.string().min(1),
  revenueBand: z.string().min(1),
  painArea: z.string().min(1),
  businessDesc: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional()
});
