# Chronicle — Website Architecture & User Journey

A structured, responsive editorial web publication following the standard website user journey:

```
[ Landing Page (Home) ] ────► [ Log In / Register ] ────► [ Author Dashboard ] ────► [ Create Blog ]
      index.html                    login.html                  dashboard.html             create-blog.html
```

---

##  The 4-Step Website Architecture

### 1. The Landing Page (`index.html`)
- **Public Visitor First**: Visitors arrive at a modern landing page introducing the publication with zero pre-filled demo accounts.
- **Hero Value Proposition**: Bold headline, mission statement, and high-contrast call-to-actions:
  - `Start Writing — It's Free` ➔ routes to registration
  - `Explore Stories` ➔ smooth scrolls to the curated dispatches feed
- **Social Proof & Metrics Bar**: 500K+ readers, 12,000+ essays, 94% read completion.
- **Core Platform Pillars (`#features`)**: Editorial typography, Markdown studio, and community discourse.
- **Curated Articles Feed (`#stories`)**: Topic filters (*Engineering, Design, AI, Culture*), Grid/List view switcher, and in-place distraction-free reading overlay.
- **Visitor Navigation**: Prominent **"Log In"** and **"Get Started"** buttons.

### 2. Log In & Registration (`login.html`)
- **Unified Auth Portal**: Toggle between **[ Log In ]** and **[ Create Account ]** tabs directly on the same page.
- **No Hardcoded Demo Data**: Clean, empty inputs with standard placeholders (`name@company.com`, `••••••••`).
- **Interactive Security**: Password show/hide visibility toggle and real-time password strength meter.
- **Direct Redirection**: Upon submitting login or registration, the session is saved and the user is directed straight to their **Dashboard**.

### 3. Author Dashboard (`dashboard.html`)
- **Personalized Author Hub**: Dynamically displays the signed-in user's name, role, email, and generated avatar.
- **Performance Overview**: Published dispatches count, claps received, drafts counter, and response discourse.
- **Story Management Tabs**:
  - *My Published Dispatches*: View, edit, or delete live articles.
  - *Saved Drafts*: Resume writing or discard scratchpad notes.
- **Primary CTA**: Direct button to **"Create New Blog"**.

### 4. Create Blog Studio (`create-blog.html`)
- **Authoring Environment**: Markdown & WYSIWYG formatting toolbar (`H2`, `H3`, Bold, Italic, Quotes, Code snippets, Lists).
- **Cover Image Selector**: Unsplash presets and custom image URL picker with live thumbnail.
- **Live Split-Mode Preview**: Test the layout in real-time before publishing.
- **Publication**: Automatically attributes the post to the logged-in user, saves it into the feed, and redirects to the Dashboard.

---

##  Quick Page Links

-  [**Landing Page (`index.html`)**](file:///c:/Users/Administrator/Blog%20App/index.html)
-  [**Log In & Register (`login.html`)**](file:///c:/Users/Administrator/Blog%20App/login.html)
-  [**Author Dashboard (`dashboard.html`)**](file:///c:/Users/Administrator/Blog%20App/dashboard.html)
-  [**Create Blog (`create-blog.html`)**](file:///c:/Users/Administrator/Blog%20App/create-blog.html)
