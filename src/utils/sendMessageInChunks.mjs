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

        // تقسيم النص إلى أجزاء صغيرة
        for (let i = 0; i < text.length; i += MAX_LENGTH) {
            chunks.push(text.slice(i, i + MAX_LENGTH));
        }

        // إرسال كل جزء من الرسالة
        for (const chunk of chunks) {
            await client.telegram.sendMessage(chatId, chunk, { parse_mode: 'Markdown', ...options });
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // إبلاغ المستخدم بخطأ في إرسال الرسالة
        // await client.telegram.sendMessage(chatId, `حدث خطأ أثناء محاولة إرسال الرسالة: ${error.message}`, { parse_mode: 'Markdown', ...options });
    }
}
