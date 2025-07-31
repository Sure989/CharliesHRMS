import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Star, Eye, Edit, TrendingUp, Users, Award, AlertTriangle, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/services/api/employee.service';
import { performanceReviewService } from '@/services/api';

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  branch: string;
  reviewPeriod: string;
  reviewType: 'quarterly' | 'annual' | 'probation' | 'promotion';
  status: 'pending' | 'in_progress' | 'completed';
  overallRating: number;
  performanceAreas: {
    customerService: number;
    teamwork: number;
    punctuality: number;
    skillProficiency: number;
    leadership?: number;
  };
  goals: string[];
  achievements: string[];
  areasForImprovement: string[];
  feedback: string;
  reviewDate: string;
  reviewer: string;
  reviewerRole: string;
}

const PerformanceManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editReview, setEditReview] = useState<Partial<PerformanceReview>>({});

  // Get active employees for the dropdown
  const [users, setUsers] = useState([]);
  useEffect(() => {
    employeeService.getEmployees().then((res: any) => setUsers(res.data || []));
  }, []);
  // Fix role comparison to use correct enum/case
  const activeEmployees = useMemo(() => {
    return users.filter(u => u.role === 'EMPLOYEE' && u.status === 'active');
  }, [users]);

  // Hospitality-focused performance reviews
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  useEffect(() => {
    performanceReviewService.getPerformanceReviews().then((data) => {
      // Map the API response to the frontend interface
      const mappedReviews = data.map(review => ({
        id: review.id.toString(),
        employeeId: review.employee.id.toString(),
        employeeName: review.employee.name,
        position: '', // No position property in review.employee
        branch: review.employee.branch,
        reviewPeriod: review.period,
        reviewType: 'quarterly' as const,
        status: review.status.toLowerCase() as 'pending' | 'in_progress' | 'completed',
        overallRating: review.score || 0,
        performanceAreas: {
          customerService: 0,
          teamwork: 0,
          punctuality: 0,
          skillProficiency: 0
        },
        goals: [],
        achievements: [],
        areasForImprovement: [],
        feedback: review.summary || '',
        reviewDate: new Date(review.createdAt).toISOString().split('T')[0],
        reviewer: review.reviewer,
        reviewerRole: 'HR Manager'
      }));
      setReviews(mappedReviews);
    }).catch(error => {
      console.error('Error fetching performance reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load performance reviews.",
        variant: "destructive"
      });
    });
  }, []);

  const [newReview, setNewReview] = useState({
    employeeId: '',
    reviewPeriod: '',
    reviewType: 'quarterly' as 'quarterly' | 'annual' | 'probation' | 'promotion',
    goals: '',
    feedback: '',
    reviewDate: '',
    reviewer: user?.firstName + ' ' + user?.lastName || ''
  });

  const handleAddReview = async () => {
    // TODO: Re-enable permission checks when transitioning to production accounts
    // if (!canManagePerformanceReviews(user)) {
    //   toast({
    //     title: "Access Denied",
    //     description: "You don't have permission to schedule performance reviews.",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    const selectedEmployee = activeEmployees.find(emp => emp.id === newReview.employeeId);
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select a valid employee.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call the API to create the performance review
      const createdReview = await performanceReviewService.createPerformanceReview({
        employeeId: newReview.employeeId,
        reviewPeriod: newReview.reviewPeriod,
        reviewType: newReview.reviewType,
        goals: newReview.goals,
        feedback: newReview.feedback,
        reviewDate: newReview.reviewDate,
        reviewer: newReview.reviewer
      });

      // Refresh the reviews list
      const updatedReviews = await performanceReviewService.getPerformanceReviews();
      const mappedReviews = updatedReviews.map(review => ({
        id: review.id.toString(),
        employeeId: review.employee.id.toString(),
        employeeName: review.employee.name,
        position: '', // No position property in review.employee
        branch: review.employee.branch,
        reviewPeriod: review.period,
        reviewType: 'quarterly' as const,
        status: review.status.toLowerCase() as 'pending' | 'in_progress' | 'completed',
        overallRating: review.score || 0,
        performanceAreas: {
          customerService: 0,
          teamwork: 0,
          punctuality: 0,
          skillProficiency: 0
        },
        goals: [],
        achievements: [],
        areasForImprovement: [],
        feedback: review.summary || '',
        reviewDate: new Date(review.createdAt).toISOString().split('T')[0],
        reviewer: review.reviewer,
        reviewerRole: 'HR Manager'
      }));
      setReviews(mappedReviews);

      setNewReview({
        employeeId: '',
        reviewPeriod: '',
        reviewType: 'quarterly',
        goals: '',
        feedback: '',
        reviewDate: '',
        reviewer: user?.firstName + ' ' + user?.lastName || ''
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Performance Review Scheduled",
        description: `Review for ${selectedEmployee.firstName} ${selectedEmployee.lastName} has been scheduled.`
      });
    } catch (error) {
      console.error('Error creating performance review:', error);
      toast({
        title: "Error",
        description: "Failed to schedule performance review. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600';
    if (rating >= 3.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.status === 'completed').length;
  const inProgressReviews = reviews.filter(r => r.status === 'in_progress').length;
  const averageRating = reviews.length > 0 ? 
    reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length : 0;

  // TODO: Re-enable permission checks when transitioning to production accounts
  // if (!canManagePerformanceReviews(user)) {
  //   return (
  //     <DashboardLayout title="Performance Management">
  //       <Alert>
  //         <AlertTriangle className="h-4 w-4" />
  //         <AlertTitle>Access Denied</AlertTitle>
  //         <AlertDescription>
  //           You don't have permission to access performance management features.
  //         </AlertDescription>
  //       </Alert>
  //     </DashboardLayout>
  //   );
  // }

  return (
    <DashboardLayout title="Performance Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">Performance Management</h2>
              <p className="text-muted-foreground">Track and evaluate employee performance across all venues</p>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Performance Review</DialogTitle>
                <DialogDescription>
                  Create a new performance review for an employee.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="employee">Select Employee</Label>
                  <Select value={newReview.employeeId} onValueChange={(value) => setNewReview({...newReview, employeeId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.position} ({employee.branch})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviewPeriod">Review Period</Label>
                    <Input
                      id="reviewPeriod"
                      placeholder="e.g., Q1 2025"
                      value={newReview.reviewPeriod}
                      onChange={(e) => setNewReview({...newReview, reviewPeriod: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewType">Review Type</Label>
                    <Select value={newReview.reviewType} onValueChange={(value: 'quarterly' | 'annual' | 'probation' | 'promotion') => setNewReview({...newReview, reviewType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quarterly">Quarterly Review</SelectItem>
                        <SelectItem value="annual">Annual Review</SelectItem>
                        <SelectItem value="probation">Probation Review</SelectItem>
                        <SelectItem value="promotion">Promotion Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="goals">Performance Goals (comma-separated)</Label>
                  <Textarea
                    id="goals"
                    placeholder="e.g., Improve customer service scores, Complete training program, Increase sales"
                    value={newReview.goals}
                    onChange={(e) => setNewReview({...newReview, goals: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reviewDate">Review Date</Label>
                    <Input
                      id="reviewDate"
                      type="date"
                      value={newReview.reviewDate}
                      onChange={(e) => setNewReview({...newReview, reviewDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewer">Reviewer</Label>
                    <Input
                      id="reviewer"
                      value={newReview.reviewer}
                      onChange={(e) => setNewReview({...newReview, reviewer: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="feedback">Initial Notes</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Any initial observations or notes for this review"
                    value={newReview.feedback}
                    onChange={(e) => setNewReview({...newReview, feedback: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddReview}>Schedule Review</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                All performance reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedReviews}</div>
              <p className="text-xs text-muted-foreground">
                Finished reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{inProgressReviews}</div>
              <p className="text-xs text-muted-foreground">
                Ongoing reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Out of 5.0
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Reviews</CardTitle>
            <CardDescription>All scheduled and completed performance evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position & Branch</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Overall Rating</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{review.employeeName}</div>
                        <div className="text-sm text-muted-foreground">{review.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.position}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {review.branch}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{review.reviewPeriod}</TableCell>
                    <TableCell className="capitalize">{review.reviewType.replace('_', ' ')}</TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(review.overallRating)}
                        <span className={`ml-1 text-sm font-medium ${getPerformanceColor(review.overallRating)}`}>
                          ({review.overallRating.toFixed(1)})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(review.reviewDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{review.reviewer}</div>
                        <div className="text-sm text-muted-foreground">{review.reviewerRole}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditReview(review);
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
          </CardContent>
        </Card>

        {/* View Review Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Performance Review Details</DialogTitle>
              <DialogDescription>
                {selectedReview && `${selectedReview.employeeName} - ${selectedReview.reviewPeriod}`}
              </DialogDescription>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-6">
                {/* Employee Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employee</Label>
                    <p className="text-sm font-medium">{selectedReview.employeeName} ({selectedReview.employeeId})</p>
                  </div>
                  <div>
                    <Label>Position & Branch</Label>
                    <p className="text-sm">{selectedReview.position} - {selectedReview.branch}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Review Period</Label>
                    <p className="text-sm">{selectedReview.reviewPeriod}</p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p className="text-sm capitalize">{selectedReview.reviewType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedReview.status)}</div>
                  </div>
                </div>

                {/* Performance Areas */}
                <div>
                  <Label>Performance Areas</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Customer Service:</span>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(selectedReview.performanceAreas.customerService)}
                          <span className="text-sm">({selectedReview.performanceAreas.customerService})</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Teamwork:</span>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(selectedReview.performanceAreas.teamwork)}
                          <span className="text-sm">({selectedReview.performanceAreas.teamwork})</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Punctuality:</span>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(selectedReview.performanceAreas.punctuality)}
                          <span className="text-sm">({selectedReview.performanceAreas.punctuality})</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Skill Proficiency:</span>
                        <div className="flex items-center space-x-1">
                          {getRatingStars(selectedReview.performanceAreas.skillProficiency)}
                          <span className="text-sm">({selectedReview.performanceAreas.skillProficiency})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedReview.performanceAreas.leadership && (
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">Leadership:</span>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(selectedReview.performanceAreas.leadership)}
                        <span className="text-sm">({selectedReview.performanceAreas.leadership})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Overall Rating */}
                <div>
                  <Label>Overall Rating</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getRatingStars(selectedReview.overallRating)}
                    <span className={`font-medium ${getPerformanceColor(selectedReview.overallRating)}`}>
                      ({selectedReview.overallRating}/5.0)
                    </span>
                  </div>
                </div>

                {/* Goals and Achievements */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Goals</Label>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {selectedReview.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Label>Achievements</Label>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {selectedReview.achievements.map((achievement, index) => (
                        <li key={index} className="text-green-700">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <Label>Areas for Improvement</Label>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    {selectedReview.areasForImprovement.map((area, index) => (
                      <li key={index} className="text-orange-700">{area}</li>
                    ))}
                  </ul>
                </div>

                {/* Feedback */}
                <div>
                  <Label>Reviewer Feedback</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedReview.feedback}</p>
                </div>

                {/* Review Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Review Date</Label>
                    <p className="text-sm">{new Date(selectedReview.reviewDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Reviewer</Label>
                    <p className="text-sm">{selectedReview.reviewer} ({selectedReview.reviewerRole})</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setEditReview(selectedReview!);
                setIsViewDialogOpen(false);
                setIsEditDialogOpen(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Review Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Performance Review</DialogTitle>
              <DialogDescription>
                Update the performance review details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Review Period</Label>
                  <Input
                    value={editReview.reviewPeriod || ''}
                    onChange={(e) => setEditReview({...editReview, reviewPeriod: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Review Type</Label>
                  <Select 
                    value={editReview.reviewType || 'quarterly'} 
                    onValueChange={(value: 'quarterly' | 'annual' | 'probation' | 'promotion') => 
                      setEditReview({...editReview, reviewType: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly Review</SelectItem>
                      <SelectItem value="annual">Annual Review</SelectItem>
                      <SelectItem value="probation">Probation Review</SelectItem>
                      <SelectItem value="promotion">Promotion Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select 
                  value={editReview.status || 'pending'} 
                  onValueChange={(value: 'pending' | 'in_progress' | 'completed') => 
                    setEditReview({...editReview, status: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea
                  value={editReview.feedback || ''}
                  onChange={(e) => setEditReview({...editReview, feedback: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Update the review in the local state
                setReviews(reviews.map(r => r.id === editReview.id ? {...r, ...editReview} : r));
                setIsEditDialogOpen(false);
                toast({
                  title: "Review Updated",
                  description: "Performance review has been updated successfully."
                });
              }}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PerformanceManagement;
