"use client"

import React from 'react'
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid'
import { fetchQuestionTypes, addQuestionType } from '../../services/questionTypes';

import { Edit2,  X, Plus, Trash2,  FileText, CheckCircle, ChevronDown, Code, Users, ExternalLink, BookOpen, Video, AlertCircle } from "lucide-react"

declare namespace JSX {
  interface Element {}
}

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", 
  "Python", "Java", "C++", "C#", "SQL", "NoSQL", "Docker", 
  "Kubernetes", "AWS", "Azure", "Git", "CI/CD", "REST API", 
  "GraphQL", "Webpack", "Jest", "Cypress", "Django", "Flask",
  "Spring Boot", "Microservices", "Machine Learning", "Data Structures",
  "Algorithms", "System Design", "OOP", "Functional Programming"
]

const DEPARTMENT_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Electronics and Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Aerospace Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Cyber Security"
]



const RESOURCE_ICONS = [
  { value: "book", label: "Book", icon: <BookOpen className="h-5 w-5" /> },
  { value: "code", label: "Code", icon: <FileText className="h-5 w-5" /> },
  { value: "video", label: "Video", icon: <Video className="h-5 w-5" /> },
]

type JobRole = {
  id: string
  title: string
  description: string
  salaryRange: String
  pdfFile?: File | null
  pdfFileName?: string
  educationRequirements: {
    cgpa: string
    twelfthMark: string
    tenthMark: string
  }
  technicalSkills: string[]
  eligibleDepartments: string[]
  interviewRounds: InterviewRound[]
  resources: Resource[]
  contactEmail: string
}

type InterviewRound = {
  id: string
  title: string
  duration: string
  questions: QuestionType[]
}

type QuestionType = {
  type: string
  count: string  // Changed from number to string
  icon: JSX.Element
}

type Resource = {
  id: string
  title: string
  description: string
  icon: string
  link: string
}

// Helper function to get icon for question type


interface IncomingData {
  roles: JobRole[];
}

export default function Adminedit() {

  const router = useRouter();
  const params = useParams();
  const uid = params?.uid as string;

  const [activeTab, setActiveTab] = useState<string>('job-roles');
  const [questionTypes, setQuestionTypes] = useState<{value: string, label?: string, default_icon?: string}[]>([]);  const activeTabRef = useRef(activeTab);

  // Company state
  const [companyData, setCompanyData] = useState({
    description: "",
    name: "",
    type: ""
  });
 

 

  // Job roles state
  
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editedJobRole, setEditedJobRole] = useState<JobRole | null>(null);
  const [jobErrors, setJobErrors] = useState<{ [key: string]: string }>({});
  const [openDropdown, setOpenDropdown] = useState<"skills" | "departments" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Get tabs from DOM instead of state
      const tabElements = Array.from(document.querySelectorAll('[role="tab"]'));
      const currentIndex = tabElements.findIndex(tab => 
        tab.getAttribute('aria-selected') === 'true'
      );

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + tabElements.length) % tabElements.length;
        (tabElements[prevIndex] as HTMLElement).click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % tabElements.length;
        (tabElements[nextIndex] as HTMLElement).click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); 

  useEffect(() => {
    const loadQuestionTypes = async () => {
      const types = await fetchQuestionTypes();
      setQuestionTypes(types);
    };
    loadQuestionTypes();
  }, []);


  useEffect(() => {
    if (!uid) return; // Don't fetch if uid is not available yet
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://backend-nox2.onrender.com/get-job-data/${uid}`);
        console.log("Response admin edit:", response); // Log the response object
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.company) {
          setCompanyData({
            name: data.company.name || "",
            type: data.company.type || "",
            description: data.company.description || ""
          });
        }
        const transformedJobRoles = (data: IncomingData): JobRole[] => {
          if (!data || !Array.isArray(data.roles)) {
            console.warn("Invalid or missing roles data:", data);
            return [];
          }
        
          return data.roles.map((role) => ({
            ...role,
            id: uuidv4(),
            pdfFile: null,
            pdfFileName: "",
            interviewRounds: Array.isArray(role.interviewRounds)
              ? role.interviewRounds.map((round) => ({
                  ...round,
                  id: `round-${uuidv4()}`,
                  questions: Array.isArray(round.questions)
                    ? round.questions.map((question) => ({
                        ...question,
                        count: typeof question.count !== "undefined" && question.count !== null
                          ? question.count.toString()
                          : "0",
                        icon: getIconForType(question.type),
                      }))
                    : [],
                }))
              : [],
            resources: Array.isArray(role.resources)
              ? role.resources.map((resource) => ({
                  ...resource,
                  id: uuidv4(),
                }))
              : [],
          }));
        };
       
    
        setJobRoles(transformedJobRoles(data));
        const transformed = transformedJobRoles(data);
setJobRoles(transformed); // Assuming this is JobRole[]

if (transformed.length > 0) {
  setSelectedJobId(transformed[0].id); // ✅ Set the ID of the first job
}
        setIsLoading(false);
      } catch (error) {
        console.error("Fetch error:", error)
        setError("Failed to load data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [uid]); // Add uid as dependency

  const selectedJob = jobRoles.find(job => job.id === selectedJobId) || jobRoles[0];

  

  const addNewQuestionType = async () => {
    const trimmedType = newQuestionType.trim();
    
    if (!trimmedType) return;
  
    try {
      // Check if type already exists
      if (questionTypes.some(q => q.value.toLowerCase() === trimmedType.toLowerCase())) {
        alert('This question type already exists');
        return;
      }
  
      // Add to backend
      const addedType = await addQuestionType(trimmedType);
      
      // Optimistically update local state
      setQuestionTypes(prev => [
        ...prev,
        {
          value: addedType.type.value,
          label: addedType.type.label,
          default_icon: addedType.type.default_icon
        }
      ]);
      
      setNewQuestionType('');
    } catch (error) {
      console.error('Failed to add question type:', error);
      alert('Failed to add question type. Please try again.');
    }
  };
  
  // Update getIconForType to handle dynamic icons
  const getIconForType = (type: string) => {
    const questionType = questionTypes.find(qt => qt.value === type);
    if (!questionType) return <FileText className="h-5 w-5" />;
    
    switch(questionType.default_icon) {
      case 'Code':
        return <Code className="h-5 w-5" />;
      case 'Users':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

    

  // Job role functions
 
  const startEditingJob = () => {
    setEditedJobRole({ ...selectedJob });
    setIsEditingJob(true);
    setJobErrors({});
  };

  const cancelEditingJob = () => {
    setIsEditingJob(false);
    setEditedJobRole(null);
    setJobErrors({});
  };

  const updateEducationField = (field: keyof JobRole['educationRequirements'], value: string) => {
    if (editedJobRole) {
      setEditedJobRole({
        ...editedJobRole,
        educationRequirements: {
          ...editedJobRole.educationRequirements,
          [field]: value
        }
      });

      if (jobErrors[field]) {
        setJobErrors({
          ...jobErrors,
          [field]: ""
        });
      }
    }
  };

  const toggleDropdown = (type: "skills" | "departments") => {
    setOpenDropdown(openDropdown === type ? null : type);
    setSearchTerm("");
  };

  const addItem = (type: "skills" | "departments", item: string) => {
    if (!editedJobRole) return;
    
    if (!item.trim()) {
      setJobErrors({ ...jobErrors, [type]: `Please select a ${type === "skills" ? "skill" : "department"}` });
      return;
    }

    const currentItems = type === "skills" 
      ? editedJobRole.technicalSkills 
      : editedJobRole.eligibleDepartments;
      
    if (currentItems.includes(item)) return;

    const updatedItems = [...currentItems, item];
    
    setEditedJobRole({
      ...editedJobRole,
      [type === "skills" ? "technicalSkills" : "eligibleDepartments"]: updatedItems
    });
    
    setOpenDropdown(null);
    setSearchTerm("");
    
    if (jobErrors[type]) {
      const newErrors = { ...jobErrors };
      delete newErrors[type];
      setJobErrors(newErrors);
    }
  };

  const removeItem = (type: "skills" | "departments", index: number) => {
    if (!editedJobRole) return;
    
    const currentItems = type === "skills" 
      ? [...editedJobRole.technicalSkills] 
      : [...editedJobRole.eligibleDepartments];
    
    currentItems.splice(index, 1);
    
    setEditedJobRole({
      ...editedJobRole,
      [type === "skills" ? "technicalSkills" : "eligibleDepartments"]: currentItems
    });
  };

  const updateRoundField = (roundId: string, field: string, value: string) => {
    if (!editedJobRole) return;
    
    const updatedRounds = editedJobRole.interviewRounds.map(round => 
      round.id === roundId ? { ...round, [field]: value } : round
    );
    
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: updatedRounds
    });
  };

  const updateQuestion = (roundId: string, questionIndex: number, field: string, value: string) => {
    if (!editedJobRole) return;
    
    const updatedRounds = editedJobRole.interviewRounds.map(round => {
      if (round.id === roundId) {
        const updatedQuestions = [...round.questions];
        
        if (field === "type") {
          const questionType = questionTypes.find(type => type.value === value);
          if (questionType) {
            updatedQuestions[questionIndex] = {
              ...updatedQuestions[questionIndex],
              type: value,
              icon: questionType 
            ? questionType.default_icon === "Code" 
              ? <Code className="h-5 w-5" />
              : questionType.default_icon === "Users"
                ? <Users className="h-5 w-5" />
                : <FileText className="h-5 w-5" />
            : <FileText className="h-5 w-5" />
            };
          }
        } else if (field === "count") {
          updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            count: value
          };
        }
        
        return {
          ...round,
          questions: updatedQuestions
        };
      }
      return round;
    });
    
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: updatedRounds
    });
  };

  const addQuestion = (roundId: string) => {
    if (!editedJobRole || questionTypes.length === 0) return;
  
    // Get the first question type from your backend-synced list as default
    const defaultType = questionTypes[0]; 
  
    const updatedRounds = editedJobRole.interviewRounds.map(round => {
      if (round.id === roundId) {
        return {
          ...round,
          questions: [
            ...round.questions,
            {
              type: defaultType.value,
              count: "0", // String type to match your backend
              icon: defaultType.default_icon === "Code" 
                ? <Code className="h-5 w-5" />
                : defaultType.default_icon === "Users"
                  ? <Users className="h-5 w-5" />
                  : <FileText className="h-5 w-5" />
            }
          ]
        };
      }
      return round;
    });
  
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: updatedRounds
    });
  };

  const removeQuestion = (roundId: string, questionIndex: number) => {
    if (!editedJobRole) return;
    
    const updatedRounds = editedJobRole.interviewRounds.map(round => {
      if (round.id === roundId) {
        const updatedQuestions = [...round.questions];
        updatedQuestions.splice(questionIndex, 1);
        return {
          ...round,
          questions: updatedQuestions
        };
      }
      return round;
    });
    
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: updatedRounds
    });
  };

  const addRound = () => {
    if (!editedJobRole) return;
    
    const newRound: InterviewRound = {
      id: `round-${uuidv4()}`,
      title: `Round ${editedJobRole.interviewRounds.length + 1}`,
      duration: "60 minutes",
      questions: [
        {
          type: "Aptitude",
          count: "5", // Changed to string
          icon: <FileText className="h-5 w-5" />
        }
      ]
    };
    
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: [...editedJobRole.interviewRounds, newRound]
    });
    setExpandedRound(newRound.id);
  };

  const removeRound = (roundId: string) => {
    if (!editedJobRole) return;
    
    setEditedJobRole({
      ...editedJobRole,
      interviewRounds: editedJobRole.interviewRounds.filter(round => round.id !== roundId)
    });
    
    if (expandedRound === roundId) {
      setExpandedRound(null);
    }
  };

  const updateResourceField = (resourceId: string, field: string, value: string) => {
    if (!editedJobRole) return;
    
    const updatedResources = editedJobRole.resources.map(resource => 
      resource.id === resourceId ? { ...resource, [field]: value } : resource
    );
    
    setEditedJobRole({
      ...editedJobRole,
      resources: updatedResources
    });
  };

  const addResource = () => {
    if (!editedJobRole) return;
    
    const maxId = Math.max(...editedJobRole.resources.map(r => Number(r.id)), 0);
    const newId = String(isFinite(maxId) ? maxId + 1 : 1);
    const defaultType = RESOURCE_ICONS[0];
    
    setEditedJobRole({
      ...editedJobRole,
      resources: [
        ...editedJobRole.resources,
        {
          id: newId,
          title: "New Resource",
          description: "Description for the new resource",
          icon: defaultType.value,
          link: "#"
        }
      ]
    });
  };

  const removeResource = (resourceId: string) => {
    if (!editedJobRole) return;
    
    setEditedJobRole({
      ...editedJobRole,
      resources: editedJobRole.resources.filter(resource => resource.id !== resourceId)
    });
  };

const saveJobChanges = () => {
  if (!editedJobRole) return;

  const updatedJobRoles = jobRoles.map(job =>
    job.id === editedJobRole.id ? editedJobRole : job
  );

  setJobRoles(updatedJobRoles);
  setIsEditingJob(false);
  setEditedJobRole(null);

  // Show the submit button after successful save
  setShowSubmitButton(true);

  // Optional: show success message too
  setShowSuccessMessage(true);
  setTimeout(() => setShowSuccessMessage(false), 3000);
};
 

const addNewJobRole = () => {
  const newId = uuidv4();
  const defaultType = questionTypes[0]; 
  const defaultResourceType = RESOURCE_ICONS[0];
  
  // Generate a unique default name
  let defaultName = "New Job Role";
  let counter = 1;
  while (jobRoles.some(job => job.title === defaultName)) {
    defaultName = `New Job Role ${counter}`;
    counter++;
  }

  const newJobRole: JobRole = {
    id: newId,
    title: defaultName,  // Use the unique default name
    description: "Description for the new job role",
    salaryRange: "N/A",
    pdfFile: null,
    pdfFileName: "",
    educationRequirements: {
      cgpa: "N/A",
      twelfthMark: "N/A",
      tenthMark: "N/A"
    },
    technicalSkills: ["N/A"],
    eligibleDepartments: ["N/A"],
    interviewRounds: [
      {
        id: `round-${uuidv4()}`,
        title: "Initial Screening",
        duration: "60 minutes",
        questions: [
          {
            type: defaultType.value,
            count: "N/A",
            icon: defaultType.default_icon === "Code" 
              ? <Code className="h-5 w-5" />
              : defaultType.default_icon === "Users"
                ? <Users className="h-5 w-5" />
                : <FileText className="h-5 w-5" />
          }
        ]
      }
    ],
    resources: [
      {
        id: uuidv4(),
        title: " Resource",
        description: "Description resource",
        icon: defaultResourceType.value,
        link: "#"
      }
    ],
    contactEmail: "N/A"
  };
  
  setJobRoles([...jobRoles, newJobRole]);
  setSelectedJobId(newId);
  setEditedJobRole({ ...newJobRole });
  setIsEditingJob(true);
};

const updateJobField = (field: string, value: string) => {
  if (editedJobRole) {
    // If updating the title, check for duplicates
    if (field === "title") {
      const isDuplicate = jobRoles.some(
        job => job.title.toLowerCase() === value.toLowerCase() && 
               job.id !== editedJobRole.id
      );
      
      if (isDuplicate) {
        setJobErrors({
          ...jobErrors,
          title: "A job role with this name already exists"
        });
        return;
      }
    }

    setEditedJobRole({
      ...editedJobRole,
      [field]: value
    });

    if (jobErrors[field]) {
      setJobErrors({
        ...jobErrors,
        [field]: ""
      });
    }
  }
};

  const deleteJobRole = (id: string) => {
    if (jobRoles.length <= 1) {
      setJobErrors({
        ...jobErrors,
        general: "You must have at least one job role"
      });
      return;
    }
    
    setJobRoles(jobRoles.filter(job => job.id !== id));
    
    if (selectedJobId === id) {
      setSelectedJobId(jobRoles[0].id);
    }
    
    if (isEditingJob && editedJobRole?.id === id) {
      cancelEditingJob();
    }
  };

  const filteredItems = (type: "skills" | "departments") => {
    const options = type === "skills" ? SKILL_OPTIONS : DEPARTMENT_OPTIONS;
    if (!editedJobRole) return [];
    
    const currentItems = type === "skills" 
      ? editedJobRole.technicalSkills 
      : editedJobRole.eligibleDepartments;
      
    return options.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !currentItems.includes(item)
    );
  };

  const addNewSkill = () => {
    if (newSkill.trim() && !SKILL_OPTIONS.includes(newSkill)) {
      SKILL_OPTIONS.push(newSkill);
      setNewSkill("");
    }
  };

  const addNewDepartment = () => {
    if (newDepartment.trim() && !DEPARTMENT_OPTIONS.includes(newDepartment)) {
      DEPARTMENT_OPTIONS.push(newDepartment);
      setNewDepartment("");
    }
  };

  const handleFinalSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate all question types first
      const invalidQuestionTypes: string[] = [];
      
      jobRoles.forEach(role => {
        role.interviewRounds.forEach(round => {
          round.questions.forEach(question => {
            if (!questionTypes.some(qt => qt.value === question.type)) {
              if (!invalidQuestionTypes.includes(question.type)) {
                invalidQuestionTypes.push(question.type);
              }
            }
          });
        });
      });
  
      if (invalidQuestionTypes.length > 0) {
        setIsSubmitting(false);
        alert(
          `The following question types are not recognized and need to be added first:\n\n${invalidQuestionTypes.join(
            ", "
          )}\n\nPlease add them in the Interview Process tab.`
        );
        setActiveTab('interview');
        return;
      }
  
      // Validate other required fields
      if (!companyData.name.trim()) {
        setIsSubmitting(false);
        alert("Company name is required");
        setActiveTab('job-roles');
        return;
      }
  
      // Prepare submission data
      const submissionData = {
        company: {
          name: companyData.name,
          type: companyData.type,
          description: companyData.description
        },
        roles: jobRoles.map(role => ({
          title: role.title,
          description: role.description,
          salaryRange: role.salaryRange,
          educationRequirements: role.educationRequirements,
          technicalSkills: role.technicalSkills,
          eligibleDepartments: role.eligibleDepartments,
          interviewRounds: role.interviewRounds.map(round => ({
            title: round.title,
            duration: round.duration,
            questions: round.questions.map(question => ({
              type: question.type,
              count: question.count === "N/A" ? "0" : question.count // Handle "N/A" case
            }))
          })),
          resources: role.resources.map(res => ({
            title: res.title,
            description: res.description,
            icon: res.icon,
            link: res.link
          })),
          contactEmail: role.contactEmail
        }))
      };
  
      // Submit to backend
      const response = await fetch(`https://backend-nox2.onrender.com/update-job/${uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: submissionData }) // Wrapped in 'data' to match your backend
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit data");
      }
  
      const result = await response.json();
      
      // Show success and redirect
      alert("Data submitted successfully!");
      router.back();
      
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        `Failed to submit data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  const tabs = [
      
      {
    id: 'job-roles',
    title: 'Job Roles',
    content: (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Job Role Management</h1>
          <button
            onClick={addNewJobRole}
            className="flex items-center gap-1 bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Job Role
          </button>
        </div>
  
        {/* Job Role Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Job Role</h2>
            {selectedJob && !isEditingJob && (
              <div className="flex items-center gap-2">
                <button
                  onClick={startEditingJob}
                  className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => deleteJobRole(selectedJobId)}
                  className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-gray-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
  
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isEditingJob}
          >
            {jobRoles.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
  
        {isEditingJob && editedJobRole ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Job Role</h2>
              <div className="flex items-center gap-2">
              
              </div>
            </div>
  
            {jobErrors.general && (
              <p className="text-red-600 text-sm mb-4">{jobErrors.general}</p>
            )}
  
            <div className="space-y-6">
              {/* Job Description Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Job Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Job Title 
                    </label>
                    <input
                      value={editedJobRole.title}
                      onChange={(e) => updateJobField("title", e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors.title ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {jobErrors.title && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors.title}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Salary in LPA
                    </label> 
                    <input
                      value={editedJobRole.salaryRange.toString()}
                      onChange={(e) => updateJobField("salaryRange", e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors.salaryRange ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="e.g. 10"
                    />
                    {jobErrors.salaryRange && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors.salaryRange}</p>
                    )}
                  </div>
                </div>
  
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">
                    Job Description 
                  </label>
                  <textarea
                    value={editedJobRole.description}
                    onChange={(e) => updateJobField("description", e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      jobErrors.description ? "border-red-600" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px]`}
                  />
                  {jobErrors.description && (
                    <p className="text-red-600 text-sm mt-1">{jobErrors.description}</p>
                  )}
                </div>
                
              </section>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* View Mode */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedJob?.title}</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {selectedJob?.salaryRange}
                </span>
              </div>
  
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <p className="text-gray-700">{selectedJob?.description}</p>
                  
                  {selectedJob?.pdfFileName && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Job Description PDF:</span>
                        <span className="text-sm">{selectedJob?.pdfFileName}</span>
                        <a 
                          href={selectedJob?.pdfFile ? URL.createObjectURL(selectedJob?.pdfFile) : "#"}
                          download={selectedJob?.pdfFileName}
                          className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
          <div className="flex justify-between mt-6">
  
              <button
                onClick={() => setActiveTab('education-requirements')}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
      
    )
  },
  {
    id: 'education-requirements',
    title: 'Education Requirements',
    content: (
      <div className="space-y-6">
        {isEditingJob && editedJobRole ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Edit Education Requirements</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditingJob}
                  className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                
              </div>
            </div>
  
            <div className="space-y-6">
              {/* Education Requirements Section */}
              <section>
                <h3 className="text-lg font-semibold mb-3">Education Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum CGPA 
  
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={editedJobRole.educationRequirements.cgpa}
                      onChange={(e) => updateEducationField('cgpa', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors.cgpa ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="e.g. 8.0"
                    />
                    {jobErrors.cgpa && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors.cgpa}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      12th Marks (%) 
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedJobRole.educationRequirements.twelfthMark}
                      onChange={(e) => updateEducationField('twelfthMark', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors.twelfthMark ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="e.g. 85"
                    />
                    {jobErrors.twelfthMark && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors.twelfthMark}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      10th Marks (%) 
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedJobRole.educationRequirements.tenthMark}
                      onChange={(e) => updateEducationField('tenthMark', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors.tenthMark ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      placeholder="e.g. 90"
                    />
                    {jobErrors.tenthMark && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors.tenthMark}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* View Mode */}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Education Requirements</h2>
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">For {selectedJob?.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Minimum CGPA</p>
                      <p className="text-lg font-medium">{selectedJob?.educationRequirements.cgpa}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">12th Marks</p>
                      <p className="text-lg font-medium">{selectedJob?.educationRequirements.twelfthMark}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">10th Marks</p>
                      <p className="text-lg font-medium">{selectedJob?.educationRequirements.tenthMark}%</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
          
        )}
         <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveTab('job-roles')}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
    
    )
  },
      {
        id: 'skills',
        title: 'Skills',
        content: (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Technical Skills</h2>
            {/* ... technical skills content ... */}
            <section className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold mb-4">Technical Skills</h2>
    {jobErrors.skills && <p className="text-red-600 text-sm mb-2">{jobErrors.skills}</p>}
  
    {/* Skills List */}
    <ul className="space-y-2 mb-4">
      {editedJobRole?.technicalSkills.map((skill, index) => (
        <li key={index} className="flex items-center justify-between">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>{skill}</span>
          </div>
          <button
            onClick={() => removeItem("skills", index)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </button>
        </li>
      ))}
    </ul>
  
    {/* Skills Dropdown */}
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleDropdown("skills")}
        className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span>Select technical skills</span>
        <ChevronDown className={`h-4 w-4 transform ${openDropdown === "skills" ? 'rotate-180' : ''}`} />
      </button>
  
      {openDropdown === "skills" && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-3 py-2 sticky top-0 bg-white">
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {filteredItems("skills").length > 0 ? (
            filteredItems("skills").map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addItem("skills", skill)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {skill}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No skills found</div>
          )}
        </div>
      )}
    </div>
  
    {/* Add New Skill */}
    <div className="mt-4">
      <input
        type="text"
        value={newSkill}
        onChange={(e) => setNewSkill(e.target.value)}
        placeholder="Enter new skill"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={addNewSkill}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add New Skill
      </button>
    </div>
  </section>
  <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveTab('education-requirements')}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </section>
        )
      },
      {
        id: 'departments',
        title: 'Departments',
        content: (
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Eligible Departments</h2>
            {/* ... departments content ... */}
            <section className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold mb-4">Eligible Departments</h2>
    {jobErrors.departments && <p className="text-red-600 text-sm mb-2">{jobErrors.departments}</p>}
  
    {/* Departments List */}
    <ul className="space-y-2 mb-4">
      {editedJobRole?.eligibleDepartments.map((dept, index) => (
        <li key={index} className="flex items-center justify-between">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>{dept}</span>
          </div>
          <button
            onClick={() => removeItem("departments", index)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </button>
        </li>
      ))}
    </ul>
  
    {/* Departments Dropdown */}
    <div className="relative">
      <button
        type="button"
        onClick={() => toggleDropdown("departments")}
        className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <span>Select eligible departments</span>
        <ChevronDown className={`h-4 w-4 transform ${openDropdown === "departments" ? 'rotate-180' : ''}`} />
      </button>
  
      {openDropdown === "departments" && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div className="px-3 py-2 sticky top-0 bg-white">
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {filteredItems("departments").length > 0 ? (
            filteredItems("departments").map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => addItem("departments", dept)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {dept}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500">No departments found</div>
          )}
        </div>
      )}
    </div>
  
    {/* Add New Department */}
    <div className="mt-4">
      <input
        type="text"
        value={newDepartment}
        onChange={(e) => setNewDepartment(e.target.value)}
        placeholder="Enter new department"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={addNewDepartment}
        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add New Department
      </button>
    </div>
  </section>
  <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveTab('skills')}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setActiveTab('interview')}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
          </section>
        )
      },
      {
        id: 'interview',
        title: 'Interview Process',
        content: (
          <section className="bg-white rounded-lg shadow-md p-6">
            
            {/* ... interview rounds content ... */}
            <section className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Interview Process</h2>
      <button
        onClick={addRound}
        className="flex items-center gap-1 bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Round
      </button>
    </div>
  
    <div className="w-full space-y-2">
      {editedJobRole?.interviewRounds.map((round,index) => (
        <div key={round.id} className="border rounded-lg overflow-hidden">
          <button
            className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors text-left"
            onClick={() => setExpandedRound(expandedRound === round.id ? null : round.id)}
          >
            <div className="flex items-center">
              <div className="font-semibold">
                Round {index+1}: {round.title}
              </div>
              <div className="ml-4 flex items-center text-gray-500 text-sm">
                <span className="font-medium">Duration:</span>
                <span className="ml-1">{round.duration}</span>
              </div>
            </div>
  
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => removeRound(round.id)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </button>
              <svg
                className={`h-5 w-5 text-gray-500 transform transition-transform ${
                  expandedRound === round.id ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
  
          {expandedRound === round.id && (
            <div className="p-4 border-t">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Round Title
                      <span className="text-red-600 ml-1"></span>
                    </label>
                    <input
                      value={round.title}
                      onChange={(e) => updateRoundField(round.id, "title", e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors[`round-${round.id}-title`] ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {jobErrors[`round-${round.id}-title`] && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors[`round-${round.id}-title`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Duration
                      <span className="text-red-600 ml-1"></span>
                    </label>
                    <input
                      value={round.duration}
                      onChange={(e) => updateRoundField(round.id, "duration", e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        jobErrors[`round-${round.id}-duration`] ? "border-red-600" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    {jobErrors[`round-${round.id}-duration`] && (
                      <p className="text-red-600 text-sm mt-1">{jobErrors[`round-${round.id}-duration`]}</p>
                    )}
                  </div>
                </div>
  
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium">
                      Question Types
                      <span className="text-red-600 ml-1"></span>
                    </label>
                    <button
                      onClick={() => addQuestion(round.id)}
                      className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Add Question Type
                    </button>
                  </div>
  
                  {jobErrors[`round-${round.id}-questions`] && (
                    <div className="flex items-center p-3 text-sm text-red-600 bg-red-50 rounded-md">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <span>{jobErrors[`round-${round.id}-questions`]}</span>
                    </div>
                  )}
  
  
                  {round.questions.map((question, index) => (
                  
                    <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                     {/* In your interview rounds section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-grow">
  <div>
    <label className="block text-xs font-medium mb-1">Type</label>
    <select
      value={question.type}
      onChange={(e) => updateQuestion(round.id, index, "type", e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
    >
      {questionTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.label || type.value}
        </option>
      ))}
    </select>
  </div>
  <div className="mt-4">
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={newQuestionType}
        onChange={(e) => setNewQuestionType(e.target.value)}
        placeholder="Enter new question type"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
      />
      <button
        onClick={addNewQuestionType}
        disabled={!newQuestionType.trim()}
        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Number of Questions
                            <span className="text-red-600 ml-1"></span>
                          </label>
                          <input
                            value={question.count}
                            onChange={(e) => updateQuestion(round.id, index, "count", e.target.value)}
                            className={`w-full px-3 py-2 border ${
                              jobErrors[`round-${round.id}-question-${index}-count`] ? "border-red-600" : "border-gray-300"
                            } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm`}
                          />
                          {jobErrors[`round-${round.id}-question-${index}-count`] && (
                            <p className="text-red-600 text-xs mt-1">
                              {jobErrors[`round-${round.id}-question-${index}-count`]}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeQuestion(round.id, index)}
                        className="p-1.5 mt-6 text-red-600 hover:text-red-800 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  
    {editedJobRole?.interviewRounds.length === 0 && (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No interview rounds added yet.</p>
      </div>
    )}
  </section>
  <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveTab('departments')}
                className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setActiveTab('resources')}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </div>
  
          </section>
        )
      },
      {
        id: 'resources',
        title: 'Resources',
        content: (
          <section className="bg-white rounded-lg shadow-md p-6">
          
            {/* ... resources content ... */}
            <section className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Additional Resources</h2>
      <button
        onClick={addResource}
        className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-1 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Resource
      </button>
    </div>
  
    <div className="grid gap-4 md:grid-cols-2">
      {editedJobRole?.resources.map((resource) => (
        <div key={resource.id} className="relative bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <button
            onClick={() => removeResource(resource.id)}
            className="absolute top-2 right-2 h-8 w-8 p-0 text-red-600 hover:text-red-800 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </button>
  
          <div className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Resource Title
                <span className="text-red-600 ml-1"></span>
              </label>
              <input
                value={resource.title}
                onChange={(e) => updateResourceField(resource.id, "title", e.target.value)}
                className={`w-full px-3 py-2 border ${
                  jobErrors[`resource-${resource.id}-title`] ? "border-red-600" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              {jobErrors[`resource-${resource.id}-title`] && (
                <p className="text-red-600 text-sm mt-1">{jobErrors[`resource-${resource.id}-title`]}</p>
              )}
            </div>
  
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
                <span className="text-red-600 ml-1"></span>
              </label>
              <textarea
                value={resource.description}
                onChange={(e) => updateResourceField(resource.id, "description", e.target.value)}
                className={`w-full px-3 py-2 border ${
                  jobErrors[`resource-${resource.id}-description`] ? "border-red-600" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                rows={3}
              />
              {jobErrors[`resource-${resource.id}-description`] && (
                <p className="text-red-600 text-sm mt-1">{jobErrors[`resource-${resource.id}-description`]}</p>
              )}
            </div>
  
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Icon Type</label>
                <select
                  value={resource.icon}
                  onChange={(e) => updateResourceField(resource.id, "icon", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {RESOURCE_ICONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">
                  Link URL
                  <span className="text-red-600 ml-1"></span>
                </label>
                <input
                  value={resource.link}
                  onChange={(e) => updateResourceField(resource.id, "link", e.target.value)}
                  className={`w-full px-3 py-2 border ${
                    jobErrors[`resource-${resource.id}-link`] ? "border-red-600" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  placeholder="e.g. https://example.com"
                />
                {jobErrors[`resource-${resource.id}-link`] && (
                  <p className="text-red-600 text-sm mt-1">{jobErrors[`resource-${resource.id}-link`]}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  
    <div className="border-t pt-4 mt-4">
      <label className="block text-sm font-medium mb-1">
        Contact Email
        <span className="text-red-600 ml-1"></span>
      </label>
      <input
  value={editedJobRole?.contactEmail || ''}
  onChange={(e) => updateJobField("contactEmail", e.target.value)}
  className={`w-full px-3 py-2 border ${
    jobErrors.contactEmail ? "border-red-600" : "border-gray-300"
  } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500`}
  placeholder="e.g. contact@company.com"
/>
      {jobErrors.contactEmail && <p className="text-red-600 text-sm mt-1">{jobErrors.contactEmail}</p>}
    </div>
    
  </section>
  <div className="flex justify-between mt-6">
  <button
    onClick={() => setActiveTab('interview')}
    className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
  >
    Back
  </button>
  <button
    onClick={() => {
      saveJobChanges();
      setShowSubmitButton(true); // show Submit button
    
    }}
    className="bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
  >
    Save
  </button>
</div>

{showSubmitButton && (
  <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-sm">
    <div className="flex items-center gap-2">
      <button
        onClick={handleFinalSubmission}
        disabled={isSubmitting}
        className={`bg-green-500 text-white font-semibold text-base py-3 px-6 rounded-xl transition-colors ${
          isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </span>
        ) : "Submit"}
      </button>
    </div>
  </div>
)}


          </section>
          
        )
      }
    ];
    
    
        return (
  <main className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="pb-16">
        {/* Tab Navigation */}
        <div 
          className="flex border-b border-gray-200 mb-6"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.title}
            </button>
          ))}
        </div>
    
        {/* Tab Content */}
        <div 
          className="space-y-8"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    
      {/* Toggleable Submit Button Section */}
      {showSubmitButton && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md border border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFinalSubmission}
              disabled={isSubmitting}
              className={`bg-green-500 text-white font-semibold text-base py-3 px-6 rounded-xl transition-colors ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  </main>
)
  };