import type { Level } from "./db/schema";

export const LEVELS: Level[] = [
  "beginners",
  "improvers",
  "intermediate",
  "advanced",
  "competition",
];

export const LEVEL_LABEL: Record<Level, string> = {
  beginners: "Beginners",
  improvers: "Improvers",
  intermediate: "Intermediate",
  advanced: "Advanced",
  competition: "Competition",
};

export const LEVEL_BLURB: Record<Level, string> = {
  beginners:
    "Your first steps: posture, frame, rhythm and the basic patterns of the core dances. No experience or partner needed.",
  improvers:
    "You know the basics. We refine timing, lead and follow, and build routines in more dances.",
  intermediate:
    "Longer routines, cleaner technique and musicality, with the detail of movement that makes dancing look effortless.",
  advanced:
    "Refined technique, partnering and performance quality, with individual coaching in every class.",
  competition:
    "Focused training for the floor: full routines, stamina, floorcraft and coaching for competitors.",
};

export const ROLE_LABEL = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
} as const;

export const CANCEL_NOTICE_HOURS = 4;
export const STUDIO_LOCATION = "Mullingar, Co. Westmeath";
export const SITE_NAME = "Grande Ballroom Studio";
export const TEACHER_NAME = "Anastasiia Fedorova";
