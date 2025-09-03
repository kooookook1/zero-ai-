import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A utility function to introduce a delay.
 * @param ms - The delay in milliseconds.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a video from a base image and a text prompt using the Gemini API.
 * @param prompt - The text prompt describing the desired animation.
 * @param imageBase64 - The base64 encoded string of the source image.
 * @param mimeType - The MIME type of the source image (e.g., 'image/jpeg').
 * @returns A promise that resolves to a local URL for the generated video blob.
 */
export const generateVideoFromImageAndText = async (
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> => {
    // Enhanced prompt to guide the AI for higher realism and accuracy.
    const enhancedPrompt = `
مهمتك هي إنشاء فيديو واقعي للغاية وعالي الدقة من الصورة والوصف التاليين. انتبه جيدًا للتفاصيل التالية:
1.  **الواقعية المطلقة:** يجب أن تبدو الحركة طبيعية تمامًا وغير قابلة للتمييز عن فيديو حقيقي. يجب أن تكون الفيزياء والضوء والظلال متسقة.
2.  **الحفاظ على الهوية:** حافظ على جميع عناصر الصورة الأصلية (الأشخاص، الأشياء، الخلفية) بدقة تامة. لا تقم بإضافة أو إزالة أو تشويه أي عنصر ما لم يُطلب منك ذلك صراحةً في وصف المستخدم.
3.  **التشريح الصحيح:** عند تحريك البشر أو الحيوانات، تأكد من أن الحركة تتبع التشريح الطبيعي بدقة. تجنب تمامًا أي تشوهات مثل الأطراف الإضافية أو المفاصل غير الطبيعية أو الأشكال الغريبة.
4.  **التنفيذ الدقيق للوصف:** نفذ وصف المستخدم بدقة متناهية. إذا طلب المستخدم حركة محددة، فقم بتنفيذ تلك الحركة فقط دون إضافات غير ضرورية.
5.  **العلامة المائية:** ضع علامة مائية نصية صغيرة وغير مزعجة تحمل النص "ZERO AI". يجب أن تكون هذه العلامة المائية شبه شفافة وموجودة **حصريًا** في الزاوية اليمنى السفلية من إطار الفيديو طوال مدته. لا تضعها في المنتصف أبداً.

وصف المستخدم: "${prompt}"
`.trim();

  try {
    // Start the video generation operation
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: enhancedPrompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
      },
    });

    // Poll for the operation result
    while (!operation.done) {
      await sleep(10000); // Wait 10 seconds before checking the status again
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error("فشل في إنشاء الفيديو أو لم يتم العثور على رابط التنزيل.");
    }
    
    const downloadLink = operation.response.generatedVideos[0].video.uri;

    // The download link requires the API key to be appended for authentication.
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);

    if (!videoResponse.ok) {
        throw new Error(`فشل في تحميل الفيديو: ${videoResponse.statusText}`);
    }

    // Convert the video response to a blob and create a local URL
    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return videoUrl;
  } catch (error) {
    console.error("Error in Gemini video generation service:", error);
    if (error instanceof Error) {
        if(error.message.includes('API_KEY')) {
             throw new Error("مفتاح API غير صالح أو مفقود. يرجى التحقق من الإعدادات.");
        }
    }
    throw new Error("حدث خطأ أثناء الاتصال بـ Gemini API لإنشاء الفيديو.");
  }
};