import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Sprout, Store, Sun, Cloud, Droplets } from 'lucide-react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';

// Weather interface
interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  isLoading: boolean;
  error: string | null;
}

// Mock farming responses
const mockResponses = {
  en: {
    default: "I'm here to help with your farming questions. Could you please be more specific?",
    keywords: {
      pest: "For pest control, I recommend these organic solutions:\n1. Neem oil spray\n2. Companion planting\n3. Natural predators like ladybugs\n4. Organic pest traps",
      water: "For optimal water management:\n1. Use drip irrigation\n2. Water early morning or evening\n3. Mulch to retain moisture\n4. Monitor soil moisture regularly",
      soil: "To improve soil health:\n1. Add organic compost\n2. Practice crop rotation\n3. Use green manure\n4. Maintain proper pH levels",
      crop: "For better crop yield:\n1. Choose season-appropriate crops\n2. Maintain proper spacing\n3. Regular weeding\n4. Balanced nutrition",
      organic: "Organic farming best practices:\n1. Use natural fertilizers\n2. Practice crop rotation\n3. Implement biological pest control\n4. Maintain soil health naturally"
    }
  },
  hi: {
    default: "मैं आपके कृषि प्रश्नों में मदद करने के लिए यहां हूं। कृपया अधिक विशिष्ट हों?",
    keywords: {
      pest: "कीट नियंत्रण के लिए, मैं इन जैविक समाधानों की सलाह देता हूं:\n1. नीम तेल स्प्रे\n2. सहयोगी खेती\n3. लेडीबग जैसे प्राकृतिक शिकारी\n4. जैविक कीट जाल",
      water: "पानी के उचित प्रबंधन के लिए:\n1. ड्रिप सिंचाई का उपयोग करें\n2. सुबह या शाम को पानी दें\n3. नमी बनाए रखने के लिए मल्च का उपयोग करें\n4. मिट्टी की नमी की नियमित जांच करें",
      soil: "मिट्टी की गुणवत्ता सुधारने के लिए:\n1. जैविक खाद डालें\n2. फसल चक्र अपनाएं\n3. हरी खाद का उपयोग करें\n4. उचित पीएच स्तर बनाए रखें",
      crop: "बेहतर फसल उपज के लिए:\n1. मौसम के अनुसार फसल चुनें\n2. उचित दूरी बनाए रखें\n3. नियमित निराई करें\n4. संतुलित पोषण",
      organic: "जैविक खेती के सर्वोत्तम तरीके:\n1. प्राकृतिक उर्वरक का उपयोग करें\n2. फसल चक्र अपनाएं\n3. जैविक कीट नियंत्रण\n4. मिट्टी की प्राकृतिक स्वास्थ्य बनाए रखें"
    }
  }
};

// Mock data for demonstration
const organicPesticideSuppliers = [
  {
    name: "Organic India Supplies",
    nameHindi: "ऑर्गेनिक इंडिया सप्लाई",
    location: "Delhi/दिल्ली",
    contact: "+91 98XXXXXXXX",
    rating: 4.8,
    specialties: ["Neem Products", "Herbal Pesticides"]
  },
  {
    name: "Green Earth Pesticides",
    nameHindi: "ग्रीन अर्थ कीटनाशक",
    location: "Mumbai/मुंबई",
    contact: "+91 98XXXXXXXX",
    rating: 4.6,
    specialties: ["Bio Fertilizers", "Organic Sprays"]
  }
];

interface Message {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

function App() {
  const [language, setLanguage] = useState<'en' | 'hi'>('hi');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: language === 'en' 
        ? "Welcome to Krishi Sakhi! How can I help you with your farming today?"
        : "कृषि सखी में आपका स्वागत है! आज मैं आपकी खेती में कैसे मदद कर सकता हूं?",
      isUser: false
    }
  ]);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    isLoading: true,
    error: null
  });

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      if (!isMounted) return;

      try {
        setWeather(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await axios.get(
          `${import.meta.env.VITE_OPENWEATHER_API_URL}Delhi&appid=${import.meta.env.VITE_OPENWEATHER_API_KEY}`
        );
        
        if (!isMounted) return;

        setWeather({
          temperature: Math.round(response.data.main.temp),
          humidity: response.data.main.humidity,
          rainfall: response.data.rain?.['1h'] || 0,
          isLoading: false,
          error: null
        });
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Error fetching weather:', error);
        setWeather(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch weather data'
        }));
      }
    };

    fetchWeather();
    // Refresh weather data every 5 minutes
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getMockResponse = (userQuery: string) => {
    const responses = mockResponses[language];
    const query = userQuery.toLowerCase();
    
    for (const [key, response] of Object.entries(responses.keywords)) {
      if (query.includes(key)) {
        return response;
      }
    }
    
    return responses.default;
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = query;
    setQuery('');
    resetTranscript();
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setMessages(prev => [...prev, { text: "...", isUser: false, isLoading: true }]);
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = getMockResponse(userMessage);
    setMessages(prev => prev.slice(0, -1).concat({ text: response, isUser: false }));
    setIsLoading(false);
  };

  const toggleMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: language === 'en' ? 'en-IN' : 'hi-IN' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80')] bg-cover bg-fixed">
      <div className="min-h-screen backdrop-blur-sm bg-green-50/80">
        {/* Header */}
        <header className="bg-gradient-to-r from-green-700 to-green-600 text-white p-4 sticky top-0 z-50 shadow-lg">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <Sprout size={28} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">
                {language === 'en' ? 'Krishi Sakhi' : 'कृषि सखी'}
              </h1>
            </div>
            <select
              className="bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-colors"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi')}
            >
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Weather Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {weather.error ? (
              <div className="col-span-full bg-red-50 text-red-600 p-4 rounded-lg text-center">
                {weather.error}
              </div>
            ) : (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <Sun className="text-yellow-500 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="font-bold">
                      {weather.isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${weather.temperature}°C`
                      )}
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <Cloud className="text-gray-500 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Humidity</p>
                    <p className="font-bold">
                      {weather.isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${weather.humidity}%`
                      )}
                    </p>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <Droplets className="text-blue-500 flex-shrink-0" size={24} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Rainfall</p>
                    <p className="font-bold">
                      {weather.isLoading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${weather.rainfall}mm`
                      )}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main chat interface */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              {language === 'en' 
                ? 'Ask your farming questions'
                : 'अपने कृषि संबंधी प्रश्न पूछें'}
            </h2>
            
            <div className="bg-gradient-to-b from-green-50 to-white rounded-xl p-4 h-[50vh] mb-6 overflow-y-auto shadow-inner">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${
                    message.isUser
                      ? 'bg-green-600 text-white ml-auto'
                      : 'bg-green-100 text-green-800'
                  } rounded-lg p-3 max-w-[85%] sm:max-w-[75%] mb-4 ${
                    message.isUser ? 'ml-auto' : 'mr-auto'
                  } whitespace-pre-wrap shadow-sm`}
                >
                  {message.isLoading ? (
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce delay-200" />
                    </div>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-col sm:flex-row">
              {browserSupportsSpeechRecognition && (
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-full shadow-lg transition-all hover:scale-105 ${
                    listening 
                      ? 'bg-red-500 text-white ring-4 ring-red-200' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {listening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              )}
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'en' ? 'Type your question...' : 'अपना प्रश्न लिखें...'}
                  className="flex-1 border-2 border-green-100 rounded-full px-4 py-3 shadow-inner focus:outline-none focus:border-green-300 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!query.trim() || isLoading}
                  className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-green-600"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Suppliers Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4">
            <button
              onClick={() => setShowSuppliers(!showSuppliers)}
              className="flex items-center gap-3 w-full justify-between hover:bg-green-50 p-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Store className="text-green-600" size={24} />
                </div>
                <h2 className="text-xl font-semibold text-green-800">
                  {language === 'en'
                    ? 'Organic Pesticide Suppliers'
                    : 'जैविक कीटनाशक आपूर्तिकर्ता'}
                </h2>
              </div>
              <span className="text-green-600 text-2xl">{showSuppliers ? '▼' : '▶'}</span>
            </button>

            {showSuppliers && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {organicPesticideSuppliers.map((supplier, index) => (
                  <div 
                    key={index} 
                    className="border border-green-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-green-800">
                        {language === 'en' ? supplier.name : supplier.nameHindi}
                      </h3>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        ★ {supplier.rating}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{supplier.location}</p>
                    <p className="text-gray-600 mb-2">{supplier.contact}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {supplier.specialties.map((specialty, idx) => (
                        <span 
                          key={idx}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;