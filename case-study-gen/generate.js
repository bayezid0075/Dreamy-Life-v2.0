/**
 * Dreamy Life — Technical Case Study (DOCX generator)
 * Uses the `docx` library (v9).
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType,
  PageNumber, Footer, Header, TabStopType, VerticalAlign, PageBreak,
  TableLayoutType, HeightRule, LineRuleType, TableOfContents,
} = require('docx');

// ─────────────────────────── palette & fonts ────────────────────────────
const C = {
  indigo: '5B4FE9',
  indigoDark: '3F379F',
  navy: '211B3D',
  amber: 'D99A2B',
  bg: 'F6F4FF',
  zebra: 'EFEDFB',
  text: '26233A',
  muted: '6F6A8A',
  border: 'D8D4EE',
  white: 'FFFFFF',
  green: '1E8E5A',
};
const FB = 'Calibri';      // body
const FH = 'Georgia';      // headings
const FM = 'Consolas';     // code

const A4 = { width: 11906, height: 16838 }; // twips

// ─────────────────────────── helpers ────────────────────────────────────
function run(text, o = {}) {
  return new TextRun({
    text,
    bold: o.bold || false,
    italics: o.italics || false,
    color: o.color || C.text,
    size: o.size || 21, // half-points
    font: o.font || FB,
    allCaps: o.allCaps || false,
    smallCaps: o.smallCaps || false,
    break: o.break || 0,
  });
}

function para(children, o = {}) {
  const p = {
    children,
    alignment: o.align || AlignmentType.LEFT,
    spacing: {
      before: o.before != null ? o.before : 0,
      after: o.after != null ? o.after : 0,
      line: o.line || 276,
      lineRule: LineRuleType.AUTO,
    },
  };
  if (o.keepNext) p.keepNext = true;
  if (o.keepLines) p.keepLines = true;
  if (o.heading) p.heading = o.heading;
  if (o.pageBreakBefore) p.pageBreakBefore = true;
  if (o.shading) p.shading = { type: ShadingType.CLEAR, fill: o.shading };
  if (o.border) p.border = o.border;
  if (o.indent) p.indent = o.indent;
  if (o.tabStops) p.tabStops = o.tabStops;
  return new Paragraph(p);
}

function bullet(text, o = {}) {
  const runs = o.runs || [run(text, { size: o.size || 20, color: o.color || C.text, bold: o.bold })];
  return para(
    [run('•  ', { color: C.indigo, bold: true, size: o.size || 20 }), ...runs],
    { after: o.after != null ? o.after : 60, line: 260, indent: { left: 320, hanging: 200 } },
  );
}

// Section heading (H1) that starts a new page
function h1(num, text, o = {}) {
  return para(
    [
      run(num + '.  ', { color: C.amber, bold: true, font: FH, size: 30 }),
      run(text, { color: C.indigoDark, bold: true, font: FH, size: 30 }),
    ],
    { heading: HeadingLevel.HEADING_1, pageBreakBefore: true, keepNext: true, after: 120 },
  );
}

function h2(text) {
  return para([run(text, { color: C.indigoDark, bold: true, font: FH, size: 24 })],
    { heading: HeadingLevel.HEADING_2, before: 240, after: 100, keepNext: true });
}

function h3(text) {
  return para([run(text, { color: C.navy, bold: true, size: 21 })],
    { heading: HeadingLevel.HEADING_3, before: 180, after: 70, keepNext: true });
}

function body(text, o = {}) {
  return para([run(text, { size: o.size || 21, color: o.color || C.text, italics: o.italics, bold: o.bold })],
    { after: o.after != null ? o.after : 120, align: o.align || AlignmentType.JUSTIFIED, line: 284 });
}

// callout / info box with a thick left accent
function callout(title, children, o = {}) {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [
            para([run(title.toUpperCase(), { bold: true, color: C.indigoDark, size: 17, smallCaps: true })],
              { after: 80, line: 240 }),
            ...children,
          ],
          shading: { type: ShadingType.CLEAR, fill: o.fill || C.bg },
          margins: { top: 140, bottom: 140, left: 220, right: 160 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 26, color: C.indigo },
          },
        }),
      ],
    }),
  ];
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

const cellMargins = { top: 90, bottom: 90, left: 110, right: 110 };
const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: C.border },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
  left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
  right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: C.border },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: C.border },
};

// generic styled table: headers: string[], rows: (string|Paragraph[])[][]
function makeTable(headers, rows, o = {}) {
  const widths = o.widths || headers.map(() => 100 / headers.length);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        children: [para([run(h, { bold: true, color: C.white, size: 17, smallCaps: true })], { after: 0, line: 240 })],
        shading: { type: ShadingType.CLEAR, fill: o.headerFill || C.indigo },
        margins: cellMargins,
        verticalAlign: VerticalAlign.CENTER,
        width: { size: widths[i], type: WidthType.PERCENTAGE },
      })),
  });
  const bodyRows = rows.map((r, ri) =>
    new TableRow({
      children: r.map((cell, ci) => {
        const isParas = Array.isArray(cell);
        const children = isParas
          ? cell
          : [para([run(cell, {
              size: o.fontSize || 19,
              color: o.bodyColor || C.text,
              bold: o.boldCols && o.boldCols.includes(ci),
            })], { after: 0, line: 250 })];
        return new TableCell({
          children,
          margins: cellMargins,
          verticalAlign: VerticalAlign.CENTER,
          width: { size: widths[ci], type: WidthType.PERCENTAGE },
          ...(ri % 2 === 1 && o.zebra !== false ? { shading: { type: ShadingType.CLEAR, fill: C.zebra } } : {}),
        });
      }),
    }),
  );
  return new Table({
    rows: [headerRow, ...bodyRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
  });
}

// stat tile for the "at a glance" grid
function statCell(number, label) {
  return new TableCell({
    children: [
      para([run(number, { bold: true, color: C.indigo, font: FH, size: 30 })],
        { align: AlignmentType.CENTER, after: 30, line: 300 }),
      para([run(label, { color: C.muted, size: 15, smallCaps: true })],
        { align: AlignmentType.CENTER, after: 0, line: 230 }),
    ],
    shading: { type: ShadingType.CLEAR, fill: C.white },
    margins: { top: 150, bottom: 150, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    width: { size: 33.3, type: WidthType.PERCENTAGE },
  });
}

// monospace code block
function codeBlock(lines) {
  return new Table({
    rows: [new TableRow({
      children: [new TableCell({
        children: lines.map((l, i) =>
          para([run(l, { font: FM, size: 16, color: '3D3A5C' })], { after: 0, line: 220 })),
        shading: { type: ShadingType.CLEAR, fill: 'EFEDF7' },
        margins: { top: 120, bottom: 120, left: 200, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          left: { style: BorderStyle.SINGLE, size: 22, color: C.indigo },
        },
      })],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
  });
}

// architecture diagram row
function archRow(label, sub, fill, fg) {
  return new TableRow({
    children: [new TableCell({
      children: [
        para([run(label, { bold: true, color: fg || C.white, size: 19, allCaps: true })],
          { align: AlignmentType.CENTER, after: sub ? 20 : 0, line: 250 }),
        ...(sub ? [para([run(sub, { color: fg || C.white, size: 15 })], { align: AlignmentType.CENTER, after: 0, line: 230 })] : []),
      ],
      shading: { type: ShadingType.CLEAR, fill: fill || C.indigo },
      margins: { top: 130, bottom: 130, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
    })],
  });
}
function arrowRow() {
  return new TableRow({
    children: [new TableCell({
      children: [para([run('▼', { bold: true, color: C.amber, size: 18 })], { align: AlignmentType.CENTER, after: 0, line: 240 })],
      margins: { top: 30, bottom: 30, left: 100, right: 100 },
      borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
    })],
  });
}

// ─────────────────────────── assets ─────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const logoBuf = fs.readFileSync(path.join(ROOT, 'logo_smaller.png'));
const bannerBuf = fs.readFileSync(path.join(ROOT, 'dashboard_banner.jpeg'));

// ─────────────────────────── footer / header ────────────────────────────
const footer = new Footer({
  children: [
    para(
      [
        run('Dreamy Life — Technical Case Study', { size: 15, color: C.muted }),
        run('    ', { size: 15 }),
        run('August 2026', { size: 15, color: C.muted }),
      ],
      { tabStops: [{ type: TabStopType.RIGHT, position: 9010 }], after: 0, line: 240 },
    ),
  ],
});
// simpler: centered page number footer
const footerCenter = new Footer({
  children: [
    para(
      [
        run('Dreamy Life — Technical Case Study   |   ', { size: 15, color: C.muted }),
        new TextRun({ children: [PageNumber.CURRENT], size: 15, color: C.muted }),
      ],
      { align: AlignmentType.CENTER, after: 0, line: 240 },
    ),
  ],
});

const headerText = new Header({
  children: [
    para(
      [
        run('DREAMY LIFE', { bold: true, size: 15, color: C.indigo, allCaps: true }),
        run('   •   Technical Case Study', { size: 15, color: C.muted }),
      ],
      { after: 60, line: 240, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 3 } } },
    ),
  ],
});

// ─────────────────────────── COVER ──────────────────────────────────────
const coverChildren = [
  // top accent strip
  para([run('', { size: 8 })], { shading: C.amber, after: 0, line: 260 }),
  para([run('', { size: 8 })], { after: 0, line: 260 }),

  // brand band
  new Table({
    rows: [new TableRow({
      height: { value: 4300, rule: HeightRule.EXACT },
      children: [new TableCell({
        children: [
          para([new ImageRun({ type: 'png', data: logoBuf, transformation: { width: 150, height: 150 } })],
            { align: AlignmentType.CENTER, after: 120, line: 260 }),
          para([run('DREAMY LIFE', { bold: true, color: C.white, font: FH, size: 64 })],
            { align: AlignmentType.CENTER, after: 60, line: 420 }),
          para([run('COMMUNITY  •  COMMERCE  •  GROWTH', { color: C.amber, size: 18, bold: true })],
            { align: AlignmentType.CENTER, after: 120, line: 260 }),
          para([run('T E C H N I C A L   C A S E   S T U D Y', { color: 'B9B2E8', size: 17, smallCaps: true })],
            { align: AlignmentType.CENTER, after: 0, line: 260 }),
        ],
        shading: { type: ShadingType.CLEAR, fill: C.navy },
        margins: { top: 260, bottom: 220, left: 300, right: 300 },
        verticalAlign: VerticalAlign.CENTER,
      })],
    })],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
  }),

  para([run('', { size: 8 })], { after: 0, line: 260 }),
  para([run('', { size: 8 })], { after: 0, line: 260 }),

  // meta block
  makeTable(
    ['', ''],
    [
      [para([run('Product', { bold: true, size: 18, color: C.muted, smallCaps: true })], { after: 0, line: 250 }),
       para([run('Dreamy Life v2.0 — all-in-one community & commerce platform', { size: 19 })], { after: 0, line: 250 })],
      [para([run('Deliverables', { bold: true, size: 18, color: C.muted, smallCaps: true })], { after: 0, line: 250 }),
       para([run('User Web App • Admin Panel • Mobile App (iOS / Android) • Backend API • WhatsApp OTP Gateway', { size: 19 })], { after: 0, line: 250 })],
      [para([run('Core Stack', { bold: true, size: 18, color: C.muted, smallCaps: true })], { after: 0, line: 250 }),
       para([run('NestJS • Next.js • React Native (Expo) • PostgreSQL • Redis • Docker', { size: 19 })], { after: 0, line: 250 })],
      [para([run('Infrastructure', { bold: true, size: 18, color: C.muted, smallCaps: true })], { after: 0, line: 250 }),
       para([run('Single 2 GB VPS • Docker Compose • GitHub Container Registry', { size: 19 })], { after: 0, line: 250 })],
      [para([run('Date', { bold: true, size: 18, color: C.muted, smallCaps: true })], { after: 0, line: 250 }),
       para([run('August 2026', { size: 19 })], { after: 0, line: 250 })],
    ],
    { widths: [24, 76], fontSize: 19 },
  ),

  para([run('', { size: 8 })], { after: 0, line: 240 }),
  para(
    [run('Prepared by the Dreamy Life engineering team — documenting the architecture, features, challenges and solutions behind the platform.', { italics: true, size: 17, color: C.muted })],
    { align: AlignmentType.CENTER, after: 0, line: 240 },
  ),
];

// ─────────────────────────── EXECUTIVE SUMMARY ──────────────────────────
const execSummary = [
  h1('1', 'Executive Summary'),
  body('Dreamy Life is a full-stack community and commerce platform that unifies social networking, multi-level referral marketing, tiered memberships, digital services and a micro-job marketplace under one roof. What began as a membership-and-referral product has grown into a complete digital ecosystem: users build referral teams up to 10 levels deep, earn commissions on memberships, mobile recharges and data packs, chat in real time, run vendor shops, resell products, post and complete paid micro-jobs — all managed from a single NestJS API, a web app, an Expo mobile app and a comprehensive admin panel.'),

  body('The project is engineered as a pnpm + Turborepo monorepo with four deployable applications and a dedicated WhatsApp OTP gateway, sharing typed contracts through a common package. The entire platform — database, cache, queue, API and two Next.js frontends — runs on a single 2 GB VPS, with deployments that take roughly two minutes thanks to a build-once, pull-on-the-server strategy. This document walks through the technology choices, the feature set, and the hardest engineering challenges we faced — from a 10-level commission engine to running a full stack on 2 GB of RAM — and the solutions that made them work.'),

  h2('At a glance'),
  new Table({
    rows: [
      new TableRow({
        children: [
          statCell('4', 'Applications / surfaces'),
          statCell('53', 'Database tables'),
          statCell('17', 'NestJS modules'),
        ],
      }),
      new TableRow({
        children: [
          statCell('10', 'Referral levels'),
          statCell('4', 'Membership tiers'),
          statCell('6', 'Mobile operators'),
        ],
      }),
      new TableRow({
        children: [
          statCell('1 × 2 GB', 'VPS footprint'),
          statCell('~2 min', 'Deploy time'),
          statCell('3', 'Wallet / funds / points'),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: tableBorders,
  }),

  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Why it matters'),
  bullet('One network, many ways to earn — commissions flow through memberships, recharges, drive packs and marketplace activity, all tracked with per-level rates configured as data.'),
  bullet('Mobile-first by design — a single Expo codebase ships iOS and Android alongside a responsive web app, with WhatsApp OTPs and bKash / Nagad / Rocket payouts matching how users actually transact.'),
  bullet('Enterprise-grade under the hood — real-time chat, escrow-protected jobs, FCM push notifications, structured error handling and Sentry monitoring, all running on hardware smaller than a typical laptop.'),
  bullet('Repeatable, low-risk operations — pre-built Docker images, automatic migrations and health-checked restarts turn deployments into a two-minute routine.'),
];

// ─────────────────────────── ABOUT ──────────────────────────────────────
const about = [
  h1('2', 'About the Project'),
  body('Dreamy Life is built around a simple idea: every member is also a partner. When a user joins, they receive a unique 8-digit referral code. Everyone they invite becomes part of their team — up to ten levels deep — and every purchase their team makes (a membership upgrade, a mobile recharge, a data pack) earns them a share of the revenue. To make the network worth building, the platform layers on real utility: a social feed with posts and reactions, direct and group chat, a vendor and reseller marketplace with order tracking, a micro-job marketplace with escrow protection, and a digital-services store for mobile recharges.'),

  body('The product targets the Bangladesh market first: users are mobile-first, familiar with WhatsApp, and transact through bKash, Nagad and Rocket. This shaped key decisions — WhatsApp-based OTP verification, UddoktaPay for card / mobile-banking payments, operator-level recharge integration, and payout methods that match local wallets.'),

  para([new ImageRun({ type: 'jpg', data: bannerBuf, transformation: { width: 560, height: 288 } })],
    { align: AlignmentType.CENTER, after: 40 }),
  para([run('The Dreamy Life web dashboard.', { italics: true, size: 15, color: C.muted })],
    { align: AlignmentType.CENTER, after: 140 }),

  h2('Platform surfaces'),
  makeTable(
    ['Surface', 'Built with', 'Role'],
    [
      ['User Web App', 'Next.js 14 • React 18 • Tailwind CSS • Zustand • TanStack Query', 'Landing, auth, dashboard, referral tree, membership, wallet & funds, social feed, vendor shop, recharge, drive pack'],
      ['Mobile App', 'Expo SDK 51 • React Native 0.74 • Expo Router', 'The same user journey on iOS and Android — shop, wallet, recharge, notifications, order tracking, profile'],
      ['Admin Panel', 'Next.js 14 • Socket.IO client', 'User management, membership plans, marketplace moderation, chat control, withdrawal & fund approvals, notification composer, visitor analytics'],
      ['Backend API', 'NestJS 10 • TypeScript • Socket.IO', 'REST + realtime layer: 17 modules over PostgreSQL and Redis, Swagger-documented, JWT-secured'],
      ['WhatsApp Gateway', 'Node.js • Baileys', 'Standalone microservice delivering OTPs over WhatsApp and verifying phone numbers'],
    ],
    { widths: [20, 34, 46], fontSize: 17 },
  ),
];

// ─────────────────────────── PROBLEM STATEMENT ─────────────────────────
const problem = [
  h1('3', 'Problem Statement'),
  body('Building a platform that combines social features, multi-level commissions, e-commerce, digital services and financial movements surfaces hard problems that a typical CRUD application never encounters. The challenges below shaped every architectural decision in the project.'),
  h2('The challenges'),
  ...[
    ['Financial complexity at scale', 'Commissions had to be computed across 10 referral levels with different rates per membership plan — plus recharge commissions, drive-pack commissions and cashback. Any rounding error, double-payout or missed edge case is real money leaving the business.'],
    ['A hard hardware ceiling', 'The entire platform had to run on a single 2 GB RAM / 1 vCPU / 24 GB disk VPS: PostgreSQL, Redis, the NestJS API, two Next.js apps and a WhatsApp gateway. Every container, image and query had to fit a tight memory budget.'],
    ['Slow, fragile deployments', 'Building images directly on a 1-core VPS was painfully slow and error-prone, and a bad deploy meant downtime for the whole platform. Deploys had to become fast, repeatable and near risk-free.'],
    ['Real-time expectations', 'Chat messages, notifications, marketplace activity and admin monitoring all need to update instantly. The API had to stream events, not just serve requests.'],
    ['Contract drift across four surfaces', 'Web, mobile and admin all talk to one API. Without a single source of truth for types, schemas and API clients, the surfaces would drift apart and break silently.'],
    ['OTP reliability', 'Registration and password recovery depend on OTP delivery. Relying on a single channel (WhatsApp) was a single point of failure for account access.'],
    ['Payments, escrow and trust', 'UddoktaPay flows for memberships, funds and vendor applications; escrow-held funds for the job marketplace; and cash-out through bKash / Nagad / Rocket all demand careful, auditable bookkeeping.'],
    ['Security surface', 'A public API that moves money, stores identities and grants admin access needs defense at every layer — auth, sessions, validation, rate of abuse, and operational monitoring.'],
  ].map(([t, d], i) => para(
    [
      run(`${i + 1}. ${t} — `, { bold: true, color: C.indigoDark, size: 20 }),
      run(d, { size: 20 }),
    ],
    { after: 110, line: 268 }),
  ),
];

// ─────────────────────────── SOLUTION & APPROACH ────────────────────────
const solution = [
  h1('4', 'Solution & Approach'),
  h2('One codebase, four surfaces'),
  body('The project is organized as a pnpm workspace with Turborepo orchestrating build, lint and type-check across packages. Shared packages carry the contracts: shared-types (Zod schemas for entities and DTOs), api-client (Axios + Socket.IO wrappers), utils and config. The web app, mobile app and admin panel import the same types and the same API client, so a schema change in the backend is a compile-time error everywhere else — never a silent runtime break.'),

  codeBlock([
    'dreamy-life/',
    '├── apps/',
    '│   ├── web/        Next.js 14 — user web app (port 3000)',
    '│   ├── admin/      Next.js 14 — admin panel (port 3001)',
    '│   └── mobile/     Expo / React Native — iOS + Android (Expo Go)',
    '├── packages/',
    '│   ├── backend/    NestJS 10 API — REST + Socket.IO (port 4000)',
    '│   ├── whatsapp-gateway/   Baileys OTP microservice (port 5001)',
    '│   ├── shared-types/       Zod schemas — the single source of truth',
    '│   ├── api-client/         Axios + Socket.IO client for all surfaces',
    '│   ├── utils/  ·  config/  shared helpers and tooling',
    '└── docker-compose*.yml · deploy.sh · build-and-push.sh',
  ]),

  para([run('', { size: 4 })], { after: 0, line: 200 }),

  h2('Modular backend'),
  body('The NestJS API is split into 17 focused modules — auth, referral, membership, wallet, recharge, withdraw, marketplace, vendor, chat, posts, notifications, media, social-earnings, admin, errors — plus database and queue infrastructure. Each module is layered (interfaces / application / infrastructure), which keeps business rules testable and side-effects (webhooks, gateways, emails) isolated. A global validation pipe (whitelist + forbid-non-whitelisted) and a global exception filter producing structured { success, error } responses give every client a consistent contract.'),

  h2('Money as configuration, not code'),
  body('Commission rates are data. Each membership plan stores its own 10-level commission table as JSON; recharge and drive-pack rates are editable configuration, including amount-tiered rate tables. The commission engine walks the referral chain at purchase time, inserts commission ledger rows and credits wallets in the same transaction flow, so totals always reconcile. Recharge failures refund the user automatically.'),

  h2('Build once, deploy fast'),
  body('Images are built on the developer machine (fast, multi-core) and pushed to GitHub Container Registry. The VPS never builds: it pulls pre-built images, runs migrations (drizzle-kit with a push fallback), restarts services and health-checks the API — about two minutes end to end. Memory limits per container keep the whole stack inside the 2 GB budget.'),

  h2('Real-time by default'),
  body('Socket.IO gateways power chat, notifications, marketplace updates and the admin monitoring stream. Background work — emails, scheduled notifications — runs through BullMQ on Redis, keeping long jobs off the request path.'),
];

// ─────────────────────────── SYSTEM ARCHITECTURE ────────────────────────
const architecture = [
  h1('5', 'System Architecture'),
  h2('Logical layers'),
  new Table({
    rows: [
      archRow('Presentation', 'Next.js Web App  •  Expo Mobile App  •  Admin Panel', '4A41B8'),
      arrowRow(),
      archRow('API & Realtime', 'NestJS REST (JWT)  +  Socket.IO Gateways (chat · notifications · marketplace · admin)', '5B4FE9'),
      arrowRow(),
      archRow('Domain Services', '17 modules — auth · referral · membership · wallet · recharge · marketplace · vendor · chat · posts · notifications · …', '6E63E8'),
      arrowRow(),
      archRow('Data & Jobs', 'PostgreSQL (Drizzle ORM)   •   Redis (cache + BullMQ queues)', '211B3D'),
      arrowRow(),
      archRow('External Services', 'UddoktaPay  •  Recharge API  •  Firebase Cloud Messaging  •  WhatsApp Gateway  •  SMTP  •  Sentry', '1E1A33'),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
  }),

  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Monorepo & build orchestration'),
  body('Turborepo wires the workspace together: build depends on upstream package builds (dependsOn "^build"), type-check and lint run across every package, and the dev task runs all services concurrently. pnpm overrides pin React 18.2 across web, mobile and admin so there is a single React runtime.'),

  h2('Deployment pipeline'),
  makeTable(
    ['Step', 'Where', 'What happens', 'Time'],
    [
      ['build-and-push.sh', 'Developer PC', 'Builds 3 Docker images and pushes them to GitHub Container Registry (GHCR)', '~6–12 min'],
      ['deploy.sh', 'VPS', 'Pre-flight checks → pulls images from GHCR → runs migrations (drizzle-kit + push fallback)', '~45 s'],
      ['deploy.sh', 'VPS', 'Restarts all services → health-checks the backend → cleans up old images', '~60 s'],
    ],
    { widths: [24, 14, 46, 16], fontSize: 17 },
  ),
  body('The VPS also auto-creates a 2 GB swap on first deploy and enforces a memory budget: PostgreSQL 300 MB, Redis 100 MB, backend 512 MB, web 350 MB, admin 350 MB — roughly 1.6 GB total, leaving headroom on the 2 GB machine.', { after: 0 }),
];

// ─────────────────────────── TECHNOLOGY STACK ───────────────────────────
const techStack = [
  h1('6', 'Technology Stack'),
  makeTable(
    ['Layer', 'Technologies', 'Used for'],
    [
      ['Monorepo & tooling', 'pnpm workspaces 8 • Turborepo • TypeScript 5 • Prettier • ESLint', 'Shared code, orchestrated builds, consistent quality gates'],
      ['Backend', 'NestJS 10 • Node.js 18+ • class-validator • Swagger / OpenAPI • Multer', 'REST + WebSocket API, validation, auto-generated docs, uploads'],
      ['Database', 'PostgreSQL 15 • Drizzle ORM • drizzle-kit', '53-table relational model, typed queries, schema migrations'],
      ['Cache & jobs', 'Redis 7 • BullMQ', 'Caching, background queues (email, scheduled notifications)'],
      ['Realtime', 'Socket.IO (server + clients)', 'Chat, notifications, marketplace events, admin monitoring'],
      ['Auth & security', 'JWT (access + refresh) • bcrypt • httpOnly cookies • guards', 'Authentication, sessions, role enforcement, account recovery'],
      ['Web & admin', 'Next.js 14 • React 18 • Tailwind CSS • Zustand • TanStack Query • Firebase JS SDK', 'User web app, admin panel, state, data fetching, web push'],
      ['Mobile', 'Expo SDK 51 • React Native 0.74 • Expo Router • expo-notifications • image-picker', 'iOS + Android app from one TypeScript codebase'],
      ['Payments', 'UddoktaPay (checkout-v2 / verify / webhooks) • bKash • Nagad • Rocket', 'Card & mobile-banking payments; wallet cash-out processing'],
      ['Messaging', 'WhatsApp gateway (Baileys) • SMTP • Firebase Cloud Messaging', 'OTP delivery, transactional email, push notifications'],
      ['Observability', 'Sentry (@sentry/nestjs) • JSON error logs • health checks', 'Error tracking on backend, web and mobile; operational insight'],
      ['Infrastructure', 'Docker • Docker Compose • GitHub Container Registry • Ubuntu 24.04 VPS', 'Containerized services, image registry, single-host deployment'],
      ['Shared contracts', '@dreamy-life/shared-types (Zod) • @dreamy-life/api-client (Axios + Socket.IO) • utils • config', 'Single source of truth for types and API access across all surfaces'],
    ],
    { widths: [20, 38, 42], fontSize: 17 },
  ),
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  body('Every layer was chosen for a reason: Drizzle for type-safe SQL on constrained hardware, BullMQ for dependable background work, Expo for shipping one mobile codebase, and Docker images pre-built on a fast machine so the tiny VPS never has to compile anything.'),
];

// ─────────────────────────── KEY FEATURES ───────────────────────────────
const featuresIntro = [
  h1('7', 'Key Features'),
  body('Fourteen feature modules make up the product. The table summarizes what each one does; deep dives follow for the systems that carry the most engineering weight.'),

  makeTable(
    ['Module', 'What it does', 'Highlights'],
    [
      ['Authentication', 'Registration, login, account recovery, profiles', 'Login by username / phone / email • JWT access + refresh sessions • OTP for signup & password reset • rich user profiles (avatar, cover, bio, family info, language)'],
      ['Referral engine', 'Grows and visualizes the referral network', 'Unique 8-digit codes • referral links (?ref=) • downline tree & upline chain • level stats (L1–L5, L6–L10)'],
      ['Membership', 'Tiered paid plans with benefits', '4 tiers: Basic ৳500, Standard ৳1,500, Smart ৳3,500, VVIP ৳10,000 • upgrade-only guard • per-plan feature lists & commission tables'],
      ['Wallet & finance', 'Earnings, spending and rewards', '3 ledgers: withdrawable wallet (commissions), funds (deposits for purchases), points (rewards) • full transaction histories'],
      ['Withdrawals', 'Cash out earnings', 'bKash / Nagad / Rocket • configurable fee & minimum balance • admin approval workflow with notes'],
      ['Payments', 'Accept money everywhere', 'UddoktaPay checkout + verification + webhooks for memberships, funds and vendor fees • idempotent invoice records'],
      ['Social network', 'Community engagement', 'Posts with media • likes • nested comments • friends & follows • social feed • reactions-earnings'],
      ['Real-time chat', '1:1 and group messaging', 'Group roles • media messages • replies, edits, deletes • read receipts • unread tracking • admin moderation'],
      ['Marketplace', 'Micro-job economy with escrow', 'Single & multi-unit jobs • bidding • assignments • proof submissions • admin approval lifecycle • escrow release / refund • platform fee'],
      ['Commerce', 'Vendors, products and reselling', 'Vendor applications (paid) • categories & subcategories • product variants (colors, sizes, pricing) • SKU & stock • reseller orders with profit margin • shipments & tracking'],
      ['Digital services', 'Instant mobile top-ups', '6 operators (GP, BL, RB, AT, TT, ST) • prepaid / postpaid • funds-wallet payment • auto-refund on failure • Drive Pack data bundles with cashback'],
      ['Notifications', 'Reach users everywhere', 'FCM push (web, Android, iOS) • broadcast & targeted • scheduled sends • templates • read tracking • in-app inbox'],
      ['Admin panel', 'Run the business', 'Dashboard • user CRUD • plan editor • marketplace & vendor moderation • withdrawals • notification composer • visitor analytics'],
      ['Media & observability', 'Assets and operations', 'Multer uploads served at /uploads • Sentry on backend, web and mobile • Swagger docs • structured error codes • JSON error logs'],
    ],
    { widths: [18, 30, 52], fontSize: 16 },
  ),
];

const deepDiveCommission = [
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Deep dive 1 — the 10-level commission engine'),
  body('The heart of the referral model is a commission engine that distributes revenue across the buyer\u2019s upline chain. Every membership plan carries its own rate table — stored as JSON configuration, not hard-coded — so plans can be repriced without a deploy:'),
  para([run('', { size: 2 })], { after: 0, line: 200 }),
  makeTable(
    ['Plan', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'],
    [
      ['Basic (৳500)', '10%', '5%', '3%', '2%', '1%', '0.5%', '0.5%', '0.5%', '0.5%', '0.5%'],
      ['Standard (৳1,500)', '12%', '6%', '4%', '3%', '2%', '1%', '1%', '0.5%', '0.5%', '0.5%'],
      ['Smart (৳3,500)', '15%', '8%', '5%', '3%', '2%', '1.5%', '1%', '0.5%', '0.5%', '0.5%'],
      ['VVIP (৳10,000)', '20%', '10%', '6%', '4%', '3%', '2%', '1.5%', '1%', '1%', '0.5%'],
    ],
    { widths: [22, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8], fontSize: 16, headerFill: C.navy },
  ),
  para([run('', { size: 2 })], { after: 0, line: 200 }),
  body('At registration, the referral service snapshots the new member\u2019s position in the tree (up to 10 levels). When a membership is purchased, the engine walks the chain, computes each upline\u2019s share from the plan\u2019s rate table, writes commission rows and credits wallets — with the same pattern reused for recharge and drive-pack commissions using their own configurable rate tables (including amount-tiered rates).'),
  callout('How correctness is protected', [
    bullet('Rates are stored per plan / per product type as configuration, so payouts always match the published table.', { size: 18 }),
    bullet('Commission ledger rows and wallet credits are written together during distribution — no drift between what is recorded and what is paid.', { size: 18 }),
    bullet('Recharge and drive-pack failures trigger automatic refunds to the user\u2019s funds wallet, and every order carries a unique API transaction id (refid) for idempotency.', { size: 18 }),
    bullet('Referral codes are guaranteed unique by generation loop, and trees are capped at 10 levels by design.', { size: 18 }),
  ]),
];

const deepDiveEscrow = [
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Deep dive 2 — escrow-protected job marketplace'),
  body('The marketplace lets members post micro-jobs (single or multi-unit) and pay from their funds wallet. Money is not handed over directly: it moves into an escrow record when the job is created. Workers bid on single-unit jobs or take assignments on multi-unit jobs, then submit proof (links and media) for approval. Only when the poster approves does the escrow release to the worker — otherwise it is refunded. Platform settings (fee percent, max submissions, active flag) are editable by admins, and every job passes through an admin approval lifecycle (pending approval → active → in progress → completed / cancelled / rejected) before it is visible to workers.'),
];

const deepDiveRealtime = [
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Deep dive 3 — real-time across the platform'),
  body('Socket.IO gateways run on the same NestJS process as the REST API. A chat gateway streams messages, typing and read receipts for direct and group conversations; a notification gateway pushes FCM-bound events to connected clients instantly (including commission alerts); a marketplace gateway broadcasts job and bid activity; and an admin gateway streams live operational events into the admin panel. For everything that must survive a disconnect — emails, scheduled broadcasts — BullMQ queues on Redis take over, with the email processor handling transactional mail.'),
];

const deepDiveNotifications = [
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Deep dive 4 — notification engine'),
  body('Notifications are a first-class module, not an afterthought. Admins compose broadcasts or targeted messages (optionally scheduled), with templates for reuse. Delivery fans out through Firebase Cloud Messaging to registered push tokens for web, Android and iOS; the system tracks recipients, sent and read counts per campaign. Transactional events — recharge success/failure, commission earned, membership status — create per-user notifications and fire Socket.IO events in the same flow, so users see updates instantly in-app and on-device.'),
];

// ─────────────────────────── CHALLENGES & SOLUTIONS ─────────────────────
const challenges = [
  h1('8', 'Challenges & Solutions'),
  body('This section pairs each major challenge with the solution that resolved it — the engineering decisions that make the platform work on its modest hardware while keeping money movements accurate and deploys safe.'),

  makeTable(
    ['Challenge', 'Solution'],
    [
      ['Running a full stack on 2 GB RAM / 1 vCPU', 'Per-container memory limits (Postgres 300 MB, Redis 100 MB, backend 512 MB, web & admin 350 MB each ≈ 1.6 GB total), auto-created 2 GB swap, and no builds on the server — images arrive pre-built from GHCR.'],
      ['Slow, fragile deployments on a weak server', 'A build-once strategy: images are built on the developer machine (~6–12 min) and pushed to GHCR; deploy.sh pulls, runs drizzle-kit migrations with a push fallback, restarts and health-checks — about 2 minutes, repeatable every time.'],
      ['Multi-level commission correctness', 'Rate tables stored as plan/product configuration; referral positions snapshotted at registration; distribution writes commission rows and wallet credits together; unique refids and automatic refunds keep recharge money honest.'],
      ['Contract drift between web, mobile and admin', 'A monorepo with shared-types (Zod) and a shared api-client. One schema change breaks every surface at compile time instead of failing at runtime.'],
      ['Real-time chat, notifications and marketplace events', 'Socket.IO gateways inside NestJS for chat, notifications, marketplace and admin monitoring; BullMQ on Redis for disconnect-safe background work (email, scheduled sends).'],
      ['Reliable OTP delivery for signup & password reset', 'A dedicated WhatsApp OTP gateway (Baileys) with /send-otp and /check-number endpoints; OTPs stored with 10-minute expiry, single-use verification, and full session invalidation after reset; graceful error messaging when the channel is unavailable.'],
      ['Payments, escrow and cash-out integrity', 'UddoktaPay checkout/verify/webhook integration with unique invoice records; job funds held in escrow until approval (release or refund); withdrawals approved by an admin before payout to bKash / Nagad / Rocket.'],
      ['Security on a public, money-moving API', 'JWT access tokens + httpOnly refresh cookies with DB-backed sessions that can be invalidated; bcrypt hashing; strict validation pipe; role guards; CORS allowlist; admin login with access code and failed-attempt lockout; Sentry error tracking; secrets masked in logs.'],
    ],
    { widths: [36, 64], fontSize: 17 },
  ),

  para([run('', { size: 4 })], { after: 0, line: 200 }),
  h2('Deep dive: fitting everything into 2 GB'),
  body('The memory budget was the constraint that touched every other decision. PostgreSQL runs with a 300 MB cap, Redis with 100 MB, and each Node service is sized to its traffic. The web and admin apps are static Next.js output served from containers; the backend keeps its footprint lean by avoiding heavy in-process work — long jobs go to BullMQ. When the box briefly spikes, the auto-created 2 GB swap absorbs the load, and deploy.sh runs disk and memory pre-flight checks before touching anything.'),

  h2('Deep dive: the two-minute deploy'),
  body('The pain point was simple: building a NestJS image on a 1-core VPS took long enough that deploys were dreaded. The fix was moving the build off the server entirely. build-and-push.sh produces the three images locally and pushes them to GHCR; deploy.sh then only pulls, migrates and restarts. Because migrations run in a dedicated container step with a drizzle-kit push fallback, schema changes land before the API restarts — no "table does not exist" window. A final health check waits for the backend before the pipeline reports success.'),

  h2('Deep dive: keeping OTP delivery reliable'),
  body('Account creation and password recovery both hinge on OTPs. Rather than hard-wiring a single provider, the backend talks to a dedicated WhatsApp gateway service built on Baileys, which maintains the WhatsApp session, exposes /send-otp and /check-number, and can be replaced or scaled independently. The auth module stores every OTP with a 10-minute expiry and a verified flag; password reset requires a verified OTP and then invalidates all of the user\u2019s sessions. Failures surface as clear, actionable messages instead of silent drops, and the email processor in BullMQ offers a parallel channel for transactional messages.'),

  h2('Deep dive: correct money, everywhere'),
  body('Commission distribution is the kind of code that looks trivial and is not. The engine treats rates as configuration (JSONB on plans and recharge config), walks the upline chain level by level, and writes each commission row together with the wallet credit in the same distribution flow. Recharge orders get unique refids before the provider call, so a retry can never double-charge; failures refund the funds wallet automatically and notify the user. Withdrawal requests never move money directly — an admin reviews and processes them, with the charge and totals recorded on the order.'),
];

// ─────────────────────────── ENGINEERING PRACTICES ──────────────────────
const engineering = [
  h1('9', 'Engineering Practices & Security'),
  h2('Practices that kept the project shippable'),
  bullet('Typed contracts everywhere — Zod schemas in shared-types are the single source of truth for entities and DTOs across backend, web, mobile and admin.'),
  bullet('Turbo-managed quality gates — build, type-check and lint run across the whole workspace; the build graph enforces package build order automatically.'),
  bullet('One deploy pipeline for every environment — dev and prod both use Docker Compose, so what runs locally is what runs in production.'),
  bullet('Self-healing operations — migrations run as part of every deploy, health checks gate the rollout, and old images are pruned to keep the 24 GB disk from filling up.'),
  bullet('Documentation as a deliverable — Swagger UI generated from NestJS decorators (auth, membership, wallet, referral, admin, health tags), plus RUN / TESTING / DEPLOY guides in the repo.'),
  h2('Security measures'),
  bullet('JWT access tokens plus refresh tokens in httpOnly cookies, backed by a sessions table for server-side invalidation (logout and password reset revoke sessions).'),
  bullet('bcrypt password hashing and a strict global ValidationPipe (whitelist + forbid non-whitelisted) so malformed payloads never reach business logic.'),
  bullet('Role guards (JWT + admin) on every protected route, CORS allowlist, and an admin login with access code plus failed-attempt lockout against brute force.'),
  bullet('Structured error responses with machine-readable codes, Sentry error tracking on backend, web and mobile, and secrets masked in logs (API keys, passwords).'),
];

// ─────────────────────────── IMPACT & RESULTS ───────────────────────────
const impact = [
  h1('10', 'Impact & Results'),
  h2('Operational wins'),
  makeTable(
    ['Metric', 'Outcome'],
    [
      ['Infrastructure footprint', 'The whole platform — database, cache, queue, API, two frontends, gateway — runs on one 2 GB VPS within a ~1.6 GB container budget.'],
      ['Deployment time', '~2 minutes on the server (pull → migrate → restart → health check); images built in ~6–12 minutes on the developer machine and distributed via GHCR.'],
      ['Migration safety', 'drizzle-kit migrations run before every restart with a push fallback, eliminating "table does not exist" windows.'],
      ['Code reuse', '4 surfaces share one set of Zod contracts and one API client; contract drift is a compile-time error, not a production incident.'],
      ['Data model', '53 relational tables cleanly model users, referrals, memberships, commissions, wallets, funds, points, payments, chat, marketplace, commerce, notifications and recharges.'],
      ['API documentation', 'Swagger UI is generated from the codebase — every endpoint, DTO and error code is discoverable and testable in-browser.'],
      ['Observability', 'Sentry on all surfaces plus structured JSON error logs give fast answers to "what broke, where, and for whom".'],
      ['Mobile coverage', 'A single Expo codebase ships iOS, Android and web, keeping the user experience consistent with the web app.'],
    ],
    { widths: [30, 70], fontSize: 17 },
  ),
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  body('The result is a platform that behaves like a well-resourced startup product while running on hardware most teams would dismiss as insufficient. Two-minute deploys mean features and fixes reach users the same day; configuration-driven rates mean the business can reprice commissions without a code release; and the escrow, refund and approval flows give users the confidence to transact real money inside the platform.'),
];

// ─────────────────────────── ROADMAP ────────────────────────────────────
const roadmap = [
  h1('11', 'Roadmap'),
  bullet('Automated payouts — integrate bKash / Nagad payout APIs so approved withdrawals settle without manual processing.'),
  bullet('Richer marketplace — reviews and ratings for posters and workers, dispute handling, and milestone-based escrow releases.'),
  bullet('Deeper analytics — visitor and funnel dashboards in the admin panel, plus revenue and commission reconciliation reports.'),
  bullet('More channels — SMS OTP fallback and email verification options in addition to WhatsApp.'),
  bullet('Native releases — TestFlight and Play Store distribution for the Expo app, with push notification permissions fully wired.'),
  bullet('Localization — the i18n scaffolding already in the web app grows into full Bengali / English switching across surfaces.'),
  bullet('Scaling path — the architecture is already split into containers; moving to a second node or managed Postgres is a config change, not a rewrite.'),
];

// ─────────────────────────── CONCLUSION ─────────────────────────────────
const conclusion = [
  h1('12', 'Conclusion'),
  body('Dreamy Life demonstrates what disciplined engineering can achieve on constrained hardware. By keeping every contract typed, every rate configurable, every long-running job queued, and every deploy scripted, the project delivers a feature-rich community and commerce platform — social network, 10-level referral economy, memberships, wallets, escrow marketplace, vendor commerce and mobile recharges — from a single 2 GB server.'),
  body('The hardest problems were not the individual features but the interactions between them: commissions that must reconcile with wallets, escrow that must protect both sides of a job, deploys that must never take the platform down, and money movements that must be auditable. Each challenge was met with a structural solution rather than a patch — and those solutions are exactly what makes the platform dependable enough to hold real users\u2019 real money.'),
  para([run('', { size: 4 })], { after: 0, line: 200 }),
  callout('In short', [
    body('Four surfaces, one codebase. Seventeen modules, fifty-three tables, ten commission levels. One small VPS — and a deploy routine that takes about two minutes. That is Dreamy Life.', { size: 19 }),
  ]),
];

// ─────────────────────────── ASSEMBLE DOCUMENT ──────────────────────────
const doc = new Document({
  creator: 'Dreamy Life Engineering',
  title: 'Dreamy Life — Technical Case Study',
  description: 'Architecture, features, challenges and solutions behind the Dreamy Life community & commerce platform.',
  features: { updateFields: true },
  styles: {
    default: {
      document: { run: { font: FB, size: 21, color: C.text } },
      heading1: {
        run: { font: FH, size: 30, bold: true, color: C.indigoDark },
        paragraph: { spacing: { before: 60, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.indigo, space: 4 } } },
      },
      heading2: {
        run: { font: FH, size: 24, bold: true, color: C.indigoDark },
        paragraph: { spacing: { before: 260, after: 110 }, keepNext: true },
      },
      heading3: {
        run: { font: FB, size: 21, bold: true, color: C.navy },
        paragraph: { spacing: { before: 200, after: 70 }, keepNext: true },
      },
    },
  },
  sections: [
    // Section 1 — cover (no header/footer, tighter margins)
    {
      properties: {
        page: {
          size: A4,
          margin: { top: 360, right: 820, bottom: 420, left: 820 },
        },
      },
      children: coverChildren,
    },
    // Section 2 — content
    {
      properties: {
        page: {
          size: A4,
          margin: { top: 1050, right: 1050, bottom: 1050, left: 1050 },
        },
      },
      headers: { default: headerText },
      footers: { default: footerCenter },
      children: [
        // Table of contents
        para([run('Table of Contents', { bold: true, font: FH, size: 30, color: C.indigoDark })],
          { after: 160, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.indigo, space: 4 } } }),
        para([new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-3' })], { after: 120 }),
        para([run('(In Microsoft Word, press Ctrl+A then F9 — or open the document and accept the field-update prompt — to refresh page numbers.)', { italics: true, size: 15, color: C.muted })], { after: 0 }),

        ...execSummary,
        ...about,
        ...problem,
        ...solution,
        ...architecture,
        ...techStack,
        ...featuresIntro,
        ...deepDiveCommission,
        ...deepDiveEscrow,
        ...deepDiveRealtime,
        ...deepDiveNotifications,
        ...challenges,
        ...engineering,
        ...impact,
        ...roadmap,
        ...conclusion,
      ],
    },
  ],
});

// ─────────────────────────── WRITE FILE ─────────────────────────────────
const outPath = path.join(ROOT, 'Dreamy-Life-Case-Study.docx');
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log('Wrote', outPath, `(${buf.length.toLocaleString()} bytes)`);
}).catch((err) => {
  console.error('Failed to generate document:', err);
  process.exit(1);
});
