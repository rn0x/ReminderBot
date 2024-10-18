import checkIfAdmin from '../utils/checkIfAdmin.mjs';
import { Scenes } from 'telegraf';

const addReminderScene = new Scenes.BaseScene('addReminder');

// عند الدخول إلى المشهد
addReminderScene.enter(async (ctx) => {
    const isAdmin = await checkIfAdmin(ctx);
    if (!isAdmin) {
        await ctx.reply('❌ ليس لديك صلاحيات لإضافة المواعيد.');
        return ctx.scene.leave();
    }
    await ctx.reply('🔁 هل تريد جعل التذكير متكررًا؟ (نعم / لا)');
    ctx.session.reminder = {}; // تهيئة الكائن لحفظ بيانات التذكير
});

// استقبال الردود بالتسلسل
addReminderScene.on('text', async (ctx) => {
    const input = ctx.message.text.trim().toLowerCase();

    if (ctx.session.reminder.isRecurring === undefined) {
        if (input === 'نعم') {
            ctx.session.reminder.isRecurring = true;
            await ctx.reply('📅 اختر يوم التذكير (0 = كل يوم، 1 = السبت، ...، 7 = الجمعة):');
        } else if (input === 'لا') {
            ctx.session.reminder.isRecurring = false;
            await ctx.reply('📅 أدخل تاريخ التذكير (YYYY-MM-DD):');
        } else {
            return await ctx.reply('❌ اختر "نعم" أو "لا" فقط.');
        }
    }
    else if (ctx.session.reminder.isRecurring && ctx.session.reminder.dayOfWeek === undefined) {
        const day = parseInt(input);
        if (isNaN(day) || day < 0 || day > 7) {
            return await ctx.reply('❌ أدخل رقمًا بين 0 و 7.');
        }

        ctx.session.reminder.dayOfWeek = day; // يتم تخزين 0 كل يوم
        await ctx.reply('⏰ أدخل وقت التذكير (HH:mm):');
    }
    else if (!ctx.session.reminder.isRecurring && !ctx.session.reminder.date) {
        const date = new Date(input);
        if (isNaN(date)) {
            return await ctx.reply('❌ تنسيق التاريخ غير صحيح. حاول مرة أخرى (YYYY-MM-DD):');
        }

        ctx.session.reminder.date = input;
        await ctx.reply('⏰ أدخل وقت التذكير (HH:mm):');
    }
    else if (!ctx.session.reminder.time) {
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timePattern.test(input)) {
            return await ctx.reply('❌ أدخل الوقت بصيغة HH:mm.');
        }

        ctx.session.reminder.time = input;
        await ctx.reply('📋 أدخل عنوان التذكير:');
    }
    else if (!ctx.session.reminder.title) {
        ctx.session.reminder.title = input;
        await ctx.reply('📝 أدخل رسالة التذكير:');
    }
    else {
        ctx.session.reminder.message = input;

        const msgDayOfWeek = ctx.session.reminder.dayOfWeek === 0
            ? '🗓️ كل يوم'
            : `🗓️ كل ${['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'][ctx.session.reminder.dayOfWeek - 1]}`;

        let summaryMessage = `📋 ملخص التذكير:\n`;
        summaryMessage += `- <b>العنوان</b>: ${ctx.session.reminder.title}\n`;
        summaryMessage += `- <b>الرسالة</b>: ${ctx.session.reminder.message}\n`;
        summaryMessage += `- <b>التاريخ</b>: ${ctx.session.reminder.isRecurring ? 'متكرر' : ctx.session.reminder.date}\n`;
        summaryMessage += `- <b>الوقت</b>: ${ctx.session.reminder.time}\n`;
        summaryMessage += `- <b>يوم الأسبوع</b>: ${ctx.session.reminder.isRecurring ? msgDayOfWeek : 'غير محدد'}`;

        // إرسال الرسالة
        await ctx.reply(summaryMessage, { parse_mode: 'HTML' });

        // إعداد الحقول للتخزين
        const {
            isRecurring, date, dayOfWeek, time, title, message,
        } = ctx.session.reminder;

        try {
            await addReminderToDatabase(
                ctx.chat.id,
                time,
                title,
                message,
                Number(isRecurring),
                date || null,
                dayOfWeek
            );

            await ctx.reply('✅ تم إضافة التذكير بنجاح!');
        } catch (error) {
            console.error('Failed to add reminder:', error);
            await ctx.reply('❌ حدث خطأ أثناء إضافة التذكير. حاول مرة أخرى لاحقًا.');
        }

        // إنهاء المشهد
        return ctx.scene.leave();
    }
});

// التعامل مع الإلغاء
addReminderScene.command('cancel', async (ctx) => {
    await ctx.reply('❌ تم إلغاء إضافة التذكير.');
    ctx.scene.leave();
});

// وظيفة لإضافة اتذكير إلى قاعدة البيانات
const addReminderToDatabase = async (
    chatId, time, title, message, isRecurring, date, dayOfWeek
) => {

    const { addReminder } = await import('../db.mjs');
    await addReminder(chatId, time, title, message, isRecurring, date, dayOfWeek);

};

export { addReminderScene };