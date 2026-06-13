'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Send, Check, CheckCheck } from 'lucide-react';
import { useStore, type ChatMessage, type ChatConversation } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientChatProps {
  isDark: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const QUICK_REPLIES = [
  '¿Ya vienes?',
  '¿Cuánto falta?',
  'Estoy en la puerta',
  'Gracias!',
];

const MOCK_REPARTIDOR_REPLIES = [
  'Entendido, ya voy en camino!',
  'Llego en unos minutos',
  'Perfecto, nos vemos ahí',
  '¡Ya casi llego!',
  'Gracias por la información',
];

const DEACTIVATION_WARNING_MS = 30 * 60 * 1000; // 30 minutes
const DEACTIVATION_TOTAL_MS = 60 * 60 * 1000; // 1 hour after delivery

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function formatTime(timestamp: string): string {
  return timestamp;
}

function pickRandomReply(): string {
  return MOCK_REPARTIDOR_REPLIES[Math.floor(Math.random() * MOCK_REPARTIDOR_REPLIES.length)];
}

/** Trigger haptic feedback if available */
function hapticTap() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/** Typing indicator with 3 sequential bouncing dots */
function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex justify-start mb-1"
    >
      <div
        className="px-5 py-3 flex items-center gap-[5px]"
        style={{
          background: 'var(--bg-alt)',
          borderRadius: '20px 20px 20px 4px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: 'var(--text-muted)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** Single message bubble — iMessage / WhatsApp style */
function MessageBubble({
  msg,
  isClient,
  isSystem,
  isDark,
}: {
  msg: ChatMessage;
  isClient: boolean;
  isSystem: boolean;
  isDark: boolean;
}) {
  /* System message — centered pill */
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center my-3"
      >
        <span
          className="text-[12px] px-4 py-1.5 rounded-full"
          style={{
            background: 'var(--bg-alt)',
            color: 'var(--text-muted)',
          }}
        >
          {msg.content}
        </span>
      </motion.div>
    );
  }

  /* Chat bubble */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isClient ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className="max-w-[80%] relative">
        <div
          className="px-4 py-2.5 text-[14px] leading-relaxed break-words"
          style={{
            background: isClient ? 'var(--primario)' : 'var(--bg-alt)',
            color: isClient ? '#FFFFFF' : 'var(--text)',
            borderRadius: isClient
              ? '20px 20px 4px 20px'
              : '20px 20px 20px 4px',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {msg.content}
        </div>
        {/* Read indicator for client messages */}
        {isClient && (
          <div className="flex justify-end mt-0.5 mr-1.5">
            {msg.read ? (
              <CheckCheck className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} />
            ) : (
              <Check className="w-3.5 h-3.5" style={{ color: isClient ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Timestamp divider — centered, 11px muted */
function TimestampDivider({ time }: { time: string }) {
  return (
    <div className="flex justify-center my-3">
      <span
        className="text-[11px]"
        style={{
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {time}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientChat({ isDark, onClose }: ClientChatProps) {
  /* ── Store ─────────────────────────────── */
  const chatOpen = useStore((s) => s.chatOpen);
  const chatOrderId = useStore((s) => s.chatOrderId);
  const chatConversations = useStore((s) => s.chatConversations);
  const sendChatMessage = useStore((s) => s.sendChatMessage);
  const setChatOpen = useStore((s) => s.setChatOpen);

  /* ── Local state ──────────────────────── */
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  /* ── Derived ──────────────────────────── */
  const conversation: ChatConversation | undefined = chatConversations.find(
    (c) => c.orderId === chatOrderId
  );
  const isActive = conversation?.active ?? false;
  const repartidor = conversation?.repartidor;

  /* ── Deactivation logic ───────────────── */
  const [showDeactivationWarning, setShowDeactivationWarning] = useState(false);
  const [chatDeactivated, setChatDeactivated] = useState(false);

  useEffect(() => {
    if (!conversation || !conversation.closedAt) {
      setShowDeactivationWarning(false);
      setChatDeactivated(false);
      return;
    }

    const closedTime = new Date(conversation.closedAt).getTime();
    const now = Date.now();
    const elapsed = now - closedTime;
    const remaining = DEACTIVATION_TOTAL_MS - elapsed;

    if (remaining <= 0) {
      setChatDeactivated(true);
      setShowDeactivationWarning(false);
      return;
    }

    if (remaining <= DEACTIVATION_WARNING_MS) {
      setShowDeactivationWarning(true);
    }

    const warnTimeout = setTimeout(() => {
      setShowDeactivationWarning(true);
    }, Math.max(0, remaining - DEACTIVATION_WARNING_MS));

    const deactivateTimeout = setTimeout(() => {
      setChatDeactivated(true);
      setShowDeactivationWarning(false);
    }, remaining);

    return () => {
      clearTimeout(warnTimeout);
      clearTimeout(deactivateTimeout);
    };
  }, [conversation]);

  /* ── Auto-scroll ──────────────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, isTyping, scrollToBottom]);

  /* ── Textarea auto-resize ─────────────── */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
    }
  }, []);

  /* ── Send message ─────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !chatOrderId || !isActive || chatDeactivated) return;

    sendChatMessage(chatOrderId, trimmed, 'cliente');
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Simulate repartidor reply
    setIsTyping(true);
    const delay = 2000 + Math.random() * 1000;
    setTimeout(() => {
      setIsTyping(false);
      if (chatOrderId) {
        sendChatMessage(chatOrderId, pickRandomReply(), 'repartidor');
      }
    }, delay);
  }, [input, chatOrderId, isActive, chatDeactivated, sendChatMessage]);

  /* ── Quick reply ──────────────────────── */
  const handleQuickReply = useCallback(
    (text: string) => {
      if (!chatOrderId || !isActive || chatDeactivated) return;
      hapticTap();
      sendChatMessage(chatOrderId, text, 'cliente');

      // Simulate repartidor reply
      setIsTyping(true);
      const delay = 2000 + Math.random() * 1000;
      setTimeout(() => {
        setIsTyping(false);
        if (chatOrderId) {
          sendChatMessage(chatOrderId, pickRandomReply(), 'repartidor');
        }
      }, delay);
    },
    [chatOrderId, isActive, chatDeactivated, sendChatMessage]
  );

  /* ── Keyboard handler ─────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* ── Close handler ────────────────────── */
  const handleClose = useCallback(() => {
    setChatOpen(false);
    onClose();
  }, [setChatOpen, onClose]);

  /* ── Group messages by timestamp ──────── */
  const renderMessages = useCallback(() => {
    if (!conversation) return null;
    const messages = conversation.messages;
    const elements: React.ReactNode[] = [];
    let lastTimestamp = '';

    messages.forEach((msg, idx) => {
      const isClient = msg.senderType === 'cliente';
      const isSystem = msg.senderType === 'sistema';

      // Show timestamp divider when timestamp changes
      if (msg.timestamp !== lastTimestamp) {
        elements.push(
          <TimestampDivider key={`ts-${msg.id}`} time={formatTime(msg.timestamp)} />
        );
        lastTimestamp = msg.timestamp;
      }

      elements.push(
        <MessageBubble key={msg.id} msg={msg} isClient={isClient} isSystem={isSystem} isDark={isDark} />
      );
    });

    // Typing indicator
    if (isTyping) {
      elements.push(
        <TypingIndicator key="typing-indicator" isDark={isDark} />
      );
    }

    return elements;
  }, [conversation, isDark, isTyping]);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* ── BACKDROP ───────────────────────────── */}
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* ── BOTTOM SHEET (FULL SCREEN) ─────────── */}
          <motion.div
            key="chat-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              background: 'var(--bg)',
              borderTopLeftRadius: 'var(--lf-sheet-radius)',
              borderTopRightRadius: 'var(--lf-sheet-radius)',
            }}
          >
            {/* ── HEADER (Glassmorphism) ──────────────── */}
            <div
              className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
              style={{
                background: 'var(--lf-glass-bg)',
                backdropFilter: 'blur(var(--lf-glass-blur))',
                WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                borderBottom: '1px solid var(--lf-glass-border)',
                borderTopLeftRadius: 'var(--lf-sheet-radius)',
                borderTopRightRadius: 'var(--lf-sheet-radius)',
              }}
            >
              {/* Driver avatar 36x36 */}
              {repartidor ? (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: repartidor.color }}
                >
                  {repartidor.initials || getInitials(repartidor.nombre)}
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}
                >
                  ?
                </div>
              )}

              {/* Driver name + online status */}
              <div className="flex-1 min-w-0">
                <span
                  className="font-bold text-[15px] truncate block"
                  style={{
                    color: 'var(--text)',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {repartidor?.nombre ?? 'Repartidor'}
                </span>
                {isActive && !chatDeactivated ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-[7px] h-[7px] rounded-full bg-green-500 shrink-0" />
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      En línea
                    </span>
                  </div>
                ) : (
                  <span
                    className="text-[12px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Chat finalizado
                  </span>
                )}
              </div>

              {/* Phone button */}
              {isActive && !chatDeactivated && repartidor && (
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--primario-soft)', color: 'var(--primario)' }}
                  aria-label="Llamar repartidor"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}

              {/* Close button 36x36 */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90"
                style={{
                  background: 'var(--bg-alt)',
                  color: 'var(--text-muted)',
                }}
                aria-label="Cerrar chat"
              >
                <X className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* ── DEACTIVATION WARNING ──────────────── */}
            <AnimatePresence>
              {showDeactivationWarning && !chatDeactivated && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 py-2.5 text-[13px] text-center"
                    style={{
                      background: isDark ? 'rgba(255,183,0,0.1)' : 'rgba(255,183,0,0.08)',
                      color: 'var(--warning)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Este chat se cerrará pronto. ¿Necesitas algo más?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── DEACTIVATED NOTICE ────────────────── */}
            <AnimatePresence>
              {chatDeactivated && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 py-2.5 text-[13px] text-center"
                    style={{
                      background: isDark ? 'rgba(255,23,68,0.1)' : 'rgba(255,23,68,0.06)',
                      color: 'var(--peligro)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Chat finalizado. Para ayuda, contacta soporte.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── MESSAGES AREA ─────────────────────── */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: isDark ? '#2A2A38 transparent' : '#D1CBC4 transparent',
              }}
            >
              {/* Custom scrollbar styles */}
              <style>{`
                [data-messages-scroll]::-webkit-scrollbar { width: 5px; }
                [data-messages-scroll]::-webkit-scrollbar-track { background: transparent; }
                [data-messages-scroll]::-webkit-scrollbar-thumb {
                  background: ${isDark ? '#2A2A38' : '#D1CBC4'};
                  border-radius: 10px;
                }
              `}</style>

              {!conversation ? (
                <div className="flex items-center justify-center h-full">
                  <p
                    className="text-[14px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No hay conversación activa
                  </p>
                </div>
              ) : (
                <>
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* ── BOTTOM SECTION: Quick Replies + Input (Glassmorphism) ── */}
            {isActive && !chatDeactivated ? (
              <div
                className="sticky bottom-0 z-10"
                style={{
                  background: 'var(--lf-glass-bg)',
                  backdropFilter: 'blur(var(--lf-glass-blur))',
                  WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                  borderTop: '1px solid var(--lf-glass-border)',
                  paddingBottom: 'var(--lf-safe-bottom)',
                }}
              >
                {/* Quick reply chips — horizontal scroll */}
                {conversation && (
                  <div
                    className="flex gap-2 px-4 pt-2.5 pb-1 overflow-x-auto"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {QUICK_REPLIES.map((text) => (
                      <button
                        key={text}
                        onClick={() => handleQuickReply(text)}
                        className="shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all hover:opacity-80 active:scale-95"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text)',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input area */}
                <div className="flex items-end gap-2 px-4 py-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-[14px] outline-none transition-colors"
                    style={{
                      background: 'var(--bg-alt)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      maxHeight: '96px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    whileTap={{ scale: 0.9 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      background: input.trim() ? 'var(--primario)' : 'var(--bg-alt)',
                      color: input.trim() ? '#FFFFFF' : 'var(--text-muted)',
                      boxShadow: input.trim() ? 'var(--shadow-primario)' : 'none',
                    }}
                    aria-label="Enviar mensaje"
                  >
                    <Send className="w-[18px] h-[18px]" />
                  </motion.button>
                </div>
              </div>
            ) : (
              /* ── Deactivated / inactive bottom bar ── */
              <div
                className="sticky bottom-0 z-10 border-t px-4 py-3"
                style={{
                  background: 'var(--lf-glass-bg)',
                  backdropFilter: 'blur(var(--lf-glass-blur))',
                  WebkitBackdropFilter: 'blur(var(--lf-glass-blur))',
                  borderTop: '1px solid var(--lf-glass-border)',
                  paddingBottom: 'var(--lf-safe-bottom)',
                }}
              >
                <div
                  className="flex items-center justify-center py-2 text-[13px]"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Chat finalizado
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
