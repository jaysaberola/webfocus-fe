export type Job = {
  id: number;
  title: string;
  department: string;
  type: string;
  location: string;
  shortDescription: string;
  description: string;
};

export const jobs: Job[] = [
  {
    id: 1,
    title: "Frontend Developer",
    department: "Engineering",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Build modern UI using React and Next.js.",
    description: `
We are looking for a Frontend Developer to build scalable UI components.

Responsibilities:
- Develop responsive interfaces
- Collaborate with designers and backend engineers
- Optimize performance

Requirements:
- React or Next.js experience
- HTML, CSS, JavaScript knowledge
    `,
  },
  {
    id: 2,
    title: "Backend Developer",
    department: "Engineering",
    type: "Full-time",
    location: "On-site",
    shortDescription: "Develop APIs and backend services.",
    description: `
You will work on server-side logic and databases.

Responsibilities:
- Build REST APIs
- Maintain backend performance
- Ensure data security
    `,
  },
  {
    id: 3,
    title: "UI/UX Designer",
    department: "Design",
    type: "Contract",
    location: "Remote",
    shortDescription: "Design intuitive user experiences.",
    description: `
Design user interfaces, wireframes, and prototypes.

Requirements:
- Figma or Adobe XD
- UX principles knowledge
    `,
  },
  {
    id: 4,
    title: "Product Manager",
    department: "Product",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Define product vision and roadmap.",
    description: `
Work with stakeholders to define product goals.

Responsibilities:
- Gather requirements
- Manage product backlog
    `,
  },
  {
    id: 5,
    title: "QA Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "On-site",
    shortDescription: "Ensure product quality.",
    description: `
Test features and report bugs.

Responsibilities:
- Manual & automated testing
- Regression testing
    `,
  },
  {
    id: 6,
    title: "DevOps Engineer",
    department: "Engineering",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Maintain CI/CD pipelines.",
    description: `
Manage infrastructure and deployments.
    `,
  },
  {
    id: 7,
    title: "Content Writer",
    department: "Marketing",
    type: "Contract",
    location: "Remote",
    shortDescription: "Write blogs and marketing content.",
    description: `
Create engaging written content.
    `,
  },
  {
    id: 8,
    title: "SEO Specialist",
    department: "Marketing",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Improve search engine visibility.",
    description: `
Optimize content for SEO.
    `,
  },
  {
    id: 9,
    title: "HR Manager",
    department: "Human Resources",
    type: "Full-time",
    location: "On-site",
    shortDescription: "Manage hiring and company culture.",
    description: `
Oversee recruitment and employee relations.
    `,
  },
  {
    id: 10,
    title: "Data Analyst",
    department: "Analytics",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Analyze business data.",
    description: `
Interpret data to drive decisions.
    `,
  },

  // Duplicate pattern to reach 20
  ...Array.from({ length: 10 }).map((_, i) => ({
    id: 11 + i,
    title: `Software Engineer ${i + 1}`,
    department: "Engineering",
    type: "Full-time",
    location: "Remote",
    shortDescription: "Build and maintain application features.",
    description: `
Develop scalable software solutions.

Requirements:
- Programming experience
- Problem-solving skills
    `,
  })),
];
