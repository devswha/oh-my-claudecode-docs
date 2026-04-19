import { z } from 'zod';

export const reportSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('vote'),
    path: z.string().min(1).max(500),
    locale: z.string().min(2).max(5),
    value: z.enum(['up', 'down']),
    turnstileToken: z.string().min(1),
  }),
  z.object({
    kind: z.literal('report'),
    category: z.enum(['bug', 'question', 'suggestion']),
    title: z.string().min(10).max(120),
    body: z.string().min(20).max(8000),
    path: z.string().max(500).optional(),
    locale: z.string().min(2).max(5),
    turnstileToken: z.string().min(1),
  }),
]);

export type ReportBody = z.infer<typeof reportSchema>;
