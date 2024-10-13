import { addChat, deleteChat, updateAdmins } from '../db.mjs'; // تأكد من استيراد دالة إزالة الأعضاء

export default async function handleMyChatMember(ctx) {
    const chatId = ctx.chat.id;
    const status = ctx?.update?.my_chat_member?.new_chat_member?.status;
    const username = ctx?.chat?.username;
    const title = ctx?.chat?.first_name || ctx?.chat?.last_name || ctx?.chat?.title;
    const chatType = ctx?.chat?.type;

    if (status === 'left' || status === 'kicked') {
        console.log(`User ${chatId} has left or was kicked from chat ${chatId}`);
        // حذف العضو من قاعدة البيانات إذا رغبت في ذلك
        try {
            await deleteChat(chatId);
            console.log(`Removed chat ${chatId} from the database.`);
        } catch (error) {
            console.error('Failed to remove chat:', error);
        }
    } else {
        try {
            await updateAdmins(ctx, chatId);
            await addChat(chatId, chatType, title, username);
            console.log(`Add chat ${chatId} from the database.`);
        } catch (error) {
            console.error('Failed to add chat:', error);
        }
    }
}
