export type BoardMember = {
  id: number;
  name: string;
  position: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

// Development-only placeholders. Real members come from the admin API; these are never shown in production.
export const boardMembers: BoardMember[] = [
  { id: 1, name: "Board Member Name", position: "Chairman", imageUrl: null, imageAlt: null },
  { id: 2, name: "Board Member Name", position: "Managing Director", imageUrl: null, imageAlt: null },
  { id: 3, name: "Board Member Name", position: "Director, Operations", imageUrl: null, imageAlt: null },
  { id: 4, name: "Board Member Name", position: "Director, Engineering", imageUrl: null, imageAlt: null },
];
