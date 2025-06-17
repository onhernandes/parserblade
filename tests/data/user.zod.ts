import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2),
  age: z.number().min(0).max(120),
  email: z.string().email(),
  isActive: z.boolean(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string()
  }),
  tags: z.array(z.string())
});

export default userSchema; 