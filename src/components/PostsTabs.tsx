"use client";

import { CheckCircleIcon, Clock3Icon, EditIcon, PlayIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ScheduledPost } from '@/types/posts';

export default function PostsTabs({
    activeTab,
    setActiveTab,
    scheduledPosts,
    postedContent,
    onPostNow,
    onDelete,
}: {
    activeTab: 'scheduled' | 'posted';
    setActiveTab: (t: 'scheduled' | 'posted') => void;
    scheduledPosts: ScheduledPost[];
    postedContent: Array<{ id: string; content: string; postedAt: Date }>;
    onPostNow: (id?: string) => void;
    onDelete: (id?: string) => void;
}) {
    return (
        <div className="space-y-6">
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
                    Scheduled ({scheduledPosts.length})
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
                                scheduledPosts.map((post) => (
                                    <div key={post.id} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                                                        {(() => {
                                                            try {
                                                                const d = post.scheduledFor instanceof Date ? post.scheduledFor : new Date(post.scheduledFor);
                                                                return Number.isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
                                                            } catch {
                                                                return String(post.scheduledFor ?? '');
                                                            }
                                                        })()}
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
                                                        onClick={() => onPostNow(post.id)}
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
                                                    onClick={() => onDelete(post.id)}
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
                                                    <span className="text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full">
                                                        {(() => {
                                                            try {
                                                                const d = post.postedAt instanceof Date ? post.postedAt : new Date(post.postedAt);
                                                                return Number.isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString();
                                                            } catch {
                                                                return String(post.postedAt ?? '');
                                                            }
                                                        })()}
                                                    </span>
                                                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Posted
                                                    </span>
                                                </div>
                                                <p className="text-slate-900 dark:text-white leading-relaxed text-base mb-4">{post.content}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-6">
                                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                                    <EditIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onDelete(post.id)}
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
    );
}
