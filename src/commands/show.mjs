import { fetchReminders } from '../db.mjs';
import { sendMessageInChunks } from '../utils/sendMessageInChunks.mjs';

export default async function showCommand(ctx) {
    try {
        const reminders = await fetchReminders(ctx.chat.id);
        if (reminders.length === 0) {
            await ctx.reply('📭 لا توجد تذكيرات حالية في هذه المحادثة.');
            return;
        }        

        const reminderList = reminders
            .map((r, index) => {
                const date = r.date ? new Date(r.date) : null; // التحقق من وجود التاريخ
                const timeParts = r.time.split(':'); // تقسيم الوقت إلى الساعات والدقائق
                const formattedTime = `${String(timeParts[0]).padStart(2, '0')}:${String(timeParts[1]).padStart(2, '0')}`; // تنسيق الوقت

                // تنسيق التاريخ إذا كان موجودًا
                const formattedDate = date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : 'غير محدد';

                // تحديد نوع التكرار
                let recurrenceText;                                
                if (r.isRecurring) {                    
                    recurrenceText = r.dayOfWeek === 0
                        ? '🗓️ كل يوم'
                        : `🗓️ كل ${['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][r.dayOfWeek - 1]}`;
                } else {
                    recurrenceText = '🔄 لمرة واحدة';
                }

                return `⏰ ${index + 1} - **${r.title}**\n📅 التاريخ: ${formattedDate}\n🕒 الوقت: ${formattedTime}\n${recurrenceText}\n`;
            })
            .join('\n');

        // await ctx.reply(`📅 **التذكيرات الحالية:**\n\n${reminderList}`, { parse_mode: 'Markdown' });
        await sendMessageInChunks(ctx, ctx.chat.id, `📅 **التذكيرات الحالية:**\n\n${reminderList}`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        await ctx.reply('❌ حدث خطأ أثناء تحميل التذكيرات. حاول لاحقًا.');
    }
}
