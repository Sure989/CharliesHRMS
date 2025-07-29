import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';
import { Training, TrainingEnrollment } from '@/types/types';

export interface CreateTrainingRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity?: number;
  instructor?: string;
  venue?: string;
  requirements?: string[];
  certification?: boolean;
  cost?: number;
  category?: string;
}

export interface UpdateTrainingRequest extends Partial<CreateTrainingRequest> {}

export interface EnrollEmployeeRequest {
  employeeIds: string[];
}

export interface UpdateEnrollmentRequest {
  status?: 'enrolled' | 'in_progress' | 'completed' | 'failed' | 'withdrawn';
  progress?: number;
  score?: number;
  certificateIssued?: boolean;
  completionDate?: string;
}

export interface TrainingFilters {
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}

class TrainingService {
  async getTrainings(filters?: TrainingFilters): Promise<PaginatedResponse<Training>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get<Training[]>(`/trainings?${params.toString()}`);
    return response;
  }

  async getTrainingById(id: string): Promise<Training> {
    const response = await apiClient.get<Training>(`/trainings/${id}`);
    return response.data!;
  }

  async createTraining(data: CreateTrainingRequest): Promise<Training> {
    const response = await apiClient.post<Training>('/trainings', data);
    return response.data!;
  }

  async updateTraining(id: string, data: UpdateTrainingRequest): Promise<Training> {
    const response = await apiClient.put<Training>(`/trainings/${id}`, data);
    return response.data!;
  }

  async deleteTraining(id: string): Promise<void> {
    await apiClient.delete(`/trainings/${id}`);
  }

  async enrollEmployees(trainingId: string, data: EnrollEmployeeRequest): Promise<ApiResponse<any>> {
    return apiClient.post(`/trainings/${trainingId}/enroll`, data);
  }

  async updateEnrollment(trainingId: string, enrollmentId: string, data: UpdateEnrollmentRequest): Promise<TrainingEnrollment> {
    const response = await apiClient.put<TrainingEnrollment>(`/trainings/${trainingId}/enrollments/${enrollmentId}`, data);
    return response.data!;
  }

  async removeEnrollment(trainingId: string, enrollmentId: string): Promise<void> {
    await apiClient.delete(`/trainings/${trainingId}/enrollments/${enrollmentId}`);
  }
}

export const trainingService = new TrainingService();
