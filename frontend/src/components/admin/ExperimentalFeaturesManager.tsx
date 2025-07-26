import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, RotateCcw, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';
import { adminService, ExperimentalFeature, CreateExperimentalFeatureDto, UpdateExperimentalFeatureDto } from '@/services/api/admin.service';

const ExperimentalFeaturesManager = () => {
  const [features, setFeatures] = useState<ExperimentalFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<ExperimentalFeature | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newFeature, setNewFeature] = useState<CreateExperimentalFeatureDto>({
    key: '',
    name: '',
    description: '',
    enabled: false
  });

  const [editFeature, setEditFeature] = useState<UpdateExperimentalFeatureDto>({
    name: '',
    description: '',
    enabled: false
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      setError(null);
      const featuresData = await adminService.getExperimentalFeatures();
      setFeatures(featuresData);
    } catch (err) {
      console.error('Failed to fetch experimental features:', err);
      setError('Failed to load experimental features. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeature = async () => {
    if (!newFeature.key || !newFeature.name) {
      setError('Key and name are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await adminService.createExperimentalFeature(newFeature);
      setFeatures(prev => [...prev, created]);
      setCreateDialogOpen(false);
      setNewFeature({ key: '', name: '', description: '', enabled: false });
    } catch (err) {
      console.error('Failed to create feature:', err);
      setError(err instanceof Error ? err.message : 'Failed to create feature');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFeature = async () => {
    if (!editingFeature) return;

    try {
      setSubmitting(true);
      setError(null);
      const updated = await adminService.updateExperimentalFeature(editingFeature.id, editFeature);
      setFeatures(prev => prev.map(f => f.id === editingFeature.id ? updated : f));
      setEditDialogOpen(false);
      setEditingFeature(null);
    } catch (err) {
      console.error('Failed to update feature:', err);
      setError(err instanceof Error ? err.message : 'Failed to update feature');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeature = async (feature: ExperimentalFeature) => {
    try {
      setError(null);
      const updated = await adminService.toggleExperimentalFeature(feature.id);
      setFeatures(prev => prev.map(f => f.id === feature.id ? updated : f));
    } catch (err) {
      console.error('Failed to toggle feature:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle feature');
    }
  };

  const handleDeleteFeature = async (feature: ExperimentalFeature) => {
    if (!confirm(`Are you sure you want to delete "${feature.name}"?`)) return;

    try {
      setError(null);
      await adminService.deleteExperimentalFeature(feature.id);
      setFeatures(prev => prev.filter(f => f.id !== feature.id));
    } catch (err) {
      console.error('Failed to delete feature:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete feature');
    }
  };

  const handleSeedDefaultFeatures = async () => {
    try {
      setError(null);
      await adminService.seedDefaultFeatures();
      await fetchFeatures(); // Refresh the list
    } catch (err) {
      console.error('Failed to seed default features:', err);
      setError(err instanceof Error ? err.message : 'Failed to seed default features');
    }
  };

  const openEditDialog = (feature: ExperimentalFeature) => {
    setEditingFeature(feature);
    setEditFeature({
      name: feature.name,
      description: feature.description || '',
      enabled: feature.enabled
    });
    setEditDialogOpen(true);
  };

  const enabledFeaturesCount = features.filter(f => f.enabled).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Experimental Features</h2>
        <div className="text-center py-8">
          <p>Loading experimental features...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Experimental Features</h2>
          <p className="text-muted-foreground">Manage experimental features and beta functionality</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDefaultFeatures}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Seed Defaults
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Experimental Feature</DialogTitle>
                <DialogDescription>
                  Add a new experimental feature to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">Feature Key</Label>
                  <Input
                    id="key"
                    value={newFeature.key}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="feature_key_snake_case"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Feature Name</Label>
                  <Input
                    id="name"
                    value={newFeature.name}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Human Readable Name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newFeature.description}
                    onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Feature description..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={newFeature.enabled}
                    onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable immediately</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateFeature} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Feature'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length}</div>
            <p className="text-xs text-muted-foreground">
              Experimental features available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enabled Features</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledFeaturesCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently active features
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled Features</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length - enabledFeaturesCount}</div>
            <p className="text-xs text-muted-foreground">
              Features in development
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>Experimental Features</CardTitle>
          <CardDescription>Configure and manage experimental features</CardDescription>
        </CardHeader>
        <CardContent>
          {features.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No experimental features found</p>
              <p className="text-sm text-muted-foreground">Create a new feature or seed defaults to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-sm text-muted-foreground font-mono">{feature.key}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {feature.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(feature.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeature(feature)}
                        >
                          {feature.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(feature)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteFeature(feature)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Experimental Feature</DialogTitle>
            <DialogDescription>
              Update the experimental feature details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Feature Name</Label>
              <Input
                id="edit-name"
                value={editFeature.name}
                onChange={(e) => setEditFeature(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Human Readable Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFeature.description}
                onChange={(e) => setEditFeature(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Feature description..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-enabled"
                checked={editFeature.enabled}
                onCheckedChange={(checked) => setEditFeature(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="edit-enabled">Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateFeature} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExperimentalFeaturesManager;
