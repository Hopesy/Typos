'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';


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
    const t = useTranslations('comments');
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
        <div className="mt-12 pt-6 border-t border-hud-line-soft space-y-8">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="h-1 w-[1px] bg-hud-faint" />
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-hud-dim">
                    {t('title')}
                </span>
            </div>

            {/* Comment Form - Tactical Style */}
            <div className="pl-6 relative max-w-2xl">
                {/* Vertical Axis Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-hud-line via-hud-line-soft to-transparent" />

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">

                    {replyTo && (
                        <div className="flex items-center gap-2 mb-[-1.5rem] animate-in slide-in-from-left duration-300">
                            <span className="text-[11px] font-mono text-hud-muted italic flex items-center gap-1">
                                <span className="w-1 h-1 bg-hud-faint"></span>
                                {t('replyingTo')}{replyTo.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="text-[11px] font-mono text-hud-faint hover:text-hud-strong transition-colors"
                            >
                                {t('cancelReply')}
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-5 md:gap-8">

                        <div className="flex-1 border-b border-hud-line pb-2 group focus-within:border-hud-line-strong transition-colors">
                            <label className="text-[12px] font-mono text-hud-dim uppercase block mb-1 tracking-[0.18em]">
                                {t('identity')}
                            </label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                required
                                placeholder={t('nicknamePlaceholder')}
                                className="bg-transparent w-full text-base font-mono text-hud-strong outline-none placeholder:text-hud-faint placeholder:text-[11px]"
                            />
                        </div>
                        <div className="flex-1 border-b border-hud-line pb-2 group focus-within:border-hud-line-strong transition-colors">
                            <label className="text-[12px] font-mono text-hud-dim uppercase block mb-1 tracking-[0.18em]">
                                {t('contact.label')}
                            </label>
                            <input
                                type="text"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder={t('contact.placeholder')}
                                className="bg-transparent w-full text-base font-mono text-hud-strong outline-none placeholder:text-hud-faint placeholder:text-[11px]"
                            />
                        </div>
                    </div>

                    <div className="border-b border-hud-line pb-2 group focus-within:border-hud-line-strong transition-colors">
                        <label className="text-[12px] font-mono text-hud-dim uppercase block mb-1 tracking-[0.18em]">
                            {t('observation')}
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            rows={2}
                            placeholder="..."
                            className="bg-transparent w-full text-base font-mono text-hud-strong outline-none resize-none placeholder:text-hud-faint placeholder:text-[11px]"
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
                            className="text-[11px] uppercase font-mono border border-hud-line px-8 py-2.5 text-hud-muted hover:text-hud-strong hover:border-hud-line-strong transition-all active:scale-95 disabled:opacity-20"
                        >
                            {isSubmitting ? t('submitting') : t('submitButton')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comment List - Ghost Style */}
            <div className="space-y-6 pt-2">
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-hud-line-soft" />
                    <span className="text-[11px] font-mono text-hud-faint uppercase tracking-[0.24em]">{t('signalsReceived')}</span>
                    <div className="h-px flex-1 bg-hud-line-soft" />
                </div>

                {isLoading ? (
                    <div className="py-6 text-center">
                        <span className="text-[11px] font-mono text-hud-faint animate-pulse italic">
                            {t('connecting')}
                        </span>
                    </div>
                ) : comments.length > 0 ? (
                    <div className="space-y-8">
                        {/* 渲染根级评论及其回复 */}
                        {comments.filter(c => !c.parent_id).map((comment, i) => {
                            const replies = comments.filter(r => r.parent_id === comment.id);

                            return (
                                <div key={comment.id || i} className="space-y-4">
                                    {/* Root Comment */}
                                    <div className="flex gap-4 group">
                                        <div className="mt-1.5 w-1 h-1 rounded-full bg-hud-faint group-hover:bg-hud-muted transition-colors" />

                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                                                <span className={`text-sm font-bold uppercase tracking-[0.16em] ${comment.is_admin ? 'text-green-500/65' : 'text-hud-muted'}`}>
                                                    {comment.nickname} {comment.is_admin ? t('admin') : ''}
                                                </span>
                                                <span className="text-[11px] text-hud-faint font-mono italic">
                                                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setReplyTo({ id: comment.id, name: comment.nickname });
                                                        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}

                                                    className="text-[11px] font-mono text-hud-faint hover:text-hud-strong transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    {t('reply')}
                                                </button>
                                            </div>
                                            <p className="text-base text-hud font-mono leading-relaxed transition-colors">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-Replies */}
                                    {replies.length > 0 && (
                                        <div className="ml-8 space-y-4 border-l border-hud-line-soft pl-5">
                                            {replies.map((reply, ri) => (
                                                <div key={reply.id || ri} className="flex gap-4 group/reply">
                                                    <div className="mt-1.5 w-[2px] h-[2px] bg-hud-faint group-hover/reply:bg-hud-muted" />
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                                                            <span className={`text-[13px] font-bold uppercase tracking-[0.16em] ${reply.is_admin ? 'text-green-500/60' : 'text-hud-muted'}`}>
                                                                {reply.nickname} {reply.is_admin ? t('admin') : ''}
                                                            </span>
                                                            <span className="text-[11px] text-hud-faint font-mono italic">
                                                                {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[15px] text-hud-muted font-mono leading-relaxed">
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

                    <div className="py-10 text-center">
                        <span className="text-[11px] font-mono text-hud-faint uppercase tracking-[0.24em] italic">
                            {t('noSignals')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

}
