
import React, { useState, useCallback } from 'react';
import { Tone } from './types';
import type { SocialPlatform, GenerationResult, AspectRatio, PostContent } from './types';
import { generateSocialPosts, generateImage } from './services/geminiService';
import { LinkedInIcon, TwitterIcon, InstagramIcon, SparkleIcon } from './components/icons';

const ToneSelector: React.FC<{ selectedTone: Tone; onSelectTone: (tone: Tone) => void }> = ({ selectedTone, onSelectTone }) => {
  return (
    <div className="flex justify-center space-x-2 sm:space-x-4">
      {(Object.keys(Tone) as Array<keyof typeof Tone>).map((key) => (
        <button
          key={key}
          onClick={() => onSelectTone(Tone[key])}
          className={`px-4 py-2 text-sm sm:text-base sm:px-6 sm:py-2.5 font-semibold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 ${
            selectedTone === Tone[key]
              ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {Tone[key]}
        </button>
      ))}
    </div>
  );
};

const ImagePlaceholder: React.FC<{aspectRatio: AspectRatio}> = ({aspectRatio}) => {
    const ratioClass = {
        '1:1': 'aspect-square',
        '4:3': 'aspect-[4/3]',
        '16:9': 'aspect-video',
    }[aspectRatio];

    return (
        <div className={`w-full bg-gray-700 animate-pulse ${ratioClass}`}>
            <div className="flex items-center justify-center h-full text-gray-500">
                <SparkleIcon className="w-12 h-12" />
            </div>
        </div>
    );
};

const ResultCard: React.FC<{ result: GenerationResult }> = ({ result }) => {
  const platformConfig: Record<SocialPlatform, { icon: React.ReactNode; aspectRatio: AspectRatio; color: string }> = {
    LinkedIn: { icon: <LinkedInIcon className="w-6 h-6" />, aspectRatio: '4:3', color: 'text-blue-400' },
    Twitter: { icon: <TwitterIcon className="w-6 h-6" />, aspectRatio: '16:9', color: 'text-white' },
    Instagram: { icon: <InstagramIcon className="w-6 h-6" />, aspectRatio: '1:1', color: 'text-pink-500' },
  };
  const { icon, aspectRatio, color } = platformConfig[result.platform];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-purple-500/50">
      <div className={`flex items-center space-x-3 p-4 border-b border-gray-700 ${color}`}>
        {icon}
        <h3 className="font-bold text-lg">{result.platform}</h3>
      </div>
      {result.imageUrl ? (
        <img src={result.imageUrl} alt={`${result.platform} post visual`} className="w-full object-cover" />
      ) : (
        <ImagePlaceholder aspectRatio={aspectRatio} />
      )}
      <div className="p-5 text-gray-300">
        <p className="whitespace-pre-wrap font-light">{result.text}</p>
      </div>
    </div>
  );
};

export default function App() {
  const [idea, setIdea] = useState<string>('');
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getAspectRatioForPlatform = (platform: SocialPlatform): AspectRatio => {
    switch (platform) {
      case 'LinkedIn': return '4:3';
      case 'Twitter': return '16:9';
      case 'Instagram': return '1:1';
      default: return '1:1';
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) {
      setError('Please enter an idea.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const postContents = await generateSocialPosts(idea, tone);

      const initialResults: GenerationResult[] = postContents.map(content => ({
        ...content,
        imageUrl: '',
      }));
      setResults(initialResults);

      const imagePromises = postContents.map(content =>
        generateImage(content.image_prompt, getAspectRatioForPlatform(content.platform))
      );
      
      const imageUrls = await Promise.all(imagePromises);

      const finalResults: GenerationResult[] = initialResults.map((result, index) => ({
        ...result,
        imageUrl: imageUrls[index],
      }));
      setResults(finalResults);

    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [idea, tone]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center my-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Cross-Platform Content Genie
            </span>
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Instantly craft and visualize social media posts for all major platforms from a single idea.
          </p>
        </header>

        <main>
          <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-3xl mx-auto border border-gray-700">
            <div className="space-y-6">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Enter your content idea... e.g., 'Launch a new productivity app'"
                className="w-full h-28 p-4 bg-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition text-lg resize-none"
                disabled={loading}
              />
              <ToneSelector selectedTone={tone} onSelectTone={setTone} />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading ? (
                   <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                   </>
                ) : (
                  <>
                    <SparkleIcon className="w-5 h-5 mr-2" />
                    Generate Content
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-center mt-8 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg max-w-3xl mx-auto">
              <strong>Error:</strong> {error}
            </div>
          )}

          {results && (
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {results.map((result) => (
                <ResultCard key={result.platform} result={result} />
              ))}
            </div>
          )}

           {!loading && !results && !error && (
            <div className="text-center mt-12 text-gray-500">
                <p>Your generated content will appear here.</p>
            </div>
           )}

        </main>
      </div>
    </div>
  );
}
