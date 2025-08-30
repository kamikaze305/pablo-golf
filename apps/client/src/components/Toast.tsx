interface ToastProps {
  show: boolean;
  message: string;
}

export function Toast({ show, message }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
      <div className="flex items-center space-x-2">
        <span className="text-lg">🎉</span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
