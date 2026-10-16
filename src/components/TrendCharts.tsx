import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Astronaut } from '../types/astronaut';

interface TrendChartsProps {
  astronaut: Astronaut;
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ astronaut }) => {
  if (astronaut.checkins.length === 0) {
    return (
      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-slate-500 text-center">
        <p className="font-semibold">N/A - Not Available</p>
        <p className="text-sm">No medical reports filed for this crew member.</p>
      </div>
    );
  }

  const data = astronaut.checkins.map(c => ({
    date: c.timestamp.toLocaleDateString(),
    mood: c.mood,
    sleep: c.sleepQuality
  }));

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <h3 className="text-slate-300 font-semibold mb-4">Health Trends</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
          <Legend />
          <Line type="monotone" dataKey="mood" stroke="#06b6d4" name="Mental Health" />
          <Line type="monotone" dataKey="sleep" stroke="#ef4444" name="Physical Health" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
