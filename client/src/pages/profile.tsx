import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import ProfileForm from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Target, MapPin, Calendar, LogOut, Users, CheckCircle, FileText, Download, Loader2, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile, GeneratedResume } from "@shared/schema";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get profile ID from localStorage - this is set after profile creation
  const profileId = localStorage.getItem('currentProfileId');
  
  // Get booked consultations from localStorage
  const [consultationBookings, setConsultationBookings] = useState<any[]>([]);
  
  useState(() => {
    const bookings = JSON.parse(localStorage.getItem('consultationBookings') || '[]');
    setConsultationBookings(bookings.filter((b: any) => b.profileId === profileId));
  });

  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentProfileId');
    queryClient.clear();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ['/api/profile', profileId],
    enabled: !!profileId,
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/matches/generate", {
        profileId: profile?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Matches Updated",
        description: "Your scholarship matches have been refreshed based on your updated profile.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
    },
    onError: (error) => {
      console.error("Match generation error:", error);
      toast({
        title: "Error",
        description: "Failed to update matches. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resume query
  const { data: resume, isLoading: isLoadingResume, refetch: refetchResume } = useQuery<GeneratedResume>({
    queryKey: ['/api/resume', profileId],
    enabled: !!profileId,
  });

  // Generate resume mutation
  const generateResumeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/resume/generate", {
        profileId: profile?.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Resume Generation Started",
        description: "Your resume is being generated. Please wait a moment and then refresh to see it.",
      });
      // Refetch resume after a delay to allow for processing
      setTimeout(() => {
        refetchResume();
      }, 3000);
    },
    onError: (error) => {
      console.error("Resume generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownloadResume = () => {
    if (profileId) {
      window.open(`/api/resume/${profileId}/download`, '_blank');
    }
  };

  const handleProfileUpdate = () => {
    setIsEditing(false);
    // Generate new matches when profile is updated
    if (profile?.id) {
      generateMatchesMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading your profile...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Create Your Profile</h2>
              <p className="text-slate-600 mb-6">
                You haven't created a profile yet. Let's get started to find your perfect scholarship matches!
              </p>
              <Button onClick={() => setIsEditing(true)} data-testid="button-create-profile">
                Create Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              {profile ? "Update Your Profile" : "Create Your Profile"}
            </h1>
            <p className="text-lg text-slate-600">
              Keep your information current to get the best scholarship matches
            </p>
          </div>
          <ProfileForm onComplete={handleProfileUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Profile</h1>
            <p className="text-lg text-slate-600">Manage your academic and personal information</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Button 
              variant="outline"
              onClick={() => generateMatchesMutation.mutate()}
              disabled={generateMatchesMutation.isPending}
              data-testid="button-refresh-matches"
              className="flex-1 md:flex-none"
            >
              {generateMatchesMutation.isPending ? "Updating..." : "Refresh Matches"}
            </Button>
            <Button 
              onClick={() => setIsEditing(true)} 
              data-testid="button-edit-profile"
              className="flex-1 md:flex-none"
            >
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-name">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-email">{profile?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Academic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Education Level</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-education-level">
                  {profile?.educationLevel?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Field of Study</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-field-of-study">{profile?.fieldOfStudy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">GPA</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-gpa">{profile?.gpa || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Graduation Year</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-800" data-testid="text-profile-graduation-year">{profile?.graduationYear}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Skills & Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Skills & Interests</label>
                <p className="text-slate-600 mt-1" data-testid="text-profile-skills">
                  {profile?.skills && profile.skills.length > 0 
                    ? (Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills)
                    : "No skills listed"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Extracurricular Activities</label>
                <p className="text-slate-600 mt-1" data-testid="text-profile-activities">
                  {profile?.activities || "No activities listed"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Financial Need</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-slate-500 font-semibold">₹</span>
                  <Badge 
                    variant="secondary" 
                    className={
                      profile?.financialNeed === 'critical' ? 'bg-red-100 text-red-800' :
                      profile?.financialNeed === 'high' ? 'bg-orange-100 text-orange-800' :
                      profile?.financialNeed === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }
                    data-testid="badge-financial-need"
                  >
                    {profile?.financialNeed ? profile.financialNeed.charAt(0).toUpperCase() + profile.financialNeed.slice(1) : "Not specified"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Location Preference</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-location">
                  {profile?.location?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Booked Consultations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Booked Consultations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {consultationBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No consultations booked yet.</p>
                  <Button onClick={() => navigate("/guidance")} className="bg-primary hover:bg-blue-700" data-testid="button-book-consultation">
                    Book a Consultation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultationBookings.map((booking: any) => (
                    <div key={booking.id} className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-slate-800">{booking.counselorName}</h4>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">Amount Paid: <span className="font-semibold">₹{booking.amount.toLocaleString("en-IN")}</span></p>
                        <p className="text-xs text-slate-500 mt-1">Booked: {new Date(booking.bookedAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <Badge className="bg-green-600 text-white">{booking.paymentStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600" data-testid="stat-profile-completeness">95%</div>
                  <p className="text-sm text-slate-600">Profile Complete</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600" data-testid="stat-last-updated">2</div>
                  <p className="text-sm text-slate-600">Days Since Update</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600" data-testid="stat-match-potential">High</div>
                  <p className="text-sm text-slate-600">Match Potential</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resume Builder */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Resume Builder</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Generate a professional resume using your profile details. Our AI-powered resume builder creates a tailored resume based on your education, skills, and experience.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => generateResumeMutation.mutate()}
                  disabled={generateResumeMutation.isPending}
                  className="bg-primary hover:bg-blue-700"
                  data-testid="button-generate-resume"
                >
                  {generateResumeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Resume
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => refetchResume()}
                  disabled={isLoadingResume}
                  data-testid="button-refresh-resume"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingResume ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Resume Preview */}
              {isLoadingResume ? (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-slate-600">Loading resume...</p>
                </div>
              ) : resume?.content ? (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <h3 className="text-lg font-bold text-slate-800 mb-4">Your Generated Resume</h3>
                      <div className="whitespace-pre-wrap text-slate-700" data-testid="text-resume-content">
                        {resume.content}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleDownloadResume}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-download-resume"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download as Word Document (.docx)
                  </Button>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600 mb-2">No resume generated yet</p>
                  <p className="text-sm text-slate-500">Click "Generate Resume" to create your professional resume based on your profile.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
