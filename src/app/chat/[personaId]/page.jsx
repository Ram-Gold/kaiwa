import ConversationStage from '../../../components/chat/ConversationStage.jsx';
import { getBriefing } from '../../../lib/briefings.js';

export default async function ChatScreen({ params, searchParams }) {
  const p = await params;
  const query = await searchParams;
  const briefing = getBriefing(query?.briefing) ?? null;

  return <ConversationStage personaId={p.personaId} briefing={briefing} />;
}
