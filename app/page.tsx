"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  displayContent?: string;
  imageUrl?: string;
  attachmentImage?: string;
  attachmentName?: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

const IMAGE_PREFIX = "/image ";
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

export default function Home() {
  const supabase = createClient();

  const [userName, setUserName] = useState<string>("there");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingText, setPendingText] = useState<{ name: string; content: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice — mic input 
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  function speak(text: string) {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    // Strip emoji so they don't get read aloud as garbled symbol names
    const clean = text.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      ""
    );
    window.speechSynthesis.cancel(); // don't stack overlapping replies
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // get the user's name and their list of past conversations.
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile?.name) setUserName(profile.name);

      await refreshConversations();
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function refreshConversations() {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  }

  async function openConversation(id: string) {
    setActiveConversationId(id);
    setLoading(false);
    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    setMessages(
      (history || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        imageUrl: m.image_url || undefined,
        attachmentImage: m.attachment_image || undefined,
        attachmentName: m.attachment_name || undefined,
      }))
    );
  }

  function startNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation? This can't be undone.")) return;

    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) startNewChat();
  }

  async function ensureConversation(firstMessageText: string): Promise<string> {
    if (activeConversationId) return activeConversationId;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");

    const title =
      firstMessageText.trim().slice(0, 42) + (firstMessageText.length > 42 ? "…" : "");

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: title || "New chat" })
      .select("id, title, updated_at")
      .single();

    if (error || !data) throw new Error("Couldn't create conversation");

    setActiveConversationId(data.id);
    setConversations((prev) => [data, ...prev]);
    return data.id;
  }

  async function touchConversation(id: string) {
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, updated_at: new Date().toISOString() } : c));
      return updated.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
    });
  }

  async function saveMessage(m: Message, conversationId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("messages").insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: m.role,
      content: m.content,
      image_url: m.imageUrl || null,
      attachment_image: m.attachmentImage || null,
      attachment_name: m.attachmentName || null,
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFileError(null);
    setPendingImage(null);
    setPendingText(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`"${file.name}" is too big — keep attachments under 4MB.`);
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPendingImage(reader.result as string);
      reader.onerror = () => setFileError("Couldn't read that image.");
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = () =>
        setPendingText({ name: file.name, content: reader.result as string });
      reader.onerror = () => setFileError("Couldn't read that file.");
      reader.readAsText(file);
    } else {
      setFileError(`"${file.name}" isn't a supported type — try an image or a text file.`);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !pendingImage && !pendingText) return;
    if (loading) return;

    try {
      // Image generation branch
      if (text.toLowerCase().startsWith(IMAGE_PREFIX) && !pendingImage && !pendingText) {
        const prompt = text.slice(IMAGE_PREFIX.length).trim();
        if (!prompt) return;

        const convId = await ensureConversation(text);
        const userMsg: Message = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        saveMessage(userMsg, convId);
        setInput("");
        setLoading(true);

        const seed = Math.floor(Math.random() * 1_000_000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          prompt
        )}?seed=${seed}&nologo=true`;

        const assistantMsg: Message = { role: "assistant", content: `here's "${prompt}" 🎨`, imageUrl };
        setMessages((prev) => [...prev, assistantMsg]);
        saveMessage(assistantMsg, convId);
        touchConversation(convId);
        speak(`Here's ${prompt}`);
        setLoading(false);
        return;
      }

      let messageContent = text;
      let attachmentName: string | undefined;

      if (pendingText) {
        messageContent = `${text}\n\n[Attached file: ${pendingText.name}]\n${pendingText.content}`;
        attachmentName = pendingText.name;
      }

      const userMsg: Message = {
        role: "user",
        content: messageContent,
        displayContent: pendingText ? text || "(sent a file)" : undefined,
        attachmentImage: pendingImage || undefined,
        attachmentName,
      };

      const convId = await ensureConversation(text || attachmentName || "New chat");
      const nextMessages: Message[] = [...messages, userMsg];
      setMessages(nextMessages);
      saveMessage(userMsg, convId);
      setInput("");
      setPendingImage(null);
      setPendingText(null);
      setLoading(true);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userName,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Request failed");
      }

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      saveMessage(assistantMsg, convId);
      touchConversation(convId);
      speak(data.reply);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠ ${e.message || "signal lost — try again"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }


  return (
    <div className="h-screen flex overflow-hidden">
      {/* Persistent left-edge tab — visible even when sidebar is collapsed */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-16 bg-graphite-raised border border-l-0 border-graphite-line icon-btn hover:bg-graphite-line flex items-center justify-center"
        style={{ clipPath: "polygon(0 0, 100% 8px, 100% calc(100% - 8px), 0 100%)" }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d={sidebarOpen ? "M7 1L2 5L7 9" : "M3 1L8 5L3 9"}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } transition-all duration-200 overflow-hidden border-r border-graphite-line flex flex-col shrink-0 bg-graphite-raised/40`}
      >
        <div className="p-4 flex flex-col gap-4 h-full min-w-[18rem] overflow-hidden">
          <div className="flex items-center gap-2 px-1 pt-1">
            <div className="w-7 h-7 bg-edge-violet flex items-center justify-center cut-tr">
              <span className="font-display font-bold text-xs text-graphite">S</span>
            </div>
            <span className="font-display font-semibold text-base tracking-tight text-paper">Sharp</span>
          </div>

          <button
            onClick={startNewChat}
            className="flex items-center gap-2 font-medium text-sm px-3 py-2.5 cut-tr bg-edge-violet text-graphite hover:brightness-110 transition-all shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            New chat
          </button>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 mt-1 -mx-1 px-1">
            {conversations.length === 0 && (
              <p className="text-xs text-ash px-2 py-2">No past chats yet — start one above.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`group relative flex items-center justify-between text-left text-sm px-3 py-2.5 rounded-lg transition-colors ${
                  activeConversationId === c.id
                    ? "bg-edge-violet/15 text-paper"
                    : "text-ash hover:bg-graphite-line/50 hover:text-paper"
                }`}
              >
                {activeConversationId === c.id && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-edge-violet" />
                )}
                <span className="truncate">{c.title || "New chat"}</span>
                <span
                  onClick={(e) => deleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-ash hover:text-edge-ember ml-2 shrink-0 transition-opacity"
                  title="Delete"
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-graphite-line pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="avatar bg-edge-ember/20 text-edge-ember">{userName.charAt(0).toUpperCase()}</div>
              <span className="text-sm text-paper truncate">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="icon-btn hover:bg-graphite-line rounded-md p-2 shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10.5L13.5 7.5L10 4.5M13.5 7.5H5.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto px-6 py-8 w-full h-screen overflow-hidden">
        <header className="flex items-center gap-3 mb-8 pl-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-sm text-ash truncate">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title || "Chat"
                : "New chat"}
            </h1>
          </div>
          {voiceSupported && (
            <button
              onClick={() => {
                if (voiceEnabled) window.speechSynthesis.cancel();
                setVoiceEnabled((v) => !v);
              }}
              title={voiceEnabled ? "Turn off spoken replies" : "Turn on spoken replies"}
              className={`icon-btn p-2 rounded-lg transition-colors ${
                voiceEnabled ? "text-edge-violet bg-edge-violet/10" : "hover:bg-graphite-line"
              }`}
            >
              {voiceEnabled ? (
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M2 6.5V10.5H5L9 14V3L5 6.5H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M11.5 5.5C12.5 6.5 12.5 10 11.5 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <path d="M13.3 3.7C15.3 5.7 15.3 11.3 13.3 13.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M2 6.5V10.5H5L9 14V3L5 6.5H2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M12 6L15 9M15 6L12 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 mb-6">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
              <div className="w-12 h-12 bg-edge-violet flex items-center justify-center cut-tr">
                <span className="font-display font-bold text-lg text-graphite">S</span>
              </div>
              <p className="text-ash text-sm">Ask Sharp anything, or try /image a description</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={m.id || i}
              className={`message-in flex items-end gap-2.5 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="avatar bg-edge-violet/20 text-edge-violet">S</div>
              )}
              <div
                className={`card max-w-[78%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "cut-bl" : "cut-tr"
                }`}
              >
                <div
                  className={`font-display text-[10px] font-semibold tracking-wide mb-1.5 ${
                    m.role === "user" ? "text-edge-ember" : "text-edge-violet"
                  }`}
                >
                  {m.role === "user" ? userName.toUpperCase() : "SHARP"}
                </div>
                {m.attachmentName && (
                  <div className="text-xs text-ash font-mono mb-1.5 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path
                        d="M7 1.5L2.5 6a1.8 1.8 0 002.5 2.5L9.5 4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    {m.attachmentName}
                  </div>
                )}
                {m.attachmentImage && (
                  <img
                    src={m.attachmentImage}
                    alt="attachment"
                    className="mb-2 max-w-full max-h-64 rounded-md border border-graphite-line"
                  />
                )}
                {m.content !== "" && (m.displayContent ?? m.content)}
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt="generated"
                    className="mt-2 max-w-full rounded-md border border-graphite-line"
                  />
                )}
              </div>
              {m.role === "user" && (
                <div className="avatar bg-edge-ember/20 text-edge-ember">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-end gap-2.5 justify-start">
              <div className="avatar bg-edge-violet/20 text-edge-violet">S</div>
              <div className="card cut-tr px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-edge-violet animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-edge-violet animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-edge-violet animate-bounce" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {(pendingImage || pendingText) && (
          <div className="flex items-center gap-2 mb-2 text-xs text-edge-violet px-1">
            {pendingImage && (
              <img src={pendingImage} alt="preview" className="h-9 w-9 object-cover rounded-md border border-graphite-line" />
            )}
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
                <path d="M7 1.5L2.5 6a1.8 1.8 0 002.5 2.5L9.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {pendingText ? pendingText.name : "image attached"}
            </span>
            <button
              onClick={() => {
                setPendingImage(null);
                setPendingText(null);
              }}
              className="icon-btn hover:text-edge-ember"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {fileError && <div className="mb-2 text-xs text-edge-ember px-1">{fileError}</div>}

        <div className="card cut-tr px-3 py-3 flex items-end gap-2 shadow-2xl shadow-black/30">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.md,.csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach an image or text file"
            className="icon-btn p-1.5 rounded-md hover:bg-graphite-line"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11.5 3L4.8 9.7a2.9 2.9 0 004.1 4.1L15.5 7.2a1.9 1.9 0 00-2.7-2.7L6.4 11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {voiceSupported && (
            <button
              onClick={toggleListening}
              title={listening ? "Stop listening" : "Speak your message"}
              className={`icon-btn p-1.5 rounded-md relative ${
                listening ? "text-edge-ember" : "hover:bg-graphite-line"
              }`}
            >
              {listening && <span className="absolute inset-0 rounded-md listening-pulse" />}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="7" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M4 8.5a5 5 0 0010 0M9 13.5V16M6.5 16h5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Sharp, or /image a description…"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-ash py-1.5"
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !pendingImage && !pendingText)}
            title="Send"
            className="p-2 cut-tr bg-edge-violet text-graphite hover:brightness-110 transition-all disabled:opacity-30 disabled:hover:brightness-100 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8H14M14 8L9 3M14 8L9 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
