import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Clock, ChevronLeft, ChevronRight, Calendar, Building2, GraduationCap, DollarSign, FileUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Scholarship } from "@shared/schema";

const SCHOLARSHIPS_PER_PAGE = 12;

export default function Opportunities() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const { toast } = useToast();
  const profileId = localStorage.getItem('currentProfileId');

  const { data: scholarships, isLoading } = useQuery<Scholarship[]>({
    queryKey: ['/api/scholarships'],
    queryFn: async () => {
      const res = await fetch('/api/scholarships');
      if (!res.ok) throw new Error('Failed to fetch scholarships');
      return res.json();
    },
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: { scholarshipId: string; documents: string[]; profileId: string }) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit application');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Your application has been submitted." });
      setShowApplicationForm(false);
      setUploadedDocuments([]);
      setSelectedScholarship(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit application. Please try again.", variant: "destructive" });
    },
  });

  const totalPages = scholarships ? Math.ceil(scholarships.length / SCHOLARSHIPS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * SCHOLARSHIPS_PER_PAGE;
  const endIndex = startIndex + SCHOLARSHIPS_PER_PAGE;
  const paginatedScholarships = scholarships?.slice(startIndex, endIndex) || [];

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">Browse All Scholarships</h1>
          <p className="text-lg">Explore our complete collection of scholarship opportunities</p>
          {!isLoading && scholarships && (
            <p className="text-sm mt-2">Showing {startIndex + 1} to {Math.min(endIndex, scholarships.length)} of {scholarships.length} scholarships</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div>Loading scholarships...</div>
          </div>
        ) : !scholarships || scholarships.length === 0 ? (
          <div className="text-center py-12">
            <p>No scholarships available</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedScholarships.map((scholarship) => (
                <Card key={scholarship.id} className="hover:shadow-lg transition-shadow" data-testid={`card-scholarship-${scholarship.id}`}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2" data-testid={`text-title-${scholarship.id}`}>
                        {scholarship.title}
                      </h3>
                      <p className="text-sm mb-3" data-testid={`text-organization-${scholarship.id}`}>
                        {scholarship.organization}
                      </p>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Amount</span>
                        <span className="font-semibold" data-testid={`text-amount-${scholarship.id}`}>
                          {scholarship.amount?.replace('$', '₹') || '₹0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Type</span>
                        <Badge variant="secondary" className="text-xs">{scholarship.type}</Badge>
                      </div>
                    </div>

                    <p className="text-sm mb-4 line-clamp-2" data-testid={`text-description-${scholarship.id}`}>
                      {scholarship.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(typeof scholarship.tags === 'string' ? JSON.parse(scholarship.tags) : scholarship.tags).slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-1 text-sm mb-3">
                        <Clock className="w-4 h-4" />
                        <span data-testid={`text-deadline-${scholarship.id}`}>Due: {scholarship.deadline}</span>
                      </div>
                      <Button 
                        className="w-full" 
                        data-testid={`button-apply-${scholarship.id}`}
                        onClick={() => setSelectedScholarship(scholarship)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
              </div>

              <Button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2"
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Scholarship Details Modal */}
      <Dialog open={!!selectedScholarship} onOpenChange={(open) => !open && setSelectedScholarship(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedScholarship && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedScholarship.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-base">
                  <Building2 className="w-4 h-4" />
                  {selectedScholarship.organization}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Key Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-medium">Award Amount</span>
                    </div>
                    <p className="text-xl font-bold text-green-800 dark:text-green-300">
                      {selectedScholarship.amount?.replace('$', '₹') || '₹0'}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Deadline</span>
                    </div>
                    <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
                      {selectedScholarship.deadline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedScholarship.description}</p>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <p className="text-muted-foreground">{selectedScholarship.requirements}</p>
                </div>

                {/* Eligibility */}
                {(selectedScholarship.eligibilityGpa || selectedScholarship.eligibleFields?.length || selectedScholarship.eligibleLevels?.length) && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Eligibility Criteria
                    </h4>
                    <div className="space-y-2">
                      {selectedScholarship.eligibilityGpa && (
                        <p className="text-sm">
                          <span className="font-medium">Minimum GPA:</span> {selectedScholarship.eligibilityGpa}
                        </p>
                      )}
                      {selectedScholarship.eligibleFields && selectedScholarship.eligibleFields.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Eligible Fields: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(typeof selectedScholarship.eligibleFields === 'string' 
                              ? JSON.parse(selectedScholarship.eligibleFields) 
                              : selectedScholarship.eligibleFields
                            ).map((field: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{field}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedScholarship.eligibleLevels && selectedScholarship.eligibleLevels.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Education Levels: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(typeof selectedScholarship.eligibleLevels === 'string'
                              ? JSON.parse(selectedScholarship.eligibleLevels)
                              : selectedScholarship.eligibleLevels
                            ).map((level: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs capitalize">{level.replace('-', ' ')}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {(typeof selectedScholarship.tags === 'string' 
                      ? JSON.parse(selectedScholarship.tags) 
                      : selectedScholarship.tags
                    ).map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>

                {/* Type Badge */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Type:</span>
                  <Badge className="capitalize">{selectedScholarship.type}</Badge>
                </div>

                {/* Apply Now Button */}
                {!showApplicationForm ? (
                  <Button 
                    onClick={() => setShowApplicationForm(true)}
                    className="w-full mt-6 bg-primary hover:bg-blue-700"
                    data-testid="button-apply-now"
                  >
                    Apply Now
                  </Button>
                ) : (
                  <div className="border-t pt-6 mt-6">
                    <h4 className="font-semibold mb-4">Submit Your Application</h4>
                    <p className="text-sm text-muted-foreground mb-4">Please upload required documents to authenticate your profile:</p>

                    {/* Document Upload */}
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          id="doc-upload"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.name.toLowerCase().endsWith('.pdf')) {
                                toast({ description: "Only PDF files are allowed", variant: "destructive" });
                                return;
                              }
                              const fileName = `${Date.now()}-${file.name}`;
                              setUploadedDocuments([...uploadedDocuments, fileName]);
                              toast({ description: `${file.name} added successfully` });
                            }
                          }}
                          data-testid="input-document-upload"
                        />
                        <label htmlFor="doc-upload" className="cursor-pointer">
                          <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload PDF documents</p>
                          <p className="text-xs text-muted-foreground">(PDF files only)</p>
                        </label>
                      </div>

                      {/* Uploaded Documents List */}
                      {uploadedDocuments.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Uploaded Documents ({uploadedDocuments.length}):</p>
                          <div className="space-y-2">
                            {uploadedDocuments.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded">
                                <span className="text-sm truncate">{doc.split('-').slice(1).join('-')}</span>
                                <button
                                  onClick={() => setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid={`button-remove-doc-${idx}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowApplicationForm(false);
                            setUploadedDocuments([]);
                          }}
                          data-testid="button-cancel-application"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-blue-700"
                          onClick={() => {
                            if (uploadedDocuments.length === 0) {
                              toast({ description: "Please upload at least one document", variant: "destructive" });
                              return;
                            }
                            if (!profileId) {
                              toast({ description: "User profile not found. Please log in.", variant: "destructive" });
                              return;
                            }
                            applicationMutation.mutate({
                              scholarshipId: selectedScholarship.id,
                              documents: uploadedDocuments,
                              profileId: profileId,
                            });
                          }}
                          disabled={applicationMutation.isPending}
                          data-testid="button-submit-application"
                        >
                          {applicationMutation.isPending ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}