
import React, { useState, useCallback, useRef } from 'react';
import { generateVideoFromImageAndText } from './services/geminiService';
import { UploadIcon, FilmIcon, SparklesIcon, XCircleIcon, ArrowPathIcon } from './components/icons';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPrompt('');
    setImageBase64(null);
    setImagePreview(null);
    setMimeType('');
    setIsLoading(false);
    setLoadingMessage('');
    setVideoUrl(null);
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('الرجاء اختيار ملف صورة صالح.');
        return;
      }
      setError(null);
      setMimeType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
        setImagePreview(reader.result as string);
      };
      reader.onerror = () => {
        setError("فشل في قراءة الصورة.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt || !imageBase64 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    const loadingMessages = [
        "بدء عملية التحريك...",
        "الذكاء الاصطناعي يحلل صورتك...",
        "تصميم الحركة بكسل ببكسل...",
        "قد تستغرق هذه العملية بضع دقائق، شكراً لصبرك.",
        "تجهيز الفيديو الخاص بك...",
        "اللمسات الأخيرة..."
    ];
    
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 4000);


    try {
      const generatedUrl = await generateVideoFromImageAndText(prompt, imageBase64, mimeType);
      setVideoUrl(generatedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
    } finally {
      setIsLoading(false);
      clearInterval(interval);
    }
  }, [prompt, imageBase64, mimeType, isLoading]);

  const isButtonDisabled = !prompt || !imageBase64 || isLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full p-8">
          <ArrowPathIcon className="w-16 h-16 text-blue-400 animate-spin mb-6" />
          <p className="text-xl font-semibold text-gray-200">{loadingMessage}</p>
          <p className="text-gray-400 mt-2">يرجى الانتظار، هذه العملية قد تستغرق عدة دقائق.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center flex flex-col items-center justify-center h-full p-8 bg-red-900/20 rounded-lg">
          <XCircleIcon className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-red-300">حدث خطأ</h3>
          <p className="text-gray-300 mt-2 mb-6">{error}</p>
          <button
            onClick={resetState}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            حاول مرة أخرى
          </button>
        </div>
      );
    }

    if (videoUrl) {
      return (
        <div className="p-4 sm:p-6 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">تم إنشاء الفيديو بنجاح!</h2>
            <div className="w-full max-w-lg rounded-lg overflow-hidden shadow-2xl shadow-blue-500/20 mb-6">
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            </div>
            <button
                onClick={resetState}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-700 hover:to-teal-600 transition-all transform hover:scale-105 duration-300 flex items-center gap-2 text-lg"
            >
                <SparklesIcon className="w-6 h-6" />
                إنشاء فيديو جديد
            </button>
        </div>
      );
    }

    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-4 sm:p-6 space-y-6">
        <div>
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-blue-500 transition-colors duration-300 bg-gray-800/50">
              {imagePreview ? (
                <img src={imagePreview} alt="معاينة الصورة" className="max-h-60 rounded-lg object-contain" />
              ) : (
                <div className="space-y-1 text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                  <div className="flex text-sm text-gray-400">
                    <p className="pl-1">قم برفع صورة</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
          </label>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageSelect} ref={fileInputRef}/>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
            اكتب وصف الحركة
          </label>
          <div className="mt-1">
            <textarea
              id="prompt"
              name="prompt"
              rows={4}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-500"
              placeholder="مثال: اجعل الشخص في الصورة يمشي إلى الأمام، أو أضف شبحًا أبيض يظهر ثم يختفي..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white transition-all duration-300 ${
              isButtonDisabled
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 transform hover:scale-105'
            }`}
          >
            <FilmIcon className="w-6 h-6" />
            حوّل إلى فيديو
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3">
                <SparklesIcon className="w-10 h-10 text-blue-400"/>
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400">
                    محرك الصور
                </h1>
            </div>
            <p className="mt-3 text-lg text-gray-400">حوّل صورك إلى فيديوهات مذهلة باستخدام الذكاء الاصطناعي</p>
        </div>
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl shadow-blue-900/20 border border-gray-700">
            <div className="min-h-[450px] flex flex-col justify-center">
             {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
