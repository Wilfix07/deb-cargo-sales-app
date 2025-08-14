import React from 'react';
import { ComprehensiveReports } from '../reports/ComprehensiveReports';

interface ReportsDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ onNavigate }) => {
  return <ComprehensiveReports onNavigate={onNavigate} />;
};