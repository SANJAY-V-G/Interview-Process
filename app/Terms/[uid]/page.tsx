'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation'; // Import useRouter and useParams from next/navigation
import { ChevronDown, ChevronRight, ExternalLink, Info, Lightbulb, Clock, BookOpen, CheckCircle, Pencil ,Eye,X} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EducationRequirements {
  cgpa: string;
  tenthMark: string;
  twelfthMark: string;
}

interface Question {
  type: string;
  count: number;
}

interface InterviewRound {
  title: string;
  duration: string;
  questions: Question[];
}

interface Resource {
  title: string;
  description: string;
  icon: string;
  link: string;
}

interface Role {
  title: string;
  description: string;
  salaryRange: string;
  educationRequirements: EducationRequirements;
  technicalSkills: string[];
  eligibleDepartments: string[];
  interviewRounds: InterviewRound[];
  resources: Resource[];
  contactEmail: string;
}

interface Company {
  name: string;
  type: string;
  description: string;
}

interface JobListing {
  company: Company;
  roles: Role[];
  uid: string;
}

const LoadingComponent = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-xl">Loading job details...</div>
  </div>
);

const ErrorComponent = ({ error }: { error: string }) => {
  const router = useRouter(); // Use Next.js router
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-xl text-red-500">{error}</div>
      <button 
        onClick={() => router.back()} // Use router.back() for navigation
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Go Back
      </button>
    </div>
  );
};

const NoDataComponent = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-xl">No job data available</div>
  </div>
);

const NoRoleComponent = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-xl">No role information available</div>
  </div>
);

const CompanyLogo = ({ logoUrl, companyName }: { logoUrl: string | null, companyName: string }) => {
  const [error, setError] = useState(false);

  if (!logoUrl || error) {
    return (
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-xs text-gray-500 font-medium">
          {companyName.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${companyName} logo`}
      className="w-16 h-16 rounded-lg object-contain border border-gray-200"
      onError={() => setError(true)}
    />
  );
};


const JobPortal = () => {
  const router = useRouter(); // Use Next.js router
  const params = useParams(); // Use Next.js useParams
  const uid = params?.uid as string; // Get uid from params
  const [jobData, setJobData] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [activeRound, setActiveRound] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [isOverallViewOpen, setIsOverallViewOpen] = useState(false);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/get-job/${uid}`);

        if (!response.ok) {
          throw new Error('Job not found');
        }
        const data = await response.json();
        setJobData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job data');
      } finally {
        setLoading(false);
      }
    };

    fetchJobData();
  }, [uid]);


  const handleRoundSelect = (index: number) => {
    if (activeRound === `round${index}`) {
      setActiveRound(null);
    } else {
      setActiveRound(`round${index}`);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/job-delete/${uid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      router.back(); // Use router.back() for navigation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  if (loading) return <LoadingComponent />;
  if (error) return <ErrorComponent error={error} />;
  if (!jobData) return <NoDataComponent />;
  if (!jobData.roles || jobData.roles.length === 0) return <NoRoleComponent />;

  const selectedRole = jobData.roles[selectedRoleIndex];
  if (!selectedRole) return <NoRoleComponent />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with Banner */}
      <header>
      
  

        {/* Company Info Bar */}
        <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 shadow-lg">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
        
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{jobData.company?.name?.split('(')[0]?.trim() || "Company"}</h1>
                  <p className="text-sky-100 mt-1">{jobData.company?.name?.split('(')[0]?.trim() || "Company"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/adminedit/${uid}`)} // Use router.push for navigation
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-sky-600 rounded-md hover:bg-sky-50 transition-colors shadow-md font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-md font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Company Overview */}
          <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold mb-4 text-sky-600 flex items-center">
              <div className="bg-sky-100 p-2 rounded-full mr-3">
                <Info className="w-5 h-5 text-sky-500" />
              </div>
              About {jobData.company?.name?.split('(')[0]?.trim() || "Company"}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {jobData.company?.description || "No company description available."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {jobData.company?.type && (
                <span className="px-4 py-1.5 bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 text-sm rounded-full font-medium border border-sky-200">
                  {jobData.company.type}
                </span>
              )}
            </div>
          </section>

          {/* Job Roles Selection */}
          {jobData.roles.length > 0 && (
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-sky-600 flex items-center">
                  <div className="bg-sky-100 p-2 rounded-full mr-3">
                    <BookOpen className="w-5 h-5 text-sky-500" />
                  </div>
                  Available Positions
                </h2>
                {jobData.roles.length > 1 && (
                  <div className="relative">
                    <button
                      className="flex items-center justify-between w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="font-medium">{selectedRole.title || "Select Role"}</span>
                      <ChevronDown
                        className={`w-4 h-4 ml-2 transition-transform text-sky-500 ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-full md:w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                        {jobData.roles.map((role, index) => (
                          <button
                            key={index}
                            className={`w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors ${
                              selectedRoleIndex === index
                                ? "bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 font-medium"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedRoleIndex(index)
                              setIsDropdownOpen(false)
                            }}
                          >
                            {role.title || `Role ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Job Details */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedRole.description || "No description available."}
                  </p>
                </div>

                {selectedRole.salaryRange && (
                  <div className="p-6 bg-gradient-to-r from-sky-50 to-sky-100 rounded-xl border border-sky-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-2 flex items-center text-sky-600">
                      <CheckCircle className="w-5 h-5 mr-2 text-sky-500" />
                      Salary Range
                    </h3>
                    <p className="text-gray-800 font-medium text-lg">{selectedRole.salaryRange}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Requirements Section */}
          {selectedRole.educationRequirements && (
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-sky-600 flex items-center">
                <div className="bg-sky-100 p-2 rounded-full mr-3">
                  <Lightbulb className="w-5 h-5 text-sky-500" />
                </div>
                Requirements
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Education Requirements */}
                <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-sky-600">Education</h3>
                  <div className="space-y-5">
                    {selectedRole.educationRequirements.cgpa !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Minimum CGPA</p>
                        <p className="text-xl font-medium text-gray-800 mt-1">
                          {selectedRole.educationRequirements.cgpa}
                        </p>
                      </div>
                    )}
                    {selectedRole.educationRequirements.twelfthMark !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">12th Grade Marks</p>
                        <p className="text-xl font-medium text-gray-800 mt-1">
                          {selectedRole.educationRequirements.twelfthMark}
                        </p>
                      </div>
                    )}
                    {selectedRole.educationRequirements.tenthMark !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">10th Grade Marks</p>
                        <p className="text-xl font-medium text-gray-800 mt-1">
                          {selectedRole.educationRequirements.tenthMark}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technical Skills */}
                {selectedRole.technicalSkills && selectedRole.technicalSkills.length > 0 && (
                  <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-sky-600">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.technicalSkills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border border-sky-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligible Departments */}
                {selectedRole.eligibleDepartments && selectedRole.eligibleDepartments.length > 0 && (
                  <div className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-sky-600">Eligible Departments</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.eligibleDepartments.map((dept, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Interview Process */}
          {selectedRole.interviewRounds && selectedRole.interviewRounds.length > 0 && (
  <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-xl font-bold text-sky-600 flex items-center">
        <div className="bg-sky-100 p-2 rounded-full mr-3">
          <Clock className="w-5 h-5 text-sky-500" />
        </div>
        Interview Process
      </h2>
      <button
        onClick={() => setIsOverallViewOpen(true)}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200 flex items-center"
      >
        <Eye className="w-4 h-4 mr-2" />
        Overall View
      </button>
    </div>

    {/* Popup for Overall View */}
    {isOverallViewOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Interview Process Overview</h3>
            <button
              onClick={() => setIsOverallViewOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Round</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question Types</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedRole.interviewRounds.map((round, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{round.title || `Round ${index + 1}`}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{round.duration || "Not specified"}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {round.questions && round.questions.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {round.questions.map((q, qIndex) => (
                            <li key={qIndex}>{q.count} {q.type} questions</li>
                          ))}
                        </ul>
                      ) : (
                        "No questions specified"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setIsOverallViewOpen(false)}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="relative pl-8 border-l-2 border-sky-200 space-y-10">
      {selectedRole.interviewRounds.map((round, index) => (
        <div key={index} className="relative">
          <button
            onClick={() => handleRoundSelect(index)}
            className={`flex items-start md:items-center mb-3 -ml-[25px] transition-all duration-200 ${
              activeRound === `round${index}`
                ? "text-sky-600 font-semibold"
                : "text-gray-700 hover:text-sky-500"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all duration-200 ${
                activeRound === `round${index}`
                  ? "bg-gradient-to-r from-sky-400 to-sky-500 text-white shadow-lg"
                  : "bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 hover:border-sky-300 text-gray-700"
              }`}
            >
              <span className="font-medium">{index + 1}</span>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-medium">{round.title || `Round ${index + 1}`}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                Duration:&nbsp;
                {round.duration || "Duration not specified"}
              </div>
            </div>
            <ChevronRight
              className={`ml-4 h-5 w-5 transition-transform ${
                activeRound === `round${index}` ? "transform rotate-90 text-sky-500" : "text-gray-400"
              }`}
            />
          </button>

          <AnimatePresence>
            {activeRound === `round${index}` && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pl-12 border-l border-dashed border-gray-300 ml-4 space-y-6">
                  {round.questions && round.questions.length > 0 && (
                    <div className="bg-gradient-to-r from-gray-50 to-white p-5 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-medium text-gray-800 mb-3">Question Types:</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                        {round.questions.map((q, qIndex) => (
                          <li key={qIndex} className="font-medium">
                            {q.count} {q.type} questions
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {round.questions && round.questions.length > 0 && (
                    <div className="bg-gradient-to-r from-sky-50 to-sky-100 rounded-xl p-6 border border-sky-200 shadow-sm">
                      <h4 className="font-semibold text-sky-600 mb-5 flex items-center">
                        <Info className="w-5 h-5 mr-2" />
                        Preparation Tips
                      </h4>
                      <div className="space-y-4">
                        {round.questions.map((q, qIndex) => (
                          <div
                            key={qIndex}
                            className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:border-sky-200 transition-colors"
                          >
                            <div className="flex items-start">
                              <div className="bg-sky-100 p-1.5 rounded-full mr-3 mt-1">
                                <CheckCircle className="w-4 h-4 text-sky-500" />
                              </div>
                              <div>
                                <p className="text-gray-800 font-medium">{q.type} Preparation</p>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                  For {q.count} {q.type.toLowerCase()} questions, focus on{" "}
                                  {q.type === "Coding"
                                    ? "practicing algorithms on platforms like LeetCode"
                                    : "solving aptitude problems from standard resources"}
                                  .
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  </section>
)}


          {/* Resources Section */}
          {selectedRole.resources && selectedRole.resources.length > 0 && (
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-6 text-sky-600 flex items-center">
                <div className="bg-sky-100 p-2 rounded-full mr-3">
                  <ExternalLink className="w-5 h-5 text-sky-500" />
                </div>
                Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {selectedRole.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all group"
                  >
                    <h3 className="font-medium text-sky-600 flex items-center group-hover:text-sky-700">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {resource.title || "Resource"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">{resource.description || "No description available"}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Contact Information */}
          {selectedRole.contactEmail && (
            <section className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-xl font-bold mb-4 text-sky-600 flex items-center">
                <div className="bg-sky-100 p-2 rounded-full mr-3">
                  <Info className="w-5 h-5 text-sky-500" />
                </div>
                Contact Information
              </h2>
              <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 inline-block">
                <span className="font-medium">Email:</span>
                <a
                  href={`mailto:${selectedRole.contactEmail}`}
                  className="text-sky-600 hover:text-sky-800 hover:underline"
                >
                  {selectedRole.contactEmail}
                </a>
              </div>
            </section>
          )}
        </div>
      </main>
      
    </div>
  );
};

export default JobPortal;