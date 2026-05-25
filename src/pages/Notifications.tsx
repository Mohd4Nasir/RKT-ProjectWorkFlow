import { useAppDispatch, useAppSelector } from '@/store';
import { markAllRead, markRead, removeNotification } from '@/store/slices/notificationsSlice';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Calendar, MessageCircle, X, Check } from 'lucide-react';
import { relativeTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const iconFor = { assigned: BellRing, deadline: Calendar, status: Bell, mention: MessageCircle };

export default function Notifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);
  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unread.length ? `You have ${unread.length} unread notification${unread.length > 1 ? 's' : ''}` : 'You\'re all caught up'}
        actions={<Button variant="outline" onClick={() => dispatch(markAllRead())}><Check className="h-4 w-4 mr-1" />Mark all read</Button>}
      />

      <div className="card-elevated divide-y divide-border">
        {notifications.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No notifications yet
          </div>
        )}
        {notifications.map((n) => {
          const Icon = (iconFor as any)[n.type] || Bell;
          return (
            <div key={n.id} className={cn('p-4 flex items-start gap-4 hover:bg-muted/20', !n.read && 'bg-primary-soft/20')}>
              <div className="h-10 w-10 rounded-xl grid place-items-center bg-primary-soft text-primary shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.description}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{relativeTime(n.createdAt)}</div>
              </div>
              <div className="flex gap-1">
                {!n.read && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => dispatch(markRead(n.id))}><Check className="h-4 w-4" /></Button>}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => dispatch(removeNotification(n.id))}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
