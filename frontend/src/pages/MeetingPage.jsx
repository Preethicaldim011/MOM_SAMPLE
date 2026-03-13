import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Home, ArrowLeft, Save, Trash2, LayoutDashboard, FolderOpen, ChevronDown, PlusCircle, Settings, RefreshCw, Volume2, Headphones, Bluetooth, Smartphone } from 'lucide-react';

function MeetingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { meetingId, project, phase, meetingData, existingPoints = [] } = location.state || {};
  
  const [activeTab, setActiveTab] = useState('speech');
  const [isListening, setIsListening] = useState(false);
  const [currentSpeechPoint, setCurrentSpeechPoint] = useState(''); // Current speech being captured
  const [pendingPoints, setPendingPoints] = useState([]); // Points waiting to be saved to table
  const [meetingPoints, setMeetingPoints] = useState(existingPoints); // Saved points in table
  const [manualPoint, setManualPoint] = useState('');
  const [completedMeetings, setCompletedMeetings] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [currentView, setCurrentView] = useState({ type: 'phase', project, phase });
  const [permissionError, setPermissionError] = useState('');
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);
  const [browserInfo, setBrowserInfo] = useState('');
  const [permissionState, setPermissionState] = useState('prompt');
  const [deviceType, setDeviceType] = useState('unknown'); // 'bluetooth', 'wired', 'usb', 'built-in'
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const recognitionRef = useRef(null);
  const pendingPointsRef = useRef(null);
  const streamRef = useRef(null);

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

  useEffect(() => {
    if (existingPoints.length > 0) {
      setMeetingPoints(existingPoints);
    }
  }, [existingPoints]);

  // Get browser info
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (userAgent.indexOf('Safari') > -1) browser = 'Safari';
    else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
    setBrowserInfo(browser);
  }, []);

  // Check for audio devices on component mount
  useEffect(() => {
    checkAudioDevices();
    
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }
    
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          setPermissionError('Microphone access is blocked. Please allow microphone access in your browser settings and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else if (event.error === 'audio-capture') {
          setPermissionError('No microphone found. Please check your microphone connection.');
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setPermissionError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
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

  const getProjectMeetings = (projectName) => {
    return completedMeetings.filter(meeting => meeting.project === projectName);
  };

  const handleDeviceChange = () => {
    console.log('Device change detected');
    checkAudioDevices();
  };

  const detectDeviceType = (deviceLabel) => {
    const label = deviceLabel.toLowerCase();
    if (label.includes('bluetooth') || label.includes('bt')) {
      return 'bluetooth';
    } else if (label.includes('usb')) {
      return 'usb';
    } else if (label.includes('realtek') || label.includes('microphone')) {
      return 'wired';
    } else if (label.includes('internal') || label.includes('built-in')) {
      return 'built-in';
    }
    return 'unknown';
  };

  const checkAudioDevices = async () => {
    setIsCheckingDevices(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setPermissionError('Your browser does not support microphone access. Please use Chrome, Edge, or Safari.');
        setIsCheckingDevices(false);
        return;
      }

      // Try multiple approaches to get devices
      let audioInputs = [];
      
      // Approach 1: Just enumerate without permission first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        audioInputs = devices.filter(device => device.kind === 'audioinput');
        console.log('Initial devices:', audioInputs);
      } catch (e) {
        console.log('Initial enumeration failed:', e);
      }

      // Approach 2: Request permission to get labels and more devices
      if (audioInputs.length === 0 || !audioInputs[0]?.label) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          setPermissionState('granted');
          tempStream.getTracks().forEach(track => track.stop());
          
          // Get devices again with labels
          const devicesWithLabels = await navigator.mediaDevices.enumerateDevices();
          audioInputs = devicesWithLabels.filter(device => device.kind === 'audioinput');
          console.log('Devices with labels:', audioInputs);
        } catch (permErr) {
          console.log('Permission not granted yet:', permErr);
          setPermissionState('prompt');
        }
      }

      setAudioDevices(audioInputs);
      
      if (audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId);
        setPermissionError('');
        setConnectionStatus('connected');
        
        // Detect device type from first device
        if (audioInputs[0].label) {
          setDeviceType(detectDeviceType(audioInputs[0].label));
        }
      } else {
        setConnectionStatus('disconnected');
        setPermissionError(
          'No microphone detected. Please check:\n' +
          '1. For wired headphones: Ensure the plug is fully inserted\n' +
          '2. For Bluetooth: Device must be paired and connected\n' +
          '3. For USB mics: Try a different USB port\n' +
          '4. Check if microphone is selected as default in Windows Sound Settings'
        );
      }
    } catch (err) {
      console.error('Error checking audio devices:', err);
      setPermissionError('Error checking for microphones.');
    } finally {
      setIsCheckingDevices(false);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      // Try with progressive constraints
      const constraintsList = [
        // First try: Basic audio
        { audio: true },
        
        // Second try: With echo cancellation
        { 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        },
        
        // Third try: With specific device if selected
        selectedDeviceId ? { 
          audio: {
            deviceId: { exact: selectedDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        } : null
      ].filter(c => c !== null);

      let stream = null;
      let lastError = null;

      // Try each constraint until one works
      for (const constraints of constraintsList) {
        try {
          console.log('Trying constraints:', constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break; // Success!
        } catch (err) {
          console.log('Constraint failed:', err);
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError || new Error('No working constraints found');
      }

      streamRef.current = stream;
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      setPermissionState('granted');
      setPermissionError('');
      
      // Refresh device list
      await checkAudioDevices();
      
      return true;
    } catch (err) {
      console.error('Microphone permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setPermissionError(
          'Microphone access is blocked. To allow:\n' +
          '1. Click the 🔒 icon in your browser\'s address bar\n' +
          '2. Find "Microphone" and select "Allow"\n' +
          '3. Refresh the page'
        );
      } else if (err.name === 'NotFoundError') {
        setPermissionError(
          'No microphone found. Quick fixes:\n' +
          '🔌 Wired: Check connection and try a different port\n' +
          '📱 Bluetooth: Go to Windows Settings → Bluetooth → Connect\n' +
          '🎧 USB: Try a different USB port\n' +
          '💻 Built-in: Check if laptop mic is enabled in Sound Settings'
        );
      } else if (err.name === 'NotReadableError') {
        setPermissionError(
          'Microphone is busy. Please:\n' +
          '1. Close other apps using the microphone (Zoom, Teams, Discord)\n' +
          '2. Restart your browser\n' +
          '3. If using Bluetooth, disconnect and reconnect'
        );
      } else {
        setPermissionError(`Error: ${err.message || 'Unknown error'}`);
      }
      return false;
    }
  };

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const hasPermission = await requestMicrophonePermission();
      
      if (hasPermission && recognitionRef.current) {
        try {
          setCurrentSpeechPoint('');
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error('Failed to start speech recognition:', err);
          setPermissionError('Failed to start speech recognition. Please try again.');
        }
      }
    }
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      mediaStreamSource.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      let hasSound = false;
      const checkInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (average > 10) {
          hasSound = true;
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        audioContext.close();
        stream.getTracks().forEach(track => track.stop());
        
        if (hasSound) {
          alert('✅ Microphone is working! Sound detected.');
        } else {
          alert('⚠️ Microphone connected but no sound detected. Please check if it\'s muted.');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Microphone test failed:', err);
      alert('❌ Microphone test failed. Please check your microphone connection.');
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
    const pointsToSave = pendingPoints.map(point => ({
      ...point,
      status: 'saved',
      savedAt: new Date().toLocaleTimeString()
    }));
    
    setMeetingPoints(prev => [...prev, ...pointsToSave]);
    setPendingPoints([]);
    setCurrentSpeechPoint('');
    setActiveTab('table');
  };

  const removePoint = (id) => {
    setMeetingPoints(prev => prev.filter(point => point.id !== id));
  };

  const saveAndExit = () => {
    if (pendingPoints.length > 0) {
      if (window.confirm('You have unsaved points. Do you want to save them to the table before exiting?')) {
        saveToTable();
      }
    }
    navigate('/', { 
      state: { 
        view: 'phase', 
        project: project,
        phase: phase 
      } 
    });
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

  const uniqueProjects = getUniqueProjects();

  const getHeaderTitle = () => {
    if (currentView.type === 'meeting') return `${project} - ${phase}`;
    if (currentView.type === 'project') return currentView.project;
    if (currentView.type === 'phase') return `${currentView.project} - ${currentView.phase}`;
    return 'Meeting Minutes';
  };

  const getDeviceIcon = () => {
    switch(deviceType) {
      case 'bluetooth': return <Bluetooth size={16} className="text-blue-500" />;
      case 'wired': return <Headphones size={16} className="text-green-500" />;
      case 'usb': return <Smartphone size={16} className="text-purple-500" />;
      default: return <Mic size={16} className="text-gray-500" />;
    }
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
              <LayoutDashboard size={20} className="mr-3" />
              <span>MinutesOfMeeting</span>
            </div>
            
            {uniqueProjects.length > 0 && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                {uniqueProjects.map(projectItem => (
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
          <div className="px-6 py-4 flex justify-center items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {getHeaderTitle()}
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate('/', { 
                state: { 
                  view: 'phase', 
                  project: project,
                  phase: phase 
                } 
              })}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <ArrowLeft size={20} />
              <span>Back to {project} - {phase}</span>
            </button>
            
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

          {/* Device Status Bar */}
          <div className="mb-4 bg-white rounded-lg shadow-sm p-3 flex items-center gap-3">
            {getDeviceIcon()}
            <span className="text-sm font-medium">
              Device: {deviceType === 'bluetooth' ? 'Bluetooth' : 
                      deviceType === 'wired' ? 'Wired Headphones' : 
                      deviceType === 'usb' ? 'USB Microphone' : 
                      deviceType === 'built-in' ? 'Built-in Microphone' : 
                      'No device detected'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}>
              {connectionStatus === 'connected' ? '✓ Connected' : '✗ Disconnected'}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {browserInfo} | {permissionState}
            </span>
          </div>

          {/* Microphone Settings Button */}
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowDeviceSettings(!showDeviceSettings)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm"
            >
              <Settings size={16} />
              <span>Advanced Settings</span>
            </button>
          </div>

          {/* Device Settings Panel */}
          {showDeviceSettings && (
            <div className="mb-6 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Audio Device Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Input Device
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={audioDevices.length === 0}
                  >
                    {audioDevices.length === 0 ? (
                      <option value="">No devices found</option>
                    ) : (
                      audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={checkAudioDevices}
                    disabled={isCheckingDevices}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isCheckingDevices ? 'animate-spin' : ''} />
                    {isCheckingDevices ? 'Scanning...' : 'Rescan Devices'}
                  </button>
                  
                  <button
                    onClick={testMicrophone}
                    disabled={audioDevices.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    <Volume2 size={16} />
                    Test Microphone
                  </button>

                  <button
                    onClick={openWindowsSoundSettings}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Settings size={16} />
                    Windows Sound Settings
                  </button>
                </div>

                {/* Device-specific guides */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Headphones size={20} className="text-blue-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Wired Headphones</h4>
                    <p className="text-xs text-gray-600">
                      • Ensure plug is fully inserted<br/>
                      • Check for 3 rings on plug<br/>
                      • Try different port (green/pink)
                    </p>
                  </div>
                  
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <Bluetooth size={20} className="text-indigo-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Bluetooth</h4>
                    <p className="text-xs text-gray-600">
                      • Must be paired in Windows<br/>
                      • Check Bluetooth is on<br/>
                      • Disconnect/reconnect if issues
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Smartphone size={20} className="text-purple-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">USB/AirPods</h4>
                    <p className="text-xs text-gray-600">
                      • Try different USB port<br/>
                      • Check Windows recognizes it<br/>
                      • Update drivers if needed
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium mb-2">Detected: {audioDevices.length} device(s)</p>
                  
                  {audioDevices.length === 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-yellow-800 mb-2">🔍 Troubleshooting:</p>
                      <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
                        <li>Open Windows Sound Settings</li>
                        <li>Under "Input", check if device appears</li>
                        <li>If not, try unplugging/reconnecting</li>
                        <li>Restart your browser</li>
                        <li>Try a different USB port</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {permissionError && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 whitespace-pre-line">{permissionError}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speech' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Speech to Text</h2>
                  <p className="text-gray-500">Works with any headset, AirPods, or built-in mic</p>
                </div>
                <button
                  onClick={toggleListening}
                  disabled={audioDevices.length === 0}
                  className={`p-6 rounded-full transition-all transform hover:scale-105 ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                      : audioDevices.length === 0
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                  }`}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-600">
                      {isListening ? 'Listening...' : 'Click microphone to start'}
                    </span>
                  </div>
                </div>
                
                {currentSpeechPoint && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">Currently speaking:</p>
                    <p className="text-gray-700 text-lg">{currentSpeechPoint}</p>
                  </div>
                )}
              </div>

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
                      <p className="text-sm mt-2">Start speaking to create points</p>
                    </div>
                  )}
                </div>
              </div>

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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Meeting Points</h2>
                  <p className="text-gray-500">Track and manage all discussion points</p>
                </div>
                {pendingPoints.length > 0 && (
                  <button
                    onClick={saveToTable}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
                  >
                    <Save size={18} />
                    <span>Save Pending Points ({pendingPoints.length})</span>
                  </button>
                )}
              </div>

              {meetingPoints.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discussion Point</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Source</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Time</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {meetingPoints.map((point, index) => (
                        <tr key={point.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{point.text}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              point.speaker === 'Manual' 
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {point.speaker}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{point.timestamp}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => removePoint(point.id)}
                              className="text-red-600 hover:text-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete point"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
                  <p className="text-gray-500 mb-2">No meeting points yet</p>
                  <p className="text-sm text-gray-400">
                    Switch to Speech to Text and start speaking, then click "Save to Table"
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MeetingPage;