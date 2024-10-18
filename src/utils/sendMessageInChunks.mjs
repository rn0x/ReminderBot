/**
 * Sends a message in chunks to a Telegram chat.
 * @param {Object} client - The Telegram client instance.
 * @param {string} chatId - The ID of the chat where the message will be sent.
 * @param {string} text - The message text to be sent.
 * @param {Object} [options={}] - Additional options for the sendMessage method.
 */
export async function sendMessageInChunks(client, chatId, text, options = {}) {
    const MAX_LENGTH = 4096; // الحد الأقصى لطول الرسالة في تيليجرام
    const chunks = [];

    try {
        // إصلاح النص قبل تقسيمه
        const fixedText = fixMarkdownErrors(text);

        // تقسيم النص إلى أجزاء صغيرة
        for (let i = 0; i < fixedText.length; i += MAX_LENGTH) {
            chunks.push(fixedText.slice(i, i + MAX_LENGTH));
        }

        // إرسال كل جزء من الرسالة
        for (const chunk of chunks) {
            await client.telegram.sendMessage(chatId, chunk, { parse_mode: 'Markdown', ...options });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // إبلاغ المستخدم بخطأ في إرسال الرسالة
        await client.telegram.sendMessage(chatId, `حدث خطأ أثناء محاولة إرسال الرسالة: ${error.message}`, { parse_mode: 'Markdown', ...options });
    }
}

/**
 * Fixes common Markdown errors in a given text.
 * @param {string} text - The text to fix.
 * @returns {string} - The fixed text.
 */
const fixMarkdownErrors = (text) => {
    // 1. إزالة علامات غير مغلقة
    text = text
        .replace(/(\*{1,2}|_{1,2})(?=[^*_]*$)/g, '$1') // إصلاح النجوم وعلامات السطر السفلي
        .replace(/`{1,3}(?=[^`]*$)/g, '`'); // إصلاح علامات الكود

    // 2. معالجة علامات الاقتباس
    text = text.replace(/"(.*?)"/g, '“$1”'); // تحويل علامات الاقتباس المفردة إلى مزدوجة
    text = text.replace(/'(.*?)'/g, '‘$1’'); // تحويل علامات الاقتباس المفردة إلى شكل أفضل

    // 3. إضافة مسافات قبل علامات الترقيم
    text = text.replace(/([.!?]+)/g, ' $1'); // إضافة مسافة قبل علامات الترقيم

    // 4. معالجة الأجزاء السفلية للخطوط
    text = text.replace(/(_{1,2})(?!\w)/g, '$1 '); // إصلاح السطر السفلي إذا كان غير متبوع بكلمة

    // 5. إزالة أي تنسيق غير مرغوب فيه
    text = text.replace(/[\*\~\`]{1,2} +/g, ''); // إزالة أي علامات تنسيق متكررة متبوعة بمسافة

    // 6. معالجة الروابط
    text = text.replace(/\[([^\]]+)\]\s*\(([^)]+)\)/g, '[$1]($2)'); // إصلاح تنسيق الروابط

    // 7. إزالة علامات غير مدعومة
    text = text.replace(/~~(.*?)~~/g, '$1'); // إزالة علامات الخط المائل
    text = text.replace(/`{3,}/g, ''); // إزالة علامات الكود المفرطة
    text = text.replace(/_(?=\s|$)/g, ''); // إزالة السطر السفلي غير المتبوع بكلمة

    // 8. إغلاق علامات الاقتباس
    const quotePattern = /((“.*?”)|('.*?'))/g;
    const matches = text.match(quotePattern);
    if (matches) {
        for (const match of matches) {
            if (!match.endsWith('”') && !match.endsWith('’')) {
                text = text.replace(match, match + '”');
            }
        }
    }

    // 9. التأكد من بقاء علامات Markdown المدعومة فقط
    text = text.replace(/(?<!\\)(\*|_)(?=\S)(.*?)(?<!\S)(\*|_)/g, '$1$2$3'); // التأكد من أن علامات النجمة أو السفلية متبوعة بكلمات

    return text;
};
