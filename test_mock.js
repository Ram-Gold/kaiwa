import { parseModelReply } from './src/lib/ai.js';

function stripSuggestions(content) {
  let cleanText = String(content || '');
  
  // Extract content between <dialogue> and </dialogue> if present
  const dialogueMatch = cleanText.match(/<dialogue>([\s\S]*?)(?:<\/dialogue>|$)/i);
  if (dialogueMatch) {
    cleanText = dialogueMatch[1];
  } else {
    // Fallback: strip <thoughts> and <suggestions> if <dialogue> is missing
    cleanText = cleanText
      .replace(/<thoughts>[\s\S]*?(?:<\/thoughts>|$)/gi, '')
      .replace(/<suggestions>[\s\S]*$/gi, '');
  }
  
  // Strip old tags just in case
  return cleanText
    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
    .replace(/THOUGHTS:[\s\S]*?DIALOGUE:/gi, '')
    .replace(/SUGGESTIONS:[\s\S]*$/gi, '')
    .trim();
}

console.log("Mock 1:");
console.log(stripSuggestions(`
<thoughts>
Thinking...
</thoughts>
<dialogue>
こんにちは
</dialogue>
<suggestions>
[{"text": "A"}]
</suggestions>
`));

console.log("Mock 2:");
console.log(stripSuggestions(`
聞き取れませんでした" which means "I couldn't hear/understand."
`));

console.log("Mock 3:");
console.log(stripSuggestions(`
<thoughts>
Thinking...
</thoughts>
聞き取れませんでした
`));

