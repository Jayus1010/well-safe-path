import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification } from "@/lib/notifications";
import { useNavigate } from "react-router-dom";

interface NotificationBellProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const typeColors: Record<string, string> = {
  warning: "bg-warning/20 border-l-warning",
  info: "bg-info/20 border-l-info",
  danger: "bg-destructive/20 border-l-destructive",
  success: "bg-success/20 border-l-success",
};

const NotificationBell = ({ notifications, onMarkRead, onMarkAllRead }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifikasi ({unreadCount})</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onMarkAllRead}>
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">Tidak ada notifikasi</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b border-border border-l-4 cursor-pointer transition-colors hover:bg-secondary/50 ${
                  typeColors[n.type] || ""
                } ${n.read ? "opacity-60" : ""}`}
                onClick={() => {
                  onMarkRead(n.id);
                  if (n.link) {
                    navigate(n.link);
                    setOpen(false);
                  }
                }}
              >
                <p className="text-xs font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
