import { GoogleGenerativeAI } from "@google/generative-ai";

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
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("يرجى التأكد من إضافة مفتاح Gemini API في ملف .env تحت اسم VITE_API_KEY");
  }

  const ai = new GoogleGenerativeAI(apiKey);

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
    const generativeModel = ai.getGenerativeModel({ model: "video-generation-001" });

    const result = await generativeModel.generateContent({
      content: [
        { inlineData: { data: imageBase64, mimeType } },
        enhancedPrompt,
      ],
    });

    // The video generation API returns a single video in the response.
    const videoUri = result.response.candidates?.[0].content.parts[0].uri;

    if (!videoUri) {
      throw new Error("فشل في إنشاء الفيديو أو لم يتم العثور على رابط الفيديو.");
    }

    // The video URI is a temporary link that does not require an API key to access.
    const videoResponse = await fetch(videoUri);

    if (!videoResponse.ok) {
      throw new Error(`فشل في تحميل الفيديو: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    return videoUrl;
  } catch (error) {
    console.error("Error in Gemini video generation service:", error);
    if (error instanceof Error && error.message.includes("API_KEY")) {
      throw new Error("مفتاح API غير صالح أو مفقود. يرجى التحقق من الإعدادات.");
    }
    throw new Error("حدث خطأ أثناء الاتصال بـ Gemini API لإنشاء الفيديو.");
  }
};