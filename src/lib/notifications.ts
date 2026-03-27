export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "danger" | "success";
  timestamp: string;
  read: boolean;
  link?: string;
}

export function generateNotifications(
  hazards: { id: string; title: string; status: string; reportedAt: string; priority: string }[],
  permits: { id: string; type: string; status: string; date: string }[],
  accidents: { id: string; title: string; status: string; date: string }[],
  inspections: { id: string; title: string; status: string; date: string }[],
): Notification[] {
  const notifs: Notification[] = [];
  const now = new Date();

  // Hazards not resolved > 2 days
  hazards.filter(h => h.status === "open").forEach(h => {
    const days = Math.floor((now.getTime() - new Date(h.reportedAt).getTime()) / 86400000);
    if (days >= 2) {
      notifs.push({
        id: `notif-hzr-${h.id}`,
        title: "Bahaya belum ditindaklanjuti",
        message: `${h.id}: "${h.title}" sudah ${days} hari belum diproses`,
        type: "warning",
        timestamp: now.toISOString(),
        read: false,
        link: "/hazard-reports",
      });
    }
  });

  // Critical hazards
  hazards.filter(h => h.priority === "critical" && h.status !== "closed").forEach(h => {
    notifs.push({
      id: `notif-crit-${h.id}`,
      title: "⚠️ Bahaya CRITICAL",
      message: `${h.id}: "${h.title}" memerlukan penanganan segera!`,
      type: "danger",
      timestamp: now.toISOString(),
      read: false,
      link: "/hazard-reports",
    });
  });

  // Pending permits
  permits.filter(p => p.status === "pending" || p.status === "open").forEach(p => {
    notifs.push({
      id: `notif-wp-${p.id}`,
      title: "Ijin kerja menunggu approval",
      message: `${p.id}: ${p.type} belum mendapat persetujuan penuh`,
      type: "info",
      timestamp: now.toISOString(),
      read: false,
      link: "/work-permits",
    });
  });

  // Open accident investigations
  accidents.filter(a => a.status !== "closed").forEach(a => {
    notifs.push({
      id: `notif-acc-${a.id}`,
      title: "Investigasi kecelakaan belum selesai",
      message: `${a.id}: "${a.title}" masih dalam investigasi`,
      type: "danger",
      timestamp: now.toISOString(),
      read: false,
      link: "/accidents",
    });
  });

  // Upcoming inspections
  inspections.filter(i => i.status === "open").forEach(i => {
    const inspDate = new Date(i.date);
    const diff = Math.floor((inspDate.getTime() - now.getTime()) / 86400000);
    if (diff <= 2 && diff >= 0) {
      notifs.push({
        id: `notif-ins-${i.id}`,
        title: "Inspeksi segera dilaksanakan",
        message: `${i.id}: "${i.title}" dijadwalkan ${diff === 0 ? "hari ini" : `${diff} hari lagi`}`,
        type: "info",
        timestamp: now.toISOString(),
        read: false,
        link: "/inspections",
      });
    }
  });

  return notifs;
}
