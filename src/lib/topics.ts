// Curated topic → verse mapping for the homepage topic chips (see TOPIC_CHIPS in
// hero-bid-box.tsx). These are well-known references, not derived data — the actual
// verse text is always fetched from the `verses` table at request time.

export type TopicVerseRef = { bookSlug: string; chapter: number; verse: number };

export type Topic = {
  label: string;
  refs: TopicVerseRef[];
};

function ref(bookSlug: string, chapter: number, verse: number): TopicVerseRef {
  return { bookSlug, chapter, verse };
}

export const TOPICS: Record<string, Topic> = {
  anxiety: {
    label: "Anxiety",
    refs: [
      ref("philippians", 4, 6),
      ref("philippians", 4, 7),
      ref("1-peter", 5, 7),
      ref("matthew", 6, 34),
      ref("psalms", 55, 22),
      ref("john", 14, 27),
      ref("psalms", 94, 19),
      ref("isaiah", 41, 10),
    ],
  },
  love: {
    label: "Love",
    refs: [
      ref("john", 3, 16),
      ref("1-corinthians", 13, 4),
      ref("1-corinthians", 13, 13),
      ref("romans", 5, 8),
      ref("1-john", 4, 19),
      ref("john", 15, 13),
      ref("romans", 8, 38),
      ref("1-john", 4, 8),
    ],
  },
  forgiveness: {
    label: "Forgiveness",
    refs: [
      ref("ephesians", 4, 32),
      ref("colossians", 3, 13),
      ref("matthew", 6, 14),
      ref("1-john", 1, 9),
      ref("luke", 6, 37),
      ref("psalms", 103, 12),
      ref("matthew", 18, 22),
    ],
  },
  hope: {
    label: "Hope",
    refs: [
      ref("jeremiah", 29, 11),
      ref("romans", 15, 13),
      ref("romans", 8, 28),
      ref("isaiah", 40, 31),
      ref("hebrews", 11, 1),
      ref("romans", 5, 5),
      ref("psalms", 39, 7),
    ],
  },
  strength: {
    label: "Strength",
    refs: [
      ref("philippians", 4, 13),
      ref("isaiah", 40, 31),
      ref("psalms", 46, 1),
      ref("2-corinthians", 12, 9),
      ref("joshua", 1, 9),
      ref("psalms", 28, 7),
      ref("nehemiah", 8, 10),
      ref("isaiah", 41, 10),
    ],
  },
  faith: {
    label: "Faith",
    refs: [
      ref("hebrews", 11, 1),
      ref("romans", 10, 17),
      ref("2-corinthians", 5, 7),
      ref("james", 1, 6),
      ref("mark", 11, 24),
      ref("ephesians", 2, 8),
      ref("romans", 1, 17),
    ],
  },
  peace: {
    label: "Peace",
    refs: [
      ref("john", 14, 27),
      ref("philippians", 4, 7),
      ref("isaiah", 26, 3),
      ref("psalms", 29, 11),
      ref("colossians", 3, 15),
      ref("romans", 5, 1),
      ref("john", 16, 33),
    ],
  },
  grief: {
    label: "Grief",
    refs: [
      ref("psalms", 34, 18),
      ref("matthew", 5, 4),
      ref("revelation", 21, 4),
      ref("psalms", 147, 3),
      ref("2-corinthians", 1, 3),
      ref("john", 11, 35),
      ref("psalms", 34, 17),
    ],
  },
};

export function getTopicByQuery(query: string): Topic | undefined {
  return TOPICS[query.trim().toLowerCase()];
}
