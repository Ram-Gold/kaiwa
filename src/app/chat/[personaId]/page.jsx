import ConversationStage from '../../../components/chat/ConversationStage.jsx';
import { getBriefing } from '../../../lib/briefings.js';

export default async function ChatScreen({ searchParams }) {
  const query = await searchParams;
  const briefing = getBriefing(query?.briefing) ?? null;

  return <ConversationStage briefing={briefing} />;
}
