
import React from 'react';
import { NavItemType } from '../types';
import { NAV_ITEMS } from '../constants';
import { UsersIcon, ClipboardIcon, GradeIcon, AcademicIcon, AppIcon } from './icons';

interface SidebarProps {
  activeView: NavItemType;
  setActiveView: (view: NavItemType) => void;
}

const ICONS: Record<NavItemType, React.ReactNode> = {
  'Alumnos': <UsersIcon />,
  'Gestión Práctica': <ClipboardIcon />,
  'Gestión de Notas': <GradeIcon />,
  'Gestión Académica': <AcademicIcon />,
  'Gestión de la App': <AppIcon />,
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-1/5 bg-gray-800 text-white flex flex-col min-w-[250px]">
      <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">
        <span className="text-teal-400">Teacher</span>Dash
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {NAV_ITEMS.map((item) => (
            <li key={item} className="mb-2">
              <button
                onClick={() => setActiveView(item)}
                className={`w-full flex items-center text-left py-3 px-4 rounded-lg transition-colors duration-200 ${
                  activeView === item
                    ? 'bg-teal-500 text-white font-semibold'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {ICONS[item]}
                <span>{item}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700 text-center text-sm text-gray-400">
        © 2024 Teacher Dashboard
      </div>
    </aside>
  );
};

export default Sidebar;
