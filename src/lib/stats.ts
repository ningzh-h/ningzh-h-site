import { getBooks, getPosts } from './content';
import { getCards } from './cards';
import { getRecreationEntries } from './recreation';
import { countWords } from './format';

/** 全站统计，供首页展示。 */
export async function getSiteStats(): Promise<{
  postCount: number;
  noteCount: number;
  recreationCount: number;
  cardCount: number;
  words: number;
}> {
  const [posts, notes, recreation, cards] = await Promise.all([
    getPosts(),
    getBooks(),
    getRecreationEntries(),
    getCards(),
  ]);

  const words =
    posts.reduce((total, post) => total + countWords(post.body ?? ''), 0) +
    notes.reduce((total, note) => total + note.wordCount, 0) +
    recreation.reduce((total, item) => total + countWords(item.entry.body ?? ''), 0) +
    cards.reduce((total, card) => total + countWords(card.entry.body ?? ''), 0);

  return {
    postCount: posts.length,
    noteCount: notes.length,
    recreationCount: recreation.length,
    cardCount: cards.length,
    words,
  };
}
