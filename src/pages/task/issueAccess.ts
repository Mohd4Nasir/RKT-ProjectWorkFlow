import type { Issue, IssueStatus } from '@/services/issueService';
import { isObserver, isOwner, isPrivileged, type MyProjectAccess } from '@/hooks/useMyProjectAccess';

/**
 * What the current user may do with an issue (activities-and-issues-api.md, "Permissions summary" + "Status flow").
 * The backend re-checks everything (401), this only hides buttons that would fail.
 * Until the user's role is known (`me.userId == null`) only the state rules apply, so nothing is hidden wrongly.
 */

/** statuses an issue may move to from `from`, ignoring who is asking. OPEN is never a target (use REOPENED). */
const FLOW: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['RESOLVED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
};

export interface IssueAccess {
  /** observers can only read */
  canRaise: boolean;
  canEdit: boolean;
  canAssign: boolean;
  /** project owner only */
  canDelete: boolean;
  /** status buttons to offer: allowed by the flow AND by the user's role */
  nextStatuses: IssueStatus[];
}

export function issueAccess(issue: Pick<Issue, 'status' | 'reportedBy' | 'assignee'>, me: MyProjectAccess): IssueAccess {
  const known = me.userId != null;
  const priv = isPrivileged(me.role);
  const reporter = known && issue.reportedBy?.userId === me.userId;
  const assignee = known && issue.assignee?.userId === me.userId;
  const staff = !known || priv; // unknown user: let the server decide

  const mayWork = staff || assignee;      // IN_PROGRESS / RESOLVED
  const mayJudge = staff || reporter;     // CLOSED / REOPENED

  const nextStatuses = FLOW[issue.status].filter((to) =>
    to === 'IN_PROGRESS' || to === 'RESOLVED' ? mayWork : mayJudge);

  return {
    canRaise: !isObserver(me.role),
    canEdit: staff || reporter,
    canAssign: (staff || reporter) && issue.status !== 'CLOSED',
    canDelete: !known || isOwner(me.role),
    nextStatuses,
  };
}
