export type Event = {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
};

export const events: Event[] = [
  {
    id: 1,
    title: "Annual Company Meetup",
    date: "March 15, 2024",
    location: "Manila, Philippines",
    description: `
Our annual meetup brings the entire team together to celebrate milestones,
share company updates, and strengthen relationships across departments.

The event includes talks, workshops, and team-building activities.
    `,
    images: ["blog-05.jpg", "blog-06.jpg", "blog-07.jpg"],
  },

  {
    id: 2,
    title: "Product Launch Event",
    date: "January 28, 2024",
    location: "Online Event",
    description: `
We officially launched our newest product feature to the public.

The session included live demos, customer stories, and an open Q&A.
    `,
    images: ["blog-10.jpg", "blog-04.jpg", "blog-07.jpg"],
  },

  {
    id: 3,
    title: "Community Tech Workshop",
    date: "December 10, 2023",
    location: "Cebu City",
    description: `
A hands-on workshop aimed at sharing knowledge with the local tech community.

Topics included web development fundamentals, UI/UX basics, and career advice.
    `,
    images: ["blog-05.jpg", "blog-06.jpg", "blog-07.jpg"],
  },

  {
    id: 4,
    title: "Team Building Retreat",
    date: "November 18, 2023",
    location: "Tagaytay, Philippines",
    description: `
A weekend retreat focused on collaboration, trust-building, and relaxation.

Activities included outdoor games, group discussions, and wellness sessions.
    `,
    images: ["blog-06.jpg", "blog-07.jpg", "blog-05.jpg"],
  },

  {
    id: 5,
    title: "Design & UX Conference",
    date: "October 5, 2023",
    location: "Makati City",
    description: `
Our design team attended a regional UX conference to learn from industry experts.

The event featured keynote talks, design critiques, and networking sessions.
    `,
    images: ["blog-04.jpg", "blog-10.jpg", "blog-07.jpg"],
  },

  {
    id: 6,
    title: "Developer Hackathon",
    date: "September 16, 2023",
    location: "Online Event",
    description: `
A 24-hour internal hackathon where teams built experimental features and tools.

The event encouraged creativity, collaboration, and rapid prototyping.
    `,
    images: ["blog-05.jpg", "blog-06.jpg", "blog-07.jpg"],
  },

  {
    id: 7,
    title: "Client Appreciation Night",
    date: "August 20, 2023",
    location: "BGC, Taguig",
    description: `
An evening dedicated to celebrating our clients and partners.

The night featured presentations, dinner, and informal networking.
    `,
    images: ["blog-05.jpg", "blog-06.jpg", "blog-07.jpg"],
  },

  {
    id: 8,
    title: "Internal Training Day",
    date: "July 8, 2023",
    location: "Office Headquarters",
    description: `
A full-day training session focused on upskilling team members.

Topics included leadership, technical best practices, and communication skills.
    `,
    images: ["blog-05.jpg", "blog-06.jpg", "blog-10.jpg"],
  },

  {
    id: 9,
    title: "Startup Networking Mixer",
    date: "June 14, 2023",
    location: "Quezon City",
    description: `
A casual networking event bringing together founders, developers, and designers.

The goal was to foster connections and idea sharing across the startup community.
    `,
    images: ["blog-06.jpg", "blog-07.jpg", "blog-10.jpg"],
  },

  {
    id: 10,
    title: "Year-End Celebration",
    date: "December 22, 2022",
    location: "Pasay City",
    description: `
Our year-end party celebrated team achievements and milestones.

The event included awards, performances, and a festive dinner.
    `,
    images: ["blog-07.jpg", "blog-10.jpg", "blog-05.jpg"],
  },
];
