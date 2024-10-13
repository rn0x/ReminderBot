import * as dotenv from 'dotenv';
dotenv.config();
import { Telegraf, session, Scenes } from 'telegraf';
import { addReminderScene } from './scenes/addReminder.mjs';
import { deleteReminderScene } from './scenes/deleteReminder.mjs';
import showCommand from './commands/show.mjs';
import startCommand from './commands/start.mjs'
import handleNewChatMembers from './events/newChatMembers.mjs';
import handleLeftChatMember from './events/leftChatMember.mjs';
import handleMyChatMember from './events/myChatMember.mjs';
import handleTextMessage from './events/handleTextMessage.mjs';
import handleError from './utils/handleError.mjs';

const client = new Telegraf(process.env.TELEGRAM_TOKEN);
client.use(session());

// Middleware للتحقق من نوع الدردشة
client.use((ctx, next) => {
    if (ctx.chat.type === 'private') {
        ctx.reply('عذرًا، لا يمكن استخدام هذا البوت في المحادثات الخاصة.');
    } else {
        return next(); 
    }
});

// إعداد المشاهد
const stage = new Scenes.Stage([addReminderScene, deleteReminderScene]);
client.use(stage.middleware());

// الأوامر
client.command('add', (ctx) => ctx.scene.enter('addReminder'));
client.command('delete', (ctx) => ctx.scene.enter('deleteReminder'));
client.command('show', showCommand);
client.command('start', startCommand);

// التعامل مع الأحداث
client.on('new_chat_members', handleNewChatMembers);
client.on('left_chat_member', handleLeftChatMember);
client.on('my_chat_member', handleMyChatMember);
client.on('text', handleTextMessage);

// إضافة معالجة الأخطاء
client.catch((error) => handleError(client, error));

export { client };
