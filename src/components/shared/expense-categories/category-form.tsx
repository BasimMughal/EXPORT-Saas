'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ExpenseCategoryValues } from '@/lib/validations/expense-category';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof ExpenseCategoryValues, string>>;
};

type CategoryFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: Partial<ExpenseCategoryValues>;
};

const initialState: ActionState = {
  ok: false,
  message: '',
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Saving...' : label}
    </Button>
  );
}

export function CategoryForm({ title, description, submitLabel, action, initialValues }: CategoryFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" name="name" placeholder="e.g. Shipping" defaultValue={initialValues?.name ?? ''} />
            {state.fieldErrors?.name ? <p className="text-sm text-destructive">{state.fieldErrors.name}</p> : null}
          </div>

          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

          <SubmitButton label={submitLabel} />
        </form>
      </CardContent>
    </Card>
  );
}
