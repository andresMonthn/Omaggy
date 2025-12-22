export async function fetchChatResponse(question: string, maxTokens: number = 500): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    throw new Error('Network error');
  }

  const data = await res.json();
  return data.answer;
}
