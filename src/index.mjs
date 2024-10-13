import * as dotenv from 'dotenv';
dotenv.config();
import { client } from './client.mjs';
import './db.mjs'; // إدارة قاعدة البيانات
import startReminderService from './startReminderService.mjs';
import updateAdminsPeriodically from './utils/updateAdminsPeriodically.mjs';


const getCurrentFormattedTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // الأشهر تبدأ من 0 لذا نضيف 1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const printBotInfo = async () => {
    try {
        const botInfo = await client.telegram.getMe(); // جلب معلومات البوت
        const currentTime = getCurrentFormattedTime(); // تنسيق الوقت الحالي

        console.log(`
==============================================
🤖 BOT INFO
----------------------------------------------
🚀 Bot Name     : ${botInfo.first_name || 'N/A'}
👤 Bot Username : @${botInfo.username || 'N/A'}
🆔 Bot ID       : ${botInfo.id}
🕒 Current Time : ${currentTime}
----------------------------------------------
The bot is now running successfully and ready!
Press Ctrl + C to stop the bot safely.
==============================================
        `);
    } catch (error) {
        console.error('Error fetching bot info:', error.message);
    }
};

// بدء خدمات البوت
await startReminderService(client);
await updateAdminsPeriodically();

client.launch();
printBotInfo();

// تمكين الإغلاق الآمن للروبوت
process.once('SIGINT', () => client.stop('SIGINT'));
process.once('SIGTERM', () => client.stop('SIGTERM'));
