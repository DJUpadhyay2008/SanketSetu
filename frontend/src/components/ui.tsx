import React, { useEffect } from "react";
import { 
  Play, CheckCircle, Award, BookOpen, AlertCircle, 
  Search, ShieldAlert, Filter, Loader2, X, Bell, 
  MapPin, ExternalLink, Calendar
} from "lucide-react";

// ==========================================
// 1. BUTTON
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "saffron";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-bold tracking-wide rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#008F87] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-[#008F87] hover:bg-[#006B66] text-white shadow-2xs dark:bg-[#008F87] dark:hover:bg-[#006B66]",
    secondary: "bg-[#17233C] hover:bg-[#1E293B] text-white shadow-2xs dark:bg-[#17233C] dark:hover:bg-[#1E293B]",
    saffron: "bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-bold shadow-2xs",
    outline: "border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#172033] dark:text-slate-200",
    ghost: "text-[#172033] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4.5 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5"
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

// ==========================================
// 2. CARD
// ==========================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverable = false, className = "", ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-slate-900 border border-[#E4E7EC] dark:border-slate-800 rounded-2xl p-5 shadow-2xs transition-all duration-200 ${
        hoverable ? "hover:shadow-xs hover:border-[#008F87]/40 hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`mb-4 flex flex-col gap-1 ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = "", ...props }) => (
  <h3 className={`text-base font-bold text-[#172033] dark:text-white tracking-tight ${className}`} {...props}>{children}</h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = "", ...props }) => (
  <p className={`text-xs text-[#667085] dark:text-slate-400 font-semibold tracking-wide ${className}`} {...props}>{children}</p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`space-y-3 ${className}`} {...props}>{children}</div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`mt-5 pt-4 border-t border-[#E4E7EC] dark:border-slate-800 flex items-center justify-between gap-2 ${className}`} {...props}>{children}</div>
);

// ==========================================
// 3. BADGE
// ==========================================
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "teal" | "saffron" | "success" | "danger" | "muted";
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-[#008F87]/10 text-[#008F87] border-[#008F87]/20 dark:bg-[#008F87]/20 dark:text-[#008F87] dark:border-[#008F87]/30",
    secondary: "bg-[#008F87]/10 text-[#008F87] border-[#008F87]/20 dark:bg-[#008F87]/20 dark:text-[#008F87] dark:border-[#008F87]/30",
    teal: "bg-[#008F87]/10 text-[#008F87] border-[#008F87]/20 dark:bg-[#008F87]/20 dark:text-[#008F87] dark:border-[#008F87]/30",
    saffron: "bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/30 dark:bg-[#F59E0B]/20 dark:text-[#F59E0B] dark:border-[#F59E0B]/40",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
    danger: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
    muted: "bg-slate-100 text-[#667085] border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800"
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// ==========================================
// 4. PROGRESS BAR
// ==========================================
interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "teal" | "saffron";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  label, 
  size = "md",
  variant = "teal"
}) => {
  const percent = Math.min(100, Math.max(0, value));

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3"
  };

  const colors = {
    teal: "bg-[#008F87] dark:bg-[#008F87]",
    saffron: "bg-[#F59E0B] dark:bg-[#F59E0B]"
  };

  return (
    <div className="w-full space-y-1.5">
      {(label || label === "") && (
        <div className="flex items-center justify-between text-xs font-semibold text-[#667085]">
          <span>{label}</span>
          <span className="font-bold text-[#172033] dark:text-white">{percent}%</span>
        </div>
      )}
      <div className={`w-full bg-[#E4E7EC] dark:bg-slate-800 rounded-full overflow-hidden ${heights[size]}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors[variant]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// ==========================================
// 5. AVATAR
// ==========================================
interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name = "User", 
  size = "md",
  active = false 
}) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-20 w-20 text-2xl"
  };

  const getInitials = (n: string) => {
    return n.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <div className="relative inline-block shrink-0">
      {src ? (
        <img 
          src={src} 
          alt={name}
          className={`rounded-full object-cover border border-slate-200 dark:border-slate-800 ${sizes[size]}`}
        />
      ) : (
        <div className={`rounded-full bg-teal-600 dark:bg-teal-500 text-white font-extrabold flex items-center justify-center border border-teal-500/25 ${sizes[size]}`}>
          {getInitials(name)}
        </div>
      )}
      {active && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-900" />
      )}
    </div>
  );
};

// ==========================================
// 6. MODAL
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer 
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[82vh] text-sm text-slate-650 dark:text-slate-350 space-y-4">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 7. DRAWER
// ==========================================
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. TABS
// ==========================================
interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 w-full overflow-x-auto scrollbar-none flex">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                isActive 
                  ? "border-teal-600 text-teal-600 dark:border-teal-500 dark:text-teal-400" 
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 9. TOAST
// ==========================================
export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: "success" | "error" | "info" | "warning";
}

interface ToastProps extends ToastMessage {
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  title, 
  message, 
  type = "info", 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    error: <ShieldAlert className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-orange-500" />,
    info: <AlertCircle className="h-5 w-5 text-sky-500" />
  };

  const borders = {
    success: "border-l-4 border-l-emerald-500",
    error: "border-l-4 border-l-red-500",
    warning: "border-l-4 border-l-orange-500",
    info: "border-l-4 border-l-sky-500"
  };

  return (
    <div className={`flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg w-full max-w-sm shrink-0 animate-in slide-in-from-top duration-300 ${borders[type]}`}>
      <span className="shrink-0">{icons[type]}</span>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">{title}</h4>
        {message && <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{message}</p>}
      </div>
      <button 
        onClick={onClose}
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 cursor-pointer"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// ==========================================
// 10. SKELETON
// ==========================================
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
      {...props}
    />
  );
};

// ==========================================
// 11. EMPTY STATE
// ==========================================
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = BookOpen,
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-350 dark:border-slate-850 rounded-2xl py-12 max-w-md mx-auto">
      <div className="h-12 w-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-4 text-slate-500 dark:text-slate-450 border border-slate-250 dark:border-slate-825">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-6 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// ==========================================
// 12. ERROR STATE
// ==========================================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50/20 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/40 rounded-2xl max-w-md mx-auto">
      <div className="h-12 w-12 bg-red-100 dark:bg-red-950/60 rounded-xl flex items-center justify-center mb-4 text-red-650 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-extrabold text-red-800 dark:text-red-400 tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-red-600/90 dark:text-red-500/90 font-semibold mb-6 max-w-xs">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm">
          Retry Again
        </Button>
      )}
    </div>
  );
};

// ==========================================
// 13. LOADING STATE
// ==========================================
export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 py-16 gap-3">
      <Loader2 className="h-10 w-10 text-teal-600 dark:text-teal-500 animate-spin" />
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Content...</span>
    </div>
  );
};

// ==========================================
// 14. SEARCH BAR
// ==========================================
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = "Search catalog..." }) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Clear search input"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
};

// ==========================================
// 15. FILTER PANEL
// ==========================================
interface FilterPanelProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 flex-nowrap w-full">
      <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-200 dark:border-slate-800 text-slate-500">
        <Filter className="h-4 w-4" />
        <span className="text-2xs font-extrabold uppercase tracking-wider">Filter:</span>
      </div>
      <div className="flex gap-2 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
              selectedCategory === cat
                ? "bg-teal-600 border-teal-600 text-white dark:bg-teal-500"
                : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-350"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 16. VIDEO CARD
// ==========================================
interface VideoCardProps {
  thumbnailUrl?: string;
  title: string;
  duration?: string;
  description?: string;
  onClick?: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  thumbnailUrl,
  title,
  duration = "3:40",
  description,
  onClick
}) => {
  return (
    <Card hoverable className="overflow-hidden p-0 flex flex-col h-full border border-slate-250 dark:border-slate-850">
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="object-cover w-full h-full" />
        ) : (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-slate-750" />
          </div>
        )}
        <div className="absolute inset-0 bg-slate-950/20 hover:bg-slate-950/30 transition-all flex items-center justify-center group">
          <button 
            onClick={onClick}
            className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 cursor-pointer"
            aria-label={`Play ${title} demonstration video`}
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </button>
        </div>
        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-3xs font-extrabold text-slate-100 uppercase tracking-widest">
          {duration}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{title}</h4>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==========================================
// 17. COURSE CARD
// ==========================================
interface CourseCardProps {
  title: string;
  difficulty: string;
  lessonsCount: number;
  xpReward: number;
  progressPercent: number;
  onAction?: () => void;
  actionLabel?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  difficulty,
  lessonsCount,
  xpReward,
  progressPercent,
  onAction,
  actionLabel = "Start Learning"
}) => {
  const getDiffBadge = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === "beginner") return <Badge variant="teal">Beginner</Badge>;
    if (d === "intermediate") return <Badge variant="saffron">Intermediate</Badge>;
    return <Badge variant="danger">Advanced</Badge>;
  };

  const ctaText = progressPercent > 0 ? (progressPercent === 100 ? "Review →" : "Continue →") : `${actionLabel} →`;

  return (
    <Card hoverable className="flex flex-col justify-between h-full border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xs transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {getDiffBadge(difficulty)}
          <span className="text-xs font-semibold text-[#667085] dark:text-slate-400">
            {lessonsCount} interactive modules
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#172033] dark:text-white tracking-tight leading-snug">{title}</h3>
        </div>
      </div>
      <div className="mt-5 space-y-4 pt-1">
        <ProgressBar value={progressPercent} size="sm" variant="teal" />
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-[#008F87] dark:text-teal-400">
            {xpReward} XP
          </span>
          {onAction && (
            <button
              onClick={onAction}
              className="px-3.5 py-1.5 rounded-xl bg-[#008F87] hover:bg-[#006B66] text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              {ctaText}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==========================================
// 18. SCHEME CARD
// ==========================================
interface SchemeCardProps {
  title: string;
  department: string;
  benefits: string;
  eligibilityKey?: string;
  eligibilityVal?: string;
  onApply?: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  title,
  department,
  benefits,
  eligibilityKey,
  eligibilityVal,
  onApply
}) => {
  return (
    <Card hoverable className="flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 dark:text-orange-400">
            {department}
          </span>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">{title}</h4>
        </div>
        <p className="text-xs font-semibold text-slate-550 dark:text-slate-350 line-clamp-3">
          {benefits}
        </p>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {eligibilityKey && eligibilityVal && (
          <div className="flex items-center gap-1.5 text-3xs font-extrabold uppercase tracking-widest text-slate-500">
            <span>Criteria:</span>
            <Badge variant="primary">{eligibilityKey}: {eligibilityVal}</Badge>
          </div>
        )}
        {onApply && (
          <Button onClick={onApply} variant="saffron" size="sm" className="w-full">
            Apply Benefits
          </Button>
        )}
      </div>
    </Card>
  );
};

// ==========================================
// 19. INSTITUTION CARD
// ==========================================
interface InstitutionCardProps {
  name: string;
  category: string;
  city: string;
  score: number; // 0 to 100
  tier: string; // Gold, Silver, Bronze
  hasVideoServices: boolean;
  hasInterpreters: boolean;
}

export const InstitutionCard: React.FC<InstitutionCardProps> = ({
  name,
  category,
  city,
  score,
  tier,
  hasVideoServices,
  hasInterpreters
}) => {
  const getTierBadge = (t: string) => {
    const tc = t.toLowerCase();
    if (tc === "gold") return <Badge variant="saffron">Gold Tier</Badge>;
    if (tc === "silver") return <Badge variant="primary">Silver Tier</Badge>;
    return <Badge variant="muted">Bronze Tier</Badge>;
  };

  return (
    <Card hoverable className="flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{category}</Badge>
          {getTierBadge(tier)}
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">{name}</h4>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {city}
          </span>
        </div>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">
            Accessibility Score
          </span>
          <span className="text-sm font-black text-teal-600 dark:text-teal-400">
            {score}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasInterpreters && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/20 text-4xs font-extrabold uppercase tracking-widest">
              Interpreters
            </span>
          )}
          {hasVideoServices && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-450 border border-sky-250 dark:border-sky-900/20 text-4xs font-extrabold uppercase tracking-widest">
              VRS Video
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

// ==========================================
// 20. CREDENTIAL CARD
// ==========================================
interface CredentialCardProps {
  courseTitle: string;
  grade: string;
  issueDate: string;
  url: string;
  badgeName?: string;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  courseTitle,
  grade,
  issueDate,
  url,
  badgeName = "Certificate"
}) => {
  return (
    <Card hoverable className="border-l-4 border-l-orange-500 p-4">
      <div className="flex gap-4 items-start">
        <div className="h-10 w-10 bg-orange-50 dark:bg-orange-950/40 rounded-xl flex items-center justify-center text-orange-500 shrink-0 border border-orange-200/50 dark:border-orange-900/50">
          <Award className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {badgeName}
            </span>
            <span className="text-2xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded">
              Grade: {grade}
            </span>
          </div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
            {courseTitle}
          </h4>
          <div className="flex items-center justify-between text-3xs font-extrabold uppercase tracking-widest text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {issueDate}
            </span>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="text-orange-500 hover:text-orange-400 flex items-center gap-1.5 transition-colors focus:outline-none"
            >
              Verify
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ==========================================
// 21. NOTIFICATION ITEM
// ==========================================
interface NotificationItemProps {
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  onMarkRead?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  message,
  isRead,
  timestamp,
  onMarkRead
}) => {
  return (
    <div 
      className={`p-4 rounded-xl border transition-colors flex gap-3 ${
        isRead 
          ? "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800" 
          : "bg-teal-50/20 dark:bg-teal-950/5 border-teal-100 dark:border-teal-900/40"
      }`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        isRead 
          ? "bg-slate-200 dark:bg-slate-800 text-slate-500" 
          : "bg-teal-600/10 text-teal-600 dark:text-teal-400"
      }`}>
        <Bell className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className={`text-xs font-black tracking-wide truncate ${isRead ? "text-slate-700 dark:text-slate-350" : "text-slate-900 dark:text-white"}`}>
            {title}
          </h4>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider shrink-0">
            {timestamp}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          {message}
        </p>
        {!isRead && onMarkRead && (
          <button 
            onClick={onMarkRead}
            className="text-[10px] font-black text-teal-600 hover:underline pt-1.5 uppercase tracking-wider block focus:outline-none cursor-pointer"
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  );
};


// ==========================================
// EXTRA: SkeletonCard
// ==========================================
export const SkeletonCard: React.FC<{ className?: string; lines?: number }> = ({ className = "", lines = 3 }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-3 ${className}`}>
    <div className="skeleton h-4 rounded-full w-2/3" />
    {Array.from({ length: lines - 1 }).map((_, i) => (
      <div key={i} className={`skeleton h-3 rounded-full ${i === lines - 2 ? "w-1/2" : "w-full"}`} />
    ))}
  </div>
);
