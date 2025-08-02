import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Users, Calendar, Award, GraduationCap, CheckCircle, Plus, UserPlus, Edit } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { normalizeDateTimeForInput, normalizeToISO } from '@/utils/dateUtils';

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number;
  capacity: number;
  enrolled: number;
  startDate: string;
  endDate: string;
  status: string;
  cost: number;
  venue?: string;
  requirements?: string[];
  certification?: boolean;
}

interface TrainingEnrollment {
  id: string;
  programId: string;
  programTitle: string;
  employeeId: string;
  employeeName: string;
  position: string;
  branch: string;
  enrollmentDate: string;
  completionDate?: string;
  status: string;
  progress: number;
  score?: number;
  certificateIssued?: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: { name: string };
  branch?: { name: string };
}

const getStatusBadge = (status: string) => {
  const Badge = ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
      variant === 'outline' ? 'border border-gray-300 text-gray-700' :
      variant === 'default' ? 'bg-blue-100 text-blue-800' :
      variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
      variant === 'destructive' ? 'bg-red-100 text-red-800' :
      ''
    }`}>{children}</span>
  );
  switch (status) {
    case 'upcoming': return <Badge variant="outline">Upcoming</Badge>;
    case 'ongoing': return <Badge variant="default">Ongoing</Badge>;
    case 'completed': return <Badge variant="secondary">Completed</Badge>;
    case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
    case 'enrolled': return <Badge variant="outline">Enrolled</Badge>;
    case 'in_progress': return <Badge variant="default">In Progress</Badge>;
    case 'failed': return <Badge variant="destructive">Failed</Badge>;
    case 'withdrawn': return <Badge variant="secondary">Withdrawn</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Food Safety': return 'bg-green-100 text-green-800';
    case 'Bartending': return 'bg-purple-100 text-purple-800';
    case 'Customer Service': return 'bg-blue-100 text-blue-800';
    case 'Security': return 'bg-red-100 text-red-800';
    case 'Leadership': return 'bg-yellow-100 text-yellow-800';
    case 'Compliance': return 'bg-gray-100 text-gray-800';
    case 'Emergency Response': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TrainingManagement: React.FC = () => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollmentsError, setEnrollmentsError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  
  // Form states
  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    capacity: '',
    startDate: '',
    endDate: '',
    venue: '',
    cost: '',
    certification: false,
    requirements: '',
    status: 'upcoming'
  });
  
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [editTraining, setEditTraining] = useState<TrainingProgram | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    capacity: '',
    cost: '',
    startDate: '',
    endDate: '',
    venue: '',
    certification: false,
    requirements: '',
    status: 'upcoming',
  });

  // Fetch training programs
  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true);
      const response = await apiClient.get<any>('/trainings');
      if (response.status === 'success') {
        setPrograms(response.data.trainings || []);
      } else {
        setProgramsError(response.message || 'Failed to load training programs.');
      }
    } catch (error) {
      setProgramsError('Failed to load training programs.');
    } finally {
      setProgramsLoading(false);
    }
  };

  // Fetch enrollments
  const fetchEnrollments = async () => {
    try {
      setEnrollmentsLoading(true);
      const response = await apiClient.get<any>('/trainings');
      if (response.status === 'success') {
        const allEnrollments = response.data.trainings?.flatMap((training: any) => 
          training.enrollments?.map((enrollment: any) => ({
            ...enrollment,
            programTitle: training.title,
            programId: training.id,
          })) || []
        ) || [];
        setEnrollments(allEnrollments);
      }
    } catch (error) {
      setEnrollmentsError('Failed to load enrollments.');
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get<any>('/employees');
      console.log('Employees API response:', response);
      if (response.status === 'success') {
        // Support both array and object with employees property
        if (Array.isArray(response.data)) {
          setEmployees(response.data);
        } else if (Array.isArray(response.data?.employees)) {
          setEmployees(response.data.employees);
        } else {
          setEmployees([]);
        }
      } else {
        setEmployees([]);
      }
    } catch (error) {
      setEmployees([]);
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchEnrollments();
    fetchEmployees();
  }, []);

  // Handle create training
  const handleCreateTraining = async () => {
    try {
      const trainingData = {
        ...newTraining,
        capacity: newTraining.capacity ? parseInt(newTraining.capacity) : undefined,
        cost: newTraining.cost ? parseFloat(newTraining.cost) : undefined,
        requirements: newTraining.requirements ? newTraining.requirements.split(',').map(r => r.trim()) : [],
        startDate: new Date(newTraining.startDate).toISOString(),
        endDate: new Date(newTraining.endDate).toISOString(),
      };

      const response = await apiClient.post('/trainings', trainingData);
      if (response.status === 'success') {
        setIsCreateDialogOpen(false);
        setNewTraining({
          title: '',
          description: '',
          category: '',
          instructor: '',
          capacity: '',
          startDate: '',
          endDate: '',
          venue: '',
          cost: '',
          certification: false,
          requirements: '',
          status: 'upcoming'
        });
        fetchPrograms();
      }
    } catch (error) {
      console.error('Failed to create training:', error);
    }
  };

  // Handle enroll employees
  const handleEnrollEmployees = async () => {
    if (!selectedTrainingId || selectedEmployees.length === 0) return;
    
    try {
      const response = await apiClient.post(`/trainings/${selectedTrainingId}/enroll`, {
        employeeIds: selectedEmployees
      });
      if (response.status === 'success') {
        setIsEnrollDialogOpen(false);
        setSelectedEmployees([]);
        setSelectedTrainingId(null);
        fetchPrograms();
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Failed to enroll employees:', error);
    }
  };

  // Handle edit training
  const handleEditTraining = async () => {
    if (!editTraining) return;
    try {
      const updateData = {
        ...editTraining,
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        instructor: editForm.instructor,
        capacity: editForm.capacity !== '' ? Number(editForm.capacity) : undefined,
        cost: editForm.cost !== '' ? Number(editForm.cost) : undefined,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : undefined,
        venue: editForm.venue,
        certification: !!editForm.certification,
        requirements: editForm.requirements ? editForm.requirements.split(',').map(r => r.trim()) : [],
      };
      await apiClient.put(`/trainings/${editTraining.id}`, updateData);
      setIsEditDialogOpen(false);
      setEditTraining(null);
      fetchPrograms();
    } catch (error) {
      console.error('Failed to update training:', error);
    }
  };

  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'ongoing').length;
  const totalEnrollments = enrollments.length;
  const completedTrainings = enrollments.filter(e => e.status === 'completed').length;
  const certificatesIssued = enrollments.filter(e => e.certificateIssued).length;

  return (
    <DashboardLayout title="Training Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">Training Management</h2>
              <p className="text-muted-foreground">Manage employee training programs and professional development</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-full p-0">
              <div className="flex flex-col h-[80vh]">
                <div className="px-6 pt-6 pb-2 overflow-y-auto flex-1">
                  <DialogHeader>
                    <DialogTitle>Schedule Training</DialogTitle>
                    <DialogDescription>Fill in the details to schedule a new training program.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label>Title</Label>
                    <Input value={newTraining.title} onChange={e => setNewTraining({ ...newTraining, title: e.target.value })} />
                    <Label>Description</Label>
                    <Textarea value={newTraining.description} onChange={e => setNewTraining({ ...newTraining, description: e.target.value })} />
                    <Label>Category</Label>
                    <Input value={newTraining.category} onChange={e => setNewTraining({ ...newTraining, category: e.target.value })} />
                    <Label>Instructor</Label>
                    <Input value={newTraining.instructor} onChange={e => setNewTraining({ ...newTraining, instructor: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Capacity</Label>
                        <Input type="number" value={newTraining.capacity} onChange={e => setNewTraining({ ...newTraining, capacity: e.target.value })} />
                      </div>
                      <div>
                        <Label>Cost</Label>
                        <Input type="number" value={newTraining.cost} onChange={e => setNewTraining({ ...newTraining, cost: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input type="datetime-local" value={normalizeDateTimeForInput(newTraining.startDate)} onChange={e => setNewTraining({ ...newTraining, startDate: e.target.value })} />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input type="datetime-local" value={normalizeDateTimeForInput(newTraining.endDate)} onChange={e => setNewTraining({ ...newTraining, endDate: e.target.value })} />
                      </div>
                    </div>
                    <Label>Venue</Label>
                    <Input value={newTraining.venue} onChange={e => setNewTraining({ ...newTraining, venue: e.target.value })} />
                    <Label>Certification</Label>
                    <Checkbox checked={newTraining.certification} onCheckedChange={checked => setNewTraining({ ...newTraining, certification: !!checked })} />
                    <Label>Requirements (comma separated)</Label>
                    <Input value={newTraining.requirements} onChange={e => setNewTraining({ ...newTraining, requirements: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 px-6 py-4 border-t bg-background">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTraining}>Create</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPrograms}</div>
              <p className="text-xs text-muted-foreground">
                All training programs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activePrograms}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedTrainings}</div>
              <p className="text-xs text-muted-foreground">
                Finished trainings
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificatesIssued}</div>
              <p className="text-xs text-muted-foreground">
                Certificates issued
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Programs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Training Programs</CardTitle>
            <CardDescription>All scheduled and completed training programs</CardDescription>
          </CardHeader>
          <CardContent>
            {programsLoading ? (
              <div className="text-center py-8">Loading programs...</div>
            ) : programsError ? (
              <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{programsError}</AlertDescription></Alert>
            ) : programs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No training programs found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>{program.title}</TableCell>
                      <TableCell><span className={getCategoryColor(program.category)}>{program.category}</span></TableCell>
                      <TableCell>{program.instructor}</TableCell>
                      <TableCell>{program.duration} hrs</TableCell>
                      <TableCell>{program.enrolled}/{program.capacity}</TableCell>
                      <TableCell>{getStatusBadge(program.status)}</TableCell>
                      <TableCell>{program.venue || '-'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTrainingId(program.id);
                              setIsEnrollDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditTraining(program);
                              setEditForm({
                                title: program.title || '',
                                description: program.description || '',
                                category: program.category || '',
                                instructor: program.instructor || '',
                                capacity: program.capacity !== undefined && program.capacity !== null ? String(program.capacity) : '',
                                cost: program.cost !== undefined && program.cost !== null ? String(program.cost) : '',
                                startDate: program.startDate ? program.startDate.slice(0, 16) : '',
                                endDate: program.endDate ? program.endDate.slice(0, 16) : '',
                                venue: program.venue || '',
                                certification: !!program.certification,
                                requirements: Array.isArray(program.requirements) ? program.requirements.join(', ') : '',
                                status: program.status || 'upcoming',
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Training Enrollments</CardTitle>
            <CardDescription>Employee training progress and completion status</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="text-center py-8">Loading enrollments...</div>
            ) : enrollmentsError ? (
              <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{enrollmentsError}</AlertDescription></Alert>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No enrollments found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Certificate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>{enrollment.employeeName}</TableCell>
                      <TableCell>{enrollment.programTitle}</TableCell>
                      <TableCell>{enrollment.position}</TableCell>
                      <TableCell>{enrollment.branch}</TableCell>
                      <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                      <TableCell><Progress value={enrollment.progress} className="h-2" /></TableCell>
                      <TableCell>{enrollment.score ?? '-'}</TableCell>
                      <TableCell>{enrollment.certificateIssued ? <Award className="h-4 w-4 text-purple-600" /> : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Enroll Employee Dialog */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enroll Employees</DialogTitle>
              <DialogDescription>Select employees to enroll in a training program.</DialogDescription>
            </DialogHeader>
            <div className="mb-2">
              <Label>Training Program</Label>
              <Select value={selectedTrainingId || ''} onValueChange={setSelectedTrainingId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a training program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-2">
              <Label>Employee(s) to Enroll</Label>
              <div className="max-h-48 overflow-y-auto border rounded p-2">
                {employees.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No employees found.</div>
                ) : (
                  employees.map(emp => (
                    <div key={emp.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            setSelectedEmployees([...selectedEmployees, emp.id]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                          }
                        }}
                      />
                      <span>{emp.firstName} {emp.lastName} <span className="text-xs text-muted-foreground">({emp.position})</span></span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEnrollEmployees} disabled={!selectedTrainingId || selectedEmployees.length === 0}>Enroll</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Training Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md w-full p-0">
            <div className="flex flex-col h-[80vh]">
              <div className="px-6 pt-6 pb-2 overflow-y-auto flex-1">
                <DialogHeader>
                  <DialogTitle>Edit Training Program</DialogTitle>
                  <DialogDescription>Update the details of this training program.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label>Title</Label>
                  <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                  <Label>Description</Label>
                  <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  <Label>Category</Label>
                  <Input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                  <Label>Instructor</Label>
                  <Input value={editForm.instructor} onChange={e => setEditForm({ ...editForm, instructor: e.target.value })} />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Capacity</Label>
                      <Input type="number" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: e.target.value })} />
                    </div>
                    <div>
                      <Label>Cost</Label>
                      <Input type="number" value={editForm.cost} onChange={e => setEditForm({ ...editForm, cost: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input type="datetime-local" value={normalizeDateTimeForInput(editForm.startDate)} onChange={e => setEditForm({ ...editForm, startDate: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input type="datetime-local" value={normalizeDateTimeForInput(editForm.endDate)} onChange={e => setEditForm({ ...editForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <Label>Venue</Label>
                  <Input value={editForm.venue} onChange={e => setEditForm({ ...editForm, venue: e.target.value })} />
                  <Label>Certification</Label>
                  <Checkbox checked={!!editForm.certification} onCheckedChange={checked => setEditForm({ ...editForm, certification: !!checked })} />
                  <Label>Requirements (comma separated)</Label>
                  <Input value={editForm.requirements} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end space-x-2 px-6 py-4 border-t bg-background">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleEditTraining} disabled={!editTraining}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default TrainingManagement;
