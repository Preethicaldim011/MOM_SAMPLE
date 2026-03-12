import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Home, ArrowLeft, Save, Trash2 } from 'lucide-react';

function MeetingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { meetingId, project, phase, meetingData, existingPoints = [] } = location.state || {};
  
  const [activeTab, setActiveTab] = useState('speech');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [meetingPoints, setMeetingPoints] = useState(existingPoints);
  const [currentPoint, setCurrentPoint] = useState('');
  
  const recognitionRef = useRef(null);
  const transcriptRef = useRef(null);

  useEffect(() => {
    // Load existing points if any
    if (existingPoints.length > 0) {
      setMeetingPoints(existingPoints);
    }
  }, [existingPoints]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
          // Add as a new meeting point automatically when speech is detected
          const newPoint = {
            id: Date.now() + Math.random(),
            text: finalTranscript.trim(),
            timestamp: new Date().toLocaleTimeString(),
            speaker: 'Speech'
          };
          
          setMeetingPoints(prev => [...prev, newPoint]);
          
          // Auto-scroll to bottom of transcript
          setTimeout(() => {
            if (transcriptRef.current) {
              transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
            }
          }, 100);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Save points to localStorage whenever they change
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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const addManualPoint = () => {
    if (currentPoint.trim()) {
      const newPoint = {
        id: Date.now(),
        text: currentPoint.trim(),
        timestamp: new Date().toLocaleTimeString(),
        speaker: 'Manual'
      };
      setMeetingPoints(prev => [...prev, newPoint]);
      setCurrentPoint('');
    }
  };

  const removePoint = (id) => {
    setMeetingPoints(prev => prev.filter(point => point.id !== id));
  };

  const saveAndExit = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-800">MOM</h1>
        </div>
        <nav className="mt-6">
          <a 
            href="#" 
            onClick={() => navigate('/')}
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home size={20} className="mr-3" />
            <span>Dashboard</span>
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="mr-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <h2 className="text-xl font-semibold text-gray-800">MOM</h2>
            </div>
            
            <button
              onClick={saveAndExit}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save size={18} />
              <span>Save & Exit</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Meeting Info Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{project} - {phase}</h1>
                <p className="text-blue-100">
                  {meetingData?.date} at {meetingData?.time} • Attendees: {meetingData?.attendees}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">{meetingPoints.length}</p>
                <p className="text-blue-100">Points Recorded</p>
              </div>
            </div>
          </div>

          {/* Tab Headers */}
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

          {/* Speech to Text View */}
          {activeTab === 'speech' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Speech to Text</h2>
                  <p className="text-gray-500">Speak naturally and your words will appear below</p>
                </div>
                <button
                  onClick={toggleListening}
                  className={`p-6 rounded-full transition-all transform hover:scale-105 ${
                    isListening 
                      ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
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
                      {isListening ? 'Listening...' : 'Microphone off'}
                    </span>
                  </div>
                  {isListening && (
                    <span className="text-xs text-gray-400 animate-pulse">
                      Speaking in real-time
                    </span>
                  )}
                </div>
                <div 
                  ref={transcriptRef}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto border-2 border-gray-100"
                >
                  {transcript ? (
                    <p className="text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                      {transcript}
                    </p>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Mic size={48} className="mb-4 opacity-20" />
                      <p className="text-center">Click the microphone button and start speaking</p>
                      <p className="text-sm mt-2">Your speech will appear here in real-time</p>
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
                    value={currentPoint}
                    onChange={(e) => setCurrentPoint(e.target.value)}
                    placeholder="Type a meeting point and press Enter..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    onKeyPress={(e) => e.key === 'Enter' && addManualPoint()}
                  />
                  <button
                    onClick={addManualPoint}
                    disabled={!currentPoint.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                  >
                    Add Point
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Table View */}
          {activeTab === 'table' && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Meeting Points</h2>
                  <p className="text-gray-500">Track and manage all discussion points</p>
                </div>
              </div>

              {/* Meeting Points Table */}
              {meetingPoints.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                          #
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discussion Point
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                          Source
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                          Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {meetingPoints.map((point, index) => (
                        <tr key={point.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {point.text}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              point.speaker === 'Manual' 
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {point.speaker}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {point.timestamp}
                          </td>
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
                    Switch to Speech to Text and start speaking, or add points manually
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