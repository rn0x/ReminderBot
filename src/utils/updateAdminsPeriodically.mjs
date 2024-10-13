import { fetchAllChats, updateAdmins } from "../db.mjs";

export default async function updateAdminsPeriodically(client) {
    setInterval(async () => {
        try {
            // جلب جميع الدردشات من قاعدة البيانات
            const chats = await fetchAllChats();

            // تحديث المشرفين لكل دردشة
            for (const chat of chats) {
                await updateAdmins(client, chat.chatId);

            }
        } catch (error) {
            console.error('Failed to update admins:', error.message);
        }
    }, 3 * 60 * 60 * 1000); // كل 3 ساعات
}
