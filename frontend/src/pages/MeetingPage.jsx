import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Home, ArrowLeft, Save, Trash2, LayoutDashboard, 
  FolderOpen, ChevronDown, PlusCircle, Settings, RefreshCw, 
  Volume2, Headphones, Bluetooth, Smartphone, AlertCircle,
  CheckCircle, XCircle, HelpCircle, Wifi, WifiOff,
  Search, Download, MoreVertical, Edit, Copy, Filter
} from 'lucide-react';

function MeetingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { meetingId, project, phase, meetingData, existingPoints = [] } = location.state || {};
  
  const [activeTab, setActiveTab] = useState('speech');
  const [isListening, setIsListening] = useState(false);
  const [currentSpeechPoint, setCurrentSpeechPoint] = useState('');
  const [pendingPoints, setPendingPoints] = useState([]);
  const [meetingPoints, setMeetingPoints] = useState([]);
  const [manualPoint, setManualPoint] = useState('');
  const [completedMeetings, setCompletedMeetings] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [currentView, setCurrentView] = useState({ type: 'phase', project, phase });
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    function: true,
    projectName: true,
    criticality: true,
    discussionPoint: true,
    responsibility: true,
    target: true,
    remainder: true,
    status: true,
    actionTaken: true,
    delete: true
  });
  
  // Simple device state
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [micError, setMicError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const recognitionRef = useRef(null);
  const pendingPointsRef = useRef(null);

  // ===== ALL FUNCTION DEFINITIONS FIRST =====
  // (These need to be defined before they're used in useEffect hooks)

  const getUniqueProjects = () => {
    const projects = new Set();
    completedMeetings.forEach(meeting => {
      projects.add(meeting.project);
    });
    return Array.from(projects);
  };

  const getUniquePhases = (projectName) => {
    const meetings = completedMeetings.filter(meeting => meeting.project === projectName);
    const uniquePhases = new Set();
    meetings.forEach(meeting => {
      uniquePhases.add(meeting.phase);
    });
    return Array.from(uniquePhases);
  };

  const handleRecognitionError = (error) => {
    setIsListening(false);
    
    switch(error) {
      case 'not-allowed':
        setMicPermission('denied');
        setMicError('Microphone access blocked. Click the mic again to allow access.');
        break;
      case 'no-speech':
        // Ignore no-speech errors
        break;
      default:
        setMicError(`Error: ${error}`);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      setMicError('');
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setMicError('Microphone access is blocked. Click the lock icon in your browser to allow access.');
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone.');
      } else {
        setMicError(`Error: ${err.message}`);
      }
      return false;
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Check permission and start
      if (micPermission !== 'granted') {
        const success = await requestMicrophonePermission();
        if (!success) return;
      }

      if (recognitionRef.current) {
        try {
          setCurrentSpeechPoint('');
          recognitionRef.current.start();
          setIsListening(true);
          setMicError('');
        } catch (err) {
          console.error('Failed to start:', err);
          setMicError('Failed to start speech recognition.');
        }
      }
    }
  };

  const addManualPoint = () => {
    if (manualPoint.trim()) {
      const newPoint = {
        id: Date.now() + Math.random(),
        text: manualPoint.trim(),
        timestamp: new Date().toLocaleTimeString(),
        speaker: 'Manual',
        status: 'pending'
      };
      setPendingPoints(prev => [...prev, newPoint]);
      setManualPoint('');
    }
  };

  const removePendingPoint = (id) => {
    setPendingPoints(prev => prev.filter(point => point.id !== id));
  };

  const saveToTable = () => {
    const pointsToSave = pendingPoints.map((point, index) => ({
      id: point.id,
      sno: meetingPoints.length + index + 1,
      function: project || '',
      projectName: project || '',
      criticality: 'Medium',
      discussionPoint: point.text,
      responsibility: '',
      target: '',
      remainder: '',
      status: 'Pending',
      actionTaken: 'No',
      timestamp: point.timestamp,
      speaker: point.speaker
    }));
    
    setMeetingPoints(prev => [...prev, ...pointsToSave]);
    setPendingPoints([]);
    setCurrentSpeechPoint('');
    setActiveTab('table');
  };

  const updatePointField = (id, field, value) => {
    setMeetingPoints(prev => prev.map(point => 
      point.id === id ? { ...point, [field]: value } : point
    ));
  };

  const removePoint = (id) => {
    setMeetingPoints(prev => {
      const filtered = prev.filter(point => point.id !== id);
      return filtered.map((point, index) => ({ ...point, sno: index + 1 }));
    });
  };

  const saveAndExit = () => {
    if (pendingPoints.length > 0) {
      if (window.confirm('You have unsaved points. Do you want to save them to the table before exiting?')) {
        saveToTable();
      }
    }
    navigate('/');
  };

  const handleBackToTVS = () => {
    if (pendingPoints.length > 0) {
      if (window.confirm('You have unsaved points. Are you sure you want to go back?')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
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

  const handlePhaseSidebarClick = (project, phase) => {
    setCurrentView({ type: 'phase', project, phase });
    setActiveSidebarItem(project);
    const phaseMeetings = completedMeetings.filter(
      m => m.project === project && m.phase === phase
    );
    if (phaseMeetings.length > 0) {
      handleMeetingClick(phaseMeetings[0]);
    }
  };

  const handleProjectSidebarClick = (project) => {
    setCurrentView({ type: 'project', project, phase: null });
    setActiveSidebarItem(project);
    toggleProjectExpand(project);
    navigate('/', { state: { view: 'project', project } });
  };

  const handleDashboardClick = () => {
    setCurrentView({ type: 'dashboard', project: null, phase: null });
    setActiveSidebarItem('dashboard');
    navigate('/');
  };

  const openWindowsSoundSettings = () => {
    window.open('ms-settings:sound', '_blank');
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const exportData = (format) => {
    console.log(`Exporting as ${format}`, meetingPoints);
    // Implement export functionality
  };

  const getHeaderTitle = () => {
    if (currentView.type === 'meeting') return `${project} - ${phase}`;
    if (currentView.type === 'project') return currentView.project;
    if (currentView.type === 'phase') return `${currentView.project} - ${currentView.phase}`;
    return 'Meeting Minutes';
  };

  // Filtered meeting points based on search
  const filteredMeetingPoints = meetingPoints.filter(point => 
    point.discussionPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.responsibility.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ===== USEEFFECT HOOKS =====

  // Transform existing points to new format
  useEffect(() => {
    if (existingPoints.length > 0) {
      const transformedPoints = existingPoints.map((point, index) => ({
        id: point.id || Date.now() + Math.random(),
        sno: index + 1,
        function: point.function || project || '',
        projectName: point.projectName || project || '',
        criticality: point.criticality || 'Medium',
        discussionPoint: point.text || point.discussionPoint || '',
        responsibility: point.responsibility || '',
        target: point.target || '',
        remainder: point.remainder || '',
        status: point.status || 'Pending',
        actionTaken: point.actionTaken || 'No',
        timestamp: point.timestamp || new Date().toLocaleTimeString(),
        speaker: point.speaker || 'Speech'
      }));
      setMeetingPoints(transformedPoints);
    }
  }, [existingPoints, project]);

  // Load completed meetings from localStorage
  useEffect(() => {
    const savedMeetings = localStorage.getItem('completedMeetings');
    if (savedMeetings) {
      setCompletedMeetings(JSON.parse(savedMeetings));
    }
  }, []);

  // Set initial expanded state for the current project
  useEffect(() => {
    if (project) {
      setActiveSidebarItem(project);
      setExpandedProjects(prev => ({
        ...prev,
        [project]: true
      }));
    }
  }, [project]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        
        if (lastResult.isFinal) {
          const newPoint = {
            id: Date.now() + Math.random(),
            text: transcript.trim(),
            timestamp: new Date().toLocaleTimeString(),
            speaker: 'Speech',
            status: 'pending'
          };
          
          setPendingPoints(prev => [...prev, newPoint]);
          setCurrentSpeechPoint('');
          
          setTimeout(() => {
            if (pendingPointsRef.current) {
              pendingPointsRef.current.scrollTop = pendingPointsRef.current.scrollHeight;
            }
          }, 100);
        } else {
          setCurrentSpeechPoint(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        handleRecognitionError(event.error);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setMicError('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Save points to localStorage
  useEffect(() => {
    if (meetingId && meetingPoints.length > 0) {
      const savedMeetings = JSON.parse(localStorage.getItem('completedMeetings') || '[]');
      const updatedMeetings = savedMeetings.map(meeting => 
        meeting.id === meetingId 
          ? { ...meeting, points: meetingPoints }
          : meeting
      );
      localStorage.setItem('completedMeetings', JSON.stringify(updatedMeetings));
    }
  }, [meetingPoints, meetingId]);

  // ===== RENDER FUNCTIONS =====

  // Render device setup flow based on state
  const renderDeviceSetup = () => {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        {/* Simple Mic Interface */}
        <div className="flex flex-col items-center justify-center">
          <button
            onClick={toggleListening}
            className={`p-16 rounded-full transition-all transform hover:scale-105 mb-4 ${
              isListening 
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' 
                : micPermission === 'denied'
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600'
            }`}
          >
            {isListening ? <MicOff size={64} /> : <Mic size={64} />}
          </button>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {isListening ? 'Listening...' : 'Click the microphone to start'}
          </h3>
          
          {micError && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg max-w-lg">
              <p className="text-sm text-red-700">{micError}</p>
              {micPermission === 'denied' && (
                <button
                  onClick={requestMicrophonePermission}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try granting permission again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Current Speech Indicator */}
        {currentSpeechPoint && (
          <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Currently speaking:</p>
            <p className="text-gray-700 text-lg">{currentSpeechPoint}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-lg flex flex-col h-screen overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">MOM</h1>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="mb-2">
            <div 
  onClick={handleDashboardClick}
  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${
    activeSidebarItem === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' : ''
  }`}
>
  <LayoutDashboard size={20} className="mr-3" />  {/* Changed from Tv to LayoutDashboard */}
  <span>MinutesOfMeeting</span>  {/* Changed from TVS to MinutesOfMeeting */}
</div>
            
            {completedMeetings.length > 0 && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {getUniqueProjects().map(projectItem => (
                  <div key={projectItem}>
                    <div 
                      className={`flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors ${
                        (activeSidebarItem === projectItem) || 
                        (project === projectItem && currentView.type === 'phase')
                          ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                          : ''
                      }`}
                      onClick={() => handleProjectSidebarClick(projectItem)}
                    >
                      <div className="flex items-center flex-1">
                        <FolderOpen size={16} className="mr-2" />
                        <span className="truncate">{projectItem}</span>
                      </div>
                      <ChevronDown 
                        size={14} 
                        className={`text-gray-400 transition-transform ${
                          expandedProjects[projectItem] ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                    
                    {(expandedProjects[projectItem] || project === projectItem) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {getUniquePhases(projectItem).map(phaseItem => (
                          <div 
                            key={phaseItem}
                            className={`px-4 py-1.5 text-xs hover:bg-gray-50 cursor-pointer rounded-lg transition-colors flex items-center ${
                              currentView.type === 'phase' && 
                              currentView.project === projectItem && 
                              currentView.phase === phaseItem
                                ? 'bg-blue-100 text-blue-700 font-medium border-l-4 border-blue-600' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhaseSidebarClick(projectItem, phaseItem);
                            }}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              currentView.type === 'phase' && 
                              currentView.project === projectItem && 
                              currentView.phase === phaseItem
                                ? 'bg-blue-600'
                                : 'bg-gray-400'
                            }`}></span>
                            <span className="truncate">{phaseItem}</span>
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
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <button
              onClick={handleBackToTVS}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to TVS</span>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {getHeaderTitle()}
            </h2>
            <div className="w-24"></div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-end items-center mb-6">
            <button
              onClick={saveAndExit}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm hover:shadow-md"
            >
              <Save size={18} />
              <span>Save & Exit</span>
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('speech')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'speech'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Speech to Text
              {pendingPoints.length > 0 && (
                <span className="ml-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs">
                  {pendingPoints.length} pending
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'table'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Meeting Table
              {meetingPoints.length > 0 && (
                <span className="ml-2 bg-white text-blue-500 px-2 py-0.5 rounded-full text-xs">
                  {meetingPoints.length}
                </span>
              )}
            </button>
          </div>

          {/* Settings Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm text-sm"
            >
              <Settings size={16} />
              <span>Audio Settings</span>
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio Settings</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Microphone Status</h4>
                  <div className="flex items-center gap-2 mb-2">
                    {micPermission === 'granted' ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : micPermission === 'denied' ? (
                      <XCircle size={16} className="text-red-500" />
                    ) : (
                      <AlertCircle size={16} className="text-yellow-500" />
                    )}
                    <span className="text-sm">
                      {micPermission === 'granted' ? 'Microphone access granted' :
                       micPermission === 'denied' ? 'Microphone access blocked' :
                       'Microphone access not requested'}
                    </span>
                  </div>
                  
                  <button
                    onClick={requestMicrophonePermission}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Request Microphone Access
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={openWindowsSoundSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    <Settings size={16} />
                    Windows Sound Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speech' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              {/* Simple Mic Interface */}
              {renderDeviceSetup()}

              {/* Pending Points Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">Pending Points</h3>
                  {pendingPoints.length > 0 && (
                    <button
                      onClick={saveToTable}
                      className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                    >
                      <Save size={18} />
                      <span>Save to Table ({pendingPoints.length})</span>
                    </button>
                  )}
                </div>
                
                <div 
                  ref={pendingPointsRef}
                  className="bg-gray-50 rounded-xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto"
                >
                  {pendingPoints.length > 0 ? (
                    <div className="space-y-2">
                      {pendingPoints.map((point, index) => (
                        <div 
                          key={point.id}
                          className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200 group"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="text-gray-700">{point.text}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  point.speaker === 'Manual' 
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                  {point.speaker}
                                </span>
                                <span className="text-xs text-gray-400">{point.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removePendingPoint(point.id)}
                            className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                            title="Remove point"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                      <Mic size={48} className="mb-4 opacity-20" />
                      <p className="text-center">No pending points yet</p>
                      <p className="text-sm mt-2">Click the microphone and start speaking</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Input */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Add Meeting Point Manually
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={manualPoint}
                    onChange={(e) => setManualPoint(e.target.value)}
                    placeholder="Type a meeting point and press Enter..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && addManualPoint()}
                  />
                  <button
                    onClick={addManualPoint}
                    disabled={!manualPoint.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                  >
                    Add Point
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'table' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              {/* Table Header with Search and Add Column */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Meeting Points</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search meetings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                    />
                  </div>
                  
                  {/* Add Column Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <PlusCircle size={18} />
                      <span>Add Column</span>
                      <ChevronDown size={16} />
                    </button>
                    
                    {showColumnMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="p-2">
                          {Object.keys(visibleColumns).map(column => (
                            <label key={column} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={visibleColumns[column]}
                                onChange={() => toggleColumn(column)}
                                className="rounded text-blue-500"
                              />
                              <span className="text-sm capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              {filteredMeetingPoints.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {visibleColumns.sno && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">S.No</th>
                        )}
                        {visibleColumns.function && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Function</th>
                        )}
                        {visibleColumns.projectName && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                        )}
                        {visibleColumns.criticality && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                        )}
                        {visibleColumns.discussionPoint && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discussion Point</th>
                        )}
                        {visibleColumns.responsibility && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsibility</th>
                        )}
                        {visibleColumns.target && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        )}
                        {visibleColumns.remainder && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remainder</th>
                        )}
                        {visibleColumns.status && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        )}
                        {visibleColumns.actionTaken && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Taken Approval</th>
                        )}
                        {visibleColumns.delete && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMeetingPoints.map((point) => (
                        <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                          {visibleColumns.sno && (
                            <td className="px-4 py-3 text-sm text-gray-900">{point.sno}</td>
                          )}
                          {visibleColumns.function && (
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={point.function}
                                onChange={(e) => updatePointField(point.id, 'function', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Function"
                              />
                            </td>
                          )}
                          {visibleColumns.projectName && (
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={point.projectName}
                                onChange={(e) => updatePointField(point.id, 'projectName', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Project"
                              />
                            </td>
                          )}
                          {visibleColumns.criticality && (
                            <td className="px-4 py-3">
                              <select
                                value={point.criticality}
                                onChange={(e) => updatePointField(point.id, 'criticality', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </td>
                          )}
                          {visibleColumns.discussionPoint && (
                            <td className="px-4 py-3 text-sm text-gray-700">{point.discussionPoint}</td>
                          )}
                          {visibleColumns.responsibility && (
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={point.responsibility}
                                onChange={(e) => updatePointField(point.id, 'responsibility', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Owner"
                              />
                            </td>
                          )}
                          {visibleColumns.target && (
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={point.target}
                                onChange={(e) => updatePointField(point.id, 'target', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Target"
                              />
                            </td>
                          )}
                          {visibleColumns.remainder && (
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={point.remainder}
                                onChange={(e) => updatePointField(point.id, 'remainder', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                placeholder="Remainder"
                              />
                            </td>
                          )}
                          {visibleColumns.status && (
                            <td className="px-4 py-3">
                              <select
                                value={point.status}
                                onChange={(e) => updatePointField(point.id, 'status', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Blocked">Blocked</option>
                              </select>
                            </td>
                          )}
                          {visibleColumns.actionTaken && (
                            <td className="px-4 py-3">
                              <select
                                value={point.actionTaken}
                                onChange={(e) => updatePointField(point.id, 'actionTaken', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Pending">Pending</option>
                              </select>
                            </td>
                          )}
                          {visibleColumns.delete && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removePoint(point.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete point"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed mb-4">
                  <p className="text-gray-500 mb-2">No meeting points found</p>
                  <p className="text-sm text-gray-400">
                    Start by adding meeting points using speech-to-text
                  </p>
                </div>
              )}

              {/* Footer with Stats and Export */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  Showing {filteredMeetingPoints.length} of {meetingPoints.length} meeting points • 
                  {Object.values(visibleColumns).filter(Boolean).length} columns visible
                </div>
                <div className="flex items-center gap-3">
                  <span>Export as:</span>
                  <button onClick={() => exportData('csv')} className="text-blue-600 hover:text-blue-800">CSV</button>
                  <button onClick={() => exportData('excel')} className="text-blue-600 hover:text-blue-800">Excel</button>
                  <button onClick={() => exportData('pdf')} className="text-blue-600 hover:text-blue-800">PDF</button>
                  <button onClick={() => exportData('word')} className="text-blue-600 hover:text-blue-800">Word</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MeetingPage;