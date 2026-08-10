'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { IoTrashSharp, IoWarningSharp, IoCloseSharp, IoArrowUndoSharp, IoChevronDownSharp } from 'react-icons/io5';

import Badge from '../ui/Badge.jsx';
import Card from '../ui/Card.jsx';
import HistorySessionDetail from './HistorySessionDetail.jsx';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth/AuthContext.jsx';
import { deletePracticeSession } from '../../lib/firebase/firestore.js';

const UNDO_TIMER_SECONDS = 5;

export default function HistoryLedger({ sessions: initialSessions }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionId, setSessionId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  
  // Pattern 1: Delete confirmation modal state
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [animatingOutId, setAnimatingOutId] = useState(null);
  
  // Deferred delete with 5s countdown timer state
  const [pendingDelete, setPendingDelete] = useState(null);
  const [timeLeft, setTimeLeft] = useState(UNDO_TIMER_SECONDS);
  const [showUndoToast, setShowUndoToast] = useState(false);
  
  const timerIntervalRef = useRef(null);
  const pendingDeleteRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  // Clean up timer on unmount & commit any pending deletion
  useEffect(() => {
    function handleBeforeUnload() {
      if (pendingDeleteRef.current?.data) {
        deletePracticeSession(user?.uid, pendingDeleteRef.current.data.id);
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (pendingDeleteRef.current?.data) {
        deletePracticeSession(user?.uid, pendingDeleteRef.current.data.id);
      }
    };
  }, [user]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === sessionId) ?? null,
    [sessionId, sessions]
  );

  // Triggered when user confirms delete in modal
  function handleDeleteConfirmed() {
    if (!sessionToDelete) return;

    const targetSession = sessionToDelete;
    const targetIndex = sessions.findIndex((s) => s.id === targetSession.id);
    
    // 1. Trigger row exit animation first
    setAnimatingOutId(targetSession.id);
    setSessionToDelete(null);

    // 2. After 280ms exit animation, remove from sessions array & show undo toast
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== targetSession.id));
      setAnimatingOutId(null);

      // Set pending deletion & reset 5s timer
      const pendingObj = { data: targetSession, index: targetIndex };
      pendingDeleteRef.current = pendingObj;
      setPendingDelete(pendingObj);
      setTimeLeft(UNDO_TIMER_SECONDS);
      setShowUndoToast(true);

      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Start 5-second countdown interval
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            executeFinalDeletion(targetSession);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 280);
  }

  // Executes permanent deletion once timer expires or user dismisses
  async function executeFinalDeletion(targetSession) {
    setShowUndoToast(false);
    setPendingDelete(null);
    pendingDeleteRef.current = null;

    if (targetSession?.id) {
      try {
        await deletePracticeSession(user?.uid, targetSession.id);
      } catch (err) {
        console.error('Error permanently deleting session:', err);
      }
    }
  }

  // Triggered when user clicks "Undo" before timer expires
  function handleUndoDelete() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (pendingDeleteRef.current) {
      const { data: restoredData, index } = pendingDeleteRef.current;
      // Re-insert into UI list at original index with entrance transition
      setSessions((prev) => {
        const next = [...prev];
        if (index >= 0 && index <= next.length) {
          next.splice(index, 0, restoredData);
        } else {
          next.push(restoredData);
        }
        return next;
      });
    }

    pendingDeleteRef.current = null;
    setShowUndoToast(false);
    setPendingDelete(null);
  }

  // Dismiss toast & execute delete immediately
  function handleDismissToast() {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (pendingDelete) {
      executeFinalDeletion(pendingDelete.data);
    }
  }

  if (selectedSession) {
    return <HistorySessionDetail session={selectedSession} sessions={sessions} onBack={() => setSessionId(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">Past Practice</h1>
          <p className="mt-1 text-sm font-bold text-ink/60 font-mono">
            {sessions.length} {sessions.length === 1 ? 'record' : 'records'} logged
          </p>
        </div>
      </header>

      <section>
        {sessions.length === 0 ? (
          <Card padding="none" className="overflow-hidden bg-white">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-paper shadow-shadow brutal-border">
                <span className="text-4xl text-ai">📝</span>
              </div>
              <h2 className="font-display text-2xl mb-2">No Practice History Yet</h2>
              <p className="max-w-md text-ink/70">
                You haven't completed any lessons or roleplays yet. Start a session to see your progress, scores, and conversation history here.
              </p>
            </div>
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden bg-white">
            <div className="grid grid-cols-[7rem_7.5rem_minmax(0,1fr)_5rem_3rem] gap-3 border-b-2 border-border bg-paper px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-ink/55 sm:grid-cols-[8rem_10rem_minmax(0,1fr)_6rem_3.5rem] sm:gap-4">
              <span>Date</span>
              <span>Type</span>
              <span>Session</span>
              <span className="text-right">Score</span>
              <span className="text-center">Action</span>
            </div>
            <div className="divide-y-2 divide-border">
              {sessions.slice(0, visibleCount).map((session) => {
                const isExiting = animatingOutId === session.id;
                return (
                  <div
                    key={session.id}
                    className={`group relative flex items-center w-full transition-all duration-300 ease-out hover:bg-mustard/10 ${
                      isExiting ? '-translate-x-8 opacity-0 max-h-0 py-0 overflow-hidden' : 'max-h-32 opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSessionId(session.id)}
                      className="flex-1 w-full text-left focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
                      aria-label={`Open saved ${session.type?.toLowerCase() || 'practice'} record for ${session.title}`}
                    >
                      <div className="grid grid-cols-[7rem_7.5rem_minmax(0,1fr)_5rem] items-center gap-3 px-4 py-4 sm:grid-cols-[8rem_10rem_minmax(0,1fr)_6rem] sm:gap-4">
                        <div>
                          <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-ink/55">
                            {session.date?.toDate ? session.date.toDate().toLocaleDateString() : session.date || 'Unknown'}
                          </p>
                          <p className="mt-1 text-sm font-bold text-ink/70">{session.duration || '00:00'}</p>
                        </div>
                        <div>
                          <Badge tone={session.type === 'Roleplay' ? 'aizome' : 'moss'}>{session.type || 'Practice'}</Badge>
                        </div>
                        <div>
                          <h2 className="font-display text-xl leading-none sm:text-2xl">{session.title || 'Untitled Session'}</h2>
                          <p className="mt-2 hidden text-sm font-semibold leading-6 text-ink/70 sm:block">{session.summary || 'No summary available.'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-3xl leading-none sm:text-4xl">{session.score || 0}%</p>
                          <p className={cn('mt-2 font-mono text-[10px] font-black uppercase tracking-[0.14em]', scoreTone(session.score || 0))}>
                            {session.grade || 'Unrated'}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Desktop Hover Delete Action Button */}
                    <div className="pr-4 pl-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className="brutal-border bg-paper p-2.5 text-correction opacity-0 group-hover:opacity-100 transition-opacity hover:bg-correction hover:text-white active:scale-95 shadow-sm"
                        title="Delete record"
                        aria-label={`Delete record for ${session.title}`}
                      >
                        <IoTrashSharp className="text-base" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visibleCount < sessions.length && (
              <div className="border-t-2 border-border p-4 text-center bg-paper/60">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="brutal-border bg-mustard text-ink px-6 py-2.5 font-mono text-xs font-black uppercase tracking-[0.14em] shadow-nav transition-transform hover:-translate-y-0.5 active:scale-95 inline-flex items-center gap-2"
                >
                  <IoChevronDownSharp className="text-sm" />
                  Show 5 More Practices ({sessions.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </Card>
        )}
      </section>

      {/* Pattern 1: Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setSessionToDelete(null)} />
          <div className="animate-panel-in relative w-full max-w-md brutal-border bg-white p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center brutal-border bg-correction text-white shadow-nav">
                <IoWarningSharp className="text-xl" />
              </span>
              <div>
                <p className="font-mono text-xs font-black uppercase text-correction">Confirm Deletion</p>
                <h3 className="font-display text-2xl leading-none">Delete Record?</h3>
              </div>
            </div>

            <p className="text-sm font-bold text-ink/80 leading-relaxed brutal-border bg-paper p-4">
              Are you sure you want to delete this record?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="brutal-border bg-paper px-4 py-2 font-mono text-xs font-black uppercase text-ink hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="brutal-border bg-correction px-4 py-2 font-mono text-xs font-black uppercase text-white shadow-nav hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Always Viewport-Bottom Anchored & Main-Content Horizontally Centered Toast (React Portal) */}
      {showUndoToast && mounted && createPortal(
        <div className="fixed bottom-8 inset-x-0 lg:left-[17rem] lg:right-[18rem] mx-auto w-max z-[9999] pointer-events-auto animate-panel-in">
          <div className="brutal-border bg-ink text-paper px-6 py-3.5 shadow-2xl flex items-center gap-4 rounded-full font-mono text-xs font-bold relative overflow-hidden">
            <span>Practice record deleted ({timeLeft}s)</span>
            
            <button
              type="button"
              onClick={handleUndoDelete}
              className="brutal-border bg-mustard text-ink px-3.5 py-1.5 font-black uppercase flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <IoArrowUndoSharp />
              Undo
            </button>

            <button
              type="button"
              onClick={handleDismissToast}
              className="text-paper/60 hover:text-paper transition-colors pl-1"
              aria-label="Dismiss notification"
            >
              <IoCloseSharp className="text-lg" />
            </button>

            {/* Countdown Progress Meter Bar at bottom edge of toast */}
            <div 
              className="absolute bottom-0 left-0 h-1 bg-mustard transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / UNDO_TIMER_SECONDS) * 100}%` }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function scoreTone(score) {
  if (score >= 90) return 'text-correction';
  if (score >= 80) return 'text-aizome';
  if (score >= 70) return 'text-moss';
  return 'text-ink';
}
