import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PayrollPieChart({ gross, statutory, net }: { gross: number, statutory: number, net: number }) {
  // To avoid overlap, net = net payroll, statutory = total statutory, gross = gross payroll
  // For visualization, statutory + net should not exceed gross, so we show: statutory, net, and the rest (other deductions)
  const other = Math.max(gross - statutory - net, 0);
  const data = {
    labels: ['Statutory Deductions', 'Net Payroll', 'Other'],
    datasets: [
      {
        data: [statutory, net, other],
        backgroundColor: [
          'rgba(251, 191, 36, 0.8)', // yellow
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(16, 185, 129, 0.6)'  // green
        ],
        borderColor: [
          'rgba(251, 191, 36, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  return (
    <div style={{ width: '180px', height: '180px' }}>
      <Pie data={data} options={{ plugins: { legend: { position: 'bottom' } } }} />
    </div>
  );
}
