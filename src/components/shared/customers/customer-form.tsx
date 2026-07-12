'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type CustomerValues } from '@/lib/validations/customer';

type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<keyof CustomerValues, string>>;
};

type CustomerFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: Partial<CustomerValues>;
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

export function CustomerForm({ title, description, submitLabel, action, initialValues }: CustomerFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" action={formAction}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={initialValues?.name ?? ''} />
              {state.fieldErrors?.name ? <p className="text-sm text-destructive">{state.fieldErrors.name}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" name="company" defaultValue={initialValues?.company ?? ''} />
              {state.fieldErrors?.company ? (
                <p className="text-sm text-destructive">{state.fieldErrors.company}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={initialValues?.country ?? ''} />
              {state.fieldErrors?.country ? (
                <p className="text-sm text-destructive">{state.fieldErrors.country}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={initialValues?.phone ?? ''} />
              {state.fieldErrors?.phone ? <p className="text-sm text-destructive">{state.fieldErrors.phone}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={initialValues?.email ?? ''} />
              {state.fieldErrors?.email ? <p className="text-sm text-destructive">{state.fieldErrors.email}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={initialValues?.notes ?? ''} />
            {state.fieldErrors?.notes ? <p className="text-sm text-destructive">{state.fieldErrors.notes}</p> : null}
          </div>

          {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

          <SubmitButton label={submitLabel} />
        </form>
      </CardContent>
    </Card>
  );
}
