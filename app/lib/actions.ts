'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  // Next.jsには、ルートセグメントをユーザーのブラウザに一時的に保存するクライアントサイドルーターキャッシュがあります。
  // プリフェッチとともに、このキャッシュは、サーバーへのリクエスト数を減らしながら、ユーザーがルート間をすばやく移動できるようにします。
  // 請求書ルートに表示されるデータを更新するので、このキャッシュをクリアして、サーバーへの新しいリクエストをトリガーする
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}