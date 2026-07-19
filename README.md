# Sharp AI

<p align="center">
  <b>An open-source AI assistant built with Next.js, Groq, and Supabase.</b><br>
  Chat • Vision • Image Generation • Voice • File Understanding • Persistent Conversations
</p>

<p align="center">
  <a href="https://sharp-ai-vert.vercel.app">🌐 Live Demo</a>
</p>

---

## ✨ About

**Sharp AI** is a modern AI assistant that delivers a ChatGPT-like experience using **only free-tier services**.

It supports real-time conversations, image generation, image understanding, voice interaction, file analysis, and secure user accounts with persistent chat history.

The goal of this project is to demonstrate that a powerful AI assistant can be built without relying on expensive infrastructure or paid APIs.

---

## 🚀 Features

### 💬 AI Chat

* Powered by Groq's ultra-fast inference
* Streaming AI responses
* Markdown support
* Multiple conversations
* Conversation history

### 🖼️ Image Generation

Generate images using:

```text
/image futuristic city at sunset
```

Powered by Pollinations.ai (no API key required).

---

### 👁️ Vision

Upload an image and ask questions like:

> "Describe this image."

> "Extract the text."

> "What's happening here?"

Sharp automatically switches to a vision model when an image is attached.

---

### 📂 File Understanding

Upload and analyze:

* TXT
* Markdown
* CSV
* JSON

Then ask questions about the uploaded content.

---

### 🎤 Voice Support

* Speech-to-text
* Text-to-speech replies
* Browser-native APIs (no paid services)

---

### 👤 Authentication

* Email & Password
* Google Sign-In
* Persistent sessions
* Secure authentication using Supabase

---

### 🗂️ Chat History

* Multiple conversations
* Sidebar navigation
* Saved automatically
* Continue previous chats anytime

---

### 🕒 Smart Time Awareness

Sharp automatically knows the user's local date and time instead of the server's timezone.

---

## 🛠️ Tech Stack

| Technology           | Purpose                   |
| -------------------- | ------------------------- |
| Next.js (App Router) | Frontend & Backend        |
| Tailwind CSS         | UI Styling                |
| Groq API             | Chat & Vision Models      |
| Supabase             | Authentication & Database |
| PostgreSQL           | Conversation Storage      |
| Pollinations.ai      | Image Generation          |
| Vercel               | Deployment                |

---

## 🏗️ Architecture

```text
                User
                  │
                  ▼
          Next.js Frontend
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   Groq API   Pollinations   Supabase
(Chat/Vision) (Images)      (Auth + DB)
```

---

## 📸 Screenshots

<img width="1366" height="641" alt="image" src="https://github.com/user-attachments/assets/dbc1072a-65e0-4039-a41d-623f2001c137" />

* Login Page
* Chat Interface
* Image Generation
* File Upload
* Mobile View

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/HaiderSharif-9/Sharp-Ai.git

cd Sharp-Ai
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create a Groq API Key

Get your free API key from:

https://console.groq.com/keys

---

### 4. Configure Supabase

Follow the instructions in:

```text
SUPABASE_SETUP.md
```

This includes:

* Creating a Supabase project
* Running the SQL schema
* Enabling Google OAuth
* Configuring authentication

---

### 5. Configure Environment Variables

Copy:

```bash
cp .env.example .env.local
```

Then add:

```env
GROQ_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

### 6. Start the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📁 Project Structure

```text
app/
├── api/
│   └── chat/
├── auth/
├── login/
├── globals.css
├── page.tsx

lib/
└── supabase/

middleware.ts

supabase_schema.sql

supabase_migration_conversations.sql
```

---

## 🌐 Deployment

Deploy for free using **Vercel**.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables.
4. Deploy.

---

## ⚠️ Known Limitations

* Groq free tier has request rate limits.
* Groq model names may occasionally change.
* Voice recognition works best in Chromium-based browsers.
* File uploads are limited to **4 MB**.

---

## 🗺️ Roadmap

### Current

* ✅ AI Chat
* ✅ Image Generation
* ✅ Vision
* ✅ Voice Input
* ✅ Voice Output
* ✅ Authentication
* ✅ Google Login
* ✅ Saved Conversations
* ✅ File Upload

### Planned

* ⏳ AI Agents
* ⏳ Long-term Memory
* ⏳ Multiple AI Models
* ⏳ Plugin System
* ⏳ PDF Support
* ⏳ Code Interpreter
* ⏳ Web Search
* ⏳ Mobile App

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Haider Sharif**

If you found this project helpful, consider giving it a ⭐ on GitHub.
