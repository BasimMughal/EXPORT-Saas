'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  exportReportCsv,
  exportReportExcel,
  exportReportPdf,
} from '@/lib/exports/report-export';

type ReportPayload = Parameters<typeof exportReportCsv>[0];

export function ReportExportActions({ payload }: { payload: ReportPayload }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(kind: 'csv' | 'excel' | 'pdf') {
    try {
      setBusy(kind);
      if (kind === 'csv') exportReportCsv(payload);
      if (kind === 'excel') await exportReportExcel(payload);
      if (kind === 'pdf') await exportReportPdf(payload);
      toast.success(`Report exported as ${kind.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      toast.error('Unable to export report right now.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        className="rounded-xl"
        disabled={busy !== null}
        onClick={() => void run('csv')}
      >
        <FileText className="h-4 w-4" />
        {busy === 'csv' ? 'Exporting...' : 'CSV'}
      </Button>
      <Button
        variant="outline"
        className="rounded-xl"
        disabled={busy !== null}
        onClick={() => void run('excel')}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {busy === 'excel' ? 'Exporting...' : 'Excel'}
      </Button>
      <Button className="rounded-xl" disabled={busy !== null} onClick={() => void run('pdf')}>
        <Download className="h-4 w-4" />
        {busy === 'pdf' ? 'Exporting...' : 'PDF'}
      </Button>
    </div>
  );
}
