/**
 * ErrorToast — Renders system-level error toasts from AppErrorBus.
 * Copied from desktop2 for desktop6 consumption (Sprint D2).
 * Placed once at app root level inside App.jsx.
 */

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, AlertCircle, XCircle, X } from "lucide-react";
import * as AppErrorBus from "../../infrastructure/AppErrorBus";

class ErrorToastBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const SEVERITY_CONFIG = {
  medium: {
    bg: "rgba(245, 158, 11, 0.95)",
    border: "#f59e0b",
    Icon: AlertTriangle,
    autoDismissMs: 4000,
  },
  high: {
    bg: "rgba(239, 68, 68, 0.95)",
    border: "#ef4444",
    Icon: AlertCircle,
    autoDismissMs: 8000,
  },
  critical: {
    bg: "rgba(220, 38, 38, 0.95)",
    border: "#dc2626",
    Icon: XCircle,
    autoDismissMs: null,
  },
};

function ToastItem({ error, onDismiss }) {
  const config = SEVERITY_CONFIG[error.report.severity];
  if (!config) return null;

  const { Icon } = config;
  const timerRef = useRef(null);

  useEffect(() => {
    if (config.autoDismissMs) {
      timerRef.current = setTimeout(() => {
        onDismiss(error.id);
      }, config.autoDismissMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [error.id, config.autoDismissMs, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "12px",
        padding: "12px 16px",
        color: "white",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)",
        maxWidth: "400px",
        minWidth: "280px",
        pointerEvents: "auto",
      }}
      data-testid="error-toast"
      data-severity={error.report.severity}
    >
      <Icon size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
      <span style={{ flex: 1, fontSize: "14px", fontWeight: 500, lineHeight: "1.4" }}>
        {error.report.message}
        {error.count > 1 && (
          <span style={{ opacity: 0.8, marginLeft: "6px", fontSize: "12px" }}>
            (x{error.count})
          </span>
        )}
      </span>
      <button
        onClick={() => onDismiss(error.id)}
        aria-label="Dismiss error"
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "50%",
          padding: "4px",
          cursor: "pointer",
          display: "flex",
          color: "white",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

function ErrorToastInner() {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    return AppErrorBus.subscribe((active) => {
      setErrors(active.filter((e) => e.report.severity !== "low"));
    });
  }, []);

  const handleDismiss = React.useCallback((id) => {
    AppErrorBus.dismiss(id);
  }, []);

  const [maxVisible, setMaxVisible] = useState(3);

  useEffect(() => {
    function checkWidth() {
      setMaxVisible(window.innerWidth < 640 ? 2 : 3);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const visibleErrors = errors.slice(0, maxVisible);

  if (visibleErrors.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: window.innerWidth < 640 ? "50%" : "20px",
        transform: window.innerWidth < 640 ? "translateX(50%)" : "none",
        display: "flex",
        flexDirection: "column-reverse",
        gap: "8px",
        zIndex: 9999,
        pointerEvents: "none",
      }}
      data-testid="error-toast-container"
    >
      <AnimatePresence mode="popLayout">
        {visibleErrors.map((error) => (
          <ToastItem
            key={error.id}
            error={error}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ErrorToast() {
  return (
    <ErrorToastBoundary>
      <ErrorToastInner />
    </ErrorToastBoundary>
  );
}
