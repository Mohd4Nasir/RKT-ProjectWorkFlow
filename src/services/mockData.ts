import { Project, Task, Users, Notification, ActivityItem } from '@/types';

export const mockUsers: Users[] = [
  { id: 'u1', name: 'Aarav Sharma', email: 'aarav@rishikirti.com', role: 'admin', department: 'Engineering', status: 'active', joinedAt: '2023-04-12' },
  { id: 'u2', name: 'Sangeeta Patel', email: 'sangeeta@rishikirti.com', role: 'user', department: 'Design', status: 'active', joinedAt: '2023-06-21' },
  { id: 'u3', name: 'Rahul Verma', email: 'rahul@rishikirti.com', role: 'user', department: 'Engineering', status: 'active', joinedAt: '2024-01-08' },
  { id: 'u4', name: 'Sneha Iyer', email: 'sneha@rishikirti.com', role: 'user', department: 'Product', status: 'active', joinedAt: '2024-02-15' },
  { id: 'u5', name: 'Vikram Singh', email: 'vikram@rishikirti.com', role: 'user', department: 'QA', status: 'active', joinedAt: '2023-09-03' },
  { id: 'u6', name: 'Ananya Rao', email: 'ananya@rishikirti.com', role: 'user', department: 'Marketing', status: 'inactive', joinedAt: '2023-11-19' },
  { id: 'u7', name: 'Kabir Mehta', email: 'kabir@rishikirti.com', role: 'user', department: 'Engineering', status: 'active', joinedAt: '2024-03-22' },
  { id: 'u8', name: 'Isha Kapoor', email: 'isha@rishikirti.com', role: 'admin', department: 'Operations', status: 'active', joinedAt: '2022-12-01' },
];

export const mockProjects: Project[] = [
  { id: 'p1', name: 'Atlas Banking Portal', description: 'Next-gen retail banking dashboard with AI insights.', status: 'active', progress: 68, startDate: '2025-01-15', endDate: '2026-08-30', members: ['u1','u2','u3','u7'], ownerId: 'u1', sla: 'on-track', tag: 'Fintech', color: 'hsl(261 38% 59%)' },
  { id: 'p2', name: 'Helios CRM Revamp', description: 'Customer relationship platform redesign and migration.', status: 'active', progress: 42, startDate: '2025-03-01', endDate: '2026-09-15', members: ['u2','u4','u5'], ownerId: 'u8', sla: 'at-risk', tag: 'SaaS', color: 'hsl(38 92% 50%)' },
  { id: 'p3', name: 'Orbit Mobile App', description: 'iOS and Android consumer app for ride sharing.', status: 'on-hold', progress: 25, startDate: '2024-11-10', endDate: '2026-06-30', members: ['u3','u7'], ownerId: 'u1', sla: 'breached', tag: 'Mobile', color: 'hsl(0 84% 60%)' },
  { id: 'p4', name: 'Nimbus Cloud Migration', description: 'Migrate legacy infrastructure to AWS multi-region.', status: 'active', progress: 81, startDate: '2024-09-20', endDate: '2026-05-15', members: ['u1','u3','u5','u8'], ownerId: 'u8', sla: 'on-track', tag: 'DevOps', color: 'hsl(160 84% 39%)' },
  { id: 'p5', name: 'Lumen Marketing Site', description: 'Brand refresh with headless CMS and CRO.', status: 'completed', progress: 100, startDate: '2024-06-01', endDate: '2025-12-20', members: ['u2','u6'], ownerId: 'u8', sla: 'on-track', tag: 'Web', color: 'hsl(217 91% 60%)' },
  { id: 'p6', name: 'Vector Analytics', description: 'Real-time analytics platform for retail customers.', status: 'active', progress: 55, startDate: '2025-02-12', endDate: '2026-10-01', members: ['u4','u5','u7'], ownerId: 'u1', sla: 'at-risk', tag: 'Data', color: 'hsl(273 67% 49%)' },
];

const today = new Date('2026-05-01');
const addDays = (d: number) => {
  const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().slice(0,10);
};

export const mockTasks: Task[] = [
  { id: 't1', projectId: 'p1', title: 'Design dashboard widgets', description: 'Create reusable widget components with theming.', status: 'in-progress', priority: 'high', assigneeId: 'u2', dueDate: addDays(3), createdAt: addDays(-12), sla: 'on-track', subtasks: [{id:'s1', title:'Audit existing components', done:true},{id:'s2', title:'Create Figma library', done:true},{id:'s3', title:'Build storybook', done:false}], comments: [{id:'c1', authorId:'u1', text:'Looking great so far!', createdAt: addDays(-2)}], attachments: [{id:'a1', name:'wireframe.fig', size:'2.4MB', type:'figma'}] },
  { id: 't2', projectId: 'p1', title: 'Integrate auth API', description: 'Wire up OAuth + 2FA flow.', status: 'todo', priority: 'high', assigneeId: 'u3', dueDate: addDays(7), createdAt: addDays(-5), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't3', projectId: 'p1', title: 'Performance audit', description: 'Lighthouse + Core Web Vitals review.', status: 'done', priority: 'medium', assigneeId: 'u7', dueDate: addDays(-2), createdAt: addDays(-20), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't4', projectId: 'p2', title: 'Customer data migration', description: 'ETL pipeline for legacy CRM.', status: 'in-progress', priority: 'high', assigneeId: 'u5', dueDate: addDays(1), createdAt: addDays(-15), sla: 'at-risk', subtasks: [{id:'s4', title:'Schema mapping', done:true},{id:'s5', title:'Run dry migration', done:false}], comments: [], attachments: [] },
  { id: 't5', projectId: 'p2', title: 'New contact form', description: 'Multi-step form with validation.', status: 'todo', priority: 'medium', assigneeId: 'u4', dueDate: addDays(10), createdAt: addDays(-3), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't6', projectId: 'p3', title: 'iOS push notifications', description: 'APNs integration.', status: 'todo', priority: 'low', assigneeId: 'u3', dueDate: addDays(-3), createdAt: addDays(-25), sla: 'breached', subtasks: [], comments: [], attachments: [] },
  { id: 't7', projectId: 'p4', title: 'Set up VPC peering', description: 'Cross-region peering and route tables.', status: 'done', priority: 'high', assigneeId: 'u8', dueDate: addDays(-5), createdAt: addDays(-30), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't8', projectId: 'p4', title: 'Database failover test', description: 'Simulate primary failure.', status: 'in-progress', priority: 'high', assigneeId: 'u1', dueDate: addDays(5), createdAt: addDays(-8), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't9', projectId: 'p6', title: 'Streaming pipeline', description: 'Kafka -> Flink -> Pinot.', status: 'in-progress', priority: 'high', assigneeId: 'u7', dueDate: addDays(4), createdAt: addDays(-10), sla: 'at-risk', subtasks: [], comments: [], attachments: [] },
  { id: 't10', projectId: 'p6', title: 'Dashboard MVP', description: 'Core charts and filters.', status: 'todo', priority: 'medium', assigneeId: 'u4', dueDate: addDays(14), createdAt: addDays(-1), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't11', projectId: 'p1', title: 'QA test plan', description: 'Write E2E test scenarios.', status: 'todo', priority: 'medium', assigneeId: 'u5', dueDate: addDays(8), createdAt: addDays(-2), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
  { id: 't12', projectId: 'p2', title: 'Onboarding emails', description: 'Lifecycle emails for new users.', status: 'done', priority: 'low', assigneeId: 'u6', dueDate: addDays(-10), createdAt: addDays(-40), sla: 'on-track', subtasks: [], comments: [], attachments: [] },
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
