import React, { useState } from 'react';

interface IntakeFormData {
  sleepQuality: number;
  sleepDuration: number;
  painAreas: string;
  nutritionalIntake: string;
  exerciseRoutine: string;
  height: string;
  weight: string;
  mood: number;
  psychologicalStressors: string;
  interpersonalFriction: string;
  isolationFeeling: number;
  habitsStruggling: string;
  habitsImproving: string;
  notes: string;
}

export const DailyIntakeForm: React.FC = () => {
  const [formData, setFormData] = useState<IntakeFormData>({
    sleepQuality: 5, sleepDuration: 7, painAreas: '', nutritionalIntake: '', exerciseRoutine: '',
    height: '', weight: '', mood: 5, psychologicalStressors: '', interpersonalFriction: '',
    isolationFeeling: 5, habitsStruggling: '', habitsImproving: '', notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted Clinical Intake:', formData);
    alert('Intake data processed by medical engine.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Daily Clinical Intake</h2>
      <div className="grid grid-cols-2 gap-6">
        {/* Physical Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 border-b pb-2">Physical Health</h3>
          <input type="number" name="sleepQuality" placeholder="Sleep Quality (1-10)" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="number" name="sleepDuration" placeholder="Sleep Duration (hrs)" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="text" name="painAreas" placeholder="Body Pain Localization" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="text" name="nutritionalIntake" placeholder="Nutritional Intake" className="w-full p-2 border rounded" onChange={handleChange} />
        </div>
        {/* Mental Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 border-b pb-2">Mental Health</h3>
          <input type="number" name="mood" placeholder="Mood (1-10)" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="text" name="psychologicalStressors" placeholder="Psychological Stressors" className="w-full p-2 border rounded" onChange={handleChange} />
          <input type="number" name="isolationFeeling" placeholder="Isolation Feeling (1-10)" className="w-full p-2 border rounded" onChange={handleChange} />
        </div>
      </div>
      <textarea name="notes" placeholder="Additional Notes" className="w-full mt-6 p-2 border rounded" rows={4} onChange={handleChange} />
      <button type="submit" className="mt-6 w-full bg-cyan-700 text-white p-3 rounded-lg font-bold hover:bg-cyan-800">Submit Clinical Data</button>
    </form>
  );
};
