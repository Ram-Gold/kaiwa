import HistoryLedger from '../../components/history/HistoryLedger.jsx';
import { historySessions } from '../../components/history/historyData.js';

export const metadata = {
  title: 'Past Practice - KAIwa',
  description: 'Review saved lesson and roleplay history, grading breakdowns, rankings, and conversation records.',
};

export default function HistoryPage() {
  return <HistoryLedger sessions={historySessions} />;
}
