import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface MenuPosition {
  x: number;
  y: number;
}

export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  action: string;  // Instead of onClick, we use an action identifier
  divider?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  onAction: (action: string) => void;  // Single callback for all menu items
  onClose: () => void;
  position: MenuPosition;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, onAction, onClose, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-[9999999] min-w-[220px] bg-[#1A1A1A] rounded-lg shadow-xl border border-[#333333] py-1 select-none"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => {
              onAction(item.action);  // Pass the action identifier up
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#333333] text-[#ECECEC] text-[13px] transition-colors duration-75 ease-in-out"
          >
            <span className="w-5 h-5 flex items-center justify-center text-[#ECECEC]">
              {item.icon}
            </span>
            <span className="font-normal">{item.label}</span>
          </button>
          {item.divider && <div className="h-[1px] bg-[#333333] mx-2 my-1" />}
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
};

interface ContextMenuContainerProps {
  children: React.ReactNode;
  items?: MenuItem[];
  onAction?: (e: React.MouseEvent, actionName: string) => boolean | void;
  onMenuAction?: (action: string) => void;
  className?: string;
  isLocked?: boolean;
}

export const ContextMenuContainer: React.FC<ContextMenuContainerProps> = ({ 
  children, 
  items = defaultMenuItems,
  onAction,
  onMenuAction,
  className = '',
  isLocked = false
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [position, setPosition] = React.useState<MenuPosition>({ x: 0, y: 0 });

  const filteredItems = React.useMemo(() => {
    if (isLocked) {
      return [
        {
          icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round"/>
          </svg>,
          label: 'Unlock',
          action: 'LOCK'
        }
      ];
    }
    return items;
  }, [isLocked, items]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const newPosition = { x: e.clientX, y: e.clientY };
    setPosition(newPosition);
    
    const shouldShowMenu = onAction?.(e, 'contextMenu');
    if (shouldShowMenu !== undefined) {
      setShowMenu(shouldShowMenu);
    } else {
      setShowMenu(true);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    onAction?.(e, 'click');
  };

  const handleMenuAction = (action: string) => {
    onMenuAction?.(action);
  };

  return (
    <div 
      onClick={handleClick}
      onContextMenu={handleContextMenu} 
      className={`w-full h-full relative z-[99999] ${className}`}
    >
      {children}
      {showMenu && (
        <ContextMenu
          items={filteredItems}
          onAction={handleMenuAction}
          position={position}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// Default menu items now use action identifiers instead of callbacks
const defaultMenuItems: MenuItem[] = [
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 4v16h16M4 20l16-16" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Remove background',
    action: 'REMOVE_BACKGROUND'
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 10V14M8 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H8C6.89543 18 6 17.1046 6 16V8C6 6.89543 6.89543 6 8 6Z" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Lock',
    action: 'LOCK',
    divider: true
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 15L12 8L19 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Bring to front',
    action: 'BRING_TO_FRONT'
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 14L12 10L16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Bring forward',
    action: 'BRING_FORWARD'
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 10L12 14L16 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Send backward',
    action: 'SEND_BACKWARD'
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 9L12 16L19 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Send to back',
    action: 'SEND_TO_BACK',
    divider: true
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M16 8V6M16 8H8M16 8V16M8 8V6M8 8V16M8 16H6M8 16H16M16 16H18M6 6H8M8 6H16M16 6H18" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Duplicate',
    action: 'DUPLICATE'
  },
  {
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V4a1 1 0 011-1h4a1 1 0 011 1v3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    label: 'Delete',
    action: 'DELETE'
  },
];

