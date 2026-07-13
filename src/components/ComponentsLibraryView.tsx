/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Mail,
  Users,
  Briefcase,
  DollarSign,
  Plus,
  Download,
  Search,
  Loader2,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { FormInput, FormSelect, FormTextarea, FormCheckbox, FormDatePicker } from './forms/FormControls';
import { UnifiedTable, UnifiedTableHeader } from './UnifiedTable';
import StatTile from './StatTile';
import Avatar from './Avatar';
import CRMProgressBanner from './details/CRMProgressBanner';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// ---------------------------------------------------------------------------
// Page scaffolding: section registry drives both the sticky in-page nav and
// the section anchors below, so adding a new section only means adding one
// entry here plus its JSX block.
// ---------------------------------------------------------------------------
const SECTIONS = [
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges & Status' },
  { id: 'avatars', label: 'Avatars' },
  { id: 'forms', label: 'Form Controls' },
  { id: 'cards', label: 'Cards & Stat Tiles' },
  { id: 'tables', label: 'Tables' },
  { id: 'tabs-select', label: 'Tabs & Select (unused)' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'progress', label: 'Progress Banner' },
];

function SectionHeading({ id, title, tag, children }: { id: string; title: string; tag: 'Single' | 'Combined'; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Badge variant={tag === 'Single' ? 'primary' : 'info'}>{tag} component{tag === 'Combined' ? 's' : ''}</Badge>
      </div>
      {children}
    </section>
  );
}

function Swatch({ label, children, code }: { label: string; children: React.ReactNode; code?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 border border-border rounded-md">{children}</div>
      {code && <code className="block text-[10.5px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{code}</code>}
    </div>
  );
}

const DEMO_TABLE_ROWS = [
  { id: 'DEMO-1', name: 'Acme Industries', status: 'Qualified', value: 24500 },
  { id: 'DEMO-2', name: 'Globex Corp', status: 'Working', value: 12000 },
  { id: 'DEMO-3', name: 'Initech LLC', status: 'New', value: 8500 },
];

const DEMO_TABLE_HEADERS: UnifiedTableHeader[] = [
  { key: 'name', label: 'Account' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value', className: 'text-right' },
];

export default function ComponentsLibraryView() {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const { register } = useForm({ defaultValues: { demoInput: '', demoTextarea: '', demoCheckbox: false } });
  const [demoSelectValue, setDemoSelectValue] = useState('option-2');
  const [demoDate, setDemoDate] = useState(new Date().toISOString().slice(0, 10));
  const [tableLoading, setTableLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progressType, setProgressType] = useState<'status' | 'priority' | 'stage'>('status');

  const handleConfirmDemo = async () => {
    const ok = await confirm({
      title: 'Delete this record?',
      description: 'This is a live demo of the shared ConfirmDialog — try Cancel and Delete.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    showToast(ok ? 'Confirmed — record "deleted."' : 'Cancelled — nothing happened.', ok ? 'success' : 'info');
  };

  return (
    <div className="space-y-8 pb-24">
      <div>
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight">Component Library</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every reusable building block available in this codebase, in one place — for whoever builds the next screen.
          <strong className="text-foreground"> Single</strong> = an atomic primitive (usually from <code className="font-mono text-[11px]">components/ui/*</code>).
          <strong className="text-foreground"> Combined</strong> = a composite pattern built from those primitives for this app's specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-8">
        {/* Sticky in-page nav */}
        <nav className="lg:sticky lg:top-6 lg:self-start space-y-0.5 text-sm">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block px-2.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-12 min-w-0">
          {/* BUTTONS */}
          <SectionHeading id="buttons" title="Buttons" tag="Single">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">import {'{ Button }'} from '@/components/ui/button'</code> — variants: default, outline, secondary, ghost, destructive, link. Sizes: xs, sm, default, lg, icon(-xs/sm/lg).
            </p>
            <Swatch label="Variants">
              <Button variant="default">Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </Swatch>
            <Swatch label="Sizes">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Add"><Plus /></Button>
            </Swatch>
            <Swatch label="With icon / disabled / loading">
              <Button><Download className="h-4 w-4" />Export</Button>
              <Button disabled>Disabled</Button>
              <Button disabled><Loader2 className="h-4 w-4 animate-spin" />Saving…</Button>
            </Swatch>
          </SectionHeading>

          {/* BADGES */}
          <SectionHeading id="badges" title="Badges & Status Pills" tag="Single">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">import {'{ Badge }'} from '@/components/ui/badge'</code> — new this session; replaces the inline <code className="font-mono text-xs">px-2 py-0.5 border rounded text-[11px] …</code> badge markup that was hand-duplicated across LeadsView/ContactsView/DealsView/TasksView. Prefer this for any new status/priority/tag pill.
            </p>
            <Swatch label="Variants" code={`<Badge variant="success">Won</Badge>`}>
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="outline">Outline</Badge>
            </Swatch>
            <Swatch label="Real-world usage examples">
              <Badge variant="success">Qualified</Badge>
              <Badge variant="primary">Working</Badge>
              <Badge variant="default">New</Badge>
              <Badge variant="destructive">Unqualified</Badge>
              <Badge variant="warning">Medium priority</Badge>
              <Badge variant="info"><Info className="h-3 w-3" />Virtual account</Badge>
            </Swatch>
          </SectionHeading>

          {/* AVATARS */}
          <SectionHeading id="avatars" title="Avatars" tag="Single">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">import Avatar from '../Avatar'</code> — new this session; replaces the <code className="font-mono text-xs">name.split(' ').map(n{'=>'}n[0]).join('')</code> initials logic duplicated in ContactsView/DealsView. Color is deterministic from the name, so the same person always gets the same color.
            </p>
            <Swatch label="Sizes" code={`<Avatar name="Sarah Jenkins" size="md" />`}>
              <Avatar name="Sarah Jenkins" size="xs" />
              <Avatar name="Alex Rivera" size="sm" />
              <Avatar name="Marcus Brody" size="md" />
              <Avatar name="Elena Rostova" size="lg" />
            </Swatch>
          </SectionHeading>

          {/* FORM CONTROLS */}
          <SectionHeading id="forms" title="Form Controls" tag="Combined">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">src/components/forms/FormControls.tsx</code> — the shared, accessible (aria-invalid/aria-describedby/role=alert wired in) form fields every create/edit sheet in this app uses. <code className="font-mono text-xs">FormInput</code>/<code className="font-mono text-xs">FormTextarea</code>/<code className="font-mono text-xs">FormCheckbox</code> take a react-hook-form <code className="font-mono text-xs">register(...)</code> result; <code className="font-mono text-xs">FormSelect</code> works either registered or fully controlled via <code className="font-mono text-xs">value</code>/<code className="font-mono text-xs">onChange</code>; <code className="font-mono text-xs">FormDatePicker</code> is always controlled.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/40 border border-border rounded-md">
              <FormInput label="Company name" register={register('demoInput')} placeholder="e.g. Stark Industries" />
              <FormSelect
                label="Assigned owner"
                value={demoSelectValue}
                onChange={setDemoSelectValue}
                options={[
                  { value: 'option-1', label: 'Sarah Jenkins' },
                  { value: 'option-2', label: 'Alex Rivera' },
                  { value: 'option-3', label: 'Marcus Brody' },
                ]}
              />
              <FormDatePicker label="Expected close date" registerName="demoDate" setValue={(_n, v) => setDemoDate(v)} value={demoDate} />
              <FormCheckbox label="Exclude from campaigns" register={register('demoCheckbox')} />
              <div className="sm:col-span-2">
                <FormTextarea label="Notes" register={register('demoTextarea')} placeholder="Free-form notes…" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <FormInput label="Field with an error" register={register('demoInput')} error="This is what a validation error looks like." />
              </div>
            </div>
          </SectionHeading>

          {/* CARDS & STAT TILES */}
          <SectionHeading id="cards" title="Cards & Stat Tiles" tag="Combined">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">Card</code>/<code className="font-mono text-xs">CardHeader</code>/<code className="font-mono text-xs">CardTitle</code>/<code className="font-mono text-xs">CardContent</code> (single, from <code className="font-mono text-xs">components/ui/card</code>) plus <code className="font-mono text-xs">StatTile</code> (combined, new this session — pulled out of Dashboard/Reports so the KPI-tile shape isn't hand-rebuilt on every new analytics page).
            </p>
            <Swatch label="Plain card">
              <Card className="w-full max-w-sm bg-card border border-border">
                <CardHeader>
                  <CardTitle>Card title</CardTitle>
                  <CardDescription>A short supporting description goes here.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Card body content.</CardContent>
              </Card>
            </Swatch>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile label="Total Leads" value={7} icon={<Users className="h-4.5 w-4.5 text-primary" />} trend={12.4} />
              <StatTile label="Open Pipeline" value="$77,000" icon={<DollarSign className="h-4.5 w-4.5 text-primary" />} trend={-4.2} />
              <StatTile label="Deals Won" value={1} icon={<Briefcase className="h-4.5 w-4.5 text-primary" />} />
            </div>
          </SectionHeading>

          {/* TABLES */}
          <SectionHeading id="tables" title="Tables" tag="Combined">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">UnifiedTable</code> (src/components/UnifiedTable.tsx) — the shared table shell every directory page (Leads/Contacts/Accounts/Deals/Tasks) uses: pagination, rows-per-page, empty state, and a loading skeleton, all built in. Raw <code className="font-mono text-xs">Table</code>/<code className="font-mono text-xs">TableRow</code>/<code className="font-mono text-xs">TableCell</code> primitives also exist in <code className="font-mono text-xs">components/ui/table.tsx</code> for one-off cases that don't need pagination.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setTableLoading((v) => !v)}>
                Toggle loading state ({tableLoading ? 'on' : 'off'})
              </Button>
            </div>
            <UnifiedTable
              id="demo-unified-table"
              data={DEMO_TABLE_ROWS}
              headers={DEMO_TABLE_HEADERS}
              loading={tableLoading}
              emptyStateText="No demo rows."
              renderRow={(row) => (
                <tr key={row.id} className="h-11 border-b border-border hover:bg-muted/50">
                  <td className="py-2 px-4 font-medium text-foreground">{row.name}</td>
                  <td className="py-2 px-4"><Badge variant="primary">{row.status}</Badge></td>
                  <td className="py-2 px-4 text-right font-mono text-foreground">${row.value.toLocaleString()}</td>
                </tr>
              )}
            />
          </SectionHeading>

          {/* TABS & SELECT (unused) */}
          <SectionHeading id="tabs-select" title="Tabs & Select" tag="Single">
            <p className="text-sm text-muted-foreground">
              These two shadcn primitives exist in <code className="font-mono text-xs">components/ui/</code> but <strong className="text-foreground">nothing in this app currently imports them</strong> — every select field uses the custom <code className="font-mono text-xs">FormSelect</code> above instead, and tabbed UI (e.g. <code className="font-mono text-xs">CRMInteractionTabs</code>) is hand-rolled. They're shown here so the next engineer knows they're available (and working) rather than reaching for a new library or re-hand-rolling tabs.
            </p>
            <Swatch label="Tabs">
              <Tabs defaultValue="one" className="w-full max-w-md">
                <TabsList>
                  <TabsTrigger value="one">Notes</TabsTrigger>
                  <TabsTrigger value="two">Tasks</TabsTrigger>
                  <TabsTrigger value="three">Meetings</TabsTrigger>
                </TabsList>
                <TabsContent value="one" className="text-sm text-muted-foreground pt-2">Notes panel content.</TabsContent>
                <TabsContent value="two" className="text-sm text-muted-foreground pt-2">Tasks panel content.</TabsContent>
                <TabsContent value="three" className="text-sm text-muted-foreground pt-2">Meetings panel content.</TabsContent>
              </Tabs>
            </Swatch>
            <Swatch label="Select (shadcn primitive — prefer FormSelect above for app forms)">
              <Select defaultValue="b">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                </SelectContent>
              </Select>
            </Swatch>
          </SectionHeading>

          {/* OVERLAYS */}
          <SectionHeading id="overlays" title="Overlays" tag="Single">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">Dialog</code>, <code className="font-mono text-xs">Sheet</code> (used for every create/edit side-panel in this app), and <code className="font-mono text-xs">Popover</code> — all from <code className="font-mono text-xs">components/ui/</code>.
            </p>
            <Swatch label="Dialog / Sheet / Popover">
              <Button variant="outline" onClick={() => setDialogOpen(true)}>Open dialog</Button>
              <Button variant="outline" onClick={() => setSheetOpen(true)}>Open sheet</Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 text-sm text-foreground bg-card border border-border">
                  Popover content — used for the Navbar notification bell and row-action menus.
                </PopoverContent>
              </Popover>
            </Swatch>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example dialog</DialogTitle>
                  <DialogDescription>This is the shared Dialog primitive — also what ConfirmDialog (below) is built on.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent side="right" className="w-full sm:max-w-md bg-card border-l border-border p-0 flex flex-col h-full">
                <SheetHeader className="px-5 py-4 border-b border-border bg-muted">
                  <SheetTitle>Example sheet</SheetTitle>
                </SheetHeader>
                <div className="p-5 text-sm text-muted-foreground">
                  Every create/edit form in this app (Add Lead, Add Deal, Edit Account, …) is a Sheet like this one, sliding in from the right.
                </div>
              </SheetContent>
            </Sheet>
          </SectionHeading>

          {/* FEEDBACK */}
          <SectionHeading id="feedback" title="Feedback" tag="Combined">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">useToast()</code> (src/context/ToastContext.tsx) and <code className="font-mono text-xs">useConfirm()</code> (src/context/ConfirmContext.tsx) — the app-wide replacements for <code className="font-mono text-xs">alert()</code>/<code className="font-mono text-xs">confirm()</code>. Also <strong className="text-foreground">Cmd/Ctrl+K</strong> anywhere in the app opens the global command palette (src/components/CommandPalette.tsx) for jumping to any page, lead, contact, deal, or account.
            </p>
            <Swatch label="Toast">
              <Button size="sm" variant="outline" onClick={() => showToast('Saved successfully.', 'success')}>Trigger success toast</Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Something went wrong.', 'error')}>Trigger error toast</Button>
              <Button size="sm" variant="outline" onClick={() => showToast('Just so you know…', 'info')}>Trigger info toast</Button>
            </Swatch>
            <Swatch label="Confirm dialog">
              <Button size="sm" variant="outline" onClick={handleConfirmDemo}>Trigger confirm dialog</Button>
            </Swatch>
          </SectionHeading>

          {/* PROGRESS BANNER */}
          <SectionHeading id="progress" title="Progress / Pipeline Banner" tag="Combined">
            <p className="text-sm text-muted-foreground">
              <code className="font-mono text-xs">CRMProgressBanner</code> (src/components/details/CRMProgressBanner.tsx) — the stepper banner at the top of every Lead/Contact/Deal detail page. Supports <code className="font-mono text-xs">type="status"</code> (lead pipeline), <code className="font-mono text-xs">"priority"</code> (contact priority), and <code className="font-mono text-xs">"stage"</code> (deal funnel).
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant={progressType === 'status' ? 'default' : 'outline'} onClick={() => setProgressType('status')}>status</Button>
              <Button size="sm" variant={progressType === 'priority' ? 'default' : 'outline'} onClick={() => setProgressType('priority')}>priority</Button>
              <Button size="sm" variant={progressType === 'stage' ? 'default' : 'outline'} onClick={() => setProgressType('stage')}>stage</Button>
            </div>
            <CRMProgressBanner
              type={progressType}
              value={progressType === 'status' ? 'Working' : progressType === 'priority' ? 'Medium' : 'Demo Scheduled'}
            />
          </SectionHeading>
        </div>
      </div>
    </div>
  );
}
