import React from 'react';

interface PeriodSelectorProps {
  periods: Array<{ id: string; name: string; startDate: string; endDate: string; }>; // minimal shape
  currentPeriod: { id: string } | null;
  onChange: (periodId: string) => void;
  loading?: boolean;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ periods, currentPeriod, onChange, loading }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Payroll Period</label>
      <select
        className="bg-background border border-input text-foreground rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-colors shadow-sm dark:bg-muted dark:text-white dark:border-muted-foreground"
        value={currentPeriod?.id || ''}
        onChange={e => onChange(e.target.value)}
        disabled={loading || periods.length === 0}
      >
        <option value="" disabled>
          {loading ? 'Loading...' : 'Select a period'}
        </option>
        {periods.map(period => (
          <option key={period.id} value={period.id}>
            {period.name} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
          </option>
        ))}
      </select>
    </div>
  );
};

export default PeriodSelector;
