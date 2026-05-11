export type PostType = "text" | "challenge" | "duel" | "achievement";

export interface User {
  id: string;
  username: string;
  handle: string;
  school: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  wins: number;
  losses: number;
  rank: number;
}

export interface Post {
  id: string;
  user: User;
  type: PostType;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  reposts: number;
  challenge?: {
    question: string;
    answer: string;
    options?: string[];
    timeLimit: number;
    rewardXp: number;
    difficulty: "easy" | "medium" | "hard";
    solved: number;
  };
  duelResult?: {
    opponent: string;
    score: string;
    won: boolean;
  };
  achievement?: {
    title: string;
    icon: string;
  };
}

export interface School {
  id: string;
  name: string;
  shortName: string;
  totalXp: number;
  members: number;
  weeklyChange: number;
}

const avatars = ["🦊", "🦉", "🐺", "🦁", "🐯", "🐻", "🦅", "🐉", "🦄", "🐙"];

export const currentUser: User = {
  id: "u-me",
  username: "Alex Rivers",
  handle: "alexrivers",
  school: "Northridge High",
  avatar: "🦊",
  xp: 4820,
  level: 24,
  streak: 12,
  wins: 87,
  losses: 23,
  rank: 142,
};

export const users: User[] = [
  currentUser,
  { id: "u1", username: "Maya Chen", handle: "mayac", school: "Eastwood Academy", avatar: "🦉", xp: 9120, level: 38, streak: 47, wins: 201, losses: 34, rank: 3 },
  { id: "u2", username: "Jordan Vega", handle: "jvega", school: "Northridge High", avatar: "🐺", xp: 7340, level: 32, streak: 22, wins: 156, losses: 41, rank: 17 },
  { id: "u3", username: "Sana Iqbal", handle: "sana", school: "Westgate Prep", avatar: "🦅", xp: 6210, level: 29, streak: 8, wins: 132, losses: 28, rank: 24 },
  { id: "u4", username: "Tomás Lee", handle: "tomas", school: "Eastwood Academy", avatar: "🐉", xp: 5430, level: 26, streak: 14, wins: 110, losses: 39, rank: 41 },
  { id: "u5", username: "Riya Patel", handle: "riya", school: "Northridge High", avatar: "🦄", xp: 4990, level: 25, streak: 5, wins: 98, losses: 30, rank: 67 },
];

export const schools: School[] = [
  { id: "s1", name: "Eastwood Academy", shortName: "EWA", totalXp: 482300, members: 412, weeklyChange: 12 },
  { id: "s2", name: "Northridge High", shortName: "NRH", totalXp: 421800, members: 389, weeklyChange: 8 },
  { id: "s3", name: "Westgate Prep", shortName: "WGP", totalXp: 398100, members: 356, weeklyChange: -3 },
  { id: "s4", name: "Stonefield Secondary", shortName: "SFS", totalXp: 312400, members: 290, weeklyChange: 5 },
  { id: "s5", name: "Brightwater Institute", shortName: "BWI", totalXp: 298700, members: 274, weeklyChange: 2 },
];

export const posts: Post[] = [
  {
    id: "p1",
    user: users[1],
    type: "challenge",
    content: "Quick logic puzzle — under 15s. Beat my time 👇",
    createdAt: "2m",
    likes: 142,
    comments: 38,
    reposts: 21,
    challenge: {
      question: "If 5 machines make 5 widgets in 5 minutes, how long do 100 machines take to make 100 widgets?",
      answer: "5 minutes",
      options: ["5 minutes", "100 minutes", "20 minutes", "1 minute"],
      timeLimit: 15,
      rewardXp: 30,
      difficulty: "medium",
      solved: 412,
    },
  },
  {
    id: "p2",
    user: users[2],
    type: "duel",
    content: "Clean sweep against @sana 🔥 Who's next?",
    createdAt: "8m",
    likes: 89,
    comments: 12,
    reposts: 4,
    duelResult: { opponent: "sana", score: "8 - 3", won: true },
  },
  {
    id: "p3",
    user: users[3],
    type: "text",
    content: "Northridge can't keep up. Eastwood pulling away in school wars this week 📈",
    createdAt: "21m",
    likes: 56,
    comments: 31,
    reposts: 9,
  },
  {
    id: "p4",
    user: users[4],
    type: "achievement",
    content: "Hit Level 26! Onwards.",
    createdAt: "1h",
    likes: 211,
    comments: 18,
    reposts: 6,
    achievement: { title: "Level 26 Reached", icon: "⚡" },
  },
  {
    id: "p5",
    user: users[5],
    type: "challenge",
    content: "Math sprint. Hard mode. +50 XP if you nail it.",
    createdAt: "2h",
    likes: 320,
    comments: 76,
    reposts: 44,
    challenge: {
      question: "What is the smallest positive integer divisible by every integer from 1 to 10?",
      answer: "2520",
      options: ["1260", "2520", "5040", "720"],
      timeLimit: 30,
      rewardXp: 50,
      difficulty: "hard",
      solved: 89,
    },
  },
  {
    id: "p6",
    user: users[1],
    type: "text",
    content: "Streak day 47. Don't break the chain. ⛓️",
    createdAt: "3h",
    likes: 401,
    comments: 22,
    reposts: 17,
  },
];

export const trending = [
  { tag: "#SchoolWars", posts: "12.4k" },
  { tag: "#BrainSprint", posts: "8.9k" },
  { tag: "#LogicDuel", posts: "5.1k" },
  { tag: "#StreakSeason", posts: "3.7k" },
  { tag: "#MathMonday", posts: "2.2k" },
];

export const liveDuels = [
  { id: "d1", a: users[1], b: users[2], round: "3 / 5", viewers: 142 },
  { id: "d2", a: users[3], b: users[4], round: "1 / 5", viewers: 89 },
  { id: "d3", a: users[5], b: users[2], round: "5 / 5", viewers: 311 },
];
