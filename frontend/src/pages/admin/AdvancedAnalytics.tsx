
import React from 'react';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';

const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/dashboard/metrics?type=advanced-analytics')
      .then(response => {
        setData(response.data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch analytics');
      })
      .finally(() => setLoading(false));
  }, []);

  const overtime = data?.overtime || null;
  const attendance = data?.attendance || null;

  if (loading) return <div>Loading advanced analytics...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold mb-4">Advanced Analytics</h2>
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Overtime Analytics</h3>
        {overtime ? (
          <ul>
            <li>Total Overtime: <b>{overtime.totalOvertime}</b></li>
            <li>Average Overtime: <b>{overtime.averageOvertime}</b></li>
          </ul>
        ) : <span>No overtime data available.</span>}
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Attendance Trends</h3>
        {attendance ? (
          <div>{attendance.message}</div>
        ) : <span>No attendance data available.</span>}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
