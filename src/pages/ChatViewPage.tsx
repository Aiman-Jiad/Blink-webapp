import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Video, Search, MoreVertical, X,
  Trash2, ChevronDown, ChevronUp, Info, Bell, BellOff,
  Pin, Forward, CheckSquare, XCircle,
} from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { MessageSkeleton } from '@/components/shared/Skeletons';
import { EmptyState } from '@/components/shared/EmptyState';
import { TypingIndicator } from '@/components/shared/TypingIndicator';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ChatInfoPanel } from '@/components/chat/ChatInfoPanel';
import { ForwardDialog, type ForwardTarget } from '@/components/chat/ForwardDialog';
import { CreatePollDialog } from '@/components/group/PollCard';
import { GroupAvatar } from '@/components/shared/GroupAvatar';
import { BarChart3, Hand } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { dataService } from '@/services/dataService';
import { groupByDate } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import type { Message } from '@/types';

const USER_NAMES: Record<string, string> = {
  u_alice: 'Alice Chen', u_marcus: 'Marcus Reid', u_sofia: 'Sofia Romano',
  u_kenji: 'Kenji Tanaka', u_priya: 'Priya Sharma', me: 'You',
};
const USER_PHOTOS: Record<string, string> = {
  u_alice: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_marcus: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_sofia: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_kenji: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
  u_priya: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
};

const REPLIES = [
  'That sounds great!',
  'Haha, love it 😄',
  'Got it, thanks!',
  'Interesting… tell me more.',
  'Sure, sounds good to me.',
  'Let me check and get back to you.',
  'Same here!',
  'Really? Wow.',
  'No worries at all 👍',
  'Talk soon!',
];

function pickReply(_text: string): string {
  return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}

export default function ChatViewPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { chats, messages, setMessages, addMessage, updateMessage, updateChat, setActiveChat, loading: chatsLoading } = useChatStore();
  const { openCall, setMobileView } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardPayload, setForwardPayload] = useState<Message[]>([]);
  const [pollOpen, setPollOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const meId = me?.id ?? 'me';

  const chat = chats.find((c) => c.id === chatId);

  // Load messages
  useEffect(() => {
    if (!chatId) return;
    setActiveChat(chatId);
    setLoading(true);
    dataService.messages.forChat(chatId).then((msgs) => {
      setMessages(chatId, msgs);
      setLoading(false);
      // Mark as read
      if (chat) {
        const updated = { ...chat, unreadCount: { ...chat.unreadCount, [meId]: 0 } };
        updateChat(updated);
        dataService.chats.upsert(updated);
      }
    });
    return () => setActiveChat(null);
  }, [chatId]);

  // If there is a chatId but the chat isn't found AND chats are still loading,
  // show a loading state instead of "Select a chat".
  if (!chat) {
    if (chatId && chatsLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <MessageSkeleton />
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={Info}
          title="Select a chat"
          description="Choose a conversation from the list to start messaging."
        />
      </div>
    );
  }

  // Simulated delivered -> read progression + transient typing indicator
  // + auto-reply for demo realism. The typing indicator only appears
  // briefly after the other user "starts typing", then clears.
  const lastMsg = messages[chatId ?? '']?.[messages[chatId ?? '']?.length - 1];
  useEffect(() => {
    if (!chatId || !lastMsg || lastMsg.senderId !== meId || lastMsg.type !== 'text') return;

    // 1. sending -> delivered
    const t1 = setTimeout(() => {
      updateMessage({ ...lastMsg, status: 'delivered' });
      dataService.messages.update({ ...lastMsg, status: 'delivered' });
    }, 600);

    // 2. delivered -> read
    const t2 = setTimeout(() => {
      updateMessage({ ...lastMsg, status: 'read' });
      dataService.messages.update({ ...lastMsg, status: 'read' });
    }, 1600);

    // 3. Other user starts "typing" (transient, 2.2s)
    const t3 = setTimeout(() => {
      if (!chat) return;
      const otherId = chat.participantIds.find((id) => id !== meId);
      if (!otherId) return;
      const updated = { ...chat, typingUsers: [otherId] };
      updateChat(updated);
      dataService.chats.upsert(updated);
    }, 2200);

    // 4. Other user stops typing + sends a reply
    const t4 = setTimeout(() => {
      if (!chat) return;
      // Clear typing
      const cleared = { ...chat, typingUsers: [] };
      updateChat(cleared);
      dataService.chats.upsert(cleared);
      // Send a reply
      const reply = pickReply(lastMsg.text);
      const replyMsg: Message = {
        id: nanoid(),
        chatId,
        senderId: chat.participantIds.find((id) => id !== meId) ?? 'u_alice',
        type: 'text',
        text: reply,
        attachments: [],
        replyTo: null,
        status: 'read',
        reactions: [],
        starred: false,
        pinned: false,
        deletedForEveryone: false,
        deletedFor: [],
        readBy: [meId],
        createdAt: Date.now(),
      };
      addMessage(replyMsg);
      dataService.messages.add(replyMsg);
      // Update chat lastMessage
      const updatedChat = {
        ...cleared,
        lastMessage: { text: reply, senderId: replyMsg.senderId, type: 'text' as const, createdAt: Date.now() },
        updatedAt: Date.now(),
      };
      updateChat(updatedChat);
      dataService.chats.upsert(updatedChat);
    }, 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMsg?.id, chatId, meId]);

  const chatMessages = useMemo(() => messages[chatId ?? ''] ?? [], [messages, chatId]);
  const grouped = useMemo(() => groupByDate(chatMessages), [chatMessages]);
  const pinnedMessages = useMemo(
    () => chatMessages.filter((m) => m.pinned && !m.deletedForEveryone && !m.deletedFor.includes(meId)),
    [chatMessages, meId],
  );

  const otherId = chat?.participantIds.find((id) => id !== meId) ?? '';
  const isGroup = chat?.type === 'group';
  const displayName = isGroup ? (chat?.name ?? 'Group') : (USER_NAMES[otherId] ?? 'Unknown');
  const displayPhoto = isGroup ? chat?.photoURL : USER_PHOTOS[otherId];
  const otherStatus = chat?.typingUsers.length ? 'online' : 'offline';

  function handleSend(text: string, attachments?: Message['attachments']) {
    if (!chatId) return;
    // Editing an existing message in place
    if (editing) {
      const updated = { ...editing, text, editedAt: Date.now() };
      updateMessage(updated);
      dataService.messages.update(updated);
      setEditing(null);
      return;
    }
    const msg: Message = {
      id: nanoid(),
      chatId,
      senderId: meId,
      type: attachments && attachments.length ? attachments[0].type : 'text',
      text,
      attachments: attachments ?? [],
      replyTo: replyTo ? {
        id: replyTo.id,
        senderId: replyTo.senderId,
        text: replyTo.text || replyTo.type,
        type: replyTo.type,
      } : null,
      status: 'sending',
      reactions: [],
      starred: false,
      pinned: false,
      deletedForEveryone: false,
      deletedFor: [],
      readBy: [meId],
      createdAt: Date.now(),
    };
    addMessage(msg);
    dataService.messages.add(msg);
    setReplyTo(null);
    // Update sending -> sent
    setTimeout(() => {
      updateMessage({ ...msg, status: 'sent' });
    }, 300);
  }

  function handleTyping(typing: boolean) {
    if (!chat) return;
    const isAlreadyTyping = chat.typingUsers.includes(meId);
    if (typing && !isAlreadyTyping) {
      const updated = { ...chat, typingUsers: [...chat.typingUsers, meId] };
      updateChat(updated);
      dataService.chats.upsert(updated);
    } else if (!typing && isAlreadyTyping) {
      const updated = { ...chat, typingUsers: chat.typingUsers.filter((id) => id !== meId) };
      updateChat(updated);
      dataService.chats.upsert(updated);
    }
  }

  function handleReact(message: Message, emoji: string) {
    const existing = message.reactions.find((r) => r.userId === meId && r.emoji === emoji);
    let reactions;
    if (existing) {
      reactions = message.reactions.filter((r) => !(r.userId === meId && r.emoji === emoji));
    } else {
      reactions = [...message.reactions.filter((r) => r.userId !== meId), { emoji, userId: meId, createdAt: Date.now() }];
    }
    const updated = { ...message, reactions };
    updateMessage(updated);
    dataService.messages.update(updated);
  }

  function handleDelete(message: Message, forEveryone: boolean) {
    const updated = forEveryone
      ? { ...message, deletedForEveryone: true }
      : { ...message, deletedFor: [...message.deletedFor, meId] };
    updateMessage(updated);
    dataService.messages.update(updated);
    toast.success(forEveryone ? 'Message deleted for everyone' : 'Message deleted for you');
  }

  function handleCopy(message: Message) {
    navigator.clipboard.writeText(message.text);
    toast.success('Message copied');
  }

  function handleTogglePin(message: Message) {
    const updated = { ...message, pinned: !message.pinned };
    updateMessage(updated);
    dataService.messages.update(updated);
    toast.success(updated.pinned ? 'Message pinned' : 'Message unpinned');
  }

  function handleToggleStar(message: Message) {
    const updated = { ...message, starred: !message.starred };
    updateMessage(updated);
    dataService.messages.update(updated);
    toast.success(updated.starred ? 'Message starred' : 'Message unstarred');
  }

  async function handleForward(message: Message) {
    const targets = buildForwardTargets();
    if (targets.length === 0) {
      toast.error('No other chats to forward to');
      return;
    }
    setForwardPayload([message]);
    setForwardOpen(true);
  }

  function buildForwardTargets(): ForwardTarget[] {
    return chats
      .filter((c) => c.id !== chatId && c.participantIds.includes(meId))
      .map((c) => {
        const otherId = c.participantIds.find((id) => id !== meId) ?? '';
        return {
          id: c.id,
          label: c.type === 'group' ? (c.name ?? 'Group') : (USER_NAMES[otherId] ?? 'Chat'),
          photo: c.type === 'group' ? c.photoURL : USER_PHOTOS[otherId],
          subtitle: c.lastMessage?.text,
        };
      });
  }

  function doForward(targetId: string) {
    const target = chats.find((c) => c.id === targetId);
    if (!target) return;
    forwardPayload.forEach((m) => {
      const fwd: Message = {
        ...m,
        id: nanoid(),
        chatId: targetId,
        senderId: meId,
        forwardedFrom: { id: m.id, name: USER_NAMES[m.senderId] ?? 'Someone' },
        replyTo: null,
        reactions: [],
        status: 'sent',
        createdAt: Date.now(),
        readBy: [meId],
      };
      dataService.messages.add(fwd);
    });
    const targetName = target.type === 'group' ? target.name : USER_NAMES[target.participantIds.find(id => id !== meId) ?? ''];
    toast.success(`Forwarded to ${targetName ?? 'chat'}`);
    setForwardOpen(false);
    setForwardPayload([]);
  }

  function handleEdit(message: Message) {
    setEditing(message);
    setReplyTo(null);
  }

  function handleSelect(message: Message, sel: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (sel) next.add(message.id); else next.delete(message.id);
      return next;
    });
  }

  function enterSelectionMode(seed?: Message) {
    setSelectionMode(true);
    if (seed) setSelectedIds(new Set([seed.id]));
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function bulkDelete(forEveryone: boolean) {
    const list = chatMessages.filter((m) => selectedIds.has(m.id));
    list.forEach((m) => {
      const updated = forEveryone
        ? { ...m, deletedForEveryone: true }
        : { ...m, deletedFor: [...m.deletedFor, meId] };
      updateMessage(updated);
      dataService.messages.update(updated);
    });
    toast.success(`Deleted ${list.length} message${list.length > 1 ? 's' : ''}`);
    exitSelectionMode();
  }

  function bulkForward() {
    const list = chatMessages.filter((m) => selectedIds.has(m.id));
    if (list.length === 0) return;
    if (buildForwardTargets().length === 0) {
      toast.error('No other chats to forward to');
      return;
    }
    setForwardPayload(list);
    setForwardOpen(true);
    exitSelectionMode();
  }

  function handleSearchInChat(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    dataService.messages.search(chatId ?? '', q).then(setSearchResults);
  }

  function scrollToMessage(id: string) {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1500);
    }
  }

  function toggleMute() {
    if (!chat) return;
    const muted = chat.mutedBy.includes(meId);
    const updated = {
      ...chat,
      mutedBy: muted ? chat.mutedBy.filter((id) => id !== meId) : [...chat.mutedBy, meId],
    };
    updateChat(updated);
    dataService.chats.upsert(updated);
    toast.success(muted ? 'Unmuted' : 'Muted');
  }

  function deleteChat() {
    if (!chatId) return;
    dataService.chats.remove(chatId);
    toast.success('Chat deleted');
    navigate('/chats');
  }

  const typingUsers = chat.typingUsers.filter((id) => id !== meId);

  return (
    <div className="flex h-full w-full min-h-0">
      {/* Chat area */}
      <div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col">
        {/* Header — glass intensifies on scroll */}
        <header className="flex items-center justify-between gap-2 border-b border-border/40 glass-strong px-3 py-2.5 shadow-soft transition-all duration-300 lg:px-5 lg:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => { navigate('/chats'); setMobileView('list'); }}
              aria-label="Back to chats"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => setInfoOpen(true)} className="flex min-w-0 items-center gap-3 rounded-lg transition-colors">
              <UserAvatar name={displayName} src={displayPhoto} size="md" status={otherStatus as 'online' | 'offline'} showStatus />
              <div className="min-w-0 text-left">
                <p className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground transition-colors">
                  {typingUsers.length > 0 ? (
                    <span className="font-medium text-primary typing-preview">typing</span>
                  ) : isGroup ? (
                    `${chat.participantIds.length} members`
                  ) : otherStatus === 'online' ? (
                    'online'
                  ) : (
                    'last seen recently'
                  )}
                </p>
              </div>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 lg:gap-1">
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary active:scale-90 transition-transform" onClick={() => openCall({ type: 'video', peerName: displayName, peerPhoto: displayPhoto ?? null })} aria-label="Video call">
              <Video className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary active:scale-90 transition-transform" onClick={() => openCall({ type: 'audio', peerName: displayName, peerPhoto: displayPhoto ?? null })} aria-label="Voice call">
              <Phone className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary active:scale-90 transition-transform" onClick={() => setSearchOpen((s) => !s)} aria-label="Search in chat">
              <Search className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="More options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Chat options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setInfoOpen(true)}>
                  <Info className="mr-2 h-4 w-4" /> View info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleMute}>
                  {chat.mutedBy.includes(meId) ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                  {chat.mutedBy.includes(meId) ? 'Unmute' : 'Mute'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => enterSelectionMode()}>
                  <CheckSquare className="mr-2 h-4 w-4" /> Select messages
                </DropdownMenuItem>
                {isGroup && (
                  <DropdownMenuItem onClick={() => setPollOpen(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Create poll
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={deleteChat}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* In-chat search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-2 border-b border-border/60 bg-panel/80 px-3 py-2"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchInChat(e.target.value)}
                placeholder="Search in this chat"
                className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0"
              />
              {searchResults.length > 0 && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {searchIndex + 1}/{searchResults.length}
                </span>
              )}
              {searchResults.length > 1 && (
                <>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const i = (searchIndex - 1 + searchResults.length) % searchResults.length; setSearchIndex(i); scrollToMessage(searchResults[i].id); }}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const i = (searchIndex + 1) % searchResults.length; setSearchIndex(i); scrollToMessage(searchResults[i].id); }}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinned messages banner */}
        {pinnedMessages.length > 0 && !selectionMode && (
          <div className="flex items-center gap-2 border-b border-border/60 bg-primary/5 px-3 py-1.5">
            <Pin className="h-3.5 w-3.5 shrink-0 text-primary" fill="currentColor" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground">
                {pinnedMessages[0].text || `${pinnedMessages[0].type}`}
              </p>
            </div>
            <button
              onClick={() => scrollToMessage(pinnedMessages[0].id)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Jump
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={() => {
            if (scrollRef.current) {
              const el = scrollRef.current;
              setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
            }
          }}
          className="no-scrollbar min-h-0 flex-1 overflow-y-auto chat-doodle px-1 py-4 lg:px-4 lg:py-6"
        >
          {loading ? (
            <MessageSkeleton />
          ) : chatMessages.length === 0 ? (
            isGroup ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <GroupAvatar name={displayName} src={displayPhoto} size="xl" className="mb-4" />
                <h2 className="font-display text-xl font-bold">{displayName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Start the conversation in this group</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button onClick={() => {
                    const msg: Message = { id: nanoid(), chatId: chatId!, senderId: meId, type: 'text', text: '👋 Hey everyone!', attachments: [], replyTo: null, status: 'sent', reactions: [], starred: false, pinned: false, deletedForEveryone: false, deletedFor: [], readBy: [meId], createdAt: Date.now() };
                    addMessage(msg); dataService.messages.add(msg); updateChat({ ...chat, lastMessage: { text: msg.text, senderId: meId, type: 'text', createdAt: msg.createdAt }, updatedAt: msg.createdAt });
                    toast.success('Message sent');
                  }} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                    <Hand className="h-4 w-4" /> Say hello
                  </button>
                  <button onClick={() => setPollOpen(true)} className="flex items-center gap-1.5 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-600 transition-colors hover:bg-sky-500/20">
                    <BarChart3 className="h-4 w-4" /> Create poll
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Info}
                title="No messages yet"
                description="Send a message to start the conversation."
              />
            )
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-panel/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur-md">
                    {group.label}
                  </span>
                </div>
                {group.items.map((msg, idx) => {
                  const next = group.items[idx + 1];
                  const isLastInGroup = !next || next.senderId !== msg.senderId || (msg.createdAt - next.createdAt > 60000);
                  return (
                    <div id={`msg-${msg.id}`} key={msg.id} className="transition-all duration-200 rounded-xl hover:bg-foreground/[0.02]">
                      <MessageBubble
                        message={msg}
                        isMine={msg.senderId === meId}
                        isGroup={isGroup}
                        senderName={USER_NAMES[msg.senderId]}
                        senderPhoto={USER_PHOTOS[msg.senderId]}
                        showAvatar={true}
                        isLastInGroup={isLastInGroup}
                        onReply={setReplyTo}
                        onForward={handleForward}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                        onTogglePin={handleTogglePin}
                        onToggleStar={handleToggleStar}
                        onReact={handleReact}
                        onEdit={handleEdit}
                        onSelect={handleSelect}
                        selected={selectedIds.has(msg.id)}
                        selectionMode={selectionMode}
                      />
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-end gap-2 px-3 py-1">
              {!isGroup && <div className="w-8 shrink-0" />}
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-chat-bubble-them px-3 py-2.5 shadow-soft">
                <TypingIndicator className="text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
              className="absolute right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-panel shadow-soft-lg md:bottom-6"
              style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 4.5rem)' }}
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Composer — pinned to bottom, never scrolls off, clears the fixed mobile nav */}
        <div className="shrink-0 border-t border-border/40 glass-strong px-1 pt-1 shadow-[0_-2px_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-xl pb-mobile-nav md:pb-1 lg:px-3 lg:py-1.5">
          <MessageComposer
            onSend={handleSend}
            onTyping={handleTyping}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            editing={editing}
            onCancelEdit={() => setEditing(null)}
            onSendVoice={(att) => handleSend('', [att])}
          />
        </div>
      </div>

      {/* Multi-select action bar (desktop inline, mobile bottom sheet style) */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-panel px-2 py-1.5 shadow-soft-lg ring-1 ring-border md:bottom-6"
            style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom) + 4.5rem)' }}
          >
            <span className="px-2 text-sm font-medium">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <Button size="sm" variant="ghost" onClick={bulkForward} disabled={selectedIds.size === 0}>
              <Forward className="mr-1 h-4 w-4" /> Forward
            </Button>
            <Button size="sm" variant="ghost" onClick={() => bulkDelete(false)} disabled={selectedIds.size === 0} className="text-destructive">
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={exitSelectionMode} aria-label="Exit selection">
              <XCircle className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward dialog */}
      <ForwardDialog
        open={forwardOpen}
        onOpenChange={(open) => { setForwardOpen(open); if (!open) setForwardPayload([]); }}
        targets={buildForwardTargets()}
        onForward={doForward}
        messageCount={forwardPayload.length}
      />

      {/* Create poll dialog */}
      {isGroup && chat && (
        <CreatePollDialog
          open={pollOpen}
          onClose={() => setPollOpen(false)}
          chat={chat}
          meId={meId}
          onCreate={async (poll) => {
            await dataService.polls.add(poll);
            toast.success('Poll created');
          }}
        />
      )}

      {/* Info panel */}
      <AnimatePresence>
        {infoOpen && (
          <ChatInfoPanel chat={chat} onClose={() => setInfoOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
