'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import { Search, Briefcase, Download, Filter } from 'lucide-react';

interface JobListing {
  uid: string;
  companyName: string;
  description: string;
  companyType: string;
  roles: string;
  salary: number;
}

const JobListUser = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedCompanyType, setSelectedCompanyType] = useState('All Companies');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('All Salaries');
  const [selectedCompany, setSelectedCompany] = useState<string>('All Companies');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompanyPopup, setShowCompanyPopup] = useState(false);
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('All');

  // Define salary ranges
  const salaryRanges = [
    { label: 'All Salaries', value: 'All Salaries' },
    { label: 'Less than 10 LPA', value: '0-10' },
    { label: '10-20 LPA', value: '10-20' },
    { label: '20-30 LPA', value: '20-30' },
    { label: '30-40 LPA', value: '30-40' },
    { label: '40-50 LPA', value: '40-50' },
    { label: '50-100 LPA', value: '50-100' },
  ];

  useEffect(() => {
    const fetchJobListings = async () => {
      try {
        const response = await fetch('http://localhost:8000/get-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setJobListings(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchJobListings();
  }, []);

  const allRoles = useMemo(() => {
    const roles = new Set<string>();
    jobListings.forEach(job => {
      if (job.roles) {
        roles.add(job.roles);
      }
    });
    return Array.from(roles).sort();
  }, [jobListings]);

  const allCompanyTypes = useMemo(() => {
    const types = new Set<string>();
    jobListings.forEach(job => {
      if (job.companyType) {
        types.add(job.companyType);
      }
    });
    return Array.from(types).sort();
  }, [jobListings]);

  const allCompanies = useMemo(() => {
    const companies = new Set<string>();
    jobListings.forEach(job => {
      if (job.companyName) {
        companies.add(job.companyName);
      }
    });
    return Array.from(companies).sort();
  }, [jobListings]);

  const companiesByType = useMemo(() => {
    const companiesMap = new Map<string, Set<string>>();
    
    // Initialize with all company types
    allCompanyTypes.forEach(type => {
      companiesMap.set(type, new Set());
    });

    // Add companies to their respective types
    jobListings.forEach(job => {
      if (job.companyName && job.companyType) {
        const companiesSet = companiesMap.get(job.companyType) || new Set();
        companiesSet.add(job.companyName);
        companiesMap.set(job.companyType, companiesSet);
      }
    });

    return companiesMap;
  }, [jobListings, allCompanyTypes]);

  const filteredCompanies = useMemo(() => {
    if (companyTypeFilter === 'All') {
      return allCompanies;
    }
    return Array.from(companiesByType.get(companyTypeFilter) || []);
  }, [companyTypeFilter, companiesByType, allCompanies]);

  const filteredJobs = jobListings.filter(job => {
    const matchesSearch = job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All Roles' || 
                       (job.roles && job.roles === selectedRole);
    const matchesCompanyType = selectedCompanyType === 'All Companies' || 
                             (job.companyType && job.companyType === selectedCompanyType);
    const matchesCompany = selectedCompany === 'All Companies' ||
                          (job.companyName && job.companyName === selectedCompany);
    
    const salaryInLPA = job.salary;
    
    let matchesSalary = true;
    if (selectedSalaryRange !== 'All Salaries') {
      const [min, max] = selectedSalaryRange.split('-').map(Number);
      matchesSalary = salaryInLPA >= min && 
                    (max ? salaryInLPA <= max : true);
    }
    
    return matchesSearch && matchesRole && matchesCompanyType && matchesSalary && matchesCompany;
  });

  

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">Loading premium opportunities...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-100">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Loading Error</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50">
  
      
      {/* Premium Header */}
<header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
        <Briefcase className="h-5 w-5 text-white" />
      </div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
        Job Portal
      </h1>
    </div>
    <div className="flex space-x-4">
      
     
      <button
        onClick={async () => {
          try {
            // Clear client-side storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Call auth context logout if available
            if (typeof logout === 'function') {
              await logout();
            }
            
            // Force full page reload to reset all state
            window.location.href = '/login';
          } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/login';
          }
        }}
        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-400 text-white rounded-lg hover:from-red-700 hover:to-red-500 transition-all shadow-lg hover:shadow-xl font-medium flex items-center"
      >
        Logout
        <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</header>
      {/* Hero Search Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Discover Your Dream Career</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Access exclusive opportunities from top companies worldwide
            </p>
          </div>
          
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-4xl mx-auto border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white/70 text-black shadow-sm placeholder-gray-400"
                  placeholder="Job title, keywords, or company"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
              >
                <option>All Companies</option>
                {allCompanies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
             
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
              >
                <option>All Roles</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              
              <select
                value={selectedCompanyType}
                onChange={(e) => setSelectedCompanyType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
              >
                <option>All Companies</option>
                {allCompanyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={selectedSalaryRange}
                onChange={(e) => setSelectedSalaryRange(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white shadow-sm"
              >
                {salaryRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job Listings Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-md overflow-hidden">
          {filteredJobs.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary (LPA)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map((job, index) => (
                  <tr 
                    key={index} 
                    onClick={() => router.push(`/UTerms/${job.uid}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                      {job.companyName?.split('(')[0]?.trim() || 'Unspecified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {job.roles || 'Unspecified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {job.description || 'No description available'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {job.salary || 'Not specified'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.companyType ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          job.companyType === 'Product-Based' 
                            ? 'bg-green-100 text-green-800' 
                            : job.companyType === 'Service-Based'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}>
                          {job.companyType}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Not specified</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/UTerms/${job.uid}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
                      >
                        View
                        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="col-span-full bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center border border-gray-200 shadow-sm">
              <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No opportunities found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('All Roles');
                  setSelectedCompanyType('All Companies');
                  setSelectedSalaryRange('All Salaries');
                  setSelectedCompany('All Companies');
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobListUser;