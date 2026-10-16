import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { CrewSwitcher } from './CrewSwitcher';
import { TrendCharts } from './TrendCharts';
import { DailyIntakeForm } from './DailyIntakeForm';
import { Biometric3DViewer } from './Biometric3DViewer';
import { BiosensorTelemetry } from './BiosensorTelemetry';
import { ClinicalTriageEngine } from './ClinicalTriageEngine'; // Added
import { Astronaut } from '../types/astronaut';

const mockCrew: Astronaut[] = [
  { id: '1', name: 'Commander Vance', role: 'Commander', status: 'NOMINAL', avatarColor: 'bg-blue-600', checkins: [] },
  { id: '2', name: 'Dr. Daoud', role: 'Medical Officer', status: 'NOMINAL', avatarColor: 'bg-emerald-600', checkins: [] },
];

export const Dashboard: React.FC = () => {
  const [activeAstronautId, setActiveAstronautId] = useState(Cookies.get('activeAstronautId') || mockCrew[0].id);
  const [currentScenario, setCurrentScenario] = useState<any>(null); // Simplified for prototype

  useEffect(() => {
    Cookies.set('activeAstronautId', activeAstronautId);
  }, [activeAstronautId]);

  const activeAstronaut = mockCrew.find(a => a.id === activeAstronautId)!;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <CrewSwitcher crew={mockCrew} activeAstronautId={activeAstronautId} onSelectAstronaut={setActiveAstronautId} />
      
      <div className="flex flex-1 p-6 gap-6">
        <aside className="w-80 space-y-4">
          <DailyIntakeForm />
          <ClinicalTriageEngine
            currentScenario={currentScenario}
            onSelectScenario={setCurrentScenario}
            astronautName={activeAstronaut.name}
            triageLevel="NORMAL"
            onOpenThinkingModal={() => {}}
            isThinkingLoading={false}
          />
        </aside>
        
        <main className="flex-1 grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <Biometric3DViewer heartRate={72} spo2={98} radiationRate={0.01} status="NOMINAL" />
          </div>
          <TrendCharts astronaut={activeAstronaut} />
          <BiosensorTelemetry />
        </main>
      </div>
    </div>
  );
};
