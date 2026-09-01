import { useState } from 'react'
export default function Tooltip({ children, content, placement = 'top' }) {
  const [show, setShow] = useState(false)
  const pos = { top: 'bottom-full mb-2', bottom: 'top-full mt-2', left: 'right-full mr-2', right: 'left-full ml-2' }[placement]
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && content && (
        <span className={`absolute ${pos} left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2 py-1 rounded bg-slate-800 text-white text-xs shadow-lg pointer-events-none`}>
          {content}
        </span>
      )}
    </span>
  )
}
