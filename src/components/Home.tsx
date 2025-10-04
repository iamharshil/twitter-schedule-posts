"use client";

import { AlertCircleIcon, AtSignIcon, CalendarIcon, CheckCircleIcon, Clock3Icon, ClockIcon, EditIcon, HashIcon, ImageIcon, LogOutIcon, PlayIcon, SendIcon, TrashIcon, TwitterIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ModeToggle } from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Home() {
    const router = useRouter();
    const [postContent, setPostContent] = useState("");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState("");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'scheduled' | 'posted'>('scheduled');

    const [scheduledPosts, setScheduledPosts] = useState<Array<{
        id: string;
        content: string;
        scheduledFor: Date;
        status: 'pending' | 'failed';
    }>>([
        // Dummy scheduled posts
        {
            id: "1",
            content: "Just launched our new product! 🚀 Excited to see what you all think. #launch #innovation",
            scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            status: 'pending'
        },
        {
            id: "2",
            content: "Working on some exciting features for next week. Can't wait to share more details! 💻",
            scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
            status: 'pending'
        },
        {
            id: "3",
            content: "Big announcement coming soon! Stay tuned for something special 🎉",
            scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            status: 'pending'
        },
        {
            id: "4",
            content: "Weekend vibes! Time to relax and recharge. What are your plans? 🌟",
            scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            status: 'pending'
        },
        {
            id: "5",
            content: "Failed to post due to network issues. Will retry automatically. #tech #retry",
            scheduledFor: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            status: 'failed'
        }
    ]);

    const [postedContent, setPostedContent] = useState<Array<{
        id: string;
        content: string;
        postedAt: Date;
        engagement?: {
            likes: number;
            retweets: number;
            replies: number;
        };
    }>>([
        // Dummy posted content
        {
            id: "p1",
            content: "Thank you to everyone who attended our webinar yesterday! The feedback was amazing 🙏",
            postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            engagement: { likes: 42, retweets: 8, replies: 12 }
        },
        {
            id: "p2",
            content: "Excited to announce our partnership with @TechCorp! Together we're building the future of innovation. #partnership #innovation",
            postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            engagement: { likes: 89, retweets: 23, replies: 15 }
        },
        {
            id: "p3",
            content: "Behind the scenes: Our team working hard on the next big feature. Can't wait to show you what we've built! 💪",
            postedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            engagement: { likes: 156, retweets: 34, replies: 28 }
        },
        {
            id: "p4",
            content: "Happy Friday everyone! What's your favorite productivity tip? Share in the comments below 👇",
            postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            engagement: { likes: 203, retweets: 45, replies: 67 }
        },
        {
            id: "p5",
            content: "Just hit 10K followers! Thank you for being part of this amazing journey. Here's to many more milestones! 🎉",
            postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            engagement: { likes: 512, retweets: 89, replies: 134 }
        }
    ]);

    // Generate time options
    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return Array.from({ length: 4 }, (_, j) => {
            const minute = (j * 15).toString().padStart(2, '0');
            return `${hour}:${minute}`;
        });
    }).flat();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 0) {
            return `${Math.abs(diffInHours)}h ago`;
        } else if (diffInHours < 24) {
            return `In ${diffInHours}h`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const formatPostedTime = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout")
            .then(() => {
                router.refresh();
            })
    }

    const handleSchedulePost = () => {
        if (!postContent.trim() || !selectedDate || !selectedTime) return;

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduledDateTime = new Date(selectedDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        const newPost = {
            id: Date.now().toString(),
            content: postContent,
            scheduledFor: scheduledDateTime,
            status: 'pending' as const
        };

        setScheduledPosts(prev => [...prev, newPost]);
        setPostContent("");
        setSelectedTime("");
    };

    const handlePostNow = (postId: string) => {
        const post = scheduledPosts.find(p => p.id === postId);
        if (!post) return;

        // Move to posted content
        const postedPost = {
            id: `p${Date.now()}`,
            content: post.content,
            postedAt: new Date(),
            engagement: { likes: 0, retweets: 0, replies: 0 }
        };

        setPostedContent(prev => [postedPost, ...prev]);
        setScheduledPosts(prev => prev.filter(p => p.id !== postId));
    };

    const handleDeletePost = (postId: string) => {
        if (activeTab === 'scheduled') {
            setScheduledPosts(prev => prev.filter(post => post.id !== postId));
        } else {
            setPostedContent(prev => prev.filter(post => post.id !== postId));
        }
    };

    const getCharacterCount = () => {
        return postContent.length;
    };

    const getCharacterCountColor = () => {
        const count = getCharacterCount();
        if (count > 280) return "text-red-500";
        if (count > 260) return "text-yellow-500";
        return "text-gray-500";
    };

    const pendingCount = scheduledPosts.filter(p => p.status === 'pending').length;
    const failedCount = scheduledPosts.filter(p => p.status === 'failed').length;

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-xl">
                                <TwitterIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post Scheduler</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Manage your Twitter content</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ModeToggle />
                            <Button variant="outline" size="sm" onClick={handleLogout}>
                                <LogOutIcon className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="px-6 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Scheduled</p>
                                        <p className="text-2xl font-bold">{pendingCount}</p>
                                    </div>
                                    <Clock3Icon className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Posted</p>
                                        <p className="text-2xl font-bold">{postedContent.length}</p>
                                    </div>
                                    <CheckCircleIcon className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-100 text-sm">Failed</p>
                                        <p className="text-2xl font-bold">{failedCount}</p>
                                    </div>
                                    <AlertCircleIcon className="h-8 w-8 text-red-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Total</p>
                                        <p className="text-2xl font-bold">{scheduledPosts.length + postedContent.length}</p>
                                    </div>
                                    <SendIcon className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Create Post Section */}
                    <Card className="mb-8 shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <SendIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                Create New Post
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Post Content */}
                            <div className="space-y-3">
                                <Label htmlFor="post-content" className="text-base font-medium">What's happening?</Label>
                                <div className="relative">
                                    <Textarea
                                        id="post-content"
                                        placeholder="What's happening?"
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        className="min-h-[140px] resize-none text-base border-2 focus:border-blue-500 transition-colors"
                                        maxLength={280}
                                    />
                                    <div className="absolute bottom-3 right-3 text-sm">
                                        <span className={getCharacterCountColor()}>
                                            {getCharacterCount()}/280
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {/* <Button variant="outline" size="sm" className="h-10 px-4">
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Media
                                </Button> */}
                                <Button variant="outline" size="sm" className="h-10 px-4">
                                    <HashIcon className="h-4 w-4 mr-2" />
                                    Hashtag
                                </Button>
                                <Button variant="outline" size="sm" className="h-10 px-4">
                                    <AtSignIcon className="h-4 w-4 mr-2" />
                                    Mention
                                </Button>
                            </div>

                            {/* Date and Time Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Schedule Date</Label>
                                    <DropdownMenu open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start h-12 text-base border-2">
                                                <CalendarIcon className="mr-3 h-5 w-5" />
                                                {selectedDate ? formatDate(selectedDate) : "Select date"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={(date) => {
                                                    setSelectedDate(date);
                                                    setIsCalendarOpen(false);
                                                }}
                                                disabled={(date) => date < new Date()}
                                                initialFocus
                                            />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-base font-medium">Schedule Time</Label>
                                    <DropdownMenu open={isTimeOpen} onOpenChange={setIsTimeOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start h-12 text-base border-2">
                                                <ClockIcon className="mr-3 h-5 w-5" />
                                                {selectedTime || "Select time"}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-auto max-h-60 overflow-y-auto">
                                            {timeOptions.map((time) => (
                                                <DropdownMenuItem
                                                    key={time}
                                                    onClick={() => {
                                                        setSelectedTime(time);
                                                        setIsTimeOpen(false);
                                                    }}
                                                    className="text-base"
                                                >
                                                    {time}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Schedule Button */}
                            <Button
                                onClick={handleSchedulePost}
                                disabled={!postContent.trim() || !selectedDate || !selectedTime || getCharacterCount() > 280}
                                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            >
                                <SendIcon className="mr-2 h-5 w-5" />
                                Schedule Post
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Posts Tabs */}
                    <div className="space-y-6">
                        {/* Tab Navigation */}
                        <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                            <button
                                type="button"
                                onClick={() => setActiveTab('scheduled')}
                                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'scheduled'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Clock3Icon className="h-4 w-4 mr-2 inline" />
                                Scheduled ({pendingCount})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('posted')}
                                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'posted'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                                Posted ({postedContent.length})
                            </button>
                        </div>

                        {/* Posts Content */}
                        <Card className="shadow-lg border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
                            <CardContent className="p-6">
                                {activeTab === 'scheduled' ? (
                                    <div className="space-y-4">
                                        {scheduledPosts.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Clock3Icon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-600 dark:text-slate-400 text-lg">No scheduled posts yet</p>
                                                <p className="text-slate-500 dark:text-slate-500 text-sm">Create your first scheduled post above</p>
                                            </div>
                                        ) : (
                                            scheduledPosts
                                                .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
                                                .map((post) => (
                                                    <div key={post.id} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                                                        {formatDateTime(post.scheduledFor)}
                                                                    </span>
                                                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${post.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                                        }`}>
                                                                        {post.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-900 dark:text-white leading-relaxed text-base">{post.content}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-6">
                                                                {post.status === 'pending' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handlePostNow(post.id)}
                                                                        className="h-9 px-4 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                                                    >
                                                                        <PlayIcon className="h-4 w-4 mr-2" />
                                                                        Post Now
                                                                    </Button>
                                                                )}
                                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                                                    <EditIcon className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeletePost(post.id)}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {postedContent.length === 0 ? (
                                            <div className="text-center py-12">
                                                <CheckCircleIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-600 dark:text-slate-400 text-lg">No posted content yet</p>
                                                <p className="text-slate-500 dark:text-slate-500 text-sm">Your posted content will appear here</p>
                                            </div>
                                        ) : (
                                            postedContent.map((post) => (
                                                <div key={post.id} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full">
                                                                    {formatPostedTime(post.postedAt)}
                                                                </span>
                                                                <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                                    Posted
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-900 dark:text-white leading-relaxed text-base mb-4">{post.content}</p>
                                                            {post.engagement && (
                                                                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                                        {post.engagement.likes} likes
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                                        {post.engagement.retweets} retweets
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                                        {post.engagement.replies} replies
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-6">
                                                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                                                <EditIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeletePost(post.id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
