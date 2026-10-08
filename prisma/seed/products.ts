// Starter catalogue. Prices follow the PDF's test ranges: ₹49–₹199 singles,
// ₹299–₹999 packs, plus free lead magnets.

import type { CategorySlug } from "../../src/lib/catalog";
import * as kit from "./pdf-kit";
import type { Kit } from "./pdf-kit";

export type SeedProduct = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: CategorySlug;
  ageGroup: string;
  price: number;
  discountPrice?: number;
  featured?: boolean;
  emoji: string;
  includes: string[];
  /** Days before seeding, so "New arrivals" has an order */
  ageDays: number;
  build: (k: Kit) => void;
};

const story = (pages: [string, "sky" | "garden" | "night" | "sea"][]) => (k: Kit) => {
  for (const [text, scene] of pages) kit.storyPage(k, text, scene);
};

const GK: [string, string][] = [
  ["What is the capital city of India?", "New Delhi"],
  ["Which is the national animal of India?", "Bengal tiger"],
  ["Which is the national bird of India?", "Peacock (Indian peafowl)"],
  ["Which is the largest planet in our solar system?", "Jupiter"],
  ["How many continents are there on Earth?", "Seven"],
  ["Which is the largest ocean on Earth?", "Pacific Ocean"],
  ["How many days are there in a leap year?", "366"],
  ["Who wrote India's national anthem, Jana Gana Mana?", "Rabindranath Tagore"],
  ["At what temperature does water freeze?", "0 degrees Celsius"],
  ["Which is the tallest mountain in the world?", "Mount Everest"],
  ["How many legs does a spider have?", "Eight"],
  ["How many legs does an insect have?", "Six"],
  ["Which is the fastest land animal?", "Cheetah"],
  ["Which is the largest animal that has ever lived?", "Blue whale"],
  ["Which planet is closest to the Sun?", "Mercury"],
  ["Which planet is called the Red Planet?", "Mars"],
  ["Which gas do we breathe in to stay alive?", "Oxygen"],
  ["What is a baby frog called?", "Tadpole"],
  ["How many sides does a hexagon have?", "Six"],
  ["In which city is the Taj Mahal?", "Agra"],
  ["Who is known as the Father of the Nation in India?", "Mahatma Gandhi"],
  ["Who was the first Indian to travel to space?", "Rakesh Sharma"],
  ["Which organ pumps blood around your body?", "The heart"],
  ["On which date does India celebrate Independence Day?", "15 August"],
  ["On which date does India celebrate Republic Day?", "26 January"],
  ["What is the national fruit of India?", "Mango"],
  ["Which is the largest country in the world by area?", "Russia"],
  ["What is the capital city of Japan?", "Tokyo"],
  ["At what temperature does water boil at sea level?", "100 degrees Celsius"],
  ["What do bees make?", "Honey"],
  ["Which is the national flower of India?", "Lotus"],
  ["How many hours are there in one day?", "24"],
];

const RIDDLES: [string, string][] = [
  ["What has hands but cannot clap?", "A clock"],
  ["What gets wetter the more it dries?", "A towel"],
  ["What has keys but cannot open any locks?", "A piano"],
  ["What can you catch but never throw?", "A cold"],
  ["What has to be broken before you can use it?", "An egg"],
  ["What goes up but never comes down?", "Your age"],
  ["I have a neck but no head. What am I?", "A bottle"],
  ["What is full of holes but still holds water?", "A sponge"],
  ["What has lots of teeth but cannot bite?", "A comb"],
  ["What runs but never walks?", "Water (a river)"],
  ["What has one eye but cannot see?", "A needle"],
  ["Which building has the most stories?", "A library"],
];

const MISSING: [string, string][] = [
  ["CAT", "a pet that says meow"],
  ["DOG", "a pet that barks"],
  ["SUN", "it shines in the day"],
  ["CUP", "you drink from it"],
  ["BUS", "a big vehicle with many seats"],
  ["HAT", "you wear it on your head"],
  ["PEN", "you write with it"],
  ["FISH", "it swims in water"],
  ["TREE", "it has leaves and branches"],
  ["BOOK", "you read it"],
  ["BALL", "you can kick or throw it"],
  ["MILK", "a white drink"],
  ["FROG", "green and loves to hop"],
  ["DUCK", "it says quack"],
  ["STAR", "it twinkles at night"],
  ["CAKE", "a birthday treat"],
];

const WORDS = {
  Animals: ["LION", "TIGER", "ZEBRA", "HORSE", "MOUSE", "SHEEP", "CAMEL", "PANDA"],
  Fruits: ["APPLE", "MANGO", "GRAPE", "BANANA", "PEAR", "LEMON", "GUAVA", "PLUM"],
  Space: ["MOON", "STAR", "SUN", "MARS", "COMET", "ROCKET", "ORBIT", "EARTH"],
  Colours: ["RED", "BLUE", "GREEN", "PINK", "BLACK", "WHITE", "BROWN", "GREY"],
};

const letterPairs = (from: string, to: string) => {
  const out: string[][] = [];
  for (let c = from.charCodeAt(0); c <= to.charCodeAt(0); c++) {
    const L = String.fromCharCode(c);
    out.push([L, L.toLowerCase()]);
  }
  return out;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  // ---------------------------------------------------------------- e-books
  {
    slug: "the-brave-little-cloud",
    title: "The Brave Little Cloud",
    shortDescription: "A gentle picture story about how even the smallest helper makes a big difference.",
    description:
      "Pip is the smallest cloud in the sky and can only make a tiny drizzle. When the village below grows dry, Pip discovers that small drops still make big puddles. A warm, beautifully simple story about kindness, effort and teamwork, with a conversation prompt at the end to talk about together.",
    category: "ebooks",
    ageGroup: "4-6",
    price: 149,
    discountPrice: 99,
    featured: true,
    emoji: "☁️",
    includes: ["Illustrated picture story", "Read-aloud friendly large text", "Talk-about-it page for parents"],
    ageDays: 40,
    build: (k) => {
      story([
        ["High above a sleepy village lived a little cloud named Pip. Pip was the smallest cloud in the whole sky.", "sky"],
        ["The big clouds made thunder and heavy rain. Pip could only make a tiny drizzle, and sometimes just a puff of mist.", "sky"],
        ["One summer the village grew dry. The flowers drooped, the pond shrank, and the farmers looked up at the sky with worried faces.", "garden"],
        ["The big clouds had floated far away to the mountains. “I am too small to help,” Pip sighed.", "sky"],
        ["But a little sparrow called up to Pip: “Small drops still make big puddles, if you keep on trying!”", "sky"],
        ["So Pip squeezed and squeezed. Drip. Drop. Drip. One drop at a time, Pip watered the flowers, one by one.", "garden"],
        ["Other little clouds saw Pip and drifted over to help. Together they made a soft rain that lasted all afternoon.", "garden"],
        ["That evening a rainbow stretched across the village. Pip had learned that even the smallest helper can make a big difference.", "sky"],
      ])(k);
      kit.infoPage(k, "Let's talk about it", [
        "When did you help someone, even in a small way? How did it feel?",
        "Pip felt too small to help. Have you ever felt that way? What helped you try anyway?",
        "Draw a picture of you and a friend helping each other on the back of this page.",
      ]);
    },
  },
  {
    slug: "ollie-the-owl-learns-to-count",
    title: "Ollie the Owl Learns to Count",
    shortDescription: "Count from 1 to 10 with Ollie through big, bright pictures.",
    description:
      "Ollie the owl is learning to count, and your little one can count along! Each page shows one big number, the number word and that many colourful pictures to point at and count. Perfect for toddlers and pre-schoolers taking their first steps with numbers.",
    category: "ebooks",
    ageGroup: "2-4",
    price: 79,
    emoji: "🦉",
    includes: ["Numbers 1 to 10 with number words", "Big pictures to point and count", "Bonus colour-and-count page"],
    ageDays: 34,
    build: (k) => {
      const things: [string, string][] = [
        ["big moon", "moon"],
        ["shiny stars", "star"],
        ["fluffy clouds", "cloud"],
        ["red balloons", "balloon"],
        ["little fish", "fish"],
        ["pretty flowers", "flower"],
        ["twinkly stars", "star"],
        ["happy hearts", "heart"],
        ["sunny suns", "sun"],
        ["tiny hearts", "heart"],
      ];
      things.forEach(([label, shape], i) => kit.countingPage(k, i + 1, label, shape));
      kit.howManyPage(k);
      kit.answerKeyPage(k);
    },
  },
  {
    slug: "my-first-space-book",
    title: "My First Space Book",
    shortDescription: "Meet the Sun and all eight planets with one amazing fact each.",
    description:
      "Blast off on a tour of our solar system! Each page introduces the Sun or a planet with a bold picture and one memorable, accurate fact written for young readers. Ends with a space word search to check what they've learned.",
    category: "ebooks",
    ageGroup: "6-8",
    price: 199,
    discountPrice: 149,
    featured: true,
    emoji: "🪐",
    includes: ["The Sun and all 8 planets", "Kid-friendly science facts", "Space word search with answers"],
    ageDays: 20,
    build: (k) => {
      const facts: [string, string, string, boolean?, number?][] = [
        ["The Sun", "The Sun is a star at the centre of our solar system. It is so big that about 109 Earths could fit side by side across it!", "#FFC93C", false, 160],
        ["Mercury", "Mercury is the smallest planet and the closest one to the Sun. A year on Mercury lasts only 88 Earth days.", "#B7B1A8", false, 80],
        ["Venus", "Venus is the hottest planet. Its thick clouds trap heat like a blanket, making it even hotter than Mercury.", "#E8C07D", false, 120],
        ["Earth", "Earth is our home and the only planet we know of with life. About 71 percent of its surface is covered by water.", "#4DA3FF", false, 125],
        ["Mars", "Mars is called the Red Planet because its dust contains rusty iron. It has the tallest volcano in the solar system, Olympus Mons.", "#E2603F", false, 100],
        ["Jupiter", "Jupiter is the biggest planet. Its Great Red Spot is a giant storm that is wider than the whole Earth.", "#D9A066", false, 165],
        ["Saturn", "Saturn is famous for its beautiful rings, which are made of billions of pieces of ice and rock.", "#E9D29A", true, 105],
        ["Uranus", "Uranus spins on its side, so it looks like it is rolling around the Sun like a ball.", "#8FDDE8", false, 120],
        ["Neptune", "Neptune is the farthest planet from the Sun. It has the fastest winds in the solar system.", "#4E6FE0", false, 120],
      ];
      for (const [name, fact, color, ringed, size] of facts) kit.factPage(k, name, fact, color, ringed, size);
      kit.wordSearchPage(k, "Space", WORDS.Space);
    },
  },
  {
    slug: "five-minute-bedtime-stories",
    title: "Five-Minute Bedtime Stories",
    shortDescription: "Three calm, cosy stories that are just the right length for bedtime.",
    description:
      "Three soothing short stories to end the day: a kind Moon who lights the way home, a girl who counts the sleepy stars, and a little fish who discovers the sea is his very own sky. Each story takes about five minutes to read aloud.",
    category: "ebooks",
    ageGroup: "4-6",
    price: 299,
    discountPrice: 199,
    emoji: "🌙",
    includes: ["3 illustrated bedtime stories", "About 5 minutes per story", "Calm, simple language"],
    ageDays: 12,
    build: (k) => {
      kit.titlePage(k, "The Moon's Night Light", "Story one");
      story([
        ["Every night, the Moon switched on her silver light so the little animals could find their way home.", "night"],
        ["One night a small rabbit was scared of the dark woods. The Moon saw him and shone a little brighter, just for him.", "night"],
        ["Step by step, the rabbit hopped all the way home. “Goodnight, brave one,” the Moon whispered.", "night"],
      ])(k);
      kit.titlePage(k, "Tara and the Sleepy Stars", "Story two");
      story([
        ["Tara could not fall asleep, so she counted the stars outside her window. One, two, three, four...", "night"],
        ["Then the stars began to yawn! “We are sleepy too,” they twinkled. “Shall we all close our eyes together?”", "night"],
        ["Tara closed her eyes. The stars dimmed softly, and the whole sky drifted off to dreamland.", "night"],
      ])(k);
      kit.titlePage(k, "The Little Fish Who Wanted to Fly", "Story three");
      story([
        ["Finn the fish watched the birds swoop over the waves, and he wished he could fly through the sky too.", "sea"],
        ["A wise old turtle smiled. “You cannot fly in the air, Finn, but you can glide through the water just like a bird.”", "sea"],
        ["Finn zoomed, swirled and twirled through the waves. The sea was his very own sky, and he loved it.", "sea"],
      ])(k);
    },
  },

  // ---------------------------------------------------------------- colouring
  {
    slug: "happy-things-colouring-pack",
    title: "Happy Things Colouring Pack",
    shortDescription: "Big, bold outlines of sunny, smiley things that little hands love to colour.",
    description:
      "Thick, simple outlines sized for small hands and chunky crayons: a smiling sun, flowers, balloons, a house, a tree, a car and more. Print as many copies as you like for rainy days, travel and quiet time.",
    category: "colouring",
    ageGroup: "2-4",
    price: 79,
    discountPrice: 49,
    featured: true,
    emoji: "🖍️",
    includes: ["8 full-page colouring pictures", "Extra-thick lines for little hands", "Print unlimited copies at home"],
    ageDays: 45,
    build: (k) => {
      const pages: [string, string][] = [
        ["sun", "sunny sun"],
        ["flower", "flower"],
        ["balloon", "balloon"],
        ["house", "house"],
        ["tree", "tree"],
        ["car", "car"],
        ["heart", "heart"],
        ["cloud", "rain cloud"],
      ];
      for (const [shape, label] of pages) kit.colouringPage(k, shape, label);
    },
  },
  {
    slug: "under-the-sea-colouring-book",
    title: "Under the Sea Colouring Book",
    shortDescription: "Dive in and colour fish, whales, jellyfish and starfish.",
    description:
      "An ocean adventure to colour in! Friendly fish, a smiling whale, a wobbly jellyfish, starfish and more, each on its own page with plenty of space for imagination.",
    category: "colouring",
    ageGroup: "4-6",
    price: 99,
    discountPrice: 69,
    emoji: "🐠",
    includes: ["8 ocean colouring pages", "Fish, whale, jellyfish and starfish", "Printable A4 pages"],
    ageDays: 28,
    build: (k) => {
      const pages: [string, string][] = [
        ["fish", "fish"],
        ["whale", "whale"],
        ["jellyfish", "jellyfish"],
        ["star", "starfish"],
        ["fish", "rainbow fish"],
        ["whale", "baby whale"],
        ["jellyfish", "glowing jellyfish"],
        ["snail", "sea snail"],
      ];
      for (const [shape, label] of pages) kit.colouringPage(k, shape, label);
    },
  },
  {
    slug: "space-adventure-colouring-pack",
    title: "Space Adventure Colouring Pack",
    shortDescription: "Rockets, moons, planets and stars for little astronauts.",
    description:
      "3, 2, 1, colour! Rockets, a ringed planet, a crescent moon, stars and the Sun. A great companion to My First Space Book, or a quick screen-free activity on its own.",
    category: "colouring",
    ageGroup: "4-6",
    price: 79,
    emoji: "🚀",
    includes: ["8 space colouring pages", "Rockets, planets, moon and stars", "Printable A4 pages"],
    ageDays: 8,
    build: (k) => {
      const pages: [string, string][] = [
        ["rocket", "rocket"],
        ["planet", "ringed planet"],
        ["moon", "moon"],
        ["star", "star"],
        ["sun", "Sun"],
        ["rocket", "space rocket"],
        ["planet", "mystery planet"],
        ["star", "shooting star"],
      ];
      for (const [shape, label] of pages) kit.colouringPage(k, shape, label);
    },
  },
  {
    slug: "garden-friends-colouring-book",
    title: "Garden Friends Colouring Book",
    shortDescription: "Butterflies, snails, flowers and trees from the garden.",
    description:
      "Head outside (on paper!) with butterflies, a snail, flowers and trees. A lovely way to start conversations about nature, seasons and the little creatures we share the world with.",
    category: "colouring",
    ageGroup: "6-8",
    price: 99,
    emoji: "🦋",
    includes: ["8 nature colouring pages", "Butterflies, snail, flowers and trees", "Printable A4 pages"],
    ageDays: 3,
    build: (k) => {
      const pages: [string, string][] = [
        ["butterfly", "butterfly"],
        ["snail", "snail"],
        ["flower", "flower"],
        ["tree", "tree"],
        ["butterfly", "butterfly friend"],
        ["sun", "garden sun"],
        ["flower", "sunflower"],
        ["cloud", "cloud"],
      ];
      for (const [shape, label] of pages) kit.colouringPage(k, shape, label);
    },
  },

  // ---------------------------------------------------------------- activities
  {
    slug: "mazes-and-puzzles-fun-book",
    title: "Mazes & Puzzles Fun Book",
    shortDescription: "Mazes that get trickier page by page, plus word searches.",
    description:
      "Start easy and finish as a maze master! Mazes grow from simple to challenging, mixed with themed word searches. Great for focus, problem-solving and pencil control. Answers included for word searches.",
    category: "activities",
    ageGroup: "6-8",
    price: 149,
    discountPrice: 99,
    featured: true,
    emoji: "🧩",
    includes: ["8 mazes from easy to tricky", "3 themed word searches", "Builds focus and problem-solving"],
    ageDays: 38,
    build: (k) => {
      kit.mazePage(k, 6, 7, "Maze 1: Warm up");
      kit.mazePage(k, 8, 9, "Maze 2: Getting going");
      kit.wordSearchPage(k, "Animals", WORDS.Animals);
      kit.mazePage(k, 10, 11, "Maze 3: Twisty paths");
      kit.mazePage(k, 11, 13, "Maze 4: Explorer");
      kit.wordSearchPage(k, "Fruits", WORDS.Fruits);
      kit.mazePage(k, 12, 14, "Maze 5: Adventurer");
      kit.mazePage(k, 14, 16, "Maze 6: Super solver");
      kit.wordSearchPage(k, "Colours", WORDS.Colours);
      kit.mazePage(k, 16, 18, "Maze 7: Expert");
      kit.mazePage(k, 18, 20, "Maze 8: Maze master!");
      kit.certificatePage(k);
    },
  },
  {
    slug: "dot-to-dot-adventures",
    title: "Dot-to-Dot Adventures",
    shortDescription: "Join the numbered dots to reveal a picture, then colour it in.",
    description:
      "Counting practice that feels like magic: join the dots in order to reveal a star, a heart, a house, a fish, a rocket and more. Each picture can be coloured in afterwards.",
    category: "activities",
    ageGroup: "4-6",
    price: 69,
    emoji: "✏️",
    includes: ["10 dot-to-dot pictures", "Counting practice up to 18", "Colour in when finished"],
    ageDays: 25,
    build: (k) => {
      const order = ["diamond", "star", "house", "fish", "heart", "rocket", "star", "diamond", "fish", "heart"];
      for (const s of order) kit.dotsPage(k, s);
    },
  },
  {
    slug: "spot-and-match-activity-book",
    title: "Spot & Match Activity Book",
    shortDescription: "Matching, counting and shape games for toddlers.",
    description:
      "Simple, joyful activities for the youngest learners: match the pictures, count how many, and trace and colour shapes. Builds early observation, counting and pencil skills.",
    category: "activities",
    ageGroup: "2-4",
    price: 59,
    emoji: "🔍",
    includes: ["Picture matching pages", "How-many counting pages", "Shape tracing and colouring"],
    ageDays: 30,
    build: (k) => {
      kit.matchPage(k);
      kit.howManyPage(k);
      kit.shapesPage(k);
      kit.matchPage(k);
      kit.howManyPage(k);
      kit.matchPage(k);
      kit.howManyPage(k);
      kit.shapesPage(k);
      kit.answerKeyPage(k);
    },
  },
  {
    slug: "brain-teasers-for-little-geniuses",
    title: "Brain Teasers for Little Geniuses",
    shortDescription: "Riddles, sudoku and number patterns to stretch growing minds.",
    description:
      "A mix of classic riddles, 4×4 and 6×6 sudoku and \"what comes next?\" number patterns. Perfect for curious kids who love a challenge. Full answer key at the back.",
    category: "activities",
    ageGroup: "8-10",
    price: 129,
    emoji: "🧠",
    includes: ["12 classic riddles", "Mini and full sudoku puzzles", "Number patterns + answer key"],
    ageDays: 15,
    build: (k) => {
      kit.questionsPage(k, "Riddle time (part 1)", "Read each riddle and write your answer.", RIDDLES.slice(0, 6));
      kit.sudokuPage(k, 4);
      kit.patternsPage(k);
      kit.questionsPage(k, "Riddle time (part 2)", "Read each riddle and write your answer.", RIDDLES.slice(6));
      kit.sudokuPage(k, 4);
      kit.sudokuPage(k, 6);
      kit.patternsPage(k);
      kit.sudokuPage(k, 6);
      kit.answerKeyPage(k);
    },
  },

  // ---------------------------------------------------------------- worksheets
  {
    slug: "addition-subtraction-practice-grade-1",
    title: "Addition & Subtraction Practice (Grade 1)",
    shortDescription: "Practice sheets for sums up to 20, with an answer key.",
    description:
      "Twenty sums per page to build confidence with addition and subtraction up to 20. Starts with addition, moves to subtraction, then mixes both. Answer key included for quick checking.",
    category: "worksheets",
    ageGroup: "6-8",
    price: 49,
    featured: true,
    emoji: "➕",
    includes: ["8 worksheets, 160 sums", "Addition, subtraction and mixed", "Answer key for parents"],
    ageDays: 42,
    build: (k) => {
      kit.mathPage(k, "+", 10, "Addition up to 10");
      kit.mathPage(k, "+", 10, "Addition up to 10 (part 2)");
      kit.mathPage(k, "+", 15, "Addition up to 20");
      kit.mathPage(k, "-", 10, "Subtraction within 10");
      kit.mathPage(k, "-", 15, "Subtraction within 15");
      kit.mathPage(k, "-", 20, "Subtraction within 20");
      kit.mathPage(k, "mix", 15, "Mixed practice");
      kit.mathPage(k, "mix", 20, "Mixed challenge");
      kit.answerKeyPage(k);
    },
  },
  {
    slug: "abc-handwriting-tracing-sheets",
    title: "ABC Handwriting Tracing Sheets",
    shortDescription: "Trace every letter A–Z in capitals and lowercase.",
    description:
      "Guided handwriting practice for every letter of the alphabet. Each letter has a dark example, grey letters to trace and open space to write independently, on proper three-line guides.",
    category: "worksheets",
    ageGroup: "4-6",
    price: 79,
    discountPrice: 59,
    emoji: "🔤",
    includes: ["All 26 letters, capital and lowercase", "Three-line handwriting guides", "Trace then write on your own"],
    ageDays: 36,
    build: (k) => {
      for (const [U, l] of letterPairs("A", "Z")) kit.tracingPage(k, [U, l], `Letter ${U} ${l}`);
    },
  },
  {
    slug: "multiplication-tables-workbook",
    title: "Multiplication Tables Workbook",
    shortDescription: "Learn the 2 to 12 times tables with fill-ins and quick quizzes.",
    description:
      "One page per times table from 2 to 12: fill in the table, then test yourself with a quick quiz in mixed order. A simple, steady way to make tables stick. Answers included.",
    category: "worksheets",
    ageGroup: "8-10",
    price: 79,
    emoji: "✖️",
    includes: ["Times tables 2 to 12", "Quick quiz on every page", "Answer key"],
    ageDays: 22,
    build: (k) => {
      for (let n = 2; n <= 12; n++) kit.tablesPage(k, n);
      kit.answerKeyPage(k);
    },
  },
  {
    slug: "general-knowledge-quiz-sheets",
    title: "General Knowledge Quiz Sheets",
    shortDescription: "32 fun GK questions about India, science and the world.",
    description:
      "Four quiz sheets covering India, animals, space, the human body and the world. Great for car journeys, family quiz nights or classroom warm-ups. Answer key included.",
    category: "worksheets",
    ageGroup: "8-10",
    price: 69,
    emoji: "🌍",
    includes: ["32 GK questions on 4 sheets", "India, science, nature and the world", "Answer key"],
    ageDays: 10,
    build: (k) => {
      for (let i = 0; i < 4; i++) {
        kit.questionsPage(k, `GK quiz ${i + 1}`, "Write your answer on the line.", GK.slice(i * 8, i * 8 + 8));
      }
      kit.answerKeyPage(k);
    },
  },
  {
    slug: "shapes-and-colours-worksheets",
    title: "Shapes & Colours Worksheets",
    shortDescription: "Trace, colour and spot circles, squares, triangles and more.",
    description:
      "First shapes made fun: trace the dotted outlines, colour them in, then match and count. Short, achievable pages that build early pencil control and shape recognition.",
    category: "worksheets",
    ageGroup: "2-4",
    price: 49,
    emoji: "🔺",
    includes: ["Shape tracing pages", "Matching and counting", "Short, toddler-sized tasks"],
    ageDays: 5,
    build: (k) => {
      kit.shapesPage(k);
      kit.matchPage(k);
      kit.shapesPage(k);
      kit.howManyPage(k);
      kit.shapesPage(k);
      kit.answerKeyPage(k);
    },
  },

  // ---------------------------------------------------------------- learning packs
  {
    slug: "pre-school-starter-pack",
    title: "Pre-School Starter Pack",
    shortDescription: "Everything for ages 2–4 in one pack: shapes, counting, colouring and first letters.",
    description:
      "A complete starter bundle for little learners: shape tracing, counting, matching, colouring pages and first letters A to F, finished with a certificate to celebrate. Saves more than buying the activities separately.",
    category: "learning-packs",
    ageGroup: "2-4",
    price: 499,
    discountPrice: 299,
    featured: true,
    emoji: "🎒",
    includes: ["Shapes, counting and matching", "Colouring pages", "Letters A–F tracing", "Certificate of completion"],
    ageDays: 18,
    build: (k) => {
      kit.shapesPage(k);
      kit.howManyPage(k);
      kit.matchPage(k);
      for (const s of ["sun", "balloon", "fish", "heart"]) kit.colouringPage(k, s, s);
      for (const pair of letterPairs("A", "F")) kit.tracingPage(k, pair, `Letter ${pair[0]} ${pair[1]}`);
      kit.numberTracingPage(k, [1, 2, 3, 4, 5]);
      kit.howManyPage(k);
      kit.answerKeyPage(k);
      kit.certificatePage(k);
    },
  },
  {
    slug: "kindergarten-learning-bundle",
    title: "Kindergarten Learning Bundle",
    shortDescription: "Letters, numbers, mazes, dot-to-dots and colouring for ages 4–6.",
    description:
      "A big, varied bundle for kindergarten: full A–Z tracing, numbers 1–10, early addition, easy mazes, dot-to-dots and colouring pages. Ideal for holidays or steady weekly practice.",
    category: "learning-packs",
    ageGroup: "4-6",
    price: 699,
    discountPrice: 399,
    emoji: "🎁",
    includes: ["A–Z letter tracing", "Numbers 1–10 and early addition", "Mazes, dot-to-dots and colouring", "Certificate"],
    ageDays: 14,
    build: (k) => {
      for (const pair of letterPairs("A", "Z")) kit.tracingPage(k, pair, `Letter ${pair[0]} ${pair[1]}`);
      kit.numberTracingPage(k, [1, 2, 3, 4, 5]);
      kit.numberTracingPage(k, [6, 7, 8, 9, 10]);
      kit.mathPage(k, "+", 5, "Adding up to 10");
      kit.mazePage(k, 6, 7, "Easy maze");
      kit.mazePage(k, 7, 8, "Maze 2");
      kit.dotsPage(k, "star");
      kit.dotsPage(k, "house");
      for (const s of ["whale", "rocket", "butterfly"]) kit.colouringPage(k, s, s);
      kit.answerKeyPage(k);
      kit.certificatePage(k);
    },
  },
  {
    slug: "grade-2-maths-and-english-mega-bundle",
    title: "Grade 2 Maths & English Mega Bundle",
    shortDescription: "Sums to 100, times tables 2–5, spelling and word puzzles.",
    description:
      "Our biggest pack for ages 6–8: addition and subtraction up to 100, times tables 2 to 5, missing-letter spelling, word searches and riddles, plus mazes for fun breaks. Full answer key and a certificate at the end.",
    category: "learning-packs",
    ageGroup: "6-8",
    price: 999,
    discountPrice: 599,
    emoji: "📚",
    includes: ["Sums up to 100", "Times tables 2–5", "Spelling and word puzzles", "Mazes, answer key and certificate"],
    ageDays: 2,
    build: (k) => {
      kit.mathPage(k, "+", 50, "Addition up to 100");
      kit.mathPage(k, "+", 50, "Addition up to 100 (part 2)");
      kit.mathPage(k, "-", 99, "Subtraction within 100");
      kit.mathPage(k, "mix", 60, "Mixed practice");
      for (const n of [2, 3, 4, 5]) kit.tablesPage(k, n);
      kit.missingLettersPage(k, MISSING.slice(0, 8));
      kit.missingLettersPage(k, MISSING.slice(8));
      kit.wordSearchPage(k, "Animals", WORDS.Animals);
      kit.wordSearchPage(k, "Fruits", WORDS.Fruits);
      kit.questionsPage(k, "Riddles", "Read each riddle and write your answer.", RIDDLES.slice(0, 6));
      kit.mazePage(k, 12, 14, "Brain break maze");
      kit.mazePage(k, 14, 16, "Brain break maze 2");
      kit.answerKeyPage(k);
      kit.certificatePage(k);
    },
  },

  // ---------------------------------------------------------------- free resources
  {
    slug: "free-starter-colouring-sheets",
    title: "Free Starter Colouring Sheets",
    shortDescription: "Four free colouring pages to try before you buy.",
    description:
      "A free taste of our colouring packs: four big, friendly outlines to print and colour. Free forever, just enter your email to get the download link.",
    category: "colouring",
    ageGroup: "2-4",
    price: 0,
    emoji: "🎨",
    includes: ["4 colouring pages", "Big, simple outlines", "Free to print and share at home"],
    ageDays: 50,
    build: (k) => {
      for (const s of ["star", "balloon", "heart", "sun"]) kit.colouringPage(k, s, s);
    },
  },
  {
    slug: "free-weekend-activity-pack",
    title: "Free Weekend Activity Pack",
    shortDescription: "A maze, a dot-to-dot, a matching game and a colouring page, free.",
    description:
      "Keep little ones happily busy this weekend with a free mini pack: one maze, one dot-to-dot, a picture matching game and a colouring page.",
    category: "activities",
    ageGroup: "4-6",
    price: 0,
    featured: true,
    emoji: "🎉",
    includes: ["Maze, dot-to-dot, matching and colouring", "Print at home", "Completely free"],
    ageDays: 48,
    build: (k) => {
      kit.mazePage(k, 7, 8);
      kit.dotsPage(k, "fish");
      kit.matchPage(k);
      kit.colouringPage(k, "rocket", "rocket");
    },
  },
  {
    slug: "free-number-tracing-1-10",
    title: "Free Number Tracing 1–10",
    shortDescription: "Trace and count numbers 1 to 10, free.",
    description: "Two free worksheets to trace numbers 1 to 10 and colour the matching number of circles.",
    category: "worksheets",
    ageGroup: "4-6",
    price: 0,
    emoji: "🔢",
    includes: ["Numbers 1–10 tracing", "Count-and-colour circles", "Free download"],
    ageDays: 47,
    build: (k) => {
      kit.numberTracingPage(k, [1, 2, 3, 4, 5]);
      kit.numberTracingPage(k, [6, 7, 8, 9, 10]);
    },
  },
];
