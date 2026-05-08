export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  wip: boolean;
  excerpt: string;
  paragraphs: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "blonde",
    title: "Blonde — Frank Ocean (2016)",
    date: "July 2025",
    wip: true,
    excerpt:
      "What makes Blonde a classic ten years on? Compared with Channel Orange, it's a meditation on how love, time, and growth reshape each other — and how the same album can mean something entirely different depending on where you are in life.",
    paragraphs: [
      "So, what is so magical about Blonde that despite being out for 10 years, people are already calling it a classic? For one, I think that when looked side-by-side with Channel Orange, the themes, soundscapes, and feelings of both albums complement each other quite well.",
      'I have always thought of Channel Orange to be the "happier" album of the two, as it reminds me of what I think life felt like during middle and high school: complicated in its own inconsequential way, but ultimately driven by the simplicity and carelessness of being young — something the songs throughout this album perfectly resemble. Thinkin Bout You\'s metaphor of a first love making you feel disoriented as if a tornado had torn your room into pieces, Lost talking about how easily one can get caught up in the thrill of life, and Super Rich Kids depicting the wasteful tendencies of teenagers. To a certain degree the album romanticizes love and all the other addictions it engages with in a way that makes them sound cool and harmless.',
      "Yet, despite tackling similar themes — especially that of love — Blonde has an infinitely more sobering tone to it. Frank's plea in Self Control to his former lover to \"keep a space\" for him in the bed shows us that perhaps that romance that flipped our world upside down in Thinkin Bout You didn't work out. White Ferrari's battle with the lack of permanence in life, love, and the universe at large shows us that perhaps time should be more consciously spent instead of wasting away like the super rich kids. Most importantly, the last song of the album, Futura Free, reminds us that while life may have seemed simpler, happier, or just overall better at some point in the past, it is the growth from the past to the present that makes us who we are today.",
      "But more than the lyrics themselves, I think that what makes this — and by extension any album — so great is what was happening in your personal life when you listened to it. While I first listened to Channel Orange and Blonde before and after breaking up with my high school girlfriend, I have since listened to both albums many times, in the span of which I graduated from high school, took a gap year to travel the world, started my undergraduate degree, and got my first job. Naturally, the albums evolved from simply being about love and heartbreak to something larger: the shifting nature of relationships and how we tend to perceive them as time goes by.",
    ],
  },
  {
    slug: "albums-2025",
    title: "Albums I Listened to in 2025",
    date: "August 2025",
    wip: true,
    excerpt:
      "A running list of albums that caught my ear in 2025. More to come.",
    paragraphs: ["This post is still in progress. Check back soon."],
  },
];
