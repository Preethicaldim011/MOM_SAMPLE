import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { ChevronRight, X, CheckCircle, MessageSquare, Calendar, Users, LayoutDashboard, FolderOpen, ChevronDown, Square, ChevronUp } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Add this to get location state
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    attendees: ''
  });
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedDashboard, setExpandedDashboard] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [currentView, setCurrentView] = useState({ type: 'dashboard', project: null, phase: null });
  
  // State for completed meetings
  const [completedMeetings, setCompletedMeetings] = useState([]);

  // Load completed meetings from localStorage on component mount
  useEffect(() => {
    const savedMeetings = localStorage.getItem('completedMeetings');
    if (savedMeetings) {
      setCompletedMeetings(JSON.parse(savedMeetings));
    }
  }, []);

  // Check if returning from meeting page with state
  useEffect(() => {
    if (location.state?.view) {
      const { view, project, phase } = location.state;
      setCurrentView({ type: view, project, phase });
      
      if (view === 'project' && project) {
        setActiveSidebarItem(project);
        // Auto-expand the project
        setExpandedProjects(prev => ({
          ...prev,
          [project]: true
        }));
      } else if (view === 'phase' && project && phase) {
        setActiveSidebarItem(project);
        // Auto-expand the project
        setExpandedProjects(prev => ({
          ...prev,
          [project]: true
        }));
      } else if (view === 'dashboard') {
        setActiveSidebarItem('dashboard');
      }
    }
  }, [location.state]);

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

  const handleCreateNewMeeting = () => {
    setSelectedProject('');
    setNewProjectName('');
    setSelectedPhase('');
    setShowMeetingForm(false);
    setMeetingData({ date: '', time: '', attendees: '' });
    setShowModal(true);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setNewProjectName('');
    setSelectedPhase('');
    setShowMeetingForm(false);
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
    // Determine final project name
    const finalProjectName = selectedProject === 'new' ? newProjectName : selectedProject;
    
    if (!finalProjectName || !selectedPhase) {
      alert('Please select a project and phase');
      return;
    }

    // Create a new meeting record
    const newMeeting = {
      id: Date.now(),
      project: finalProjectName,
      phase: selectedPhase,
      date: meetingData.date || new Date().toISOString().split('T')[0],
      time: meetingData.time || new Date().toLocaleTimeString(),
      attendees: meetingData.attendees || 'TBD',
      points: [], // Will be populated in meeting page
      timestamp: new Date().toISOString()
    };

    // Save to localStorage
    const updatedMeetings = [...completedMeetings, newMeeting];
    setCompletedMeetings(updatedMeetings);
    localStorage.setItem('completedMeetings', JSON.stringify(updatedMeetings));

    setShowModal(false);
    
    // Auto-expand the project in sidebar
    setExpandedProjects(prev => ({
      ...prev,
      [finalProjectName]: true
    }));
    
    // Navigate to meeting page with current context
    navigate('/meeting', { 
      state: { 
        meetingId: newMeeting.id,
        project: finalProjectName,
        phase: selectedPhase,
        meetingData: newMeeting,
        returnTo: { type: 'project', project: finalProjectName } // Add return context
      }
    });
  };

  const getProjectMeetings = (projectName) => {
    return completedMeetings.filter(meeting => meeting.project === projectName);
  };

  const handleMeetingClick = (meeting) => {
    // Set current view before navigating
    setCurrentView({ type: 'phase', project: meeting.project, phase: meeting.phase });
    setActiveSidebarItem(meeting.project);
    setExpandedProjects(prev => ({
      ...prev,
      [meeting.project]: true
    }));
    
    navigate('/meeting', { 
      state: { 
        meetingId: meeting.id,
        project: meeting.project,
        phase: meeting.phase,
        meetingData: meeting,
        existingPoints: meeting.points || [],
        returnTo: { type: 'phase', project: meeting.project, phase: meeting.phase }
      }
    });
  };

  const toggleProjectExpand = (project) => {
    setExpandedProjects(prev => ({
      ...prev,
      [project]: !prev[project]
    }));
  };

  // Handle phase click in sidebar - directly go to meeting page
  const handlePhaseSidebarClick = (project, phase) => {
    // Get the most recent meeting for this phase
    const phaseMeetings = getPhaseMeetings(project, phase);
    if (phaseMeetings.length > 0) {
      // Sort by date (most recent first) and take the latest
      const sortedMeetings = [...phaseMeetings].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Set current view before navigating
      setCurrentView({ type: 'phase', project, phase });
      setActiveSidebarItem(project);
      setExpandedProjects(prev => ({
        ...prev,
        [project]: true
      }));
      
      handleMeetingClick(sortedMeetings[0]);
    }
  };

  // Handle project click in sidebar
  const handleProjectSidebarClick = (project) => {
    setCurrentView({ type: 'project', project, phase: null });
    setActiveSidebarItem(project);
    toggleProjectExpand(project);
  };

  // Handle dashboard click
  const handleDashboardClick = () => {
    setCurrentView({ type: 'dashboard', project: null, phase: null });
    setActiveSidebarItem('dashboard');
  };

  // Toggle dashboard expansion
  const toggleDashboardExpand = (e) => {
    e.stopPropagation();
    setExpandedDashboard(!expandedDashboard);
  };

  // Get unique phases for a project
  const getUniquePhases = (projectName) => {
    const meetings = getProjectMeetings(projectName);
    const uniquePhases = new Set();
    meetings.forEach(meeting => {
      uniquePhases.add(meeting.phase);
    });
    return Array.from(uniquePhases);
  };

  // Group meetings by phase for a specific project
  const getMeetingsByPhase = (projectName) => {
    const projectMeetings = getProjectMeetings(projectName);
    const phases = {};
    
    projectMeetings.forEach(meeting => {
      if (!phases[meeting.phase]) {
        phases[meeting.phase] = [];
      }
      phases[meeting.phase].push(meeting);
    });
    
    return phases;
  };

  // Get meetings for a specific phase
  const getPhaseMeetings = (projectName, phaseName) => {
    return completedMeetings.filter(
      meeting => meeting.project === projectName && meeting.phase === phaseName
    );
  };

  // Get the most recent meeting for a project preview
  const getProjectPreview = (projectName) => {
    const meetings = getProjectMeetings(projectName);
    if (meetings.length === 0) return null;
    
    // Sort by date (most recent first)
    const sortedMeetings = [...meetings].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    return sortedMeetings[0];
  };

  const uniqueProjects = getUniqueProjects();

  // Get header title based on current view
  const getHeaderTitle = () => {
    if (currentView.type === 'dashboard') return 'MinutesOfMeeting';
    if (currentView.type === 'project') return currentView.project;
    if (currentView.type === 'phase') return `${currentView.project} - ${currentView.phase}`;
    return 'Dashboard';
  };

  // Handle phase card click - directly go to meeting page
  const handlePhaseCardClick = (project, phase) => {
    const phaseMeetings = getPhaseMeetings(project, phase);
    if (phaseMeetings.length > 0) {
      // Sort by date (most recent first) and take the latest
      const sortedMeetings = [...phaseMeetings].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      // Set current view before navigating
      setCurrentView({ type: 'phase', project, phase });
      setActiveSidebarItem(project);
      setExpandedProjects(prev => ({
        ...prev,
        [project]: true
      }));
      
      handleMeetingClick(sortedMeetings[0]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Always visible */}
      <div className="w-72 bg-white shadow-lg flex flex-col h-screen overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">MOM</h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Dashboard Menu Item with expand/collapse */}
          <div className="mb-2">
            <div 
              className={`flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${
                activeSidebarItem === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium border-r-4 border-blue-600' : ''
              }`}
              onClick={handleDashboardClick}
            >
              <div className="flex items-center flex-1">
                <LayoutDashboard size={20} className="mr-3" />
                <span>MinutesOfMeeting</span>
              </div>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform cursor-pointer ${
                  expandedDashboard ? 'rotate-180' : ''
                }`}
                onClick={toggleDashboardExpand}
              />
            </div>
            
            {/* Projects as Sub-modules under Dashboard - only show when expanded */}
            {expandedDashboard && uniqueProjects.length > 0 && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {uniqueProjects.map(project => (
                  <div key={project}>
                    <div 
                      className={`flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors ${
                        activeSidebarItem === project && (currentView.type === 'project' || currentView.type === 'phase') 
                          ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                          : ''
                      }`}
                      onClick={() => handleProjectSidebarClick(project)}
                    >
                      <div className="flex items-center flex-1">
                        <FolderOpen size={16} className="mr-2" />
                        <span className="truncate">{project}</span>
                      </div>
                      <ChevronDown 
                        size={14} 
                        className={`text-gray-400 transition-transform ${
                          expandedProjects[project] ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                    
                    {/* Expanded Project Phases in Sidebar - Direct to meeting page */}
                    {expandedProjects[project] && (
                      <div className="ml-6 mt-1 space-y-1">
                        {getUniquePhases(project).map(phase => (
                          <div 
                            key={phase}
                            className={`px-4 py-1.5 text-xs hover:bg-gray-50 cursor-pointer rounded-lg transition-colors flex items-center ${
                              currentView.type === 'phase' && 
                              currentView.project === project && 
                              currentView.phase === phase
                                ? 'bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-600' 
                                : 'text-gray-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhaseSidebarClick(project, phase);
                            }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              currentView.type === 'phase' && 
                              currentView.project === project && 
                              currentView.phase === phase
                                ? 'bg-blue-600'
                                : 'bg-gray-400'
                            }`}></span>
                            <span className="truncate">{phase}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Shows current view name with centered text */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-center items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {getHeaderTitle()}
            </h2>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentView.type === 'dashboard' && (
            /* Dashboard View - Projects as Square Shapes */
            <>
              <div className="flex justify-between items-center mb-8">
                <button
                  onClick={handleCreateNewMeeting}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  + Create New Meeting
                </button>
              </div>
              
              {/* Projects as Square Grid - Larger modules */}
              <div className="max-w-7xl">
                {uniqueProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {uniqueProjects.map(project => {
                      const preview = getProjectPreview(project);
                      const uniquePhases = getUniquePhases(project);
                      
                      // Generate a consistent color based on project name
                      const colors = [
                        'bg-blue-50 border-blue-200 hover:border-blue-400',
                        'bg-purple-50 border-purple-200 hover:border-purple-400',
                        'bg-green-50 border-green-200 hover:border-green-400',
                        'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
                        'bg-pink-50 border-pink-200 hover:border-pink-400',
                        'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
                        'bg-orange-50 border-orange-200 hover:border-orange-400',
                        'bg-teal-50 border-teal-200 hover:border-teal-400'
                      ];
                      const colorIndex = project.length % colors.length;
                      
                      return (
                        <div 
                          key={project}
                          className={`${colors[colorIndex]} border-2 rounded-xl p-8 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg min-h-[200px] ${
                            activeSidebarItem === project ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                          }`}
                          onClick={() => handleProjectSidebarClick(project)}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                              <MessageSquare size={28} className="text-gray-600" />
                              <span className="text-sm font-medium bg-white px-3 py-1.5 rounded-full shadow-sm">
                                {uniquePhases.length} phase{uniquePhases.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            <h4 className="text-xl font-bold text-gray-800 mb-3">{project}</h4>
                            
                            {preview && (
                              <div className="mt-auto">
                                <div className="text-base text-gray-600 mb-2">
                                  Latest: {new Date(preview.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm bg-white text-blue-600 px-3 py-1.5 rounded-full">
                                    {getProjectMeetings(project).length} meeting{getProjectMeetings(project).length !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-sm text-gray-500 truncate">
                                    {preview.phase}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <h4 className="text-2xl text-gray-600 mb-4">No projects yet</h4>
                    <p className="text-gray-500 mb-8">Create your first meeting to get started</p>
                    <button
                      onClick={handleCreateNewMeeting}
                      className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
                    >
                      + Create Meeting
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {currentView.type === 'project' && (
            /* Project View - Show Phases as Square Boxes - Direct to meeting page on click */
            <div className="max-w-7xl">
              {/* Phases as Square Cards - Larger modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {getUniquePhases(currentView.project).map(phase => {
                  const phaseMeetings = getMeetingsByPhase(currentView.project)[phase] || [];
                  const totalPoints = phaseMeetings.reduce((sum, meeting) => sum + (meeting.points?.length || 0), 0);
                  const latestMeeting = phaseMeetings.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                  
                  // Generate a consistent color based on phase name
                  const colors = [
                    'bg-blue-50 border-blue-200 hover:border-blue-400',
                    'bg-purple-50 border-purple-200 hover:border-purple-400',
                    'bg-green-50 border-green-200 hover:border-green-400',
                    'bg-yellow-50 border-yellow-200 hover:border-yellow-400',
                    'bg-pink-50 border-pink-200 hover:border-pink-400',
                    'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
                  ];
                  const colorIndex = phase.length % colors.length;
                  
                  return (
                    <div 
                      key={phase}
                      className={`${colors[colorIndex]} border-2 rounded-xl p-8 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg min-h-[200px] ${
                        currentView.type === 'phase' && currentView.phase === phase ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                      }`}
                      onClick={() => handlePhaseCardClick(currentView.project, phase)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <Square size={28} className="text-gray-600" />
                          <span className="text-sm font-medium bg-white px-3 py-1.5 rounded-full shadow-sm">
                            {phaseMeetings.length} meeting{phaseMeetings.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <h4 className="text-xl font-bold text-gray-800 mb-3">{phase}</h4>
                        
                        {latestMeeting && (
                          <div className="mt-auto">
                            <div className="text-base text-gray-600 mb-2">
                              Latest: {new Date(latestMeeting.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm bg-white text-blue-600 px-3 py-1.5 rounded-full">
                                {totalPoints} total points
                              </span>
                              {latestMeeting.attendees !== 'TBD' && (
                                <span className="text-sm text-gray-500 truncate">
                                  {latestMeeting.attendees.split(',')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* If no phases yet */}
              {getUniquePhases(currentView.project).length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                  <h4 className="text-2xl text-gray-600 mb-4">No meetings yet for {currentView.project}</h4>
                  <p className="text-gray-500 mb-8">Create your first meeting to get started</p>
                  <button
                    onClick={() => {
                      setSelectedProject(currentView.project);
                      setShowModal(true);
                    }}
                    className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg"
                  >
                    + Create Meeting
                  </button>
                </div>
              )}
            </div>
          )}

          {currentView.type === 'phase' && (
            /* Phase View - Show All Meetings for this Phase */
            <div className="max-w-4xl">
              <div className="space-y-4">
                {getPhaseMeetings(currentView.project, currentView.phase).map((meeting) => (
                  <div
                    key={meeting.id}
                    onClick={() => handleMeetingClick(meeting)}
                    className="bg-white rounded-lg p-6 hover:shadow-md cursor-pointer transition-all border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-800">{meeting.phase}</h3>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                        {meeting.points?.length || 0} points
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(meeting.date).toLocaleDateString()}
                      </span>
                      {meeting.time && (
                        <span className="flex items-center gap-1">
                          <span>🕐</span>
                          {meeting.time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {meeting.attendees}
                      </span>
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
                Create New Meeting
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Project Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a project...</option>
                  {uniqueProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                  <option value="new">+ Create New Project</option>
                </select>
              </div>

              {/* New Project Name Input */}
              {selectedProject === 'new' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Phase Selection - Show only if project is selected */}
              {(selectedProject && selectedProject !== 'new' || newProjectName) && (
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
              )}

              {/* Meeting Details Form */}
              {showMeetingForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Date (Optional)
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
                      Meeting Time (Optional)
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
                      Attendees (Optional)
                    </label>
                    <input
                      type="text"
                      name="attendees"
                      value={meetingData.attendees}
                      onChange={handleInputChange}
                      placeholder="Enter attendees names"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleProceed}
                    disabled={!((selectedProject && selectedProject !== 'new') || newProjectName) || !selectedPhase}
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