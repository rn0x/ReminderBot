import { fetchReminders } from '../db.mjs'

export default async function showCommand(ctx) {
    try {
        const reminders = await fetchReminders(ctx.chat.id);
        if (reminders.length === 0) {
            await ctx.reply('📭 لا توجد تذكيرات حالية في هذه المحادثة.');
            return;
        }

        const reminderList = reminders
            .map((r, index) => {
                const date = new Date(r.reminderTime);
                const formattedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                return `⏰ ${index + 1}- ${r.title} (${formattedTime})`;
            })
            .join('\n');

        await ctx.reply(`📅 التذكيرات الحالية:\n\n${reminderList}`);
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        await ctx.reply('❌ حدث خطأ أثناء تحميل التذكيرات. حاول لاحقًا.');
    }
}
