import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Search, Users, Calendar, DollarSign, FileWarning, Filter, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ExtractedEntity } from '@/types/entities';

interface EntityResultsDashboardProps {
  entities: ExtractedEntity;
  fileName: string;
}

type TabKey = 'party_names' | 'dates' | 'amounts' | 'termination_clauses';

const tabs: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'party_names', label: 'Parties', icon: Users },
  { key: 'dates', label: 'Dates', icon: Calendar },
  { key: 'amounts', label: 'Amounts', icon: DollarSign },
  { key: 'termination_clauses', label: 'Termination', icon: FileWarning },
];

export function EntityResultsDashboard({ entities, fileName }: EntityResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('party_names');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(entities, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.pdf', '')}_entities.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(entities, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredData = useMemo(() => {
    const data = entities[activeTab] as any[];
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some((v) =>
        typeof v === 'string' && v.toLowerCase().includes(q)
      )
    );
  }, [entities, activeTab, searchQuery]);

  const totalEntities =
    entities.party_names.length +
    entities.dates.length +
    entities.amounts.length +
    entities.termination_clauses.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tabs.map((tab) => {
          const count = entities[tab.key].length;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl border p-4 text-left transition-all ${
                activeTab === tab.key
                  ? 'border-primary/50 bg-primary/5 shadow-gold'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{tab.label}</span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${activeTab === tab.key ? 'text-primary' : 'text-foreground'}`}>
                {count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyJSON} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </Button>
          <Button size="sm" onClick={handleDownloadJSON} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download JSON
          </Button>
        </div>
      </div>

      {/* Confidence */}
      {entities.metadata?.overall_confidence !== undefined && (
        <div className="flex items-center gap-3 rounded-lg bg-secondary px-4 py-2.5 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Overall Confidence:</span>
          <Badge variant={entities.metadata.overall_confidence >= 0.8 ? 'default' : 'secondary'}>
            {Math.round(entities.metadata.overall_confidence * 100)}%
          </Badge>
          <span className="text-muted-foreground ml-2">·</span>
          <span className="text-muted-foreground">{totalEntities} entities extracted</span>
        </div>
      )}

      {/* Results table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {activeTab === 'party_names' && (
                  <>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
                  </>
                )}
                {activeTab === 'dates' && (
                  <>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Context</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valid</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
                  </>
                )}
                {activeTab === 'amounts' && (
                  <>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Currency</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Context</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
                  </>
                )}
                {activeTab === 'termination_clauses' && (
                  <>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Clause</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notice Period</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    {searchQuery ? 'No matching entities found' : 'No entities extracted for this category'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    {activeTab === 'party_names' && (
                      <>
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.role || '—'}</td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge value={item.confidence} />
                        </td>
                      </>
                    )}
                    {activeTab === 'dates' && (
                      <>
                        <td className="px-4 py-3 font-mono text-foreground">{item.date}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.context || '—'}</td>
                        <td className="px-4 py-3">
                          {item.valid_format ? (
                            <Badge variant="default" className="text-xs">Valid</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Non-standard</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge value={item.confidence} />
                        </td>
                      </>
                    )}
                    {activeTab === 'amounts' && (
                      <>
                        <td className="px-4 py-3 font-mono font-semibold text-primary">{item.amount}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.currency || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{item.context || '—'}</td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge value={item.confidence} />
                        </td>
                      </>
                    )}
                    {activeTab === 'termination_clauses' && (
                      <>
                        <td className="px-4 py-3 text-foreground max-w-md">
                          <p className="line-clamp-3">{item.clause_text}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{item.notice_period || '—'}</td>
                        <td className="px-4 py-3">
                          <ConfidenceBadge value={item.confidence} />
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warnings */}
      {entities.metadata?.warnings && entities.metadata.warnings.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-medium text-warning mb-2">⚠ Processing Warnings</p>
          <ul className="space-y-1">
            {entities.metadata.warnings.map((w, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {w}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function ConfidenceBadge({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-muted-foreground">—</span>;
  const pct = Math.round(value * 100);
  return (
    <span className={`text-xs font-mono font-medium ${
      pct >= 85 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-destructive'
    }`}>
      {pct}%
    </span>
  );
}
