import StreamingChatScreen from '../../../components/chat/StreamingChatScreen.jsx';

export const metadata = {
  title: 'AI Kaiwa - Streaming Mode Preview | KAIwa',
  description: 'Real-time token-by-token streaming Japanese conversational practice powered by Claude and multi-provider AI inference.',
};

export default function StreamingChatPage() {
  return <StreamingChatScreen initialPersonaId="sensei" title="AI Kaiwa (Streaming Demo)" />;
}
