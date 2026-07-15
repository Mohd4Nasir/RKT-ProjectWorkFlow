import { Project, Task, Users, Notification, ActivityItem, PublicProject } from '@/types/ProejctAndTask';

export const mockUsers: Users[] = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@rishikirti.com', role: 'admin', department: 'Engineering', status: 'active', joinedAt: '2023-04-12' },
  { id: 2, name: 'Sangeeta Patel', email: 'sangeeta@rishikirti.com', role: 'user', department: 'Design', status: 'active', joinedAt: '2023-06-21' },
  { id: 3, name: 'Rahul Verma', email: 'rahul@rishikirti.com', role: 'user', department: 'Engineering', status: 'active', joinedAt: '2024-01-08' },
  { id: 4, name: 'Sneha Iyer', email: 'sneha@rishikirti.com', role: 'user', department: 'Product', status: 'active', joinedAt: '2024-02-15' },
  { id: 5, name: 'Vikram Singh', email: 'vikram@rishikirti.com', role: 'user', department: 'QA', status: 'active', joinedAt: '2023-09-03' },
  { id: 6, name: 'Ananya Rao', email: 'ananya@rishikirti.com', role: 'user', department: 'Marketing', status: 'inactive', joinedAt: '2023-11-19' },
  { id: 7, name: 'Kabir Mehta', email: 'kabir@rishikirti.com', role: 'user', department: 'Engineering', status: 'active', joinedAt: '2024-03-22' },
  { id: 8, name: 'Isha Kapoor', email: 'isha@rishikirti.com', role: 'admin', department: 'Operations', status: 'active', joinedAt: '2022-12-01' },
];


//  all  Public projects are accessible to all users, but only those with 'public' access can be joined without restrictions. Projects with 'restricted' access require approval from the project owner, while 'private' projects are not visible to users who are not members.



 export const mockPublicProjects: PublicProject[] = [
  {
    id: 'pub_1',
    name: 'Open Source AI Library',
    description: 'Community-driven AI library for developers',
    status: 'active',
    ownerId: 'user_1',
    access: 'public',
    createdAt: '2024-01-15',
    joined: false,
    tags: ['AI', 'Open Source', 'Machine Learning'],
    stars: 245
  },
  {
    id: 'pub_2',
    name: 'Climate Action Initiative',
    description: 'Global collaboration on climate change solutions',
    status: 'in-progress',
    ownerId: 'user_2',
    access: 'public',
    createdAt: '2024-02-20',
    joined: true,
    tags: ['Environment', 'Sustainability'],
    stars: 189
  },
  {
    id: 'pub_3',
    name: 'Web Components Library',
    description: 'Reusable web components for modern applications',
    status: 'active',
    ownerId: 'user_3',
    access: 'restricted',
    createdAt: '2024-01-10',
    joined: false,
    tags: ['Web Development', 'Components'],
    stars: 67
  },
  {
    id: 'pub_4',
    name: 'Blockchain Education Platform',
    description: 'Learn blockchain development through hands-on projects',
    status: 'active',
    ownerId: 'user_1',
    access: 'public',
    createdAt: '2024-03-01',
    joined: false,
    tags: ['Blockchain', 'Education'],
    stars: 123
  },
  {
    id: 'pub_5',
    name: 'Health Data Standardization',
    description: 'Standardizing healthcare data formats and APIs',
    status: 'on-hold',
    ownerId: 'user_4',
    access: 'restricted',
    createdAt: '2023-12-05',
    joined: false,
    tags: ['Healthcare', 'Data Standards'],
    stars: 45
  },
  {
    id: 'pub_6',
    name: 'Mobile UI Kit',
    description: 'Cross-platform mobile UI components',
    status: 'completed',
    ownerId: 'user_2',
    access: 'public',
    createdAt: '2023-11-20',
    joined: true,
    tags: ['Mobile', 'UI/UX'],
    stars: 234
  },
  {
    id: 'pub_7',
    name: 'DevOps Toolchain',
    description: 'Automated CI/CD pipeline tools',
    status: 'in-progress',
    ownerId: 'user_5',
    access: 'public',
    createdAt: '2024-02-10',
    joined: false,
    tags: ['DevOps', 'Automation'],
    stars: 178
  },
  {
    id: 'pub_8',
    name: 'Data Visualization Framework',
    description: 'Framework for building interactive data dashboards',
    status: 'active',
    ownerId: 'user_3',
    access: 'public',
    createdAt: '2024-01-25',
    joined: false,
    tags: ['Data Visualization', 'Analytics'],
    stars: 312
  }
];
export const mockProjects: Project[] = [
  {
    id: "p1",
    projectId: "P001",
    projectTitle: "Atlas Banking Portal",
    ownerId: "u1",
    ownerName: "John Doe",
    projectStatus: "IN_PROGRESS",
    description: "Next-gen retail banking dashboard with AI insights.",
    progress: 68,
    startDate: "2025-01-15",
    endDate: "2026-08-30",
    members: ["u1", "u2", "u3", "u7"],
    totalTask: 120,
    completedTask: 82,
    tag: "Fintech",
    color: "hsl(261 38% 59%)",
  },
  {
    id: "p2",
    projectId: "P002",
    projectTitle: "Helios CRM Revamp",
    ownerId: "u8",
    ownerName: "Sarah Wilson",
    projectStatus: "IN_PROGRESS",
    description: "Customer relationship platform redesign and migration.",
    progress: 42,
    startDate: "2025-03-01",
    endDate: "2026-09-15",
    members: ["u2", "u4", "u5"],
    totalTask: 85,
    completedTask: 36,
    tag: "SaaS",
    color: "hsl(38 92% 50%)",
  },
  {
    id: "p3",
    projectId: "P003",
    projectTitle: "Orbit Mobile App",
    ownerId: "u1",
    ownerName: "John Doe",
    projectStatus: "ON_HOLD",
    description: "iOS and Android consumer app for ride sharing.",
    progress: 25,
    startDate: "2024-11-10",
    endDate: "2026-06-30",
    members: ["u3", "u7"],
    totalTask: 60,
    completedTask: 15,
    tag: "Mobile",
    color: "hsl(0 84% 60%)",
  },
  {
    id: "p4",
    projectId: "P004",
    projectTitle: "Nimbus Cloud Migration",
    ownerId: "u8",
    ownerName: "Sarah Wilson",
    projectStatus: "IN_PROGRESS",
    description: "Migrate legacy infrastructure to AWS multi-region.",
    progress: 81,
    startDate: "2024-09-20",
    endDate: "2026-05-15",
    members: ["u1", "u3", "u5", "u8"],
    totalTask: 150,
    completedTask: 122,
    tag: "DevOps",
    color: "hsl(160 84% 39%)",
  },
  {
    id: "p5",
    projectId: "P005",
    projectTitle: "Lumen Marketing Site",
    ownerId: "u8",
    ownerName: "Sarah Wilson",
    projectStatus: "COMPLETED",
    description: "Brand refresh with headless CMS and CRO.",
    progress: 100,
    startDate: "2024-06-01",
    endDate: "2025-12-20",
    members: ["u2", "u6"],
    totalTask: 40,
    completedTask: 40,
    tag: "Web",
    color: "hsl(217 91% 60%)",
  },
  {
    id: "p6",
    projectId: "P006",
    projectTitle: "Vector Analytics",
    ownerId: "u1",
    ownerName: "John Doe",
    projectStatus: "IN_PROGRESS",
    description: "Real-time analytics platform for retail customers.",
    progress: 55,
    startDate: "2025-02-12",
    endDate: "2026-10-01",
    members: ["u4", "u5", "u7"],
    totalTask: 95,
    completedTask: 52,
    tag: "Data",
    color: "hsl(273 67% 49%)",
  },
];

const today = new Date('2026-05-01');
const addDays = (d: number) => {
  const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().slice(0,10);
};

export const mockTasks = [
  {
    projectId: "p1", // Design System Project
    listId: 9,
    listTitle: "Design Tasks",
    sequence: 5000,
    tasks: [
      {
        endDate: "2026-06-30",
        listId: 9,
        parentTaskId: null,
        startDate: "2026-06-23",
        subTask: [
          {
            subTaskId: 101,
            subTaskTitle: "Audit existing components",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 102,
            subTaskTitle: "Create Figma library",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 103,
            subTaskTitle: "Build storybook",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 15,
        taskSequence: 10000,
        taskStatus: "TODO",
        taskTitle: "Design dashboard widgets"
      },
      {
        endDate: "2026-07-07",
        listId: 9,
        parentTaskId: null,
        startDate: "2026-06-25",
        subTask: [
          {
            subTaskId: 104,
            subTaskTitle: "Setup OAuth provider",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 105,
            subTaskTitle: "Implement 2FA flow",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 106,
            subTaskTitle: "Test authentication endpoints",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 107,
            subTaskTitle: "Add refresh token logic",
            subTaskStatus: "DONE"
          }
        ],
        taskId: 16,
        taskSequence: 10001,
        taskStatus: "IN_PROGRESS",
        taskTitle: "Integrate auth API"
      }
    ]
  },
  {
    projectId: "P002", // Backend Migration Project
    listId: 10,
    listTitle: "Backend Tasks",
    sequence: 6000,
    tasks: [
      {
        endDate: "2026-07-15",
        listId: 10,
        parentTaskId: null,
        startDate: "2026-06-20",
        subTask: [
          {
            subTaskId: 108,
            subTaskTitle: "Setup Lighthouse CI",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 109,
            subTaskTitle: "Run performance tests",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 110,
            subTaskTitle: "Optimize images",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 111,
            subTaskTitle: "Fix Core Web Vitals",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 17,
        taskSequence: 20000,
        taskStatus: "TODO",
        taskTitle: "Performance audit"
      },
      {
        endDate: "2026-07-01",
        listId: 10,
        parentTaskId: null,
        startDate: "2026-06-18",
        subTask: [
          {
            subTaskId: 112,
            subTaskTitle: "Schema mapping",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 113,
            subTaskTitle: "Run dry migration",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 114,
            subTaskTitle: "Data validation",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 115,
            subTaskTitle: "Production migration",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 116,
            subTaskTitle: "Rollback plan",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 18,
        taskSequence: 20001,
        taskStatus: "IN_PROGRESS",
        taskTitle: "Customer data migration"
      },
      {
        endDate: "2026-07-20",
        listId: 10,
        parentTaskId: null,
        startDate: "2026-06-28",
        subTask: [
          {
            subTaskId: 117,
            subTaskTitle: "Design form UI",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 118,
            subTaskTitle: "Add form validation",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 119,
            subTaskTitle: "Implement multi-step",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 120,
            subTaskTitle: "Connect to API",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 19,
        taskSequence: 20002,
        taskStatus: "TODO",
        taskTitle: "New contact form"
      }
    ]
  },
  {
    projectId: "P003", // Mobile App Project
    listId: 11,
    listTitle: "Mobile Tasks",
    sequence: 7000,
    tasks: [
      {
        endDate: "2026-06-28",
        listId: 11,
        parentTaskId: null,
        startDate: "2026-06-10",
        subTask: [
          {
            subTaskId: 121,
            subTaskTitle: "Get APNs certificate",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 122,
            subTaskTitle: "Setup notification service",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 123,
            subTaskTitle: "Handle push notifications",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 124,
            subTaskTitle: "Test on real device",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 20,
        taskSequence: 30000,
        taskStatus: "TODO",
        taskTitle: "iOS push notifications"
      },
      {
        endDate: "2026-07-10",
        listId: 11,
        parentTaskId: null,
        startDate: "2026-06-15",
        subTask: [
          {
            subTaskId: 125,
            subTaskTitle: "Configure VPC",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 126,
            subTaskTitle: "Setup peering connection",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 127,
            subTaskTitle: "Update route tables",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 128,
            subTaskTitle: "Security group rules",
            subTaskStatus: "DONE"
          }
        ],
        taskId: 21,
        taskSequence: 30001,
        taskStatus: "DONE",
        taskTitle: "Set up VPC peering"
      }
    ]
  },
  {
    projectId: "P004", // Infrastructure Project
    listId: 12,
    listTitle: "DevOps Tasks",
    sequence: 8000,
    tasks: [
      {
        endDate: "2026-07-12",
        listId: 12,
        parentTaskId: null,
        startDate: "2026-06-22",
        subTask: [
          {
            subTaskId: 129,
            subTaskTitle: "Setup replica database",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 130,
            subTaskTitle: "Configure failover",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 131,
            subTaskTitle: "Test primary failure",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 132,
            subTaskTitle: "Monitoring setup",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 133,
            subTaskTitle: "Document process",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 22,
        taskSequence: 40000,
        taskStatus: "IN_PROGRESS",
        taskTitle: "Database failover test"
      },
      {
        endDate: "2026-07-11",
        listId: 12,
        parentTaskId: null,
        startDate: "2026-06-21",
        subTask: [
          {
            subTaskId: 134,
            subTaskTitle: "Setup Kafka cluster",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 135,
            subTaskTitle: "Configure Flink",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 136,
            subTaskTitle: "Setup Pinot",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 137,
            subTaskTitle: "Data ingestion pipeline",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 138,
            subTaskTitle: "Test streaming",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 23,
        taskSequence: 40001,
        taskStatus: "IN_PROGRESS",
        taskTitle: "Streaming pipeline"
      },
      {
        endDate: "2026-07-25",
        listId: 12,
        parentTaskId: null,
        startDate: "2026-06-30",
        subTask: [
          {
            subTaskId: 139,
            subTaskTitle: "Design charts",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 140,
            subTaskTitle: "Add filters",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 141,
            subTaskTitle: "Real-time data updates",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 142,
            subTaskTitle: "Responsive design",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 143,
            subTaskTitle: "Export functionality",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 24,
        taskSequence: 40002,
        taskStatus: "TODO",
        taskTitle: "Dashboard MVP"
      }
    ]
  },
  {
    projectId: "P005", // QA Project
    listId: 13,
    listTitle: "QA Tasks",
    sequence: 9000,
    tasks: [
      {
        endDate: "2026-07-18",
        listId: 13,
        parentTaskId: null,
        startDate: "2026-06-29",
        subTask: [
          {
            subTaskId: 144,
            subTaskTitle: "Write test scenarios",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 145,
            subTaskTitle: "Setup Cypress",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 146,
            subTaskTitle: "Write E2E tests",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 147,
            subTaskTitle: "Integrate with CI/CD",
            subTaskStatus: "TODO"
          },
          {
            subTaskId: 148,
            subTaskTitle: "Test reports",
            subTaskStatus: "TODO"
          }
        ],
        taskId: 25,
        taskSequence: 50000,
        taskStatus: "TODO",
        taskTitle: "QA test plan"
      },
      {
        endDate: "2026-06-21",
        listId: 13,
        parentTaskId: null,
        startDate: "2026-06-01",
        subTask: [
          {
            subTaskId: 149,
            subTaskTitle: "Design email templates",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 150,
            subTaskTitle: "Setup email service",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 151,
            subTaskTitle: "Write email content",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 152,
            subTaskTitle: "Test email delivery",
            subTaskStatus: "DONE"
          },
          {
            subTaskId: 153,
            subTaskTitle: "Analytics tracking",
            subTaskStatus: "DONE"
          }
        ],
        taskId: 26,
        taskSequence: 50001,
        taskStatus: "DONE",
        taskTitle: "Onboarding emails"
      }
    ]
  }
];

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'assigned', title: 'New task assigned', description: '“Design dashboard widgets” was assigned to you', createdAt: addDays(0), read: false, link: '/tasks' },
  { id: 'n2', type: 'deadline', title: 'Deadline tomorrow', description: '“Customer data migration” is due in 24 hours', createdAt: addDays(0), read: false, link: '/tasks' },
  { id: 'n3', type: 'status', title: 'Project updated', description: 'Atlas Banking Portal moved to 68% complete', createdAt: addDays(-1), read: true, link: '/projects' },
  { id: 'n4', type: 'mention', title: 'You were mentioned', description: 'Aarav mentioned you in “Design dashboard widgets”', createdAt: addDays(-2), read: true, link: '/tasks' },
];

export const mockActivity: ActivityItem[] = [
  { id: 'av1', userId: 'u1', action: 'completed task', target: 'Performance audit', createdAt: addDays(-1) },
  { id: 'av2', userId: 'u2', action: 'commented on', target: 'Design dashboard widgets', createdAt: addDays(-1) },
  { id: 'av3', userId: 'u3', action: 'created task', target: 'iOS push notifications', createdAt: addDays(-2) },
  { id: 'av4', userId: 'u8', action: 'updated project', target: 'Nimbus Cloud Migration', createdAt: addDays(-2) },
  { id: 'av5', userId: 'u4', action: 'joined project', target: 'Vector Analytics', createdAt: addDays(-3) },
  { id: 'av6', userId: 'u5', action: 'closed task', target: 'Onboarding emails', createdAt: addDays(-4) },
];

// Demo accounts
export const demoAccounts = [
  { email: 'admin@rishikirti.com', password: 'admin123', userId: 'u1' },
  { email: 'user@rishikirti.com', password: 'user123', userId: 'u2' },
];
