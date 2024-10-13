export async function sendMessageInChunks(bot, chatId, text, options = {}) {
    const maxLength = 4096; // الحد الأقصى لطول الرسالة في تيليجرام
    const chunks = [];

    // تقسيم النص إلى أجزاء صغيرة
    for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.slice(i, i + maxLength));
    }

    // إرسال كل جزء من الرسالة
    for (const chunk of chunks) {
        try {
            await bot.telegram.sendMessage(chatId, chunk, { parse_mode: 'Markdown', ...options });
        } catch (error) {
            console.error('Error sending message chunk:', error);
            // إبلاغ المستخدم بخطأ في إرسال الرسالة
            await bot.telegram.sendMessage(chatId, `حدث خطأ أثناء محاولة إرسال الرسالة: ${error.message}`, { parse_mode: 'Markdown', ...options });
            break; // الخروج من الحلقة في حال حدوث خطأ
        }
    }
}
