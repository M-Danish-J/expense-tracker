import {
  ArrowLeftRight,
  BarChart3,
  CircleAlert,
  Database,
  Eye,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  PencilLine,
  PieChart,
  Receipt,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Landing page copy, kept as data rather than inlined in JSX.
 *
 * The FAQ list in particular is the single source for both the rendered
 * accordion and the FAQPage structured data — writing them separately is how
 * they drift, and Google penalises structured data that doesn't match the page.
 */

export const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

export const TRUST_SIGNALS: ReadonlyArray<{
  icon: LucideIcon;
  label: string;
}> = [
  { icon: Eye, label: "Built for clarity" },
  { icon: Shield, label: "Private by design" },
  { icon: LayoutGrid, label: "Your data, your workspace" },
  { icon: Sparkles, label: "Simple by default" },
];

export const PROBLEMS: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "danger" | "warning" | "info";
}> = [
  {
    icon: CircleAlert,
    title: "Where did my money go?",
    body: "Scattered transactions make spending difficult to understand.",
    tone: "danger",
  },
  {
    icon: Wallet,
    title: "How much do I actually have?",
    body: "Money across cash, banks, and wallets can be difficult to track.",
    tone: "warning",
  },
  {
    icon: TrendingUp,
    title: "Am I spending too much?",
    body: "Without clear trends, it's easy to lose sight of where your money goes.",
    tone: "info",
  },
];

export const FEATURES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  body: string;
  tone: "brand" | "info" | "success" | "warning";
}> = [
  {
    icon: Receipt,
    title: "Track Every Expense",
    body: "Quickly record expenses and keep your spending history organized.",
    tone: "brand",
  },
  {
    icon: LayoutDashboard,
    title: "See the Full Picture",
    body: "Bring your accounts and transactions into one clear financial view.",
    tone: "info",
  },
  {
    icon: PieChart,
    title: "Know Where You're Spending",
    body: "Categorize expenses and discover where your money goes.",
    tone: "success",
  },
  {
    icon: ArrowLeftRight,
    title: "Move Money Correctly",
    body: "Track transfers between accounts without treating them as income or expenses.",
    tone: "warning",
  },
  {
    icon: BarChart3,
    title: "Powerful Dashboard",
    body: "See balances, income, expenses, and spending patterns at a glance.",
    tone: "brand",
  },
  {
    icon: Users,
    title: "Built for More Than One",
    body: "Use workspaces to keep personal or shared finances organized.",
    tone: "info",
  },
];

export const SECURITY_POINTS: ReadonlyArray<{
  icon: LucideIcon;
  label: string;
}> = [
  { icon: ShieldCheck, label: "Secure Authentication" },
  { icon: Lock, label: "Workspace Isolation" },
  { icon: Database, label: "Protected Financial Data" },
];

export const STEPS: ReadonlyArray<{
  icon: LucideIcon;
  number: string;
  title: string;
  body: string;
}> = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create your workspace",
    body: "Set up your personal financial workspace.",
  },
  {
    icon: Wallet,
    number: "02",
    title: "Add your accounts",
    body: "Add your bank accounts, cash, wallets, or other accounts.",
  },
  {
    icon: PencilLine,
    number: "03",
    title: "Start tracking",
    body: "Record transactions and let your financial picture come together.",
  },
];

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

export const FAQS: readonly FaqItem[] = [
  {
    question: "What is an expense tracker?",
    answer:
      "An expense tracker is a tool that helps you record, categorize, and understand your spending and income. It gives you a clear picture of where your money goes, helping you make better financial decisions and build healthier spending habits.",
  },
  {
    question: "How does this expense tracker work?",
    answer:
      "Create a workspace, add your accounts (bank, cash, wallets), and start recording transactions. Expensio automatically organizes your data into clear categories and visual insights so you can understand your financial picture at a glance.",
  },
  {
    question: "Can I track multiple bank accounts?",
    answer:
      "Yes. You can add as many accounts as you need — bank accounts, savings accounts, digital wallets, and more. Each account maintains its own balance and transaction history within your workspace.",
  },
  {
    question: "Can I track cash expenses?",
    answer:
      "Absolutely. Create a cash account and record your cash transactions just like any other account. This helps you track spending that doesn't appear in bank statements.",
  },
  {
    question: "Can I track income as well as expenses?",
    answer:
      "Yes. Expensio supports both income and expense transactions, giving you a complete picture of your cash flow. You can categorize and filter by transaction type to see exactly what's coming in and going out.",
  },
  {
    question: "What is a workspace?",
    answer:
      "A workspace is your private financial environment. It contains your accounts, transactions, categories, and insights. You can have a personal workspace for your own finances and create separate workspaces to manage money with family or others.",
  },
  {
    question: "Can multiple people use the same workspace?",
    answer:
      "Yes. You can invite others to join a shared workspace. This is useful for managing household finances, family budgets, or any situation where multiple people need to track expenses together.",
  },
  {
    question: "Can I transfer money between accounts?",
    answer:
      "Yes. Transfers let you move money between your own accounts without affecting your income or expense totals. This keeps your financial reports accurate even when you're moving money around.",
  },
  {
    question: "Is my financial data private?",
    answer:
      "Yes. Your financial data is protected by secure authentication and workspace-level data isolation. Each workspace is completely separated, ensuring your information stays private and accessible only to authorized members.",
  },
];

export const FOOTER_COLUMNS: ReadonlyArray<{
  heading: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}> = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Get started",
    links: [
      { label: "Create an account", href: "/auth/sign-up" },
      { label: "Sign in", href: "/auth/login" },
    ],
  },
];
