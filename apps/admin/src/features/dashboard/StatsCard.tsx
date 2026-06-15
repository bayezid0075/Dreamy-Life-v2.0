interface StatsCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  chartPath?: string;
}

export default function StatsCard({ title, value, trend, trendValue, color = 'tertiary', chartPath }: StatsCardProps) {
  const colorMap: Record<string, { text: string; bg: string; blur: string }> = {
    tertiary: { text: 'text-tertiary', bg: 'bg-tertiary/10', blur: 'bg-tertiary/20' },
    primary: { text: 'text-primary-container', bg: 'bg-primary-container/10', blur: 'bg-primary-container/20' },
    secondary: { text: 'text-error', bg: 'bg-error/10', blur: 'bg-secondary-container/20' },
  };
  const c = colorMap[color] || colorMap.tertiary;

  return (
    <div className="glass-panel rounded-xl p-md flex flex-col justify-between relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${c.blur} rounded-full blur-xl group-hover:blur-2xl transition-all`} />
      <div>
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold">{title}</p>
        <h2 className={`font-display-lg text-display-lg mt-xs font-bold ${color === 'primary' ? 'neon-text text-primary-container' : 'text-on-surface'}`}>
          {value}
        </h2>
      </div>
      {(trend || chartPath) && (
        <div className="flex items-end justify-between mt-md">
          {trend && trendValue && (
            <div className={`flex items-center ${c.text} font-code-sm text-code-sm ${c.bg} px-2 py-1 rounded`}>
              <span className="material-symbols-outlined text-[16px] mr-1">
                {trend === 'up' ? 'trending_up' : 'trending_down'}
              </span>
              {trendValue}
            </div>
          )}
          {chartPath && (
            <svg className="w-16 h-8" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path className={c.text} d={chartPath} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
