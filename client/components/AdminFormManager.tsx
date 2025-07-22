import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Edit,
  Trash2,
  Plus,
  Settings,
  Eye,
  Upload,
  Download,
  Variable,
  Link,
  Save,
  X,
  Copy,
  Database,
  FolderOpen,
  AlertTriangle,
  Package,
  Shield,
  AlertCircle,
} from "lucide-react";
import { Form, FormField } from "@shared/types";
import { VariableMappingEditor } from "./VariableMappingEditor";

interface PDFFile {
  name: string;
  size: number;
  lastModified: string;
  mappedForms: string[];
}

interface VariableMapping {
  id: string;
  formFieldId: string;
  formFieldLabel: string;
  pdfVariable: string;
  databaseColumn: string;
  required: boolean;
  fieldType: string;
  autoFillFrom?: string;
}

interface AdminFormManagerProps {
  currentUser: any;
}

export function AdminFormManager({ currentUser }: AdminFormManagerProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string>("");
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [showVariableMapper, setShowVariableMapper] = useState(false);
  const [showPdfManager, setShowPdfManager] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showPdfLinker, setShowPdfLinker] = useState(false);
  const [showVariableView, setShowVariableView] = useState(false);
  const [selectedPdfForView, setSelectedPdfForView] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Only allow access for admins
  if (currentUser?.role !== "admin") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">
            Only administrators can access the form management system.
          </p>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // No need to define predefined forms here anymore - they come from the server

      // Fetch forms with error handling
      try {
        const formsResponse = await fetch("/api/forms", { headers });
        if (formsResponse.ok) {
          const formsData = await formsResponse.json();
          setForms(formsData || []);
        } else {
          console.warn("Forms API not responding properly");
          setForms([]);
        }
      } catch (error) {
        console.warn("Failed to fetch forms:", error);
        setForms([]);
      }

      // Fetch PDF files (handle gracefully if endpoint doesn't exist)
      try {
        const pdfResponse = await fetch("/api/admin/pdf-files", { headers });
        if (pdfResponse.ok) {
          const pdfData = await pdfResponse.json();
          setPdfFiles(pdfData || []);
        } else {
          console.log("PDF files endpoint returned error, using empty list");
          setPdfFiles([]);
        }
      } catch (error) {
        console.log("PDF files endpoint not available, using empty list");
        setPdfFiles([]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      // Set empty fallback data
      setForms([]);
      setPdfFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCreate = async () => {
    const newForm: Partial<Form> = {
      name: "New Form",
      description: "Enter description",
      fields: [],
      isTemplate: false,
      restrictedToCompanies: [],
    };

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newForm),
      });

      if (response.ok) {
        const createdForm = await response.json();
        setForms([...forms, createdForm]);
        setSelectedForm(createdForm);
        setShowFormEditor(true);
      }
    } catch (error) {
      console.error("Failed to create form:", error);
    }
  };

  const handleFormUpdate = async (formId: string, updates: Partial<Form>) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setForms(forms.map(f => f.id === formId ? updatedForm : f));
        setSelectedForm(updatedForm);
      }
    } catch (error) {
      console.error("Failed to update form:", error);
    }
  };

  const handleFormDelete = async (formId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/forms/${formId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId));
        if (selectedForm?.id === formId) {
          setSelectedForm(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
    }
  };

  const handleFieldAdd = () => {
    if (!selectedForm) return;

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
      placeholder: "Enter value",
    };

    const updatedForm = {
      ...selectedForm,
      fields: [...selectedForm.fields, newField],
    };

    setSelectedForm(updatedForm);
    setEditingField(newField);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return;

    const updatedFields = selectedForm.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );

    const updatedForm = { ...selectedForm, fields: updatedFields };
    setSelectedForm(updatedForm);
  };

  const handleFieldDelete = (fieldId: string) => {
    if (!selectedForm) return;

    const updatedFields = selectedForm.fields.filter(field => field.id !== fieldId);
    const updatedForm = { ...selectedForm, fields: updatedFields };
    setSelectedForm(updatedForm);
  };

  const handleSaveForm = async () => {
    if (!selectedForm) return;

    await handleFormUpdate(selectedForm.id, selectedForm);
    setShowFormEditor(false);
    setEditingField(null);
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.name.endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        fetchData(); // Refresh PDF list
        alert('PDF uploaded successfully!');
      } else {
        alert('Upload endpoint not available yet');
      }
    } catch (error) {
      console.error("Failed to upload PDF:", error);
      alert('Upload feature not available yet');
    }
  };

  const handlePdfRename = async (oldName: string, newName: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/rename-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldName, newName }),
      });

      if (response.ok) {
        fetchData(); // Refresh PDF list
        alert('PDF renamed successfully!');
      } else {
        alert('Rename feature not available yet');
      }
    } catch (error) {
      console.error("Failed to rename PDF:", error);
      alert('Rename feature not available yet');
    }
  };

  const handleLinkPdfToForm = async (formId: string, pdfFileName: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/link-pdf-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ formId, pdfFileName }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
        setShowPdfLinker(false);
        alert("PDF linked to form successfully!");
      } else {
        setShowPdfLinker(false);
        alert("Link feature not available yet");
      }
    } catch (error) {
      console.error("Failed to link PDF to form:", error);
      setShowPdfLinker(false);
      alert("Link feature not available yet");
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading form management system...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-500 to-amber-500 p-1 rounded mr-2">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-amber-600 bg-clip-text text-transparent font-bold">
                Admin Form Management System
              </span>
            </div>
            <Badge className="bg-gradient-to-r from-red-500 to-amber-500 text-white">Admin Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="forms">Forms Management</TabsTrigger>
              <TabsTrigger value="variables">Variable Mapping</TabsTrigger>
              <TabsTrigger value="pdfs">PDF Management</TabsTrigger>
              <TabsTrigger value="database">Database Schema</TabsTrigger>
            </TabsList>

            {/* Forms Management Tab */}
            <TabsContent value="forms">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search forms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button onClick={handleFormCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Button>
                  </div>
                  <Badge variant="outline">
                    {filteredForms.length} forms
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {filteredForms.map((form) => (
                    <Card key={form.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {form.id === "material-list-form" && (
                                <Package className="h-5 w-5 text-blue-600" />
                              )}
                              {form.id === "noncompliance-form" && (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                              <h3 className="font-semibold">{form.name}</h3>
                              <Badge variant={form.isTemplate ? "default" : "secondary"}>
                                {form.isTemplate ? "Template" : "Standard"}
                              </Badge>
                              {form.pdfTemplate && (
                                <Badge variant="outline">
                                  <FileText className="h-3 w-3 mr-1" />
                                  PDF: {form.pdfTemplate}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{form.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{form.fields.length} fields</span>
                              <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                              <span>Updated: {new Date(form.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowFormEditor(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowVariableMapper(true);
                              }}
                            >
                              <Variable className="h-4 w-4" />
                            </Button>
                            {!['material-list-form', 'noncompliance-form'].includes(form.id) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Form</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{form.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleFormDelete(form.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Variable Mapping Tab */}
            <TabsContent value="variables">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Form-to-Database Variable Mapping</h3>
                  <Select value={selectedForm?.id || ""} onValueChange={(formId) => {
                    const form = forms.find(f => f.id === formId);
                    setSelectedForm(form || null);
                  }}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a form" />
                    </SelectTrigger>
                    <SelectContent>
                      {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Field Mappings for "{selectedForm.name}"</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Form Field</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Database Column</TableHead>
                            <TableHead>Auto Fill Source</TableHead>
                            <TableHead>Required</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedForm.fields.map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="database_column"
                                  defaultValue={field.id.replace(/[^a-zA-Z0-9]/g, '_')}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="autoFillSource"
                                  defaultValue={field.autoFillFrom}
                                  className="w-32"
                                />
                              </TableCell>
                              <TableCell>
                                <Switch checked={field.required} />
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">
                                  <Save className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* PDF Management Tab */}
            <TabsContent value="pdfs">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">PDF Template Management</h3>
                  <div className="flex space-x-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                      id="pdf-upload"
                    />
                    <Label htmlFor="pdf-upload">
                      <Button asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload PDF
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                <div className="grid gap-4">
                  {pdfFiles.map((pdf) => (
                    <Card key={pdf.name} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-red-600" />
                              <h3 className="font-semibold">{pdf.name}</h3>
                              <Badge variant="outline">
                                {(pdf.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              Last modified: {new Date(pdf.lastModified).toLocaleDateString()}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Mapped to:</span>
                              {pdf.mappedForms.length > 0 ? (
                                pdf.mappedForms.map((formName) => (
                                  <Badge key={formName} variant="secondary" className="text-xs">
                                    {formName}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  No forms mapped
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdfForView(pdf.name);
                                setShowPdfViewer(true);
                              }}
                              title="View PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdf(pdf.name);
                                setShowVariableView(true);
                              }}
                              title="Edit Variable Mapping"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPdf(pdf.name);
                                setShowPdfLinker(true);
                              }}
                              title="Link to Form"
                            >
                              <Link className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Database Schema Tab */}
            <TabsContent value="database">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Database Schema & Routes Configuration</h3>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Form Data Storage Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure how form fields map to database columns and API routes.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm">
{`{
  "formSubmissions": {
    "id": "string",
    "jobId": "string",
    "formId": "string",
    "submittedBy": "string",
    "data": {
      // Dynamic fields based on form configuration
    },
    "submittedAt": "datetime",
    "signature": "object"
  }
}`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Standard Forms Schema */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900">
                      <FileText className="h-5 w-5 mr-2" />
                      Standard Forms Data Schema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Material List Schema */}
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Material List Form
                        </h4>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <pre className="text-sm">
{`{
  "materialListSubmission": {
    "formId": "material-list-form",
    "data": {
      "item_description": "string",
      "manufacturer": "string",
      "size_specification": "string",
      "quantity_requested": "number",
      "quantity_used": "number",
      "notes": "text"
    }
  }
}`}
                          </pre>
                        </div>
                      </div>

                      {/* Non Compliance Schema */}
                      <div>
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Non Compliance Form
                        </h4>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <pre className="text-sm">
{`{
  "nonComplianceSubmission": {
    "formId": "noncompliance-form",
    "data": {
      "cold_vacuum_breaker": "select",
      "pipe_material": "select",
      "water_pressure": "number",
      "compliance_notes": "text"
    }
  }
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Editor Dialog */}
      <Dialog open={showFormEditor} onOpenChange={setShowFormEditor}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form: {selectedForm?.name}</DialogTitle>
            <DialogDescription>
              Configure form fields, validation, and database mapping.
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <div className="space-y-6">
              {/* Form Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="form-name">Form Name</Label>
                  <Input
                    id="form-name"
                    value={selectedForm.name}
                    onChange={(e) => setSelectedForm({
                      ...selectedForm,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="form-type">Form Type</Label>
                  <Input
                    id="form-type"
                    value={selectedForm.formType || ""}
                    onChange={(e) => setSelectedForm({
                      ...selectedForm,
                      formType: e.target.value
                    })}
                    placeholder="e.g., clearance, liability, assessment"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={selectedForm.description || ""}
                  onChange={(e) => setSelectedForm({
                    ...selectedForm,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedForm.isTemplate}
                  onCheckedChange={(checked) => setSelectedForm({
                    ...selectedForm,
                    isTemplate: checked
                  })}
                />
                <Label>Template Form</Label>
              </div>

              {/* Fields Management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Form Fields</h4>
                  <Button onClick={handleFieldAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedForm.fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => handleFieldUpdate(field.id, { type: value as any })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                  <SelectItem value="select">Select</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                  <SelectItem value="radio">Radio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Auto Fill From</Label>
                              <Input
                                value={field.autoFillFrom || ""}
                                onChange={(e) => handleFieldUpdate(field.id, { autoFillFrom: e.target.value })}
                                placeholder="e.g., claimNo, insuredName"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Placeholder</Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) => handleFieldUpdate(field.id, { placeholder: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: checked })}
                                />
                                <Label>Required</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.readonly}
                                  onCheckedChange={(checked) => handleFieldUpdate(field.id, { readonly: checked })}
                                />
                                <Label>Read Only</Label>
                              </div>
                            </div>
                          </div>

                          {field.type === "select" && (
                            <div>
                              <Label>Options (one per line)</Label>
                              <Textarea
                                value={field.options?.join('\n') || ""}
                                onChange={(e) => handleFieldUpdate(field.id, {
                                  options: e.target.value.split('\n').filter(opt => opt.trim())
                                })}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFieldDelete(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowFormEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveForm}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Form
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Variable Mapping Editor Dialog */}
      {showVariableMapper && selectedForm && (
        <VariableMappingEditor
          form={selectedForm}
          onSave={(mappings) => {
            console.log("Variable mappings saved:", mappings);
            setShowVariableMapper(false);
          }}
          onClose={() => setShowVariableMapper(false)}
        />
      )}

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>PDF Viewer: {selectedPdfForView}</DialogTitle>
          </DialogHeader>
          <div className="h-[600px] w-full">
            {selectedPdfForView && (
              <iframe
                src={`/forms/${selectedPdfForView}`}
                className="w-full h-full border rounded"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF to Form Linker Dialog */}
      <Dialog open={showPdfLinker} onOpenChange={setShowPdfLinker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link PDF to Form</DialogTitle>
            <DialogDescription>
              Associate "{selectedPdf}" with a form template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Form</Label>
              <Select onValueChange={(formId) => {
                if (formId && selectedPdf) {
                  handleLinkPdfToForm(formId, selectedPdf);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a form" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variable Mapping View Dialog */}
      <Dialog open={showVariableView} onOpenChange={setShowVariableView}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Variable className="h-5 w-5 mr-2 text-amber-600" />
              PDF Variable Mapping: {selectedPdf}
            </DialogTitle>
            <DialogDescription>
              View and edit how form fields map to PDF variables for this template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Forms using this PDF */}
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Forms Using This PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {forms
                    .filter(form => form.pdfTemplate === selectedPdf)
                    .map(form => (
                      <Card key={form.id} className="bg-white border-amber-200">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-amber-800">{form.name}</h4>
                              <p className="text-sm text-gray-600">{form.description}</p>
                              <Badge variant="outline" className="mt-2">
                                {form.fields.length} fields
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedForm(form);
                                setShowVariableMapper(true);
                                setShowVariableView(false);
                              }}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Mapping
                            </Button>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-medium text-sm mb-2">Field Mappings:</h5>
                            <div className="space-y-2">
                              {form.fields.slice(0, 5).map(field => (
                                <div key={field.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                  <span className="font-medium">{field.label}</span>
                                  <span className="text-gray-600">{field.type}</span>
                                  <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                                    {field.id.replace(/[^a-zA-Z0-9]/g, "_")}
                                  </span>
                                </div>
                              ))}
                              {form.fields.length > 5 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{form.fields.length - 5} more fields
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  {forms.filter(form => form.pdfTemplate === selectedPdf).length === 0 && (
                    <div className="text-center py-8 text-amber-600">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No forms are currently using this PDF template</p>
                      <Button
                        className="mt-2 bg-amber-600 hover:bg-amber-700"
                        onClick={() => {
                          setShowPdfLinker(true);
                          setShowVariableView(false);
                        }}
                      >
                        Link to Form
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
