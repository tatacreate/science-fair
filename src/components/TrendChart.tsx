import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendChartProps {
  data: { date: string; physical: number; mental: number }[];
  astronautName: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, astronautName }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900 mb-4">{astronautName} Health Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} domain={[0, 10]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e4e4e7' }}
            />
            <Legend />
            <Line type="monotone" dataKey="physical" stroke="#0ea5e9" strokeWidth={2} name="Physical" />
            <Line type="monotone" dataKey="mental" stroke="#f59e0b" strokeWidth={2} name="Mental" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
