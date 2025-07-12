import { ApiResponse } from './apiClient';
import axios from 'axios';

export interface PerformanceReview {
  id: number;
  employee: {
    id: number;
    name: string;
    department: string;
    branch: string;
  };
  reviewer: string;
  period: string;
  score: number;
  summary: string;
  status: string;
  createdAt: string;
}

export const performanceReviewService = {
  async getPerformanceReviews(): Promise<PerformanceReview[]> {
    const res = await axios.get<ApiResponse<{ reviews: PerformanceReview[] }>>('performance-reviews');
    return res.data.data?.reviews || [];
  },
};

export async function getPerformanceReviews(params?: {
  department?: string;
  branch?: string;
  status?: string;
  cycle?: string;
}) {
  const query = params
    ? '?' +
      Object.entries(params)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join('&')
    : '';
  const res = await fetch(`performance-reviews${query}`);
  if (!res.ok) throw new Error('Failed to fetch performance reviews');
  return res.json();
}
