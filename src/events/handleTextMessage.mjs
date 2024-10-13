import { addChat, addMember } from "../db.mjs";

export default async function handleTextMessage(ctx) {
    const message = ctx.message.text;
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const chatUsername = ctx?.chat?.username || "anonymous";
    const fromUsername = ctx?.from?.username || "anonymous";
    const title = ctx?.chat?.first_name || ctx?.chat?.last_name || ctx?.chat?.title || "anonymous";
    const chatType = ctx?.chat?.type;

    // اضافة الاعضاء الى القاعدة
    await addChat(chatId, chatType, title, chatUsername);
    await addMember(userId, chatId);

}
