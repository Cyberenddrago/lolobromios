import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Variable,
  Database,
  Link,
  Save,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Copy,
  Edit,
} from "lucide-react";
import { Form, FormField } from "@shared/types";

interface VariableMapping {
  id: string;
  formFieldId: string;
  formFieldLabel: string;
  formFieldType: string;
  databaseColumn: string;
  pdfVariable: string;
  autoFillFrom?: string;
  required: boolean;
  isCustom: boolean;
}

interface DatabaseColumn {
  name: string;
  type: string;
  required: boolean;
  description: string;
  usedBy: string[];
}

interface VariableMappingEditorProps {
  form: Form;
  onSave: (mappings: VariableMapping[]) => void;
  onClose: () => void;
}

export function VariableMappingEditor({ form, onSave, onClose }: VariableMappingEditorProps) {
  const [mappings, setMappings] = useState<VariableMapping[]>([]);
  const [databaseSchema, setDatabaseSchema] = useState<DatabaseColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMapping, setActiveMapping] = useState<VariableMapping | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Common database columns that can be auto-filled
  const commonAutoFillSources = [
    { value: "claimNo", label: "Claim Number" },
    { value: "insuredName", label: "Insured Name" },
    { value: "riskAddress", label: "Risk Address" },
    { value: "assignedStaffName", label: "Assigned Staff Name" },
    { value: "policyNo", label: "Policy Number" },
    { value: "underwriter", label: "Underwriter" },
    { value: "broker", label: "Broker" },
    { value: "excess", label: "Excess Amount" },
    { value: "incidentDate", label: "Incident Date" },
    { value: "descriptionOfLoss", label: "Description of Loss" },
    { value: "title", label: "Job Title" },
    { value: "description", label: "Job Description" },
  ];

  useEffect(() => {
    loadVariableMappings();
    loadDatabaseSchema();
  }, [form.id]);

  const loadVariableMappings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/forms/${form.id}/variable-mappings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setMappings(data.mappings || generateDefaultMappings());
      } else {
        setMappings(generateDefaultMappings());
      }
    } catch (error) {
      console.error("Failed to load variable mappings:", error);
      setMappings(generateDefaultMappings());
    } finally {
      setLoading(false);
    }
  };

  const loadDatabaseSchema = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/admin/database-schema", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        const columns = Object.entries(data.schema.dynamicFormFields).map(([name, info]: [string, any]) => ({
          name,
          type: info.type,
          required: info.required,
          description: `${info.fieldLabel} (${info.formName})`,
          usedBy: [info.formName],
        }));
        setDatabaseSchema(columns);
      }
    } catch (error) {
      console.error("Failed to load database schema:", error);
    }
  };

  const generateDefaultMappings = (): VariableMapping[] => {
    return form.fields.map((field) => ({
      id: `mapping-${field.id}`,
      formFieldId: field.id,
      formFieldLabel: field.label,
      formFieldType: field.type,
      databaseColumn: field.id.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase(),
      pdfVariable: field.id.replace(/[^a-zA-Z0-9]/g, "_"),
      autoFillFrom: field.autoFillFrom,
      required: field.required,
      isCustom: false,
    }));
  };

  const handleMappingUpdate = (mappingId: string, updates: Partial<VariableMapping>) => {
    setMappings(prev => prev.map(mapping =>
      mapping.id === mappingId ? { ...mapping, ...updates } : mapping
    ));
  };

  const handleSaveMappings = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/admin/forms/${form.id}/variable-mappings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mappings }),
      });

      if (response.ok) {
        onSave(mappings);
      } else {
        throw new Error("Failed to save mappings");
      }
    } catch (error) {
      console.error("Failed to save variable mappings:", error);
      alert("Failed to save variable mappings");
    }
  };

  const generatePreviewData = (mapping: VariableMapping) => {
    const sampleData = {
      claimNo: "CLM-2024-001234",
      insuredName: "John Smith",
      riskAddress: "123 Main Street, Cape Town",
      assignedStaffName: "Keenan Williams",
      policyNo: "POL-987654",
      excess: "R1,500",
      title: "Geyser Replacement",
    };

    return {
      formField: mapping.formFieldLabel,
      databaseColumn: mapping.databaseColumn,
      pdfVariable: mapping.pdfVariable,
      autoFillValue: mapping.autoFillFrom ? sampleData[mapping.autoFillFrom as keyof typeof sampleData] : "No auto-fill",
      sampleInput: mapping.formFieldType === "select" ? "Option 1" : "User input value",
    };
  };

  const validateMapping = (mapping: VariableMapping): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];

    if (!mapping.databaseColumn.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      issues.push("Database column name must start with a letter and contain only letters, numbers, and underscores");
    }

    if (!mapping.pdfVariable.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
      issues.push("PDF variable name must start with a letter and contain only letters, numbers, and underscores");
    }

    if (mapping.autoFillFrom && !commonAutoFillSources.find(s => s.value === mapping.autoFillFrom)) {
      issues.push("Auto-fill source should be from the available options or a valid job/form field");
    }

    // Check for duplicate database columns
    const duplicates = mappings.filter(m => m.databaseColumn === mapping.databaseColumn && m.id !== mapping.id);
    if (duplicates.length > 0) {
      issues.push("Database column name is already used by another field");
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading variable mappings...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Variable className="h-5 w-5 mr-2" />
            Variable Mapping Editor: {form.name}
          </DialogTitle>
          <DialogDescription>
            Configure how form fields map to database columns and PDF variables for data processing and auto-fill functionality.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="mappings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mappings">Field Mappings</TabsTrigger>
            <TabsTrigger value="preview">Preview & Test</TabsTrigger>
            <TabsTrigger value="schema">Database Schema</TabsTrigger>
          </TabsList>

          {/* Mappings Tab */}
          <TabsContent value="mappings" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-semibold">Form Field Mappings</h3>
                <p className="text-sm text-gray-600">
                  Configure database storage and auto-fill behavior for each form field.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={loadVariableMappings}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleSaveMappings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save All
                </Button>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Database Column</TableHead>
                    <TableHead>PDF Variable</TableHead>
                    <TableHead>Auto Fill Source</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => {
                    const validation = validateMapping(mapping);
                    return (
                      <TableRow key={mapping.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{mapping.formFieldLabel}</div>
                            <div className="text-xs text-gray-500">{mapping.formFieldId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{mapping.formFieldType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={mapping.databaseColumn}
                            onChange={(e) => handleMappingUpdate(mapping.id, { databaseColumn: e.target.value })}
                            className="w-32"
                            placeholder="column_name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={mapping.pdfVariable}
                            onChange={(e) => handleMappingUpdate(mapping.id, { pdfVariable: e.target.value })}
                            className="w-32"
                            placeholder="PDF_VARIABLE"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping.autoFillFrom || ""}
                            onValueChange={(value) => handleMappingUpdate(mapping.id, { autoFillFrom: value || undefined })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No auto-fill</SelectItem>
                              {commonAutoFillSources.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                  {source.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={mapping.required}
                            onCheckedChange={(checked) => handleMappingUpdate(mapping.id, { required: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          {validation.isValid ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Issues
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveMapping(mapping);
                                setPreviewData(generatePreviewData(mapping));
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(mapping.databaseColumn);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Validation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const allIssues = mappings.flatMap(mapping => {
                    const validation = validateMapping(mapping);
                    return validation.issues.map(issue => ({ mapping: mapping.formFieldLabel, issue }));
                  });

                  if (allIssues.length === 0) {
                    return (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        All mappings are valid and ready to save.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {allIssues.length} validation issues found:
                      </div>
                      <div className="space-y-1">
                        {allIssues.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 ml-6">
                            <strong>{item.mapping}:</strong> {item.issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Flow Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Preview how data flows from form input to database storage:
                    </div>
                    
                    {activeMapping && previewData && (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Form Field</Label>
                          <div className="font-medium">{previewData.formField}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Database Column</Label>
                          <div className="font-mono text-sm">{previewData.databaseColumn}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">PDF Variable</Label>
                          <div className="font-mono text-sm">{previewData.pdfVariable}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Auto-fill Value</Label>
                          <div className="text-blue-600">{previewData.autoFillValue}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-500">Sample User Input</Label>
                          <div>{previewData.sampleInput}</div>
                        </div>
                      </div>
                    )}

                    {!activeMapping && (
                      <div className="text-center py-8 text-gray-500">
                        Click "Edit" on any mapping to see the preview here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Insert Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-500">SQL INSERT Statement</Label>
                    <div className="bg-black text-green-400 p-3 rounded font-mono text-xs">
                      <div>INSERT INTO form_submissions (</div>
                      <div className="ml-4">id, job_id, form_id, submitted_by, submitted_at,</div>
                      {mappings.slice(0, 3).map((mapping) => (
                        <div key={mapping.id} className="ml-4">
                          {mapping.databaseColumn},
                        </div>
                      ))}
                      <div className="ml-4">...</div>
                      <div>) VALUES (</div>
                      <div className="ml-4">'sub-123', 'job-456', '{form.id}', 'staff-789', NOW(),</div>
                      <div className="ml-4">'value1', 'value2', 'value3', ...</div>
                      <div>);</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Schema Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{databaseSchema.length}</div>
                      <div className="text-sm text-gray-600">Total Columns</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{mappings.filter(m => m.required).length}</div>
                      <div className="text-sm text-gray-600">Required Fields</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{mappings.filter(m => m.autoFillFrom).length}</div>
                      <div className="text-sm text-gray-600">Auto-fill Fields</div>
                    </div>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Used By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {databaseSchema.slice(0, 10).map((column) => (
                          <TableRow key={column.name}>
                            <TableCell className="font-mono text-sm">{column.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{column.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {column.required ? (
                                <Badge variant="destructive">Required</Badge>
                              ) : (
                                <Badge variant="secondary">Optional</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{column.description}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {column.usedBy.map((form) => (
                                  <Badge key={form} variant="outline" className="text-xs">
                                    {form}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {databaseSchema.length > 10 && (
                    <div className="text-center text-sm text-gray-500">
                      Showing first 10 columns. Total: {databaseSchema.length}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
