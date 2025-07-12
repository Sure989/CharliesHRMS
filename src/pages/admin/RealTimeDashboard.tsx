import React from 'react';

interface RealTimeDashboardProps {
  role?: string;
}

const RealTimeDashboard: React.FC<RealTimeDashboardProps> = ({ role }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Real-Time Dashboard</h2>
      <p>Welcome, {role ? role : 'user'}! Real-time metrics and charts will appear here.</p>
    </div>
  );
};

export default RealTimeDashboard;
