'use client';

import { useState, useEffect, useCallback, useRef } from 'react';


interface Comment {
    id: string;
    nickname: string;
    content: string;
    created_at: string;
    is_admin?: number;
    parent_id?: string;
}


interface CommentsProps {
    pageId: string;
    pageTitle: string;
}

export default function Comments({ pageId, pageTitle }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [nickname, setNickname] = useState('');
    const [contact, setContact] = useState('');
    const [content, setContent] = useState('');
    const [hpCheck, setHpCheck] = useState(''); // Honeypot state
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const formRef = useRef<HTMLFormElement>(null);



    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/comments?slug=${encodeURIComponent(pageId)}`);
            interface CommentsResponse {
                comments?: Comment[];
            }
            const data = (await res.json()) as CommentsResponse;
            if (data.comments) {
                setComments(data.comments);
            }

        } catch (error) {
            console.error('Failed to fetch comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [pageId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchComments();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchComments]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname || !content || isSubmitting) return;


        setIsSubmitting(true);
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: pageId,
                    pageTitle, // 新增：传递文章标题
                    nickname,
                    contact,
                    content,
                    parent_id: replyTo?.id || null,
                    hp_check: hpCheck // Send honeypot value
                }),
            });



            if (res.ok) {
                setNickname('');
                setContact('');
                setContent('');
                setReplyTo(null);
                fetchComments();
            }



        } catch (error) {
            console.error('Failed to post comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-16 pt-8 border-t border-white/5 space-y-12">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="h-1 w-[1px] bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                    Terminal_Comments / 终端评论系统
                </span>
            </div>

            {/* Comment Form - Tactical Style */}
            <div className="pl-6 relative max-w-2xl">
                {/* Vertical Axis Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">

                    {replyTo && (
                        <div className="flex items-center gap-2 mb-[-1.5rem] animate-in slide-in-from-left duration-300">
                            <span className="text-[9px] font-mono text-white/40 italic flex items-center gap-1">
                                <span className="w-1 h-1 bg-white/20"></span>
                                Replying to @{replyTo.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="text-[9px] font-mono text-white/10 hover:text-white transition-colors"
                            >
                                [ CANCEL_REPLY ]
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-10">

                        <div className="flex-1 border-b border-white/10 pb-2 group focus-within:border-white/30 transition-colors">
                            <label className="text-[8px] font-mono text-white/20 uppercase block mb-1 tracking-widest">
                                Identity / 称呼
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                                placeholder="Nickname"
                                className="bg-transparent w-full text-sm font-mono text-white/80 outline-none placeholder:text-white/5"
                            />
                        </div>
                        <div className="flex-1 border-b border-white/10 pb-2 group focus-within:border-white/30 transition-colors">
                            <label className="text-[8px] font-mono text-white/20 uppercase block mb-1 tracking-widest">
                                Correspondence / 联系方式
                            </label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="Optional"
                                className="bg-transparent w-full text-sm font-mono text-white/80 outline-none placeholder:text-white/5"
                            />
                        </div>
                    </div>

                    <div className="border-b border-white/10 pb-2 group focus-within:border-white/30 transition-colors">
                        <label className="text-[8px] font-mono text-white/20 uppercase block mb-1 tracking-widest">
                            Observation / 内容
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={2}
                            placeholder="..."
                            className="bg-transparent w-full text-sm font-mono text-white/80 outline-none resize-none placeholder:text-white/5"
                        />
                    </div>

                    <div className="hidden">
                        <label htmlFor="hp_check">Do not fill this out if you are human</label>
                        <input
                            type="text"
                            id="hp_check"
                            name="hp_check"
                            value={hpCheck}
                            onChange={(e) => setHpCheck(e.target.value)}
                            autoComplete="off"
                            tabIndex={-1}
                        />
                    </div>
                    <div className="flex justify-start">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="text-[10px] uppercase font-mono border border-white/10 px-8 py-2 text-white/40 hover:text-white hover:border-white/30 transition-all active:scale-95 disabled:opacity-20"
                        >
                            {isSubmitting ? 'TRANSMITTING...' : '[ CONFIRM_SIGNAL ]'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comment List - Ghost Style */}
            <div className="space-y-10 pt-4">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">Signals_Received</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                {isLoading ? (
                    <div className="py-10 text-center">
                        <span className="text-[9px] font-mono text-white/10 animate-pulse italic">
                            CONNECTING_D1_INSTANCE...
                        </span>
                    </div>
                ) : comments.length > 0 ? (
                    <div className="space-y-12">
                        {/* 渲染根级评论及其回复 */}
                        {comments.filter(c => !c.parent_id).map((comment, i) => {
                            const replies = comments.filter(r => r.parent_id === comment.id);

                            return (
                                <div key={comment.id || i} className="space-y-6">
                                    {/* Root Comment */}
                                    <div className="flex gap-6 group">
                                        <div className="mt-1.5 w-1 h-1 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors shadow-[0_0_8px_rgba(255,255,255,0)] group-hover:shadow-[0_0_8px_rgba(255,255,255,0.2)]" />

                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                                                <span className={`text-[11px] font-bold uppercase tracking-widest ${comment.is_admin ? 'text-green-500/60' : 'text-white/40'}`}>
                                                    {comment.nickname} {comment.is_admin ? '[ADMIN]' : ''}
                                                </span>
                                                <span className="text-[9px] text-white/10 font-mono italic">
                                                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setReplyTo({ id: comment.id, name: comment.nickname });
                                                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}

                                                    className="text-[9px] font-mono text-white/10 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    [ REPLY ]
                                                </button>
                                            </div>
                                            <p className="text-[13px] text-white/50 font-mono leading-relaxed group-hover:text-white/70 transition-colors">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-Replies */}
                                    {replies.length > 0 && (
                                        <div className="ml-10 space-y-6 border-l border-white/5 pl-6">
                                            {replies.map((reply, ri) => (
                                                <div key={reply.id || ri} className="flex gap-4 group/reply">
                                                    <div className="mt-1.5 w-[2px] h-[2px] bg-white/10 group-hover/reply:bg-white/30" />
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${reply.is_admin ? 'text-green-500/60' : 'text-white/30'}`}>
                                                                {reply.nickname} {reply.is_admin ? '[ADMIN]' : ''}
                                                            </span>
                                                            <span className="text-[8px] text-white/10 font-mono italic">
                                                                {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] text-white/40 font-mono leading-relaxed">
                                                            {reply.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (

                    <div className="py-16 text-center">
                        <span className="text-[9px] font-mono text-white/5 uppercase tracking-[0.5em] italic">
                            No_Input_Signals_Detected
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

}
