import React from 'react';
import { Astronaut } from '../types/astronaut';

interface CrewSwitcherProps {
  crew: Astronaut[];
  activeAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const CrewSwitcher: React.FC<CrewSwitcherProps> = ({ crew, activeAstronautId, onSelectAstronaut }) => {
  if (!crew || !Array.isArray(crew)) {
    return <div className="p-4 text-slate-500">Loading crew...</div>;
  }
  return (
    <div className="flex gap-4 p-4 bg-white border-b border-slate-200">
      {crew.map((member) => (
        <button
          key={member.id}
          onClick={() => onSelectAstronaut(member.id)}
          className={`flex items-center gap-3 p-3 rounded-lg border transition ${
            activeAstronautId === member.id 
              ? 'bg-slate-100 border-cyan-500' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full ${member.avatarColor} flex items-center justify-center font-bold text-white`}>
            {member.name.charAt(0)}
          </div>
          <div className="text-left">
            <div className="font-semibold text-slate-800">{member.name}</div>
            <div className="text-xs text-slate-500">{member.role}</div>
          </div>
          <div className={`w-3 h-3 rounded-full ${member.status === 'NOMINAL' ? 'bg-green-500' : 'bg-red-500'}`} />
        </button>
      ))}
    </div>
  );
};
