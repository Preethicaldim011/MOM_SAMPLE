import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X, CheckCircle, MessageSquare, Calendar, Users, LayoutDashboard, FolderOpen, ChevronDown } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    attendees: ''
  });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  
  // State for completed meetings
  const [completedMeetings, setCompletedMeetings] = useState([]);

  // Load completed meetings from localStorage on component mount
  useEffect(() => {
    const savedMeetings = localStorage.getItem('completedMeetings');
    if (savedMeetings) {
      setCompletedMeetings(JSON.parse(savedMeetings));
    }
  }, []);

  const phases = [
    'Design Development',
    'Part Development',
    'Gateway',
    'Prototype',
    'Testing',
    'Production'
  ];

  // Get unique projects from completed meetings
  const getUniqueProjects = () => {
    const projects = new Set();
    completedMeetings.forEach(meeting => {
      projects.add(meeting.project);
    });
    return Array.from(projects);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setSelectedPhase('');
    setShowMeetingForm(false);
    setShowModal(true);
  };

  const handlePhaseClick = (phase) => {
    setSelectedPhase(phase);
    setShowMeetingForm(true);
  };

  const handleInputChange = (e) => {
    setMeetingData({
      ...meetingData,
      [e.target.name]: e.target.value
    });
  };

  const handleProceed = () => {
    // Create a new meeting record
    const newMeeting = {
      id: Date.now(),
      project: selectedProject,
      phase: selectedPhase,
      date: meetingData.date,
      time: meetingData.time,
      attendees: meetingData.attendees,
      points: [], // Will be populated in meeting page
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const updatedMeetings = [...completedMeetings, newMeeting];
    setCompletedMeetings(updatedMeetings);
    localStorage.setItem('completedMeetings', JSON.stringify(updatedMeetings));

    setShowModal(false);
    
    // Auto-expand the project in sidebar after creating meeting
    setExpandedProjects(prev => ({
      ...prev,
      [selectedProject]: true
    }));
    
    // Optionally switch to that project view
    // setActiveSidebarItem(selectedProject);
    
    navigate('/meeting', { 
      state: { 
        meetingId: newMeeting.id,
        project: selectedProject,
        phase: selectedPhase,
        meetingData: meetingData
      }
    });
  };

  const getProjectMeetings = (projectName) => {
    return completedMeetings.filter(meeting => meeting.project === projectName);
  };

  const handleMeetingClick = (meeting) => {
    navigate('/meeting', { 
      state: { 
        meetingId: meeting.id,
        project: meeting.project,
        phase: meeting.phase,
        meetingData: meeting,
        existingPoints: meeting.points || []
      }
    });
  };

  const toggleProjectExpand = (project) => {
    setExpandedProjects(prev => ({
      ...prev,
      [project]: !prev[project]
    }));
  };

  // Group meetings by phase for a specific project
  const getMeetingsByPhase = (projectName) => {
    const projectMeetings = getProjectMeetings(projectName);
    const phases = {};
    
    // Get all unique phases for this project
    const projectPhases = [...new Set(projectMeetings.map(m => m.phase))];
    
    projectPhases.forEach(phase => {
      phases[phase] = projectMeetings.filter(m => m.phase === phase);
    });
    
    return phases;
  };

  const uniqueProjects = getUniqueProjects();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">MOM</h1>
        </div>
        <nav className="mt-6">
          {/* Dashboard Menu Item */}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setActiveSidebarItem('dashboard');
            }}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
              activeSidebarItem === 'dashboard' ? 'bg-gray-100 border-l-4 border-blue-500' : ''
            }`}
          >
            <LayoutDashboard size={20} className="mr-3" />
            <span>Dashboard</span>
          </a>
          
          {/* Dynamic Project Sub-modules */}
          {uniqueProjects.map(project => (
            <div key={project} className="mt-2">
              <div 
                className={`flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-100 cursor-pointer ${
                  activeSidebarItem === project ? 'bg-gray-100 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => {
                  setActiveSidebarItem(project);
                  toggleProjectExpand(project);
                }}
              >
                <div className="flex items-center flex-1">
                  <FolderOpen size={20} className="mr-3" />
                  <span>{project}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {getProjectMeetings(project).length}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform ${
                      expandedProjects[project] ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </div>
              
              {/* Expanded Project Phases */}
              {expandedProjects[project] && (
                <div className="ml-8 mt-1 space-y-1">
                  {Object.entries(getMeetingsByPhase(project)).map(([phase, meetings]) => (
                    <div key={phase} className="relative">
                      <div className="px-6 py-2 text-sm text-gray-600 font-medium">
                        {phase}
                      </div>
                      {meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          onClick={() => handleMeetingClick(meeting)}
                          className="px-6 py-2 ml-4 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-l-2 border-gray-200 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate max-w-[120px]">
                              {meeting.date}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                              {meeting.points?.length || 0}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {meeting.attendees}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  {/* New Meeting Button for this Project */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProjectClick(project);
                    }}
                    className="w-full px-6 py-2 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 transition-colors"
                  >
                    <span className="text-lg">+</span> New Meeting
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {activeSidebarItem === 'dashboard' ? 'Dashboard' : `${activeSidebarItem} - Meeting History`}
            </h2>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeSidebarItem === 'dashboard' ? (
            /* Dashboard View */
            <>
              <h3 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h3>
              
              {/* Projects Overview */}
              <div className="max-w-4xl space-y-4">
                {uniqueProjects.length > 0 ? (
                  uniqueProjects.map(project => (
                    <div key={project} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                      <div 
                        onClick={() => toggleProjectExpand(project)}
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            project === 'TVS' ? 'bg-blue-100' : 
                            project === 'TECH' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            <MessageSquare size={24} className={
                              project === 'TVS' ? 'text-blue-600' : 
                              project === 'TECH' ? 'text-purple-600' : 'text-green-600'
                            } />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">{project}</h4>
                            <p className="text-sm text-gray-500">
                              {getProjectMeetings(project).length} meeting{getProjectMeetings(project).length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                            className={`px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium ${
                              project === 'TVS' ? 'bg-blue-500 hover:bg-blue-600' : 
                              project === 'TECH' ? 'bg-purple-500 hover:bg-purple-600' : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            + New Meeting
                          </button>
                          <ChevronRight 
                            size={20} 
                            className={`text-gray-400 transition-transform ${
                              expandedProjects[project] ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                      </div>

                      {/* Project Meetings List (expanded) */}
                      {expandedProjects[project] && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          {getProjectMeetings(project).length > 0 ? (
                            <div className="space-y-3">
                              {getProjectMeetings(project).map((meeting) => (
                                <div
                                  key={meeting.id}
                                  onClick={() => handleMeetingClick(meeting)}
                                  className="bg-white rounded-lg p-4 hover:shadow-md cursor-pointer transition-all border border-gray-200"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle size={16} className="text-green-500" />
                                      <span className="font-medium text-gray-800">{meeting.phase}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      project === 'TVS' ? 'bg-blue-100 text-blue-600' : 
                                      project === 'TECH' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                      {meeting.points?.length || 0} points
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {meeting.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users size={14} />
                                      {meeting.attendees}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <p>No meetings yet</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProjectClick(project);
                                }}
                                className={`mt-2 text-sm font-medium ${
                                  project === 'TVS' ? 'text-blue-500 hover:text-blue-600' : 
                                  project === 'TECH' ? 'text-purple-500 hover:text-purple-600' : 'text-green-500 hover:text-green-600'
                                }`}
                              >
                                + Create your first meeting
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl shadow-md">
                    <h4 className="text-xl text-gray-600 mb-4">No projects yet</h4>
                    <p className="text-gray-500 mb-6">Create your first meeting to get started</p>
                    <button
                      onClick={() => {
                        setSelectedProject('New Project');
                        setShowModal(true);
                      }}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      + Create Meeting
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Project Specific View */
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-gray-800">{activeSidebarItem} Meetings</h3>
                <button
                  onClick={() => handleProjectClick(activeSidebarItem)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  + New Meeting
                </button>
              </div>

              {/* Meetings by Phase */}
              <div className="space-y-8">
                {Object.entries(getMeetingsByPhase(activeSidebarItem)).map(([phase, meetings]) => (
                  <div key={phase} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800">{phase}</h4>
                      <p className="text-sm text-gray-500">
                        {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-4">
                      {meetings.length > 0 ? (
                        <div className="space-y-3">
                          {meetings.map((meeting) => (
                            <div
                              key={meeting.id}
                              onClick={() => handleMeetingClick(meeting)}
                              className="bg-white rounded-lg p-4 hover:shadow-md cursor-pointer transition-all border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle size={16} className="text-green-500" />
                                  <span className="font-medium text-gray-800">{phase}</span>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  {meeting.points?.length || 0} points
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {meeting.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users size={14} />
                                  {meeting.attendees}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No {phase} meetings yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedProject} - Add Meeting Details
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Project Name Input for New Projects */}
              {selectedProject === 'New Project' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={selectedProject === 'New Project' ? '' : selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Phase Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Phase
                </label>
                <select
                  value={selectedPhase}
                  onChange={(e) => handlePhaseClick(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a phase...</option>
                  {phases.map((phase) => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </select>
              </div>

              {/* Meeting Details Form */}
              {showMeetingForm && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={meetingData.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={meetingData.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attendees
                    </label>
                    <input
                      type="text"
                      name="attendees"
                      value={meetingData.attendees}
                      onChange={handleInputChange}
                      placeholder="Enter attendees names (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleProceed}
                    disabled={!selectedProject || !selectedPhase || !meetingData.date || !meetingData.time || !meetingData.attendees}
                    className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    Start Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;