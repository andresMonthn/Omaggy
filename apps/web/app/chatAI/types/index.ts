export type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
