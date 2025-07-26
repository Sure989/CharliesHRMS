import { ApiResponse, apiClient } from '../apiClient';

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
    const res = await apiClient.get<{ reviews: PerformanceReview[] }>('/performance-reviews');
    return res.data?.reviews || [];
  },
  
  async createPerformanceReview(reviewData: {
    employeeId: string;
    reviewPeriod: string;
    reviewType: string;
    goals: string;
    feedback: string;
    reviewDate: string;
    reviewer: string;
  }): Promise<PerformanceReview> {
    const res = await apiClient.post<{ review: PerformanceReview }>('/performance-reviews', reviewData);
    return res.data?.review!;
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
