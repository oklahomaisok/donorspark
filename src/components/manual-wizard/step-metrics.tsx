'use client';

export interface MetricsData {
  metrics: { value: string; label: string }[];
}

interface StepMetricsProps {
  data: MetricsData;
  onChange: (data: MetricsData) => void;
}

export function StepMetrics({ data, onChange }: StepMetricsProps) {
  const addMetric = () => {
    if (data.metrics.length < 5) {
      onChange({ metrics: [...data.metrics, { value: '', label: '' }] });
    }
  };

  const removeMetric = (index: number) => {
    onChange({ metrics: data.metrics.filter((_, i) => i !== index) });
  };

  const updateMetric = (index: number, field: 'value' | 'label', value: string) => {
    const updated = [...data.metrics];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ metrics: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl serif mb-2">Impact Numbers</h2>
        <p className="text-sm text-ink/50">
          Share your key metrics. These help donors understand the scale of your work.
        </p>
      </div>

      <div className="space-y-3">
        {data.metrics.map((metric, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={metric.value}
                onChange={(e) => updateMetric(i, 'value', e.target.value)}
                placeholder="e.g. 2,500"
                className="bg-cream border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
              />
              <input
                type="text"
                value={metric.label}
                onChange={(e) => updateMetric(i, 'label', e.target.value)}
                placeholder="e.g. Youth Served"
                className="bg-cream border border-ink/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-ink/20 focus:border-transparent transition-shadow"
              />
            </div>
            <button
              type="button"
              onClick={() => removeMetric(i)}
              className="text-ink/30 hover:text-ink/60 transition-colors px-2 pt-2.5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}

        {data.metrics.length < 5 && (
          <button
            type="button"
            onClick={addMetric}
            className="text-sm text-ink/50 hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add a metric
          </button>
        )}

        {data.metrics.length === 0 && (
          <div className="bg-cream/50 border border-ink/5 rounded-xl p-4 text-center">
            <p className="text-sm text-ink/40">
              No metrics yet. Don&apos;t worry if you don&apos;t have exact numbers — you can add these later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
