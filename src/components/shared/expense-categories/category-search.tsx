import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CategorySearchProps = {
  q: string;
};

export function CategorySearch({ q }: CategorySearchProps) {
  return (
    <form className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row">
      <Input name="q" placeholder="Search expense categories" defaultValue={q} />
      <div className="flex gap-2">
        <Button type="submit">Search</Button>
        <Button asChild variant="outline">
          <Link href="/expense-categories">Reset</Link>
        </Button>
      </div>
    </form>
  );
}
