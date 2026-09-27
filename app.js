/* ============================================================
   The Sniff Test — app logic
   Pure client-side JavaScript. No network calls, no storage,
   nothing leaves the browser. The text you paste is analysed
   in memory and discarded when you close the tab.
   ============================================================ */

/* -----------------------------------------------------------
   1. The pattern library.
   Each entry is one persuasion tactic we look for:
     id   – short internal name
     re   – a regular expression that matches the tactic's wording
     name – the human-readable title shown on the card
     why  – what the tactic is doing to the reader
     do   – the concrete action to take in response
   ----------------------------------------------------------- */
const FLAGS = [
  {
    id: "income",
    re: /(\$|£|€)\s?\d[\d,\.]*\s?(k\b|,?\d{3})|\bfive[- ]figures?\b|\b\d+\s?k\b\s?(month|week|day|deal)?|\b(10|20|30|40|50)k\b/gi,
    name: "Specific big income figures",
    why: "Numbers like '£10,000 month' or '$9,300 in 3 weeks' are the headline because they work on your imagination. They're almost always the best result they could find — the top of a very lopsided distribution — and they're revenue, not profit.",
    do: "Ask for the median member's result, not the star's. And ask: is that money in, or money kept?"
  },
  {
    id: "urgency",
    re: /\b(not for long|closing soon|doors? clos|limited (spots?|spaces?|time)|spots? (are )?(filling|running out)|act now|don'?t miss|before it'?s too late|only \d+ (spots?|places?)|window (is )?(still )?open|enrol(l)? now|last chance)\b/gi,
    name: "Urgency & scarcity",
    why: "Deadlines and 'limited spots' exist to stop you thinking and comparing. A real opportunity is still there next week. Manufactured urgency is designed to short-circuit your judgement.",
    do: "Treat any countdown as a reason to slow down, not speed up. Sleep on it."
  },
  {
    id: "price-gate",
    re: /\b(book a call|apply (now|to join)|schedule a call|fit check|see if (you|this is a fit)|qualify|application)\b/gi,
    name: "Price hidden behind a call",
    why: "If you can't see the price without 'applying' or 'booking a call', the call is a sales meeting built to handle your objections before you hear the number. Confident, fairly-priced products show the price.",
    do: "Email and ask for the exact total price in writing, today. Watch what happens."
  },
  {
    id: "beginner",
    re: /\b(no experience (needed|required)|complete beginners?|anyone can|from (zero|scratch)|no (skills?|tech) (needed|required)|even if you)\b/gi,
    name: "'Anyone can do it' + big promise",
    why: "'Built for complete beginners' paired with five-figure income suggests the result is easy and guaranteed. The skill might be learnable, but the outcome depends heavily on sales effort and luck — which they downplay.",
    do: "Ask what fraction of total beginners who join ever sign a single client."
  },
  {
    id: "lifestyle",
    re: /\b(quit (your|their) job|fire your boss|escape the 9[- ]?5|financial freedom|time freedom|location freedom|work from anywhere|digital nomad|travel the world|laptop lifestyle|be your own boss)\b/gi,
    name: "Lifestyle bait",
    why: "Selling the feeling (freedom, beaches, quitting) rather than the actual work. The dream is doing the persuading; the day-to-day reality is cold outreach and rejection.",
    do: "Picture the boring version: 100 cold messages a day. Still want it? Then maybe. If only the beach sold you, pause."
  },
  {
    id: "invest",
    re: /\b(invest in yourself|investment,? not (an )?expense|it'?s an investment|bet on yourself|the cost of (not|inaction))\b/gi,
    name: "'It's an investment, not an expense'",
    why: "A reframe that pre-loads guilt: if you hesitate at the price, you 'don't believe in yourself'. It's there to make a high price feel like your fault for questioning it.",
    do: "A price is a price. Judge the value for the money, not your self-belief."
  },
  {
    id: "proof",
    re: /\b(success stories|real results|testimonials?|awards? ceremony|annual awards|winners?|case stud(y|ies)|transformations?|next up award|hall of fame)\b/gi,
    name: "Manufactured social proof",
    why: "Awards ceremonies, 'success stories', wall-to-wall testimonials. Curated proof shows you the wins and hides the silent majority who got nothing. Selection, not evidence.",
    do: "Ask to speak to three recent members they did NOT hand-pick for you."
  },
  {
    id: "system",
    re: /\b(proven system|exact (system|blueprint|method)|fast[- ]?track|done[- ]for[- ]you|copy[- ]?paste|plug[- ]and[- ]play|templates?|secret (formula|method)|the (exact )?steps?)\b/gi,
    name: "'Proven system' / templates",
    why: "'Exact system', 'fast-track', 'copy-paste templates' imply a turnkey machine. In reality you're buying documents and scripts you'll still have to execute — usually the same ideas available free online.",
    do: "Ask exactly what's inside that you can't find free on YouTube or in docs."
  },
  {
    id: "disclaimer",
    re: /\b(not (part of|endorsed by|affiliated with) (youtube|google|facebook|meta)|results? (are )?not (typical|guaranteed)|individual results (may )?vary|no (income )?guarantee)\b/gi,
    name: "The small-print tell",
    why: "'Not endorsed by Facebook… results not typical' is the legal disclaimer almost every info-product carries. It quietly admits the headline results are NOT what a typical buyer should expect.",
    do: "Read it as their own admission: your results will probably look nothing like the ad."
  },
  {
    id: "vsl",
    re: /\b(watch (the |this )?(video|vsl) (first|below)|click below to watch|free (training|masterclass|webinar)|60[- ]second|register for the (free )?(training|webinar))\b/gi,
    name: "Video sales funnel (VSL)",
    why: "A long 'free training' video that builds desire then drops a pitch is a classic funnel. The free value is bait; the close is the point.",
    do: "Skip to the end. If it leads to 'book a call' with no price, you've seen the real product."
  },
  {
    id: "anti",
    re: /\b(they don'?t want you to know|while (others|everyone else) (grind|sleep)|the (system|matrix)|wake up|sheep|broke (mindset|friends)|stay poor|gurus? (are )?lying|in (complete )?silence)\b/gi,
    name: "Us-vs-them / mindset pressure",
    why: "Framing doubters as 'broke mindset' or 'sheep' isolates you from the people who'd sensibly tell you to be careful. Anything that punishes you for asking questions is a warning sign.",
    do: "The people telling you to slow down are usually the ones not selling you anything."
  },
  {
    id: "vague",
    re: /\b(ai does (the|all) (heavy lifting|work)|on autopilot|passive income|while you sleep|set (it )?and forget|revolutionary|game[- ]chang|paradigm shift|blow your mind)\b/gi,
    name: "Vague magic mechanism",
    why: "'AI does the heavy lifting', 'on autopilot', 'while you sleep'. When the actual mechanism is fuzzy and the adjectives are huge, the work being hidden is usually the hard, unglamorous part: getting clients.",
    do: "Ask them to walk you through one boring, specific day of the actual work."
  },

  /* ---------------------------------------------------------
     "Quiet" scam signals. These are often written in calm,
     polite, professional language — no hype, no exclamation
     marks — so the tactics above can miss them.
     severe: true → a classic scam marker; pushes the verdict up.
     --------------------------------------------------------- */
  {
    id: "guaranteed",
    severe: true,
    re: /\b(guaranteed (returns?|profits?|income|payouts?)|risk[- ]free|(no|zero) risk|capital (is )?(protected|guaranteed)|can(not|'t) lose|fixed (daily |weekly |monthly )?returns?|\d+(\.\d+)?\s?% (per|a|each|every) (day|week|month)|(daily|weekly) (returns|payouts|profits))\b/gi,
    name: "Guaranteed or fixed returns",
    why: "Real investments go up and down. Nobody can honestly promise 'guaranteed returns', 'no risk' or '2% a week'. Steady, high, guaranteed payouts are the signature of Ponzi schemes, which pay early investors with later investors' money until it collapses.",
    do: "Treat any guaranteed return as a stop sign. Check the firm on your country's financial regulator register (e.g. the FCA register in the UK) before sending anything."
  },
  {
    id: "payment",
    severe: true,
    re: /\b(gift ?cards?|itunes cards?|steam cards?|bitcoin|btc|usdt|tether|crypto(currency)? (wallet|address|payment)|wire transfer|western union|moneygram|bank transfer only|pay (via|in|with|using) (crypto|bitcoin|gift cards?))\b/gi,
    name: "Hard-to-reverse payment method",
    why: "Gift cards, crypto and wire transfers are scammers' favourite ways to get paid because the money is almost impossible to trace or claw back. Legitimate businesses take card payments, which come with buyer protection.",
    do: "Only pay by credit card or a method with buyer protection. If they insist on crypto, gift cards or a wire, walk away."
  },
  {
    id: "fee",
    severe: true,
    re: /\b((processing|release|activation|verification|withdrawal|clearance|unlocking|handling|admin(istration)?) fees?|unlock (your )?(funds|earnings|account|withdrawal)|pay (the )?tax(es)? (before|to) (withdraw|release|receive)|fee (to|before) (withdraw|release|receive))\b/gi,
    name: "Pay a fee to get your money",
    why: "Being asked to pay a 'release fee', 'tax' or 'verification fee' before you can withdraw your own money is one of the most reliable scam markers there is. The balance you're shown usually doesn't exist, and paying just leads to the next fee.",
    do: "Don't pay. A genuine platform deducts fees from your balance; it doesn't ask for new money to unlock it."
  },
  {
    id: "secrecy",
    re: /\b(keep (this|it) (confidential|private|between us|quiet)|don'?t (tell|share this with) (anyone|your (bank|family))|private (opportunity|offer|invitation)|exclusive invitation|by invitation only|discreet(ly)?|not (available|open) to the public)\b/gi,
    name: "Secrecy & exclusivity",
    why: "'Keep this between us' or 'not open to the public' stops you from asking the people most likely to spot a problem: your bank, friends and family. Legitimate opportunities don't need to be secret.",
    do: "Tell someone you trust about it before doing anything. If you've been asked not to, that's the reason to."
  },
  {
    id: "offplatform",
    re: /\b((message|contact|text|reach|add) (me|us) on (whatsapp|telegram|signal)|whatsapp|telegram|move (this|the conversation) to)\b/gi,
    name: "Move to a private chat app",
    why: "Asking you to continue on WhatsApp or Telegram moves the conversation away from platforms that monitor for scams and can ban accounts. It's a very common step in investment and romance scams.",
    do: "Keep conversations on the original platform, and be wary of anyone who pushes to move."
  },
  {
    id: "mentor",
    re: /\b(account manager|trading (mentor|coach|expert|signals?)|investment (advisor|adviser|manager|mentor)|i (can|will) (help|teach|show) you (to )?(invest|trade|earn)|my (mentor|uncle|cousin|aunt) (taught|showed|introduced)|let me manage)\b/gi,
    name: "Friendly 'mentor' or account manager",
    why: "A helpful stranger who offers to manage your money or 'show you how they trade' is the core of many investment scams. The friendliness and patience are part of the method.",
    do: "Anyone giving financial advice should be registered. Look their name up on the regulator's register, not on a link they send you."
  },
  {
    id: "legit",
    re: /\b(fully (licensed|regulated|registered|compliant)|licensed and regulated|(fca|sec|asic|finra|government)[- ](approved|registered|regulated|backed)|registered with the (fca|sec)|as seen on|trusted by (thousands|millions)|(100%|completely|totally) (legit|legitimate|safe|secure)|not a scam|rest assured)\b/gi,
    name: "Unverified claims of legitimacy",
    why: "'Fully regulated', 'as seen on the BBC', '100% legit, not a scam'. These claims sound reassuring but cost nothing to write. Scammers routinely copy real registration numbers or the names of real firms.",
    do: "Verify every claim yourself on the official register or the outlet's own website. Never use the phone number or link they give you."
  },
  {
    id: "recruit",
    re: /\b(referral (bonus|commission|rewards?)|recruit(ing)? (others|friends|members|people)|downline|upline|build your team|invite (your )?friends (to|and) earn|(earn|get paid) (for|on) every (person|member|referral)|residual income|matrix (plan|bonus))\b/gi,
    name: "Paid to recruit others",
    why: "If a big part of the money comes from signing up new people rather than selling a real product to real customers, it's a pyramid or multi-level structure. Most participants lose money.",
    do: "Ask what share of income comes from product sales to non-members. If they can't or won't say, assume it's mostly recruitment."
  },
  {
    id: "data",
    severe: true,
    re: /\b((send|share|provide|confirm|verify) (me )?(your|a copy of your) (password|pin|passport|id|driving licen[cs]e|bank (details|login)|seed phrase|recovery phrase|private key|social security|ssn|card (details|number))|seed phrase|recovery phrase|private key|remote access|anydesk|teamviewer)\b/gi,
    name: "Asks for personal data or device access",
    why: "Requests for passwords, ID documents, crypto recovery phrases or remote access to your computer (AnyDesk, TeamViewer) enable identity theft or let them empty your accounts directly.",
    do: "Never share these with anyone who contacted you. A real company will never ask for your password or recovery phrase."
  }
];

/* A sample pitch used by the "Load an example" button. */
const EXAMPLE = `The window to get ahead with AI is still open — but not for long.
The exact system helping 400+ people build their own AI Growth Consultancy and quit their job.
Built for complete beginners. We help you build your agency from zero. Watch the video below first, then start the 60-second fit check.
Hear from our recent success stories — real results, no fluff. He made $9,300 in 3 weeks. From call centre to $17,093. By January he'd done his first £10,000 month and took home the "Next Up" award at our annual awards ceremony. From apprentice to five figures in just 3 months.
This isn't a get-rich-quick scheme — see it as an investment, not an expense. Apply now to join. Spots are limited.
This website is not endorsed by YouTube, Google or Facebook. Results are not typical.`;

/* Escape <, >, & so pasted text can't inject HTML into the page (XSS safety). */
function esc(s) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

/* Find every tactic in the text.
   Returns `hit` (which tactics fired) and `merged` (non-overlapping
   character spans to highlight, sorted by position). */
function scan(text) {
  const ranges = [];
  const hit = [];
  for (const f of FLAGS) {
    f.re.lastIndex = 0;              // reset the regex's internal cursor before scanning
    let m, found = false;
    while ((m = f.re.exec(text)) !== null) {
      if (m.index === f.re.lastIndex) f.re.lastIndex++;  // guard against zero-length matches looping forever
      if (m[0].trim().length === 0) continue;
      ranges.push([m.index, m.index + m[0].length]);     // record start + end of this match
      found = true;
    }
    if (found) hit.push(f);
  }

  // Merge overlapping highlight ranges so we never nest <mark> inside <mark>.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    if (merged.length && r[0] <= merged[merged.length - 1][1]) {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
    } else {
      merged.push([r[0], r[1]]);
    }
  }
  return { hit, merged };
}

/* -----------------------------------------------------------
   2. The main routine: read the text, find tactics, render.
   ----------------------------------------------------------- */
function run() {
  const text = document.getElementById('inp').value.trim();
  const res = document.getElementById('results');

  // Nothing pasted yet → gentle prompt, then stop.
  if (!text) {
    res.innerHTML = `<div class="panel" style="border-color:var(--red)"><strong>Nothing to check yet.</strong> Paste a pitch above — or hit "Load an example" to see how it works.</div>`;
    return;
  }

  const { hit, merged } = scan(text);

  // Rebuild the text, wrapping each merged span in a <mark>. Everything is escaped first.
  let out = '', pos = 0;
  for (const [s, e] of merged) {
    out += esc(text.slice(pos, s)) + '<mark class="flag">' + esc(text.slice(s, e)) + '</mark>';
    pos = e;
  }
  out += esc(text.slice(pos));

  // Choose a verdict band from how many distinct tactics fired.
  // Any "severe" signal overrides the count: one is enough to stop and verify.
  const n = hit.length;
  const severe = hit.filter(f => f.severe);
  let band, stamp, blurb;
  if (severe.length) {
    band = "Serious scam warning signs"; stamp = "Stop &amp;<br>verify";
    blurb = `This contains ${severe.length === 1 ? "a signal" : "signals"} strongly associated with scams (${severe.map(f => f.name.toLowerCase()).join(", ")}). Don't send money or personal details until you've independently verified who you're dealing with.`;
  } else if (n === 0) {
    band = "Clean read — but stay sharp"; stamp = "Keep your<br>guard up";
    blurb = "None of the warning signs this tool knows about showed up in what you pasted. That's not a green light. Well-written scams can avoid every phrase on the list, so you'll have to judge it on substance. Run the questions at the bottom anyway.";
  } else if (n <= 3) {
    band = "Some sales pressure"; stamp = "Proceed<br>carefully";
    blurb = "A few persuasion tactics here. Not damning on its own — plenty of normal businesses use one or two — but read each one below and keep your wallet shut until your questions are answered.";
  } else if (n <= 6) {
    band = "Heavy funnel pressure"; stamp = "Slow<br>down";
    blurb = "This leans hard on persuasion over substance. The number of tactics stacked together is the signal. Go through every flag below before you engage with a sales call.";
  } else {
    band = "Textbook high-pressure pitch"; stamp = "Do your<br>homework";
    blurb = "This is a full house of info-marketing tactics. It may still be a real product some people profit from — but it's engineered to rush your judgement. Read everything below twice.";
  }

  const pct = Math.min(100, Math.round((n / FLAGS.length) * 100));  // meter fill %

  // ---- build the results HTML ----
  let html = `
  <div class="verdict">
    <div class="stamp">${stamp}</div>
    <h2>${band}</h2>
    <div class="count"><b>${n}</b> of ${FLAGS.length} warning signs detected</div>
    <div class="meter"><i id="bar"></i></div>
    <p class="blurb">${blurb}</p>
  </div>
  <div class="notice">
    <strong>Not 100% reliable.</strong> This tool matches wording, not facts. It can miss scams and flag honest businesses.
    Double-check with a Google search: search the company or person's name plus words like
    <em>"scam"</em>, <em>"reviews"</em> or <em>"complaints"</em>, and look them up on your country's official
    regulator or company register.
  </div>`;

  if (n) {
    html += `<div class="sec-head">Your pitch, marked up in red</div>`;
    html += `<div class="marked">${out}</div>`;
    html += `<div class="sec-head">What each red mark is doing to you</div>`;
    for (const f of hit) {
      html += `<div class="flagcard${f.severe ? ' severe' : ''}">
        <div class="name">${f.name}${f.severe ? ' <span class="tag">High risk</span>' : ''}</div>
        <div class="why">${f.why}</div>
        <div class="do"><b>Do this →</b> ${f.do}</div>
      </div>`;
    }
  }

  // Always-on education (shown no matter what the input was).
  html += `<div class="sec-head">The maths the figures skip</div>
  <div class="reality">
    <div class="item"><h3>You're shown the winners only</h3><p>Testimonials are the top slice of a very lopsided spread. For every person on £10k there are usually far more who paid and made little or nothing — and you never meet them. The advert is the right tail, not the average.</p></div>
    <div class="item"><h3>Revenue is not profit</h3><p>"£9,300 in 3 weeks" is money <em>in</em> — before ad spend, software, refunds and tax. A five-figure month can net a few hundred pounds, or a loss. Always ask what was actually kept.</p></div>
    <div class="item"><h3>One month is not a salary</h3><p>"First £10k month" describes a single peak. These businesses are lumpy and clients leave. A peak is not a baseline, and a baseline is not forever.</p></div>
  </div>`;

  html += `<div class="sec-head">To be fair — what's often true</div>
  <div class="reality fair">
    <div class="item"><h3>The skill is real and learnable</h3><p>Some people genuinely build small AI-automation agencies that make money. The underlying tools (chatbots, workflow automation, simple agents) are real — and you can learn them <strong>free</strong>, today, from open docs and YouTube.</p></div>
    <div class="item"><h3>The bottleneck is sales, not AI</h3><p>The hard part isn't the tech — it's finding clients and surviving rejection. No course removes that. What these programs really sell is a sales script, templates, and an accountability community. Decide if that's worth the (often hidden) price to you.</p></div>
  </div>`;

  html += `<div class="sec-head">Before you pay, ask — and get it in writing</div>
  <ul class="ask">
    <li>What is the exact total price, today? (If they won't say before a call, that's your answer.)</li>
    <li>What percentage of members never sign a single client? Show me the median, not the testimonials.</li>
    <li>What's the refund policy — and what are the actual conditions and deadlines?</li>
    <li>Can I speak to three recent members you did not personally choose?</li>
    <li>What's inside that I genuinely can't find free online?</li>
    <li>What ongoing costs (ads, software, subscriptions) will I need on top of the fee?</li>
  </ul>`;

  res.innerHTML = html;

  // Animate the meter after the DOM has painted.
  requestAnimationFrame(() => {
    const bar = document.getElementById('bar');
    if (bar) bar.style.width = pct + '%';
  });

  // Reveal + fill the footer disclaimer.
  const foot = document.getElementById('foot');
  foot.classList.remove('hidden');
  foot.innerHTML = `A flag here is not proof a company is dishonest or breaking the law. Plenty of legitimate businesses use some of these tactics, and some flagged programs do deliver value. This tool spots persuasion patterns and common scam wording so you slow down and ask better questions. It is not a verdict on any specific company and it is not 100% reliable. Always double-check with a Google search and the official regulator before you pay or share anything.`;

  res.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Helpers for the other two buttons. */
function loadExample() {
  document.getElementById('inp').value = EXAMPLE;
  run();
}
function clearAll() {
  document.getElementById('inp').value = '';
  document.getElementById('results').innerHTML = '';
  document.getElementById('ai-box').classList.add('hidden');
  document.getElementById('foot').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* -----------------------------------------------------------
   AI prompt: builds a ready-made prompt from the pasted text so the
   user can paste it into a free AI chat (ChatGPT, Claude, Gemini).
   This app still makes no network calls; the user chooses whether
   to send their text to an AI, and which one.
   ----------------------------------------------------------- */
function buildPrompt(text) {
  const { hit } = scan(text);
  const hint = hit.length
    ? `An automated keyword checker already flagged these warning signs: ${hit.map(f => f.name).join("; ")}. Treat that as a hint, not a conclusion.`
    : `An automated keyword checker found no known warning phrases. That doesn't mean it's safe; look closely for subtler signs.`;

  return `You are a careful consumer-protection analyst. Assess the text below for signs of a scam, fraud, or high-pressure sales tactics, including tactics written in calm, polite or professional language.

Please give me:
1. A verdict: "Likely scam", "High-pressure but possibly legitimate", "Appears legitimate" or "Not enough information", with how confident you are and why.
2. Each red flag you find: quote the exact wording and explain why it matters.
3. Every claim I could verify myself (company names, people, registration numbers, regulators, websites, results or awards) and exactly how to check each one. If you can search the web, check them and cite your sources. If you can't, say so and don't guess.
4. Anything that looks genuinely legitimate or reassuring.
5. The questions I should ask before paying money or sharing personal details.

Be honest about uncertainty. Don't invent facts about the company or people named.

${hint}

--- TEXT START ---
${text}
--- TEXT END ---`;
}

async function copyPrompt() {
  const text = document.getElementById('inp').value.trim();
  const box = document.getElementById('ai-box');
  const status = document.getElementById('ai-status');
  const out = document.getElementById('ai-prompt');
  box.classList.remove('hidden');

  if (!text) {
    status.textContent = 'Paste a pitch above first, then click this button again.';
    out.classList.add('hidden');
    return;
  }

  out.value = buildPrompt(text);  // .value is plain text, so nothing pasted can run as HTML
  out.classList.remove('hidden');

  // Try the modern clipboard API; fall back to the older copy command.
  let copied = false;
  try {
    await navigator.clipboard.writeText(out.value);
    copied = true;
  } catch {
    out.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
  }

  status.textContent = copied
    ? 'Copied! Open one of the free AI chats below and paste it in (Ctrl+V / Cmd+V).'
    : "Couldn't copy automatically. Select all the text in the box below, copy it, then paste it into one of the AI chats.";
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* -----------------------------------------------------------
   3. Wire the buttons up.
   Done in JS (not inline onclick) so the strict Content-Security-Policy
   can forbid inline scripts — a real, visible security practice.
   `defer` on the <script> tag means the DOM is ready by the time this runs.
   ----------------------------------------------------------- */
document.getElementById('btn-run').addEventListener('click', run);
document.getElementById('btn-example').addEventListener('click', loadExample);
document.getElementById('btn-clear').addEventListener('click', clearAll);
document.getElementById('btn-ai').addEventListener('click', copyPrompt);
