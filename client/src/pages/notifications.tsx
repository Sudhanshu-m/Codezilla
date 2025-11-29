import { useState } from "react";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, Award, AlertCircle, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  type: "deadline" | "match" | "application" | "system";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "deadline",
    title: "Deadline Approaching",
    message: "National Merit STEM Scholarship deadline is in 7 days. Don't forget to submit your application!",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "2",
    type: "match",
    title: "New Scholarship Match",
    message: "You have a 95% match with Tech Diversity Excellence Award. Check it out!",
    timestamp: "5 hours ago",
    isRead: false,
  },
  {
    id: "3",
    type: "application",
    title: "Application Received",
    message: "Your application for Community Leadership Grant has been successfully submitted.",
    timestamp: "1 day ago",
    isRead: true,
  },
  {
    id: "4",
    type: "system",
    title: "Profile Update Reminder",
    message: "Keep your profile up to date to get better scholarship matches.",
    timestamp: "2 days ago",
    isRead: true,
  },
  {
    id: "5",
    type: "match",
    title: "New Scholarships Available",
    message: "3 new scholarships matching your profile have been added. View your matches now!",
    timestamp: "3 days ago",
    isRead: true,
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "match":
        return <Award className="w-5 h-5 text-green-500" />;
      case "application":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "system":
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "deadline":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Deadline</Badge>;
      case "match":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Match</Badge>;
      case "application":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Application</Badge>;
      case "system":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">System</Badge>;
      default:
        return <Badge variant="outline">Notification</Badge>;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
            </h1>
            <p className="text-slate-600 mt-2">
              Stay updated with your scholarship applications and matches
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={markAllAsRead}
              data-testid="button-mark-all-read"
            >
              Mark all as read
            </Button>
          )}
        </div>

        {unreadCount > 0 && (
          <div className="mb-6">
            <Badge className="bg-primary text-white">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No notifications yet</p>
                <p className="text-sm text-slate-400 mt-2">
                  We'll notify you when there are updates about your scholarships
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? "border-l-4 border-l-primary bg-blue-50/30" : ""
                }`}
                data-testid={`card-notification-${notification.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}>
                          {notification.title}
                        </h3>
                        {getTypeBadge(notification.type)}
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-slate-400">
                        {notification.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-slate-400 hover:text-red-500"
                        data-testid={`button-delete-${notification.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
