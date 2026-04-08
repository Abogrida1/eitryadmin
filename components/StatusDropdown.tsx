"use client";

import { useState, useRef, useEffect } from "react";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
  isPickup?: boolean;
}

export default function StatusDropdown({ currentStatus, onStatusChange, isPickup = false }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { id: "pending", label: "قيد الطلب", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
    { id: "processing", label: "جاري التجهيز", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    { 
      id: "shipped", 
      label: isPickup ? "جاهز للاستلام" : "تم الشحن", 
      color: isPickup ? "#a855f7" : "#f59e0b", 
      bg: isPickup ? "rgba(168, 85, 247, 0.1)" : "rgba(245, 158, 11, 0.1)" 
    },
    { 
      id: "delivered", 
      label: isPickup ? "تم الاستلام من الفرع" : "تم التوصيل", 
      color: "#10b981", 
      bg: "rgba(16, 185, 129, 0.1)" 
    },
  ];

  const selectedOption = statusOptions.find((opt) => opt.id === currentStatus) || statusOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="status-dropdown-container" ref={dropdownRef}>
      <button 
        className={`status-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: selectedOption.color, backgroundColor: selectedOption.bg }}
      >
        <span className="status-dot" style={{ backgroundColor: selectedOption.color }}></span>
        <span className="status-label">{selectedOption.label}</span>
        <svg className={`chevron ${isOpen ? 'rotate' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="status-menu glass-card">
          {statusOptions.map((option) => (
            <button
              key={option.id}
              className={`status-item ${currentStatus === option.id ? 'selected' : ''}`}
              onClick={() => {
                onStatusChange(option.id);
                setIsOpen(false);
              }}
            >
              <span className="status-dot" style={{ backgroundColor: option.color }}></span>
              {option.label}
              {currentStatus === option.id && (
                <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
