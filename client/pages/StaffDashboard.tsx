import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  User,
  Calendar,
  List,
  StickyNote,
  Camera,
  Download,
  Edit,
  MapPin,
  Settings,
  Briefcase,
  Trash2,
  Eye,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Job, Form, FormSubmission } from "@shared/types";

import { JobExtensionModal } from "@/components/JobExtensionModal";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { JobNotesModal } from "@/components/JobNotesModal";
import { StaffProfileEditModal } from "@/components/StaffProfileEditModal";
import { AdditionalFormsModal } from "@/components/AdditionalFormsModal";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [showJobExtension, setShowJobExtension] = useState(false);
  const [selectedJobForExtension, setSelectedJobForExtension] =
    useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] =
    useState<Job | null>(null);
  const [showJobNotes, setShowJobNotes] = useState(false);
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<Job | null>(
    null,
  );
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAdditionalForms, setShowAdditionalForms] = useState(false);
  const [selectedJobForForms, setSelectedJobForForms] = useState<Job | null>(
    null,
  );
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [showCompletedForms, setShowCompletedForms] = useState(false);
  const [formsSearchTerm, setFormsSearchTerm] = useState("");

  useEffect(() => {
    if (user && (user.role === "staff" || user.role === "supervisor" || user.role === "admin" || user.role === "apollo")) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes, formsRes, submissionsRes] = await Promise.all([
        fetch(`/api/jobs?assignedTo=${user.id}`, { headers }),
        fetch("/api/forms", { headers }),
        fetch(`/api/form-submissions?submittedBy=${user.id}`, { headers }),
      ]);

      const [jobsData, formsData, submissionsData] = await Promise.all([
        jobsRes.json(),
        formsRes.json(),
        submissionsRes.json(),
      ]);

      setJobs(jobsData);
      setForms(formsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  const getJobForms = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return [];

    const formIds = job.formIds || (job.formId ? [job.formId] : []);
    return forms.filter((f) => formIds.includes(f.id));
  };

  const getJobForm = (jobId: string) => {
    const jobForms = getJobForms(jobId);
    return jobForms.length > 0 ? jobForms[0] : null;
  };

  const isFormSubmitted = (jobId: string) => {
    return submissions.some((s) => s.jobId === jobId);
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      } else {
        console.error("Failed to update job status");
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const handleExtendJob = (job: Job) => {
    setSelectedJobForExtension(job);
    setShowJobExtension(true);
  };

  const handleViewJobDetails = (job: Job) => {
    setSelectedJobForDetails(job);
    setShowJobDetails(true);
  };

  const handleAddNote = (job: Job) => {
    setSelectedJobForNotes(job);
    setShowJobNotes(true);
  };

  const handleCheckIn = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/staff/${user.id}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          location: "Office", // In production, get GPS location
        }),
      });

      if (response.ok) {
        setIsCheckedIn(true);
        setLastCheckIn(new Date().toISOString());
      }
    } catch (error) {
      console.error("Check-in failed:", error);
    }
  };

  const handleDownloadFormPDF = async (submission: FormSubmission) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/forms/${submission.formId}/submissions/${submission.id}/pdf`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${submission.formType}-${submission.jobId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Clone the response before reading to avoid "body stream already read" error
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage = errorData || errorMessage;
        } catch (readError) {
          console.warn("Could not read error response body:", readError);
        }
        console.error(
          `Failed to download PDF (${response.status}):`,
          errorMessage,
        );
        alert(`Failed to download PDF: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDeleteJob = async (job: Job) => {
    if (!user || user.role !== "admin") {
      alert("Only administrators can delete jobs");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        fetchData(); // Refresh the data
        setShowDeleteConfirm(false);
        setJobToDelete(null);
        alert("Job and all associated forms deleted successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to delete job: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Error deleting job. Please try again.");
    }
  };

  const handleReopenJob = async (job: Job) => {
    if (!user || (user.role !== "admin" && user.role !== "apollo")) {
      alert("Only administrators and apollo users can reopen jobs");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "in_progress" }),
      });

      if (response.ok) {
        fetchData(); // Refresh the data
        alert("Job reopened successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to reopen job: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error reopening job:", error);
      alert("Error reopening job. Please try again.");
    }
  };

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter((j) => j.status === "pending").length,
    inProgressJobs: jobs.filter((j) => j.status === "in_progress").length,
    completedJobs: jobs.filter((j) => j.status === "completed").length,
    formsSubmitted: submissions.length,
  };

  const completionRate =
    stats.totalJobs > 0
      ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
      : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  My Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                  {lastCheckIn && (
                    <span className="ml-2 text-green-600">
                      • Checked in {new Date(lastCheckIn).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={isCheckedIn ? "default" : "outline"}
                size="sm"
                onClick={handleCheckIn}
                disabled={isCheckedIn}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isCheckedIn ? "Checked In" : "Check In"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileEdit(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedJobs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Forms Submitted
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.formsSubmitted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Overall Completion
                  </span>
                  <span className="text-sm text-gray-600">
                    {completionRate}%
                  </span>
                </div>
                <Progress value={completionRate} className="w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {stats.pendingJobs}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.inProgressJobs}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedJobs}
                  </p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No jobs assigned yet.</p>
              </div>
            ) : (
              <Tabs defaultValue={jobs[0]?.id} className="w-full">
                <TabsList className="w-full flex-wrap h-auto p-1">
                  {jobs.map((job) => (
                    <TabsTrigger
                      key={job.id}
                      value={job.id}
                      className="flex items-center space-x-2 m-1"
                    >
                      <Badge
                        variant={
                          job.status === "completed"
                            ? "default"
                            : job.status === "in_progress"
                              ? "secondary"
                              : "outline"
                        }
                        className="w-2 h-2 p-0"
                      />
                      <span className="truncate max-w-32">{job.title}</span>
                      <span className="text-xs text-gray-500">
                        ({job.claimNo || job.ClaimNo})
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {jobs.map((job) => {
                  const isCurrentUser = job.assignedTo === user?.id;

                  if (!isCurrentUser && user?.role !== "supervisor") {
                    return null;
                  }

                  return (
                    <TabsContent key={job.id} value={job.id} className="mt-4">
                      <div className="space-y-4 p-6 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {job.title}
                            </h3>
                            <div className="flex gap-2 mt-2">
                              <Badge
                                variant={
                                  job.status === "completed"
                                    ? "default"
                                    : job.status === "in_progress"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {job.status}
                              </Badge>
                              <Badge variant="outline">
                                {job.claimNo || job.ClaimNo}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <div>
                              {new Date(job.scheduledDate).toLocaleDateString()}
                            </div>
                            {job.scheduledTime && (
                              <div>{job.scheduledTime}</div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div>
                              <strong>Client:</strong>{" "}
                              {job.insuredName || job.InsuredName}
                            </div>
                            <div>
                              <strong>Address:</strong> {job.address}
                            </div>
                            {job.contactInfo && (
                              <div>
                                <strong>Contact:</strong> {job.contactInfo}
                              </div>
                            )}
                            {user?.role === "admin" && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-center justify-between">
                                  <strong className="text-sm">Submitted Forms:</strong>
                                  <Badge variant="outline" className="text-xs">
                                    {submissions.filter(s => s.jobId === job.id).length} forms
                                  </Badge>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {submissions
                                    .filter(s => s.jobId === job.id)
                                    .map((submission) => (
                                      <div key={submission.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                        <span className="font-medium">
                                          {submission.formId === "material-list-form" ? "Material List" :
                                           submission.formId === "noncompliance-form" ? "Non Compliance" :
                                           forms.find(f => f.id === submission.formId)?.name || "Unknown Form"}
                                        </span>
                                        <div className="flex space-x-1">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadFormPDF(submission)}
                                            className="text-xs h-6 px-2"
                                          >
                                            <Download className="h-3 w-3 mr-1" />
                                            PDF
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              // TODO: Implement form editing
                                              alert("Form editing will be implemented");
                                            }}
                                            className="text-xs h-6 px-2"
                                          >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  {submissions.filter(s => s.jobId === job.id).length === 0 && (
                                    <p className="text-xs text-gray-500 italic">No forms submitted yet</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <strong>Underwriter:</strong>{" "}
                              {job.underwriter || job.Underwriter}
                            </div>
                            <div>
                              <strong>Description:</strong> {job.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-4 border-t">
                          {job.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateJobStatus(job.id, "in_progress")
                              }
                            >
                              Start Job
                            </Button>
                          )}
                          {job.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateJobStatus(job.id, "completed")
                              }
                            >
                              Mark Complete
                            </Button>
                          )}
                          <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewJobDetails(job)}
                        >
                          View Details
                        </Button>
                        {(user?.role === "admin" || user?.role === "apollo") && (
                          <div className="flex space-x-2 ml-2">
                            {job.status === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReopenJob(job)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reopen
                              </Button>
                            )}
                            {user?.role === "admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setJobToDelete(job);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No jobs assigned
                  </h3>
                  <p className="text-gray-600">
                    You don't have any jobs assigned to you yet. Check back
                    later or contact your administrator.
                  </p>
                </div>
              ) : (
                jobs.map((job) => {
                  const form = getJobForm(job.id);
                  const hasSubmittedForm = isFormSubmitted(job.id);

                  return (
                    <div
                      key={job.id}
                      className="border rounded-lg p-6 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium">{job.title}</h3>
                            <Badge variant={getPriorityColor(job.priority)}>
                              {job.priority}
                            </Badge>
                            <Badge
                              className={getStatusColor(job.status)}
                              variant="secondary"
                            >
                              {job.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-gray-600">{job.description}</p>

                          {/* Job Details */}
                          {job.claimNo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Claim Details
                                </p>
                                <div className="mt-2 space-y-1 text-sm">
                                  {job.claimNo && (
                                    <p>
                                      <span className="font-medium">
                                        Claim No:
                                      </span>{" "}
                                      {job.claimNo}
                                    </p>
                                  )}
                                  {job.policyNo && (
                                    <p>
                                      <span className="font-medium">
                                        Policy No:
                                      </span>{" "}
                                      {job.policyNo}
                                    </p>
                                  )}
                                  {job.insuredName && (
                                    <p>
                                      <span className="font-medium">
                                        Insured:
                                      </span>{" "}
                                      {job.insuredName}
                                    </p>
                                  )}
                                  {job.excess && (
                                    <p>
                                      <span className="font-medium">
                                        Excess:
                                      </span>{" "}
                                      {job.excess}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  Contact & Location
                                </p>
                                <div className="mt-2 space-y-1 text-sm">
                                  {job.riskAddress && (
                                    <p>
                                      <span className="font-medium">
                                        Address:
                                      </span>{" "}
                                      {job.riskAddress}
                                    </p>
                                  )}
                                  {job.insCell && (
                                    <p>
                                      <span className="font-medium">
                                        Contact:
                                      </span>{" "}
                                      {job.insCell}
                                    </p>
                                  )}
                                  {job.email && (
                                    <p>
                                      <span className="font-medium">
                                        Email:
                                      </span>{" "}
                                      {job.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          {job.dueDate && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {new Date(job.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          <p className="text-sm text-gray-500">
                            Created: {new Date(job.createdAt).toDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Form Section */}
                      {form && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">
                                Required Form: {form.name}
                              </span>
                              {hasSubmittedForm ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Submitted
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-red-100 text-red-800"
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant={hasSubmittedForm ? "outline" : "default"}
                              disabled={job.status !== "in_progress"}
                              onClick={() => {
                                if (job.status !== "in_progress") {
                                  alert("Forms can only be submitted when the job is in progress. Please start the job first or ask an admin to reopen a completed job.");
                                  return;
                                }
                                if (form) {
                                  // Navigate to fill form page
                                  window.location.href = `/fill-form?jobId=${job.id}&formId=${form.id}`;
                                }
                              }}
                              title={job.status !== "in_progress" ? "Job must be in progress to submit forms" : ""}
                            >
                              {hasSubmittedForm ? "View Form" :
                               job.status === "pending" ? "Start Job First" :
                               job.status === "completed" ? "Job Completed" :
                               "Fill Form"}
                            </Button>
                          </div>
                          {form.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {form.description}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Job Photos Section */}
                      <div className="pt-4 mt-4 border-t">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Camera className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-sm">
                              Job Photos
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // In production, implement photo upload
                              console.log("Upload photos for job:", job.id);
                            }}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Add Photos
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {/* Mock photos - replace with actual photo data */}
                          {[1, 2, 3].map((photoIndex) => (
                            <div
                              key={photoIndex}
                              className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                            >
                              <Camera className="h-6 w-6 text-gray-400" />
                            </div>
                          ))}
                          <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                            <Camera className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex space-x-2">
                          {job.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateJobStatus(job.id, "in_progress")
                              }
                            >
                              Start Job
                            </Button>
                          )}
                          {job.status === "in_progress" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Check if there are required forms and if they're submitted
                                const assignedFormIds =
                                  job.formIds ||
                                  (job.formId ? [job.formId] : []);
                                const availableForms = forms.filter((f) =>
                                  assignedFormIds.includes(f.id),
                                );

                                const submittedFormIds = submissions
                                  .filter((s) => s.jobId === job.id)
                                  .map((s) => s.formId);

                                const missingForms = availableForms.filter(
                                  (f) => !submittedFormIds.includes(f.id),
                                );

                                if (missingForms.length > 0) {
                                  alert(
                                    `Please submit the following forms before marking the job as complete: ${missingForms.map((f) => f.name).join(", ")}`,
                                  );
                                  return;
                                }

                                updateJobStatus(job.id, "completed");
                              }}
                            >
                              Mark Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddNote(job)}
                          >
                            <StickyNote className="h-4 w-4 mr-1" />
                            Add Note
                          </Button>
                          {/* Allow extending jobs that are not completed or need follow-up */}
                          {(job.status !== "completed" ||
                            (job as any).carryOver) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExtendJob(job)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Extend
                            </Button>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            View Details
                          </Button>
                          {(user?.role === "admin" || user?.role === "apollo") && (
                            <>
                              {job.status === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReopenJob(job)}
                                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                >
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Reopen
                                </Button>
                              )}
                              {user?.role === "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setJobToDelete(job);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Forms Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle
                className="flex items-center cursor-pointer"
                onClick={() => setShowCompletedForms(!showCompletedForms)}
              >
                <FileText className="h-5 w-5 mr-2" />
                My Completed Forms
                <Badge variant="outline" className="ml-2">
                  {submissions.length} forms
                </Badge>
                {showCompletedForms ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompletedForms(!showCompletedForms)}
              >
                {showCompletedForms ? "Collapse" : "Expand"}
              </Button>
            </div>
            {showCompletedForms && submissions.length > 0 && (
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search forms by type, job, or date..."
                    value={formsSearchTerm}
                    onChange={(e) => setFormsSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </CardHeader>
          {showCompletedForms && (
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No forms submitted yet</p>
                  <p className="text-sm">Complete job forms to see them here</p>
                </div>
              ) : (
                (() => {
                  // Filter submissions based on search term
                  const filteredSubmissions = submissions.filter((submission) => {
                    const relatedJob = jobs.find(j => j.id === submission.jobId);
                    const searchLower = formsSearchTerm.toLowerCase();

                    return (
                      (submission.formType || "").toLowerCase().includes(searchLower) ||
                      (submission.formId || "").toLowerCase().includes(searchLower) ||
                      (relatedJob?.title || "").toLowerCase().includes(searchLower) ||
                      new Date(submission.submittedAt).toLocaleDateString().toLowerCase().includes(searchLower)
                    );
                  });

                  // Group submissions by date
                  const groupedSubmissions = filteredSubmissions.reduce((groups, submission) => {
                    const date = new Date(submission.submittedAt).toLocaleDateString();
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(submission);
                    return groups;
                  }, {} as Record<string, typeof submissions>);

                  // Sort dates in descending order (newest first)
                  const sortedDates = Object.keys(groupedSubmissions).sort((a, b) =>
                    new Date(b).getTime() - new Date(a).getTime()
                  );

                  if (filteredSubmissions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No forms match your search</p>
                        <p className="text-sm">Try adjusting your search terms</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {sortedDates.map((date) => (
                        <div key={date}>
                          <h4 className="font-semibold text-sm text-gray-700 mb-3 pb-2 border-b">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {groupedSubmissions[date].length} forms
                            </Badge>
                          </h4>
                          <div className="space-y-3">
                            {groupedSubmissions[date].map((submission) => {
                              const relatedJob = jobs.find(j => j.id === submission.jobId);
                              return (
                                <div
                                  key={submission.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </div>
                                      <div>
                                        <h5 className="font-medium text-sm">
                                          {submission.formId === "material-list-form" ? "Material List" :
                                           submission.formId === "noncompliance-form" ? "Non Compliance" :
                                           submission.formType || "Unknown Form"}
                                        </h5>
                                        <p className="text-xs text-gray-600">
                                          {relatedJob?.title || `Job ${submission.jobId}`}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(submission.submittedAt).toLocaleTimeString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="default"
                                      className="bg-green-100 text-green-800 text-xs"
                                    >
                                      Completed
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadFormPDF(submission)}
                                      className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs h-7 px-2"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      PDF
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </CardContent>
          )}
        </Card>

        {/* Job Extension Modal */}
        <JobExtensionModal
          open={showJobExtension}
          onOpenChange={(open) => {
            setShowJobExtension(open);
            if (!open) setSelectedJobForExtension(null);
          }}
          job={selectedJobForExtension}
          onJobExtended={fetchData}
        />

        {/* Job Details Modal */}
        <JobDetailsModal
          open={showJobDetails}
          onOpenChange={(open) => {
            setShowJobDetails(open);
            if (!open) setSelectedJobForDetails(null);
          }}
          job={selectedJobForDetails}
          onJobUpdated={fetchData}
        />

        {/* Job Notes Modal */}
        <JobNotesModal
          open={showJobNotes}
          onOpenChange={(open) => {
            setShowJobNotes(open);
            if (!open) setSelectedJobForNotes(null);
          }}
          job={selectedJobForNotes}
          onNotesUpdated={fetchData}
        />

        {/* Staff Profile Edit Modal */}
        <StaffProfileEditModal
          open={showProfileEdit}
          onOpenChange={setShowProfileEdit}
          user={user}
          onProfileUpdated={fetchData}
        />

        {/* Additional Forms Modal */}
        {selectedJobForForms && (
          <AdditionalFormsModal
            isOpen={showAdditionalForms}
            onClose={() => {
              setShowAdditionalForms(false);
              setSelectedJobForForms(null);
            }}
            job={selectedJobForForms}
            assignedStaff={user}
          />
        )}

        {/* Job Deletion Confirmation Dialog */}
        {showDeleteConfirm && jobToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                Delete Job Confirmation
              </h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete job "{jobToDelete.title}"?
                <br />
                <strong className="text-red-600">
                  This will permanently delete the job and all associated forms.
                </strong>
              </p>
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setJobToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteJob(jobToDelete)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
