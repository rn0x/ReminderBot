import checkIfAdmin from '../utils/checkIfAdmin.mjs';
import { Scenes } from 'telegraf';

// إنشاء المشهد الخاص بحذف التذكير
const deleteReminderScene = new Scenes.BaseScene('deleteReminder');

// عند دخول المشهد
deleteReminderScene.enter(async (ctx) => {
    const isAdmin = await checkIfAdmin(ctx);
    if (!isAdmin) {
        await ctx.reply('❌ ليس لديك صلاحيات لحذف التذكيرات.');
        return ctx.scene.leave();
    }

    // عرض قائمة التذكيرات للمستخدم
    try {
        const reminders = await getRemindersByChatId(ctx.chat.id);
        if (reminders.length === 0) {
            await ctx.reply('📭 لا توجد تذكيرات متاحة للحذف.');
            return ctx.scene.leave();
        }

        const reminderList = reminders
            .map((r, index) => {
                const date = new Date(r.reminderTime);
                const formattedTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

                return `⏰ ${index + 1}- ${r.title} (${formattedTime})`;
            })
            .join('\n');

        await ctx.reply(`🗑️ اختر رقم التذكير الذي تريد حذفه:\n\n${reminderList}`);
        ctx.session.reminders = reminders; // تخزين التذكيرات في الجلسة
    } catch (error) {
        console.error('Failed to fetch reminders:', error);
        await ctx.reply('❌ حدث خطأ أثناء تحميل التذكيرات. حاول لاحقًا.');
        ctx.scene.leave();
    }
});

// استقبال رقم التذكير للحذف
deleteReminderScene.on('text', async (ctx) => {
    const reminders = ctx.session.reminders;
    const index = parseInt(ctx.message.text) - 1;

    if (isNaN(index) || index < 0 || index >= reminders.length) {
        return await ctx.reply('❌ رقم غير صحيح. حاول مرة أخرى:');
    }

    const reminder = reminders[index];

    try {
        await deleteReminderFromDatabase(reminder.id);
        await ctx.reply(`✅ تم حذف التذكير: "${reminder.title}" بنجاح!`);
    } catch (error) {
        console.error('Failed to delete reminder:', error);
        await ctx.reply('❌ حدث خطأ أثناء حذف التذكير. حاول لاحقًا.');
    }

    ctx.scene.leave(); // إنهاء المشهد
});

// التعامل مع الإلغاء
deleteReminderScene.command('cancel', async (ctx) => {
    await ctx.reply('❌ تم إلغاء عملية الحذف.');
    ctx.scene.leave();
});

// وظيفة لجلب التذكيرات من قاعدة البيانات
const getRemindersByChatId = async (chatId) => {
    const { fetchReminders } = await import('../db.mjs');
    return await fetchReminders(chatId);
};

// وظيفة لحذف التذكير من قاعدة البيانات
const deleteReminderFromDatabase = async (reminderId) => {
    const { removeReminder } = await import('../db.mjs');
    await removeReminder(reminderId);
};

export { deleteReminderScene };
