import React from 'react';
import { FiAlertTriangle } from "react-icons/fi";

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    loading?: boolean;
}

export function CustomAlertDialog({ isOpen, onClose, onConfirm, title, description, loading }: AlertDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-neutral-800 bg-neutral-950 p-6 shadow-2xl duration-200 sm:rounded-lg md:w-full animate-in zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]">
                <div className="flex flex-col space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight text-neutral-100">
                        <FiAlertTriangle className="h-5 w-5 text-red-500" />
                        {title}
                    </div>
                    <div className="text-sm text-neutral-400">
                        {description}
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <button
                        className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-700 disabled:pointer-events-none disabled:opacity-50 border border-neutral-800 bg-transparent shadow-sm hover:bg-neutral-800 hover:text-neutral-100 h-9 px-4 py-2"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 bg-red-900/50 text-red-200 shadow-sm hover:bg-red-900/70 h-9 px-4 py-2 border border-red-900"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
