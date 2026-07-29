import Link from 'next/link';

export default function ChatScreen({ params }) {
  return (
    <div className="flex flex-col h-[75vh] border rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chat with {params.personaId}</h2>
        <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">
          &larr; Back to Dashboard
        </Link>
      </div>
      
      <div className="flex-1 p-6 flex flex-col justify-end gap-4 overflow-y-auto bg-gray-50/50">
        <div className="self-start bg-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%]">
          こんにちは！今日の調子はどうですか？
        </div>
        <div className="self-end bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
          元気です！
        </div>
      </div>
      
      <div className="p-4 border-t bg-white">
        <div className="w-full bg-gray-100 border-transparent focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 rounded-full h-12 flex items-center px-4 text-gray-400 transition-all">
          Type your message in Japanese...
        </div>
      </div>
    </div>
  );
}
