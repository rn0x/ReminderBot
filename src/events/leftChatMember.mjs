import { deleteMember } from "../db.mjs";

export default async function handleLeftChatMember(ctx) {
    const leftMember = ctx.message.left_chat_member;
    console.log(`Member left: ${leftMember.id}`);
    await deleteMember(leftMember.id, ctx.chat.id);
}
