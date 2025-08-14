
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Edit, Trash2, Save, X, Users, UserCheck, UserX } from "lucide-react";
import { typedSupabase, TABLES } from "@/lib/supabase-utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Panchayath {
  id: string;
  name: string;
  district: string;
  state: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  agent_id?: string;
  category: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface AgentCounts {
  total: number;
  active: number;
  inactive: number;
}

interface PanchayathDetailsProps {
  panchayath: Panchayath;
  onBack: () => void;
}

export const PanchayathDetails = ({ panchayath, onBack }: PanchayathDetailsProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentCounts, setAgentCounts] = useState<AgentCounts>({ total: 0, active: 0, inactive: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('panchayath');
  const [createdBy, setCreatedBy] = useState('');
  const [activeTab, setActiveTab] = useState('panchayath');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
    fetchAgents();
  }, [panchayath.id]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await typedSupabase
        .from(TABLES.AGENTS)
        .select('id, name, role')
        .eq('panchayath_id', panchayath.id)
        .order('name');

      if (error) throw error;
      
      setAgents(data || []);
      
      // Calculate agent counts (assuming all fetched agents are active for now)
      const total = data?.length || 0;
      setAgentCounts({
        total,
        active: total, // You can add logic here to determine active/inactive
        inactive: 0
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await typedSupabase
        .from(TABLES.PANCHAYATH_NOTES)
        .select('*')
        .eq('panchayath_id', panchayath.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !createdBy.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await typedSupabase
        .from(TABLES.PANCHAYATH_NOTES)
        .insert({
          panchayath_id: panchayath.id,
          note: newNote.trim(),
          created_by: createdBy.trim(),
          agent_id: selectedAgent || null,
          category: selectedCategory
        });

      if (error) throw error;

      setNewNote('');
      setSelectedAgent('');
      setCreatedBy('');
      setSelectedCategory('panchayath');
      setShowAddForm(false);
      fetchNotes();
      toast({
        title: "Success",
        description: "Note added successfully"
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await typedSupabase
        .from(TABLES.PANCHAYATH_NOTES)
        .update({ 
          note: editNoteText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) throw error;

      setEditingNote(null);
      setEditNoteText('');
      fetchNotes();
      toast({
        title: "Success",
        description: "Note updated successfully"
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    setIsSubmitting(true);
    try {
      const { error } = await typedSupabase
        .from(TABLES.PANCHAYATH_NOTES)
        .delete()
        .eq('id', noteToDelete);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      fetchNotes();
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note.id);
    setEditNoteText(note.note);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditNoteText('');
  };

  const getFilteredNotes = (category: string) => {
    return notes.filter(note => note.category === category || (!note.category && category === 'panchayath'));
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown Agent';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Panchayaths
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{panchayath.name}</h2>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{panchayath.district}</Badge>
                <Badge variant="outline">{panchayath.state}</Badge>
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Manage notes for this panchayath and its agents
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Agent Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{agentCounts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Agents</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{agentCounts.inactive}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notes Management</CardTitle>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-3">Add New Note</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="panchayath">About Panchayath</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="group_leader">Group Leader</SelectItem>
                      <SelectItem value="pro">P.R.O</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory !== 'panchayath' && (
                  <div>
                    <Label htmlFor="agent">Select Agent</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents
                          .filter(agent => {
                            if (selectedCategory === 'coordinator') return agent.role === 'coordinator';
                            if (selectedCategory === 'supervisor') return agent.role === 'supervisor';
                            if (selectedCategory === 'group_leader') return agent.role === 'group_leader';
                            if (selectedCategory === 'pro') return agent.role === 'pro';
                            if (selectedCategory === 'customer') return agent.role === 'customer';
                            return true;
                          })
                          .map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name} ({agent.role})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <Label htmlFor="created_by">Created By</Label>
                <Input
                  id="created_by"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="mb-3"
                rows={4}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddNote} 
                  disabled={isSubmitting || !newNote.trim() || !createdBy.trim()}
                >
                  {isSubmitting ? 'Adding...' : 'Add Note'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewNote('');
                    setSelectedAgent('');
                    setCreatedBy('');
                    setSelectedCategory('panchayath');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="panchayath">Panchayath</TabsTrigger>
              <TabsTrigger value="coordinator">Coordinator</TabsTrigger>
              <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
              <TabsTrigger value="group_leader">Group Leader</TabsTrigger>
              <TabsTrigger value="pro">P.R.O</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
            </TabsList>

            {['panchayath', 'coordinator', 'supervisor', 'group_leader', 'pro', 'customer'].map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading notes...</p>
                  </div>
                ) : getFilteredNotes(category).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No notes found for {category.replace('_', ' ')}.</p>
                    <p className="text-sm text-gray-500 mt-2">Click "Add New Note" to create the first note.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredNotes(category).map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg bg-white">
                        {editingNote === note.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              rows={4}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleEditNote(note.id)}
                                disabled={isSubmitting || !editNoteText.trim()}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={cancelEdit}
                                disabled={isSubmitting}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-gray-800 whitespace-pre-wrap">{note.note}</p>
                                {note.agent_id && (
                                  <Badge variant="outline" className="mt-2">
                                    Agent: {getAgentName(note.agent_id)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1 ml-4">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => startEdit(note)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    setNoteToDelete(note.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>By: {note.created_by}</span>
                              <span>Created: {new Date(note.created_at).toLocaleDateString()}</span>
                              {note.updated_at !== note.created_at && (
                                <span>Updated: {new Date(note.updated_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteNote}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
